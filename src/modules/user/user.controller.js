import { Router } from "express";
import { profile, rotateToken } from "./user.service.js";
import { successResponse } from "../../common/utils/index.js";
import {} from "module";
import { authentication } from "../../middleware/authentication.middleware.js";
import { TokenTypeEnum } from "../../common/enums/security.enum.js";
const router = Router();

router.get("/", authentication(), async (req, res, next) => {
  const result = await profile(req.user);
  return successResponse({
    res,
    message: "Done",
    status: 200,
    data: { result },
  });
});
router.get(
  "/rotate",
  authentication(TokenTypeEnum.refresh),
  async (req, res, next) => {
    console.log(req.headers.authorization);

    const result = await rotateToken(req.user, `${req.protocol}://${req.host}`);
    return successResponse({
      res,
      message: "Done",
      status: 200,
      data: { result },
    });
  },
);

export default router;
