// controllers/uploadController.js
const multer = require("multer");
const path = require("path");
const db = require("../config/database");

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    // Use session user id and original extension
    cb(null, req.session.user.id + path.extname(file.originalname));
  }
});

// File filter: allow only images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only images are allowed"), false);
  }
};

const upload = multer({ storage, fileFilter });

exports.uploadProfilePicture = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded." });
  }
  const profilePicturePath = "/uploads/" + req.file.filename;
  db.promise().query("UPDATE users SET profile_picture = ? WHERE id = ?", [profilePicturePath, req.session.user.id])
    .then(() => {
      req.session.user.profilePicture = profilePicturePath;
      res.json({ message: "Profile picture uploaded successfully!", profilePicture: profilePicturePath });
    })
    .catch((error) => {
      console.error("Database update error:", error);
      res.status(500).json({ message: "Failed to update profile picture." });
    });
};

exports.multerUpload = upload.single("profilePicture");
