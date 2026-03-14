import { Router } from "express";
import {
  logout,
  profile,
  profileCoverImage,
  profileImage,
  rotateToken,
  shareProfile,
} from "./user.service.js";
import {
  fileFieldValidation,
  localFileUpload,
  successResponse,
} from "../../common/utils/index.js";
import { authentication } from "../../middleware/authentication.middleware.js";
import { TokenTypeEnum } from "../../common/enums/security.enum.js";
import { validation } from "../../middleware/validation.middleware.js";
import * as validators from "./user.validation.js";
import { resolveObjectURL } from "node:buffer";

const router = Router();

router.post("/logout", authentication(), async (req, res, next) => {
  const status = await logout(req.body, req.user, req.decode);
  return successResponse({
    res,
    message: "Done",
    status,
  });
});

router.patch(
  "/password",
  authentication(),
  validation(validators.updatePassword),
  async (req, res, next) => {
    const credentials = await updatePassword(
      req.body,
      req.user,
      `${req.protocol}://${req.host}`,
    );

    return successResponse({
      res,
      message: "Done",
      status: 200,
      data: { credentials },
    });
  },
);
router.patch(
  "/profile-image",
  authentication(),
  localFileUpload({
    customPath: "users/profile",
    validation: fileFieldValidation.image,
    maxSize: 5,
  }).single("attachment"),

  validation(validators.profileImage),
  async (req, res, next) => {
    const account = await profileImage(req.file, req.user);

    return successResponse({
      res,
      message: "Done",
      status: 200,
      data: { account },
    });
  },
);
router.patch(
  "/profile-cover-image",
  authentication(),
  localFileUpload({
    customPath: "users/profile/cover",
    validation: fileFieldValidation.image,
    maxSize: 5,
  }).array("attachments", 5),
  validation(validators.profileCoverImage),
  async (req, res, next) => {
    const account = await profileCoverImage(req.files, req.user);
    return successResponse({
      res,
      message: "Done",
      status: 200,
      data: { account },
    });
  },
);

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
  "/:userId/share-profile",
  validation(validators.shareProfile),
  async (req, res, next) => {
    const result = await shareProfile(req.params.userId);
    return successResponse({
      res,
      message: "Done",
      status: 200,
      data: { result },
    });
  },
);
router.post(
  "/rotate",
  authentication(TokenTypeEnum.refresh),
  async (req, res, next) => {
    const credentials = await rotateToken(
      req.user,
      req.decode,
      `${req.protocol}://${req.host}`,
    );
    return successResponse({
      res,
      message: "Done",
      status: 201,
      data: { ...credentials },
    });
  },
);

export default router;
