// routes/authApiRoutes.js
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const db = require("../config/database");

const SECRET_KEY = "your_jwt_secret_key";      // Replace with your actual secret
const REFRESH_SECRET = "your_refresh_secret";     // Replace with your actual secret

router.use(cookieParser());

// Helper to generate tokens
function generateTokens(user) {
  const accessToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET_KEY, { expiresIn: "15m" });
  const refreshToken = jwt.sign({ id: user.id }, REFRESH_SECRET, { expiresIn: "7d" });
  return { accessToken, refreshToken };
}

// Login Route
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body; // username is email in our case
    const [rows] = await db.promise().query("SELECT * FROM users WHERE email = ?", [username]);
    if (!rows.length) return res.status(401).json({ message: "Invalid credentials" });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });
    
    const { accessToken, refreshToken } = generateTokens({ id: user.id, email: user.email, role: user.role });
    // Set tokens in httpOnly cookies
    res.cookie("accessToken", accessToken, { httpOnly: true, secure: true, sameSite: "Strict" });
    res.cookie("refreshToken", refreshToken, { httpOnly: true, secure: true, sameSite: "Strict" });
    
    res.json({ success: true, token: accessToken });  // Also return token for convenience
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Refresh Token Route
router.post("/refresh", (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(403).json({ message: "Refresh token required" });
  
  jwt.verify(refreshToken, REFRESH_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid or expired refresh token" });
    const newAccessToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET_KEY, { expiresIn: "15m" });
    res.cookie("accessToken", newAccessToken, { httpOnly: true, secure: true, sameSite: "Strict" });
    res.json({ token: newAccessToken });
  });
});

// Logout Route
router.post("/logout", (req, res) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.json({ message: "Logged out" });
});

module.exports = router;
