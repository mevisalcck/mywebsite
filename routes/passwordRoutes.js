// routes/passwordRoutes.js
const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const db = require("../config/database");

// Configure nodemailer (update with your credentials)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "your-email@gmail.com", // replace
    pass: "your-email-password",  // replace
  },
});

// Forgot Password
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const [rows] = await db.promise().query("SELECT * FROM users WHERE email = ?", [email]);
    if (!rows.length) {
      return res.status(404).json({ message: "User not found" });
    }
    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour
    await db.promise().query("UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?", [resetToken, resetTokenExpiry, email]);
    const resetLink = `http://itsme.cck.com:3000/reset-password?token=${resetToken}`;
    await transporter.sendMail({
      to: email,
      subject: "Password Reset",
      html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`,
    });
    res.status(200).json({ message: "Password reset email sent" });
  } catch (err) {
    console.error("Forgot Password Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Reset Password
router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const [rows] = await db.promise().query("SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > ?", [token, Date.now()]);
    if (!rows.length) return res.status(400).json({ message: "Invalid or expired token" });
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.promise().query("UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE reset_token = ?", [hashedPassword, token]);
    res.status(200).json({ message: "Password reset successfully" });
  } catch (err) {
    console.error("Reset Password Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
