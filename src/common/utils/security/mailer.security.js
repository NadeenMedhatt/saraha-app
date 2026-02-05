import nodemailer from "nodemailer";
import { EMAIL_PASS, EMAIL_USER } from "../../../../config/config.service.js";
export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});