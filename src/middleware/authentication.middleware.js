import { TokenTypeEnum } from "../common/enums/index.js";
import { BadRequestException, decodeToken } from "../common/utils/index.js";

export const authentication = (tokenType = TokenTypeEnum.access) => {
  return async (req, res, next) => {
    if (!req?.headers?.authorization) {
      throw BadRequestException({ message: "Missing Authorization Key" });
    }
    const { authorization } = req.headers;
    const [flag, credential] = authorization.split(" ");

    if (!flag || !credential) {
      throw BadRequestException({ message: "Missing Authorization Parts" });
    }
    req.user = await decodeToken({
      token: credential,
      tokenType,
    });
    next();
  };
};
