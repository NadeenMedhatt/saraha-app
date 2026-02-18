import { Router } from "express";
import {
  login,
  loginWithGmail,
  signup,
  signupWithGmail,
} from "./auth.service.js";
import {
  successResponse,
  BadRequestException,
} from "../../common/utils/index.js";
import * as validators from "./auth.validation.js";
import { validation } from "../../middleware/index.js";

const router = Router();
router.post(
  "/signup",
  validation(validators.signup),
  async (req, res, next) => {
    const result = await signup(req.body);
    return successResponse({
      res,
      message: "Done",
      status: 201,
      data: { result },
    });
  },
);
router.post("/login", validation(validators.login), async (req, res, next) => {
  const result = await login(req.body, `${req.protocol}://${req.host}`);
  return successResponse({
    res,
    message: "Done",
    status: 200,
    data: { result },
  });
});

router.post("/signup/gmail", async (req, res, next) => {
  const { result, status = 201 } = await signupWithGmail(
    req.body,
    `${req.protocol}://${req.host}`,
  );

  return successResponse({
    res,
    message: "Done",
    status,
    data: { result },
  });
});

router.post("/login/gmail", async (req, res, next) => {
  const account = await loginWithGmail(
    req.body,
    `${req.protocol}://${req.host}`,
  );
  return successResponse({
    res,
    message: "Done",
    status: 200,
    data: { account },
  });
});

export default router;
