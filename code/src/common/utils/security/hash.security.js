import { hash, compare } from "bcrypt";
import { SALT_ROUND } from "../../../../config/config.service.js";
import * as argon2 from "argon2";
import { HashEnum } from "../../enums/index.js";
export const generateHash = async ({
  plaintext,
  salt = SALT_ROUND,
  algo = HashEnum.Bcrypt,
} = {}) => {
  let hashedPassword = "";
  switch (algo) {
    case HashEnum.Bcrypt:
      hashedPassword = await hash(plaintext, salt);
      break;
    case HashEnum.Argon:
      hashedPassword = await argon2.hash(plaintext);

      break;

    default:
      hashedPassword = await hash(plaintext, salt);

      break;
  }

  return hashedPassword;
};

export const compareHash = async ({
  plaintext,
  cipherText,
  algo = HashEnum.Bcrypt,
} = {}) => {
  let match = false;
  switch (algo) {
    case HashEnum.Bcrypt:
      match = await compare(plaintext, cipherText);
      break;
    case HashEnum.Argon:
      match = await argon2.verify(cipherText, plaintext);

      break;

    default:
      match = await compare(plaintext, cipherText);

      break;
  }

  return match;
};
