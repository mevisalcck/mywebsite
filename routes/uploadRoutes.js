// routes/uploadRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

// Set up storage engine so that filenames are unique (userID_timestamp.ext ideally)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    // For simplicity, we're using Date.now(); you might use req.user.id if JWT is used (if authenticated upload required)
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

// Allow only images (optionally)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only images are allowed"), false);
  }
};

const upload = multer({ storage, fileFilter });

// Upload endpoint
router.post("/", upload.single("profilePicture"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }
  const profilePicturePath = "/uploads/" + req.file.filename;
  try {
    await req.app.get("db").promise().query("UPDATE users SET profile_picture = ? WHERE email = ?", [profilePicturePath, req.body.email]);
    res.json({ message: "Profile picture uploaded successfully!", profilePicture: profilePicturePath });
  } catch (error) {
    console.error("Database update error:", error);
    res.status(500).json({ message: "Failed to update profile picture." });
  }
});

module.exports = router;
