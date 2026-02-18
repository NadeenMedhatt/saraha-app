import { BadRequestException } from "../common/utils/index.js";

export const validation = (schema) => {
  return (req, res, next) => {
    const keys = Object.keys(schema) || [];
    const errors = [];
    for (const key of keys) {
      const validationResult = schema[key].validate(req.body, {
        abortEarly: false,
      });
      if (validationResult.error) {
        errors.push({
          key,
          details: validationResult.error.details?.map((ele) => {
            return { message: ele.message, path: ele.path };
          }),
        });
      }
    }

    if (errors.length) {
      throw BadRequestException({
        message: "validation error",
        extra: errors,
      });
    }
    next();
  };
};
