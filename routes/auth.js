/*
import express from "express";
import { forgotPassword, resetPassword } from "../controllers/auth.js";

const router = express.Router();

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
*/



import express from "express";
import { forgotPassword, resetPassword } from "../controllers/auth.js";
import { body } from "express-validator";

const router = express.Router();

router.post(
  "/forgot-password",
  body("email").isEmail().withMessage("Valid email is required"),
  forgotPassword
);

router.post(
  "/reset-password",
  [
    body("token").notEmpty().withMessage("Token is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
  ],
  resetPassword
);

export default router;
