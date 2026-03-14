import jwt from "jsonwebtoken";
import {
  ACCESS_EXPIRE_IN,
  REFRESH_EXPIRE_IN,
  SYSTEM_REFRESH_TOKEN_SECRET_KEY,
  SYSTEM_TOKEN_SECRET_KEY,
  USER_REFRESH_TOKEN_SECRET_KEY,
  USER_TOKEN_SECRET_KEY,
} from "../../../../config/config.service.js";
import { AudienceEnum, TokenTypeEnum, RoleEnum } from "../../enums/index.js";
import {
  BadRequestException,
  NotFoundException,
  UnAuthorizedException,
} from "../response/index.js";
import { findOne, TokenModel, UserModel } from "../../../DB/index.js";
import { randomUUID } from "node:crypto";
import { model } from "mongoose";
import { revokeTokenKey } from "../../services/redis.service.js";

export const generateToken = async ({
  payload = {},
  secret = USER_TOKEN_SECRET_KEY,
  options = {},
} = {}) => {
  return jwt.sign(payload, secret, options);
};
export const verifyToken = async ({
  token,
  secret = USER_TOKEN_SECRET_KEY,
} = {}) => {
  return jwt.verify(token, secret);
};
export const getTokenSignature = async (role) => {
  let accessSignature = undefined;
  let refreshSignature = undefined;
  let audience = AudienceEnum.User;
  switch (role) {
    case RoleEnum.Admin:
      accessSignature = SYSTEM_TOKEN_SECRET_KEY;
      audience = AudienceEnum.System;
      refreshSignature = SYSTEM_REFRESH_TOKEN_SECRET_KEY;
      break;

    default:
      accessSignature = USER_TOKEN_SECRET_KEY;
      audience = AudienceEnum.User;
      refreshSignature = USER_REFRESH_TOKEN_SECRET_KEY;
      break;
  }
  return { accessSignature, refreshSignature, audience };
};
export const getSignatureLevel = async (audienceType) => {
  let signatureLevel = RoleEnum.User;
  switch (audienceType) {
    case AudienceEnum.System:
      signatureLevel = RoleEnum.Admin;
      break;
    default:
      signatureLevel = RoleEnum.User;
      break;
  }
  return signatureLevel;
};
export const createLoginCredentials = async (user, issuer) => {
  const { accessSignature, refreshSignature, audience } =
    await getTokenSignature(user.role);

  const jwtid = randomUUID();
  const access_token = await generateToken({
    payload: { sub: user._id },
    secret: accessSignature,
    options: {
      issuer,
      audience: [TokenTypeEnum.access, audience],
      expiresIn: ACCESS_EXPIRE_IN,
      jwtid,
    },
  });
  const refresh_token = await generateToken({
    payload: { sub: user._id },
    secret: refreshSignature,
    options: {
      issuer,
      audience: [TokenTypeEnum.refresh, audience],
      expiresIn: REFRESH_EXPIRE_IN,
      jwtid,
    },
  });

  return { access_token, refresh_token };
};

export const decodeToken = async ({
  token,
  tokenType = TokenTypeEnum.access,
} = {}) => {
  const decode = jwt.decode(token);

  if (!decode?.aud?.length) {
    throw new BadRequestException({
      message: "Fail to decoded this token aud is required",
    });
  }
  const [decodeTokenType, audienceType] = decode.aud;
  if (decodeTokenType != tokenType) {
    throw BadRequestException({ message: `invalid token type` });
  }
  if (
    decode.jti &&
    (await get(revokeTokenKey({ userId: decode.sub, jti: decode.jti })))
  ) {
    throw UnAuthorizedException({ message: "Invalid Login Session" });
  }

  const signatureLevel = await getSignatureLevel(audienceType);
  const { accessSignature, refreshSignature } =
    await getTokenSignature(signatureLevel);

  const verifyData = await verifyToken({
    token,
    secret:
      tokenType == TokenTypeEnum.refresh ? refreshSignature : accessSignature,
  });
  const user = await findOne({
    model: UserModel,
    filter: { _id: verifyData.sub },
  });
  if (!user) {
    throw UnAuthorizedException({ message: "Not Register account" });
  }

  if (
    user.changeCredentialsTime &&
    user.changeCredentialsTime?.getTime() >= decode.iat * 1000
  ) {
    throw UnAuthorizedException({ message: "Invalid Login Session" });
  }

  return { user, decode };
};
