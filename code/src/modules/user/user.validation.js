import joi from "joi";
import {
  fileFieldValidation,
  generalValidationFields,
} from "../../common/utils/index.js";
import { Types } from "mongoose";
export const shareProfile = {
  params: joi.object().keys({
    userId: generalValidationFields.id.required(),
  }),
};

export const profileImage = {
  file: generalValidationFields.file(fileFieldValidation.image).required(),
};
export const updatePassword = {
  body: joi
    .object()
    .keys({
      oldPassword: generalValidationFields.password.required(),
      password: generalValidationFields.password.not(joi.ref("oldPassword")).required(),
      confirmPassword: generalValidationFields
        .confirmPassword("password")
        .required(),
    })
    .required(),
};
export const profileCoverImage = {
  files: joi
    .array()
    .items(generalValidationFields.file(fileFieldValidation.image).required())
    .min(1)
    .max(5)
    .required(),
};
