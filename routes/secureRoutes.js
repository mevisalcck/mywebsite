// routes/secureRoutes.js
const express = require("express");
const router = express.Router();
const jwtAuth = require("../middlewares/jwtAuth");

router.get("/secure-data", jwtAuth, (req, res) => {
  res.json({ message: "Secure data accessed", user: req.user });
});

module.exports = router;
