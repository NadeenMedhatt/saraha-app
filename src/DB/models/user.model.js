import mongoose from "mongoose";
import {
  GenderEnum,
  ProviderEnum,
  RoleEnum,
} from "../../common/enums/index.js";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "firstName Is Required"],
      minLength: 2,
      maxLength: 25,
    },
    lastName: {
      type: String,
      required: [true, "lastName Is Required"],
      minLength: 2,
      maxLength: 25,
    },

    email: {
      type: String,
      unique: true,
      required: [true, "Email Is Required"],
    },
    password: {
      type: String,
      required: function () {
        return this.provider == ProviderEnum.System;
      },
    },
    DOB: Date,
    gender: {
      type: Number,
      enum: Object.values(GenderEnum),
      default: GenderEnum.Male,
    },
    provider: {
      type: Number,
      enum: Object.values(ProviderEnum),
      default: ProviderEnum.System,
    },
    role: {
      type: Number,
      enum: Object.values(RoleEnum),
      default: RoleEnum.User,
    },
    phone: String,
    confirmedEmail: Date,
    profilePic: String,
  },
  {
    collection: "Route_User",
    strict: true,
    strictQuery: true,
    timestamps: true,
    autoIndex: true,
    validateBeforeSave: true,
  },
);
userSchema
  .virtual("username")
  .set(function (value) {
    const [firstName, lastName] = value?.split(" ") || [];
    this.set({ firstName, lastName });
  })
  .get(function () {
    return this.firstName + " " + this.lastName;
  });

export const UserModel =
  mongoose.models.User || mongoose.model("User", userSchema);
