import {
  generateHash,
  ConflictException,
  NotFoundException,
  compareHash,
  encrypt,
  createLoginCredentials,
  BadRequestException,
  sendEmail,
  emailTemplate,
  createNumberOtp,
  emailEvent,
} from "../../common/utils/index.js";
import { create, findOne, findOneAndUpdate, updateOne, UserModel } from "../../DB/index.js";
import { EmailEnum, HashEnum, ProviderEnum } from "../../common/enums/index.js";
import { OAuth2Client } from "google-auth-library";
import { CLIENT_IDS } from "../../../config/config.service.js";
import {
  allKeysByPrefix,
  blockOtpKey,
  deleteKey,
  get,
  incr,
  maxAttemptOtpKey,
  otpKey,
  revokeTokenKey,
  revokeTokenKeyPrefix,
  set,
  ttl,
} from "../../common/services/redis.service.js";
import { model } from "mongoose";

const sendEmailOtp = async ({ email, subject, title }) => {
  const isBlockedTTL = await ttl(blockOtpKey({ email, subject }));
  if (isBlockedTTL > 0) {
    throw BadRequestException({
      message: `sorry we cannot request new otp while you are blocked active please try again after ${isBlockedTTL}`,
    });
  }

  const remainingOtpTTL = await ttl(otpKey({ email, subject }));
  if (remainingOtpTTL > 0) {
    throw BadRequestException({
      message: `sorry we cannot request new otp while current otp still active please try again after ${remainingOtpTTL}`,
    });
  }
  const maxTrial = await get(maxAttemptOtpKey({ email, subject }));
  if (maxTrial >= 3) {
    await set({
      key: blockOtpKey({ email, subject }),
      value: 1,
      ttl: 7 * 60,
    });
    throw BadRequestException({
      message: `you have reached the max trial`,
    });
  }
  const code = createNumberOtp();
  await set({
    key: otpKey({ email, subject }),
    value: await generateHash({ plaintext: `${code}` }),
    ttl: 120,
  });
  emailEvent.emit("sendEmail", async () => {
    await sendEmail({
      to: email,
      subject,
      html: emailTemplate({ code, title }),
    });
  });

  await incr(maxAttemptOtpKey({ email, subject }));
};
export const signup = async (inputs) => {
  const { username, email, password, phone } = inputs;
  const checkEmailExists = await findOne({
    model: UserModel,
    filter: { email },
  });

  if (checkEmailExists) {
    throw ConflictException({ message: "Email Exists" });
  }

  const user = await create({
    model: UserModel,
    data: {
      username,
      email,
      password: await generateHash({
        plaintext: password,
        algo: HashEnum.Bcrypt,
      }),
      phone: await encrypt(phone),
      provider: ProviderEnum.System,
    },
  });

  // const code = createNumberOtp();
  // await set({
  //   key: otpKey({ email }),
  //   value: await generateHash({ plaintext: `${code}` }),
  //   ttl: 120,
  // });
  // await sendEmail({
  //   to: email,
  //   subject: "Confirm-Email",
  //   html: emailTemplate({ code, title: "Confirm-Email" }),
  // });
  // await set({
  //   key: maxAttemptOtpKey({ email }),
  //   value: 1,
  //   ttl: 360,
  // });

  await sendEmailOtp({
    email,
    subject: EmailEnum.ConfirmEmail,
    title: "verify Email",
  });

  return user;
};
export const confirmEmail = async (inputs) => {
  const { email, otp } = inputs;

  const account = await findOne({
    model: UserModel,
    filter: {
      email,
      confirmedEmail: { $exists: false },
      provider: ProviderEnum.System,
    },
  });

  if (!account) {
    throw NotFoundException({ message: "Fail to find account" });
  }

  const hashOtp = await get(otpKey({ email, subject: EmailEnum.ConfirmEmail }));
  if (!hashOtp) {
    throw NotFoundException({ message: "Expired OTP" });
  }

  if (!(await compareHash({ plaintext: otp, cipherText: hashOtp }))) {
    throw ConflictException({ message: "Invalid OTP" });
  }
  account.confirmedEmail = new Date();
  await account.save();
  await deleteKey(
    await allKeysByPrefix(otpKey({ email, subject: EmailEnum.ConfirmEmail })),
  );
  return;
};
export const resendConfirmEmail = async (inputs) => {
  const { email } = inputs;

  const account = await findOne({
    model: UserModel,
    filter: {
      email,
      confirmedEmail: { $exists: false },
      provider: ProviderEnum.System,
    },
  });

  if (!account) {
    throw NotFoundException({ message: "Fail to find account" });
  }

  await sendEmailOtp({
    email,
    subject: EmailEnum.ConfirmEmail,
    title: "verify Email",
  });

  return;
};
export const requestForgetPasswordOtp = async (inputs) => {
  const { email } = inputs;

  const account = await findOne({
    model: UserModel,
    filter: {
      email,
      confirmedEmail: { $exists: true },
      provider: ProviderEnum.System,
    },
  });

  if (!account) {
    throw NotFoundException({ message: "Fail to find account" });
  }

  await sendEmailOtp({
    email,
    subject: EmailEnum.ForgetPassword,
    title: "Reset Code",
  });

  return;
};
export const verifyForgetPasswordOtp = async (inputs) => {
  const { email, otp} = inputs;

  const hashOtp = await get(
    otpKey({ email, subject: EmailEnum.ForgetPassword }),
  );
  if (!hashOtp) {
    throw NotFoundException({ message: "Expired OTP" });
  }
  if (!(await compareHash({ plaintext: otp, cipherText: hashOtp }))) {
    throw ConflictException({ message: "Invalid OTP" });
  }
  return;
};
export const resetForgetPasswordOtp = async (inputs) => {
  const { email, otp , password } = inputs;

  await verifyForgetPasswordOtp({ email, otp });
  const user = await findOneAndUpdate({
    model: UserModel,
    filter: {
      email,
      confirmedEmail: { $exists: true },
      provider: ProviderEnum.System,
    },
    update: {
      password: await generateHash({ plaintext: password }),
      changeCredentialsTime: new Date(),
    },
  });
  if (!user) {
    throw NotFoundException({ message: "Account Not Exists" });
  }
  const tokenKeys = await allKeysByPrefix(revokeTokenKeyPrefix(user._id));
  const otpKeys = await allKeysByPrefix(
    otpKey({ email, subject: EmailEnum.ForgetPassword }),
  );
  await deleteKey([...tokenKeys, ...otpKeys]);
  return;
};

export const login = async (inputs, issuer) => {
  const { email, password } = inputs;

  const user = await findOne({
    model: UserModel,
    filter: {
      email,
      provider: ProviderEnum.System,
      confirmedEmail: { $exists: true },
    },
  });

  if (!user) {
    throw NotFoundException({ message: "Invalid Credentials" });
  }
  const matchPass = await compareHash({
    plaintext: password,
    cipherText: user.password,
    algo: HashEnum.Bcrypt,
  });

  if (!matchPass) {
    throw NotFoundException({ message: "Invalid Credentials" });
  }

  return await createLoginCredentials(user, issuer);
};
const verifyGoogleAccount = async (idToken) => {
  const client = new OAuth2Client();
  const ticket = await client.verifyIdToken({
    idToken,
    audience: CLIENT_IDS,
  });
  const payload = ticket.getPayload();

  if (!payload?.email_verified) {
    throw BadRequestException({
      message: "fail to verify this account with google",
    });
  }
  return payload;
};
export const signupWithGmail = async ({ idToken }, issuer) => {
  const payload = await verifyGoogleAccount(idToken);
  const checkUserExist = await findOne({
    model: UserModel,
    filter: { email: payload.email },
  });
  if (checkUserExist) {
    if (checkUserExist.provider == ProviderEnum.System) {
      throw ConflictException({
        message: "Account already exists with diffrent provider",
      });
    }
    const result = await loginWithGmail({ idToken }, issuer);
    return { result, status: 200 };
  }

  const user = await create({
    model: UserModel,
    data: {
      firstName: payload.given_name,
      lastName: payload.family_name,
      email: payload.email,
      profilePic: payload.picture,
      provider: ProviderEnum.Google,
      confirmEmail: new Date(),
    },
  });

  return { result: await createLoginCredentials(user, issuer) };
};
export const loginWithGmail = async ({ idToken }, issuer) => {
  const payload = await verifyGoogleAccount(idToken);

  const user = await findOne({
    model: UserModel,
    filter: { email: payload.email, provider: ProviderEnum.Google },
  });
  if (!user) {
    throw NotFoundException({ message: "Invalid Credentials" });
  }

  return await createLoginCredentials(user, issuer);
};
