import { resolve } from "node:path";
import { config } from "dotenv";

export const NODE_ENV = process.env.NODE_ENV;

const envPath = {
  development: `.env.development`,
  production: `.env.production`,
};
console.log({ en: envPath[NODE_ENV] });

config({ path: resolve(`./config/${envPath[NODE_ENV]}`) });

export const port = process.env.PORT ?? 7000;

export const DB_URI = process.env.DB_URI;
export const REDIS_URI = process.env.REDIS_URI;

export const CRYPTO_SECRET = process.env.CRYPTO_SECRET;
export const SYSTEM_TOKEN_SECRET_KEY = process.env.SYSTEM_TOKEN_SECRET_KEY;
export const USER_TOKEN_SECRET_KEY = process.env.USER_TOKEN_SECRET_KEY;
export const SYSTEM_REFRESH_TOKEN_SECRET_KEY =
  process.env.SYSTEM_REFRESH_TOKEN_SECRET_KEY;
export const USER_REFRESH_TOKEN_SECRET_KEY =
  process.env.USER_REFRESH_TOKEN_SECRET_KEY;
export const ACCESS_EXPIRE_IN = parseInt(process.env.ACCESS_EXPIRE_IN);
export const REFRESH_EXPIRE_IN = parseInt(process.env.REFRESH_EXPIRE_IN);
export const CLIENT_IDS = process.env.CLIENT_IDS.split(",")||[];
export const EMAIL_APP = process.env.EMAIL_APP;
export const EMAIL_APP_PASSWORD = process.env.EMAIL_APP_PASSWORD;
export const APP_NAME = process.env.APP_NAME;
export const FACEBOOK_LINK = process.env.FACEBOOK_LINK;
export const INSTAGRAM_LINK = process.env.INSTAGRAM_LINK;
export const TWITTER_LINK = process.env.TWITTER_LINK;

export const SALT_ROUND = parseInt(process.env.SALT_ROUND ?? "10");
console.log({ SALT_ROUND });
