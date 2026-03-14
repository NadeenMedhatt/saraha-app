import nodemailer from "nodemailer";
import {
  EMAIL_APP,
  EMAIL_APP_PASSWORD,
} from "../../../../config/config.service.js";
export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_APP,
    pass: EMAIL_APP_PASSWORD,
  },
});
