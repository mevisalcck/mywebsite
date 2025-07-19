process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

require('dotenv').config();
const express = require("express");
const path = require("path");
const fs = require("fs");
const cookieParser = require("cookie-parser");
const bcrypt = require('bcrypt');

const authApiRoutes = require("./routes/authApiRoutes");
const secureRoutes = require("./routes/secureRoutes");
const blogRoutes = require("./routes/blogRoutes");
const adminRoutes = require("./routes/adminRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const userRoutes = require("./routes/userRoutes");
const passwordRoutes = require("./routes/passwordRoutes");

const jwtAuth = require("./middlewares/jwtAuth");
const adminMiddleware = require("./middlewares/adminMiddleware");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static("public"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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

app.use("/api", authApiRoutes);
app.use("/api", secureRoutes);
app.use("/blog", blogRoutes);
app.use("/admin", adminRoutes);
app.use("/upload", uploadRoutes);
app.use("/", userRoutes);
app.use("/", passwordRoutes);

app.get("/dashboard", jwtAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

app.get("/admin", jwtAuth, adminMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "adminPage.html"));
});

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.get("/register", (req, res) => res.sendFile(path.join(__dirname, "public", "register.html")));
app.get("/login", (req, res) => res.sendFile(path.join(__dirname, "public", "login.html")));
app.get("/blog", (req, res) => res.sendFile(path.join(__dirname, "public", "blog.html")));

const PORT = 3000;

// Always use HTTP (NGINX will handle HTTPS for you later if needed)
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});
