import {
  generateHash,
  ConflictException,
  NotFoundException,
  compareHash,
  encrypt,
  sendEmailOTP,
  createLoginCredentials,
  BadRequestException,
} from "../../common/utils/index.js";
import { create, findOne, UserModel } from "../../DB/index.js";
import { HashEnum, ProviderEnum } from "../../common/enums/index.js";
import { OAuth2Client } from "google-auth-library";
import { CLIENT_IDS } from "../../../config/config.service.js";

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
      password: await generateHash(password, undefined, HashEnum.Bcrypt),
      phone: await encrypt(phone),
      provider: ProviderEnum.System,
    },
  });
  await sendEmailOTP(email);

  return user;
};

export const login = async (inputs, issuer) => {
  const { email, password } = inputs;

  const user = await findOne({
    model: UserModel,
    filter: {
      email,
      provider: ProviderEnum.System,
    },
  });

  if (!user) {
    throw NotFoundException({ message: "Invalid Credentials" });
  }
  const matchPass = await compareHash(password, user.password, HashEnum.Bcrypt);

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
    //return login with gmail
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
