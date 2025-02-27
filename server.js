const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const path = require("path");
const app = express();
const session = require("express-session");
const multer = require("multer"); // For file uploads
const nodemailer = require("nodemailer"); // For sending emails
const crypto = require("crypto"); // For generating reset tokens

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public")); // Serve static files from "public" folder


// Database connection
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Vnfr1899",
    database: "mywebsite",
});

db.connect((err) => {
    if (err) {
        console.error("MySQL connection error:", err);
        return;
    }
    console.log("Connected to MySQL database");
});

// Session configuration
const MySQLStore = require("express-mysql-session")(session);
const sessionStore = new MySQLStore({}, db); // Store session in MySQL

app.use(
    session({
        secret: "your_secret_key",
        resave: false,
        saveUninitialized: false,
        store: sessionStore, // Store sessions in MySQL
        cookie: { secure: false, httpOnly: true },
    })
);

// Serve pages
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.get("/register", (req, res) => res.sendFile(path.join(__dirname, "public", "register.html")));
app.get("/login", (req, res) => res.sendFile(path.join(__dirname, "public", "login.html")));
app.get("/dashboard", (req, res) => {
    console.log("Session user in /dashboard:", req.session.user); // Debugging
    if (!req.session.user) {
        return res.redirect("/login"); // Redirect if not logged in
    }
    res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});


// Middleware to check authentication
function authMiddleware(req, res, next) {
    if (!req.session.user) return res.status(401).json({ message: "Unauthorized" });
    next();
}

// Register Endpoint
app.post("/register", async (req, res) => {
    const { name, email, password, role } = req.body;

    try {
        const [existingUser] = await db.promise().query("SELECT * FROM users WHERE email = ?", [email]);

        if (existingUser.length > 0) {
            return res.status(400).json({ message: "Email already exists! Please login instead." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.promise().query("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)", [name, email, hashedPassword, role || 'user']);

        res.status(201).json({ message: "User registered successfully!" });
    } catch (err) {
        console.error("MySQL Error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Login Endpoint

app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await db.promise().query("SELECT * FROM users WHERE email = ?", [email]);
        if (!rows.length) return res.status(401).json({ message: "Invalid email or password" });
        const user = rows[0];
        if (!await bcrypt.compare(password, user.password)) {
            return res.status(401).json({ message: "Invalid email or password" });
        }
        // Update last_login timestamp
        await db.promise().query("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?", [user.id]);
        // Save user info in session, including the role
        req.session.user = { id: user.id, email: user.email, name: user.name, role: user.role };
        console.log("Session user after login:", req.session.user);
        res.status(200).json({ success: true, redirectTo: "/dashboard" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});


// Fetch user data
app.get("/user", authMiddleware, async (req, res) => {
    try {
        const [user] = await db.promise().query(
            "SELECT name, email, created_at, last_login, profile_picture FROM users WHERE id = ?",
            [req.session.user.id]
        );
        if (user.length === 0) return res.status(404).json({ message: "User not found" });
        res.json({ user: user[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});


// Change password
app.post("/change-password", authMiddleware, async (req, res) => {
    const { newPassword } = req.body;
    if (!newPassword) return res.status(400).json({ message: "Password is required" });
    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.promise().query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, req.session.user.id]);
        res.json({ message: "Password updated successfully!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// Delete account
app.post("/delete-account", authMiddleware, async (req, res) => {
    try {
        await db.promise().query("DELETE FROM users WHERE id = ?", [req.session.user.id]);
        req.session.destroy();
        res.json({ message: "Account deleted successfully!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// Logout Endpoint
app.post("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ message: "Logout failed" });
        res.clearCookie("connect.sid"); // Remove session cookie
        res.json({ message: "Logged out successfully!" });
    });
});


// Configure Nodemailer for sending emails
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "your-email@gmail.com", // Replace with your actual email
        pass: "your-email-password",  // Replace with your actual email password or use OAuth2
    },
});

// Endpoint to request a password reset
app.post("/forgot-password", async (req, res) => {
    const { email } = req.body;
    try {
        const [rows] = await db.promise().query("SELECT * FROM users WHERE email = ?", [email]);
        if (rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        const user = rows[0];
        const resetToken = crypto.randomBytes(20).toString("hex");
        const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

        await db.promise().query("UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?", [resetToken, resetTokenExpiry, user.id]);

        const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;
        console.log("Password reset link:", resetLink); // Log the link for debugging

        await transporter.sendMail({
            to: email,
            subject: "Password Reset",
            html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`,
        });

        res.status(200).json({ message: "Password reset email sent" });
    } catch (err) {
        console.error("Forgot Password Error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// Endpoint to reset the password
app.post("/reset-password", async (req, res) => {
    const { token, newPassword } = req.body;
    try {
        const [rows] = await db.promise().query("SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > ?", [token, Date.now()]);
        if (rows.length === 0) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }
        const user = rows[0];
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.promise().query("UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?", [hashedPassword, user.id]);
        res.status(200).json({ message: "Password reset successfully" });
    } catch (err) {
        console.error("Reset Password Error:", err);
        res.status(500).json({ message: "Server error" });
    }
});


// Set up storage for uploaded files
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/"); // Save files in the "uploads" folder
    },
    filename: (req, file, cb) => {
        cb(null, req.session.user.id + path.extname(file.originalname)); // Unique filename per user
    }
});
app.use('/uploads', express.static('uploads'));

// File filter (optional, allows only images)
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else {
        cb(new Error("Only images are allowed"), false);
    }
};

// Initialize multer
const upload = multer({ storage, fileFilter });


// Updated File Upload Endpoint (uses session user ID)
app.post("/upload", authMiddleware, upload.single("profilePicture"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded." });
    }

    const profilePicturePath = "/uploads/" + req.file.filename; // Ensure this path matches your static folder setup

    try {
        // Update the user's profile picture in the database
        await db.promise().query("UPDATE users SET profile_picture = ? WHERE id = ?", [profilePicturePath, req.session.user.id]);

        // Update session
        req.session.user.profilePicture = profilePicturePath;

        res.json({ message: "Profile picture uploaded successfully!", profilePicture: profilePicturePath });
    } catch (error) {
        console.error("Database update error:", error);
        res.status(500).json({ message: "Failed to update profile picture." });
    }
});


// Update Profile Endpoint (Update user's name and email)
app.post("/update-profile", authMiddleware, async (req, res) => {
    const { name, email } = req.body;
    try {
        // Optionally, check if the new email is already in use by another user
        const [existing] = await db.promise().query(
            "SELECT id FROM users WHERE email = ? AND id != ?", 
            [email, req.session.user.id]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({ message: "Email already in use by another account." });
        }
        
        await db.promise().query(
            "UPDATE users SET name = ?, email = ? WHERE id = ?", 
            [name, email, req.session.user.id]
        );
        
        // Also update session data
        req.session.user.name = name;
        req.session.user.email = email;
        
        res.json({ message: "Profile updated successfully!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});



// -----------------------
// Admin Endpoints
// -----------------------

// Admin Middleware: Ensures the current session user is an admin
function adminMiddleware(req, res, next) {
    console.log("Admin middleware session:", req.session.user);
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden: Admins only" });
    }
    next();
}

// Serve the Admin Panel (accessible at /admin)
app.get("/admin", adminMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// Fetch All Users (Admin Only)
app.get("/admin/users", adminMiddleware, async (req, res) => {
    try {
        const [users] = await db.promise().query(
            "SELECT id, name, email, role, profile_picture FROM users"
        );
        res.json({ users });
    } catch (err) {
        console.error("Error fetching users:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// Delete a User (Admin Only)
// Prevents an admin from deleting their own account.
app.post("/admin/delete-user", adminMiddleware, async (req, res) => {
    const { userId } = req.body;
    if (parseInt(userId) === req.session.user.id) {
        return res.status(400).json({ message: "You cannot delete yourself!" });
    }
    try {
        await db.promise().query("DELETE FROM users WHERE id = ?", [userId]);
        res.json({ message: "User deleted successfully!" });
    } catch (err) {
        console.error("Error deleting user:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// Update a User's Role (Admin Only)
// Prevents an admin from demoting themselves.
app.post("/admin/update-role", adminMiddleware, async (req, res) => {
    const { userId, role } = req.body;
    if (parseInt(userId) === req.session.user.id && role !== 'admin') {
        return res.status(400).json({ message: "You cannot demote yourself!" });
    }
    try {
        await db.promise().query("UPDATE users SET role = ? WHERE id = ?", [role, userId]);
        res.json({ message: "User role updated successfully!" });
    } catch (err) {
        console.error("Error updating role:", err);
        res.status(500).json({ message: "Server error" });
    }
});



app.listen(3000, () => {
    console.log("Server is running at http://localhost:3000");
});

