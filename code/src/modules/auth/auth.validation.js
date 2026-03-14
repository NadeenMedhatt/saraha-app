import joi from "joi";
import { generalValidationFields } from "../../common/utils/index.js";

export const login = {
  body: joi
    .object()
    .keys({
      email: generalValidationFields.email.required(),
      password: generalValidationFields.password.required(),
    })
    .required(),
};

export const signup = {
  body: login["body"]
    .append({
      username: generalValidationFields.username.required(),
      confirmPassword: generalValidationFields
        .confirmPassword("password")
        .required(),
      phone: generalValidationFields.phone.required(),
    })
    .required(),
};
export const resendConfirmEmail = {
  body: joi
    .object()
    .keys({
      email: generalValidationFields.email.required(),
    })
    .required(),
};
export const confirmEmail = {
  body: resendConfirmEmail.body
    .append({
      email: generalValidationFields.email.required(),
      otp: generalValidationFields.otp.required(),
    })
    .required(),
};
export const resetForgetPasswordCode = {
  body: confirmEmail.body
    .append({
      password: generalValidationFields.password.required(),
      confirmPassword: generalValidationFields
        .confirmPassword("password")
        .required(),
    })
    .required(),
};
