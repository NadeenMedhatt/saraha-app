import nodemailer from "nodemailer";
import {
  APP_NAME,
  EMAIL_APP,
  EMAIL_APP_PASSWORD,
} from "../../../../config/config.service.js";

export const sendEmail = async ({
  to,
  cc,
  bcc,
  subject,
  html,
  attachments = [],
}) => {
  // Create a transporter using Ethereal test credentials.
  // For production, replace with your actual SMTP server details.
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: EMAIL_APP,
      pass: EMAIL_APP_PASSWORD,
    },
  });

  const info = await transporter.sendMail({
    from: `"${APP_NAME}" <${EMAIL_APP}>`,
    to,
    cc,
    bcc,
    subject,
    html,
    attachments,
  });

  console.log("Message sent:", info.messageId);
};
