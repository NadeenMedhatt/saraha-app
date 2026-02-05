import mongoose from "mongoose";

const OTPSchema = new mongoose.Schema(
  {
    hashedOTP: String,
    email: String,
    expireAt: { type: Date, expires: 300 },
  },
  {
    collection: "Route_OTP",
    strict: true,
    strictQuery: true,
    timestamps: true,
    autoIndex: true,
    validateBeforeSave: true,
  },
);

export const OTPModel = mongoose.models.OTP || mongoose.model("OTP", OTPSchema);
