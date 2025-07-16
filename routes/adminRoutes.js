// routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const jwtAuth = require("../middlewares/jwtAuth");
const adminMiddleware = require("../middlewares/adminMiddleware");

// Protect all admin API endpoints
router.use(jwtAuth);
router.use(adminMiddleware);

// Example: Get all users
router.get("/users", async (req, res) => {
  try {
    const [users] = await req.app.get("db").promise().query(
      "SELECT id, name, email, role, profile_picture FROM users"
    );
    res.json({ users });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Additional admin API endpoints (update roles, delete user, etc.) can go here

module.exports = router;
