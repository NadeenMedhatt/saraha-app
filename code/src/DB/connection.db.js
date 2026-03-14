import mongoose from "mongoose";
import { DB_URI } from "../../config/config.service.js";
import { UserModel } from "./models/index.js";

export const authenticateDB = async () => {
  try {
    const result = await mongoose.connect(DB_URI, {});
    await UserModel.syncIndexes();
    console.log(`DB connected successfully`);
  } catch (error) {
    console.log(`Fail to connect to DB ${error}`);
  }
};
