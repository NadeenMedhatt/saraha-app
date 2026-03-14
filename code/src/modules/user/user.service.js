import {
  compareHash,
  ConflictException,
  createLoginCredentials,
  decrypt,
  generateHash,
  NotFoundException,
} from "../../common/utils/index.js";
import { LogoutEnum } from "../../common/enums/index.js";
import { findOne } from "../../DB/database.repository.js";
import { UserModel } from "../../DB/index.js";
import { ACCESS_EXPIRE_IN } from "../../../config/config.service.js";
import {
  allKeysByPrefix,
  deleteKey,
  revokeTokenKey,
  revokeTokenKeyPrefix,
  set,
} from "../../common/services/index.js";

const createRevokeToken = async ({ userId, jti, ttl }) => {
  await set({
    key: revokeTokenKey({ userId, jti }),
    value: jti,
    ttl,
  });
};
export const logout = async ({ flag }, user, { jti, iat, sub }) => {
  // 28:29
  let status = 200;
  switch (flag) {
    case LogoutEnum.All:
      user.changeCredentialsTime = new Date();
      await user.save();
      await deleteKey(await keys(revokeTokenKeyPrefix(sub)));
      break;

    default:
      await createRevokeToken({
        userId: sub,
        jti,
        ttl: iat + REFRESH_EXPIRE_IN,
      });
      status = 201;

      break;
  }

  return status;
};
export const updatePassword = async (
  { oldPassword, password },
  user,
  issuer,
) => {
  if (
    !(await compareHash({ plaintext: oldPassword, cipherText: user.password }))
  ) {
    throw ConflictException({ message: "invalid old password" });
  }
  user.password = await generateHash({ plaintext: password });
  user.changeCredentialsTime = new Date();
  await user.save();
  await deleteKey(await allKeysByPrefix(revokeTokenKeyPrefix(user._id)));
  return await createLoginCredentials(user, issuer);
};
export const profileImage = async (file, user) => {
  user.profilePic = file.finalPath;
  await user.save();
  return user;
};
export const profileCoverImage = async (files, user) => {
  console.log(files);

  user.coverProfilePictures = files.map((file) => file.finalPath);
  await user.save();
  return user;
};
export const profile = async (user) => {
  return user;
};
export const shareProfile = async (userId) => {
  const account = await findOne({
    model: UserModel,
    filter: { _id: userId },
    select: "-password",
  });
  if (!account) {
    throw NotFoundException({ message: "Invalid shared account" });
  }
  if (account.phone) {
    account.phone = await decrypt(account.phone);
  }
  return account;
};
export const rotateToken = async (user, { jti, iat, sub }, issuer) => {
  if ((iat + ACCESS_EXPIRE_IN) * 1000 >= Date.now() + 3000) {
    throw ConflictException({ message: "current access token still valid" });
  }
  await createRevokeToken({ userId: sub, jti, ttl: iat + REFRESH_EXPIRE_IN });

  return await createLoginCredentials(user, issuer);
};
