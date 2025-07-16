// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const jwtAuth = require("../middlewares/jwtAuth");
const db = require("../config/database");

// User registration (already exists)
router.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const [existingUser] = await db.promise().query("SELECT * FROM users WHERE email = ?", [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: "Email already exists! Please login instead." });
    }
    const bcrypt = require("bcrypt");
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.promise().query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, role || "user"]
    );
    res.status(201).json({ message: "User registered successfully!" });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get user info using JWT (for dashboard)
router.get("/user", jwtAuth, async (req, res) => {
  try {
    // req.user is populated by jwtAuth middleware
    const [rows] = await db.promise().query(
      "SELECT name, email, created_at, last_login, profile_picture FROM users WHERE id = ?",
      [req.user.id]
    );
    if (!rows.length) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ user: rows[0] });
  } catch (err) {
    console.error("Error fetching user data:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
