import {
  generateHash,
  ConflictException,
  NotFoundException,
  compareHash,
  encrypt,
  decrypt,
  sendEmailOTP,
} from "../../common/utils/index.js";
import { OTPModel, UserModel } from "../../DB/model/index.js";
import { HashEnum, ProviderEnum } from "../../common/enums/index.js";

export const signup = async (inputs) => {
  const { username, email, password, phone } = inputs;
  const checkEmailExists = await UserModel.findOne({ email });

  if (checkEmailExists) {
    return ConflictException({ message: "Email Exists" });
  }

  const [user] = await UserModel.create([
    {
      username,
      email,
      password: await generateHash(password, undefined, HashEnum.Bcrypt),
      phone: await encrypt(phone),
      provider: ProviderEnum.System,
    },
  ]);
  await sendEmailOTP(email);

  return user;
};

export const login = async (inputs) => {
  const { email, password } = inputs;

  const user = await UserModel.findOne({
    email,
    provider: ProviderEnum.System,
  });

  if (!user) {
    return NotFoundException({ message: "Invalid Credentials" });
  }
  const matchPass = await compareHash(password, user.password, HashEnum.Bcrypt);

  if (!matchPass) {
    return NotFoundException({ message: "Invalid Credentials" });
  }
  user.phone = await decrypt(user.phone);
  return user;
};
