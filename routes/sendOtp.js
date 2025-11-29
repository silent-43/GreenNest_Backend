import express from "express";
import nodemailer from "nodemailer";
import { client } from "../db.js";

const router = express.Router();

router.post("/send-otp", async (req, res) => {
  const { email } = req.body;

  const otp = Math.floor(100000 + Math.random() * 900000);

  // otp save to DB
  await client.query("UPDATE users SET otp=$1 WHERE email=$2", [otp, email]);

  // gmail SMTP
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "YOUR_GMAIL@gmail.com",
      pass: "APP_PASSWORD"
    }
  });

  await transporter.sendMail({
    to: email,
    subject: "Password Reset OTP",
    text: `Your OTP: ${otp}`
  });

  res.json({ message: "OTP sent to your email" });
});

export default router;
