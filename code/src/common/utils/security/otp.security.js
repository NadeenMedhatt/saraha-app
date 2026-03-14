import { OTPModel } from "../../../DB/models/index.js";
import { encrypt, transporter } from "./index.js";

function generateOTP(length = 6) {
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10); // 0–9
  }
  return otp;
}
export const sendEmailOTP = async (email) => {
  const otp = generateOTP();
  const mailOptions = {
    from: EMAIL_USER,
    to: email,
    subject: "Saraha Email verification",
    html: `
        <div style="font-family:sans-serif;">
        <h2>Email Verification</h2>
        <p>Your OTP code is:</p>
        <h1 style="letter-spacing:4px;">${otp}</h1>
        <p>This code will expire in 5 minutes.</p>
      </div>
        `,
  };
  await transporter.sendMail(mailOptions);
  const hashedOTP = await encrypt(otp);
  const expireAt = new Date(Date.now());
  await OTPModel.deleteMany({ email });
  await OTPModel.create([
    {
      email,
      hashedOTP,
      expireAt,
    },
  ]);
  return otp;
};
