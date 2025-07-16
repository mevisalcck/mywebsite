// server.js
require('dotenv').config();
const express = require("express");
const path = require("path");
const fs = require("fs");
const https = require("https");
const cookieParser = require("cookie-parser");
// const bcrypt = require('bcrypt');
const bcrypt = require('bcrypt');

// Load route modules
const authApiRoutes = require("./routes/authApiRoutes");     // /api/login, /api/refresh, etc.
const secureRoutes = require("./routes/secureRoutes");         // Additional secure endpoints (JWT-protected)
const blogRoutes = require("./routes/blogRoutes");
const adminRoutes = require("./routes/adminRoutes");           // Admin API endpoints (JWT+admin protected)
const uploadRoutes = require("./routes/uploadRoutes");
const userRoutes = require("./routes/userRoutes");
const passwordRoutes = require("./routes/passwordRoutes");

// Load JWT middleware and admin role checker
const jwtAuth = require("./middlewares/jwtAuth");
const adminMiddleware = require("./middlewares/adminMiddleware");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static("public"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Database Connection
const db = require("./config/database");
db.getConnection((err, connection) => {
  if (err) {
    console.error("MySQL connection error:", err);
    return;
  }
  console.log("Connected to MySQL database");
  connection.release();
});
app.set("db", db);

// Mount routes
app.use("/api", authApiRoutes);   // Handles login, refresh, logout (JWT-based)
app.use("/api", secureRoutes);    // Secure endpoints (example: /api/secure-data)
app.use("/blog", blogRoutes);
app.use("/admin", adminRoutes);   // Admin API endpoints (JWT+admin) for operations like /admin/users
app.use("/upload", uploadRoutes);
app.use("/", userRoutes);         // Registration etc.
app.use("/", passwordRoutes);     // Forgot/reset password endpoints

// Serve protected pages using JWT middleware
app.get("/dashboard", jwtAuth, (req, res) => {
  // Only if token is valid, serve the dashboard page
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// Protect admin page: require valid JWT then check admin role
app.get("/admin", jwtAuth, adminMiddleware, (req, res) => {
  // The user must have a valid token and role=admin
  res.sendFile(path.join(__dirname, "public", "adminPage.html"));
});


// Serve public pages (no JWT required)
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.get("/register", (req, res) => res.sendFile(path.join(__dirname, "public", "register.html")));
app.get("/login", (req, res) => res.sendFile(path.join(__dirname, "public", "login.html")));
app.get("/blog", (req, res) => res.sendFile(path.join(__dirname, "public", "blog.html")));
// Start the server (using HTTPS if certificates exist)
const PORT = 3000;
if (fs.existsSync("key.pem") && fs.existsSync("cert.pem")) {
  https.createServer({
    key: fs.readFileSync("key.pem"),
    cert: fs.readFileSync("cert.pem")
  }, app).listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on: https://localhost:${PORT}`);
  });
} else {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on: http://localhost:${PORT}`);
  });
}
