import joi from "joi";

export const login = {
  body: joi
    .object()
    .keys({
      email: joi
        .string()
        .email({
          minDomainSegments: 2,
          maxDomainSegments: 3,
          tlds: { allow: ["com", "net", "edu"] },
        })
        .required(),
      password: joi
        .string()
        .pattern(
          new RegExp(
            /^(?=.*[a-z]){1,}(?=.*[A-Z]){1,}(?=.*\d){1,}(?=.*\W){1,}[\w\W\d].{8,25}$/,
          ),
        )
        .required(),
    })
    .required(),
};

export const signup = {
  body: login['body']
    .append({
      username: joi
        .string()
        .pattern(new RegExp(/^[A-Z]{1}[a-z]{1,24}\s[A-Z]{1}[a-z]{1,24}/))
        .required(),
      confirmPassword: joi.string().valid(joi.ref("password")).required(),
      phone: joi
        .string()
        .pattern(new RegExp(/^(02|2|\+2)?01[0-25]\d{8}$/))
        .required(),
    })
    .required(),
};
