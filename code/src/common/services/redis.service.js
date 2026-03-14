import { redisClient } from "../../DB/index.js";
import { EmailEnum } from "../enums/index.js";

export const revokeTokenKeyPrefix = (userId) => {
  return `user:RevokeToken:${userId.toString()}`;
};
export const revokeTokenKey = (userId, jti) => {
  return `user:RevokeToken:${userId}:${jti}`;
};
export const otpKey = ({ email, subject =EmailEnum.ConfirmEmail }) => {
  return `OTP::User::${email}::${subject}`;
};
export const maxAttemptOtpKey = ({ email, subject =EmailEnum.ConfirmEmail }) => {
  return `${otpKey({ email, subject })}::MaxTrial`;
};
export const blockOtpKey = ({ email, subject =EmailEnum.ConfirmEmail }) => {
  return `${otpKey({ email, subject })}::Block`;
};

export const set = async ({ key, value, ttl = null } = {}) => {
  try {
    const data = typeof value === "string" ? value : JSON.stringify(value);

    if (ttl) {
      // ttl by seconds
      await redisClient.setEx(key, ttl, data);
    } else {
      await redisClient.set(key, data);
    }

    return true;
  } catch (error) {
    console.error("Redis SET error:", error);
    return false;
  }
};

export const get = async (key) => {
  try {
    const data = await redisClient.get(key);
    if (!data) return null;

    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  } catch (error) {
    console.error("Redis GET error:", error);
    return null;
  }
};

export const update = async (key, value, ttl = null) => {
  try {
    const exists = await redisClient.exists(key);
    if (!exists) return false;
    return await redisClient.set(key, value, ttl);
  } catch (error) {
    console.error("Redis UPDATE error:", error);
    return false;
  }
};

export const deleteKey = async (key) => {
  try {
    const result = await redisClient.del(key);
    return result === 1;
  } catch (error) {
    console.error("Redis DELETE error:", error);
    return false;
  }
};
export const exists = async (key) => {
  try {
    return await redisClient.exists(key);
  } catch (error) {
    console.error("Redis EXITS error:", error);
    return false;
  }
};
export const incr = async (key) => {
  try {
    return await redisClient.incr(key);
  } catch (error) {
    console.error("Redis incr error:", error);
    return false;
  }
};

export const expire = async (key, ttl) => {
  try {
    const result = await redisClient.expire(key, ttl);
    return result === 1;
  } catch (error) {
    console.error("Redis EXPIRE error:", error);
    return false;
  }
};

export const ttl = async (key) => {
  try {
    return await redisClient.ttl(key);
  } catch (error) {
    console.error("Redis TTL error:", error);
    return -2;
  }
};

export const allKeysByPrefix = async (baseKey) => {
  return await redisClient.keys(baseKey);
};

export const logout = async (inputs) => {
  const { flag, decoded, FCMToken } = inputs;
  let status = 200;
  switch (flag) {
    case LogoutEnum.All:
      await updateOne({
        model: UserModel,
        filter: { _id: decoded?._id },
        update: {
          changeCredentialsTime: new Date(),
        },
      });
      //console.log(await allKeysByPrefix(revokeTokenKeyPrefix(`${decoded?._id}*`)));

      await Promise.allSettled([
        removeUser(decoded?._id),
        removeFCMUser(decoded?._id),
        deleteKey(
          await allKeysByPrefix(revokeTokenKeyPrefix(`${decoded?._id}*`)),
        ),
      ]);

      break;
    default:
      await createRevokeToken(decoded);
      if (FCMToken) {
        await removeFCM(decoded._id, FCMToken);
      }
      status = 201;
      break;
  }
  return status;
};
