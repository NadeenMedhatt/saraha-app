import { Router } from "express";
import {
  confirmEmail,
  login,
  loginWithGmail,
  requestForgetPasswordOtp,
  resendConfirmEmail,
  resetForgetPasswordOtp,
  signup,
  signupWithGmail,
  verifyForgetPasswordOtp,
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
router.patch(
  "/confirm-email",
  validation(validators.confirmEmail),
  async (req, res, next) => {
    const result = await confirmEmail(req.body);
    return successResponse({
      res,
      message: "Done",
      status: 200,
    });
  },
);
router.patch(
  "/resend-confirm-email",
  validation(validators.resendConfirmEmail),
  async (req, res, next) => {
    const result = await resendConfirmEmail(req.body);
    return successResponse({
      res,
      message: "Done",
      status: 200,
    });
  },
);
router.post(
  "/request-forget-password-code",
  validation(validators.resendConfirmEmail),
  async (req, res, next) => {
    const result = await requestForgetPasswordOtp(req.body);
    return successResponse({
      res,
      message: "Done",
      status: 200,
    });
  },
);
router.patch(
  "/verify-forget-password-code",
  validation(validators.confirmEmail),
  async (req, res, next) => {
    const result = await verifyForgetPasswordOtp(req.body);
    return successResponse({
      res,
      message: "Done",
      status: 200,
    });
  },
);
router.patch(
  "/reset-forget-password-code",
  validation(validators.resetForgetPasswordCode),
  async (req, res, next) => {
    const result = await resetForgetPasswordOtp(req.body);
    return successResponse({
      res,
      message: "Done",
      status: 200,
    });
  },
);

router.post("/login", validation(validators.login), async (req, res, next) => {
  const result = await login(req.body, `${req.protocol}://${req.host}`);
  return successResponse({
    res,
    message: "Done",
    status: 200,
    data: { ...result },
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
