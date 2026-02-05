import { NODE_ENV } from "../../../../config/config.service.js";

export const globalErrorHandling = (error, req, res, next) => {
  const status = error.cause?.status ?? 500;
  return res.status(status).json({
    error_message:
      status == 500
        ? "something went wrong"
        : (error.message ?? "something went wrong"),
    stack: NODE_ENV == "development" ? error.stack : undefined,
  });
};
export const ErrorException = ({
  message = "Error",
  status = undefined,
  extra = undefined,
} = {}) => {
  throw new Error(message, { cause: { status, extra } });
};

export const NotFoundException = ({
  message = "NotFoundException",
  extra = undefined,
}) => {
  return ErrorException({ message, status: 404, extra });
};
export const BadRequestException = ({
  message = "BadRequestException",
  extra = undefined,
}) => {
  return ErrorException({ message, status: 400, extra });
};
export const ConflictException = ({
  message = "ConflictException",
  extra = undefined,
}) => {
  return ErrorException({ message, status: 409, extra });
};
export const UnAuthorizedException = ({
  message = "UnAuthorizedException",
  extra = undefined,
}) => {
  return ErrorException({ message, status: 401, extra });
};
export const ForbiddenException = ({
  message = "ForbiddenException",
  extra = undefined,
}) => {
  return ErrorException({ message, status: 403, extra });
};
