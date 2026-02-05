import { Router } from "express";
import { profile } from "./user.service.js";
const router = Router();

router.get("/", async (req, res, next) => {
  const result = await profile();
  return successResponse({
    res,
    message: "User Updated",
    status: 200,
    data: { result },
  });
});

export default router;
