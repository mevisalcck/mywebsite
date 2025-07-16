const bcrypt = require("bcrypt");
const CryptoJS = require("crypto-js");
const jwt = require("jsonwebtoken");
const db = require("../config/database");

const JWT_SECRET = "$#FD*%DKKB#UGE"; // Your JWT secret key

// Decrypt function
function decryptAES(encryptedText) {
  const bytes = CryptoJS.AES.decrypt(encryptedText, "IU984456TETn@%^@$8");
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
}

// Encrypt function
function encryptAES(data) {
  return CryptoJS.AES.encrypt(JSON.stringify(data), "IU984456TETn@%^@$8").toString();
}

exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const [existingUser] = await db.promise().query("SELECT * FROM users WHERE email = ?", [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: "Email already exists! Please login instead." });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.promise().query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, role || 'user']
    );
    res.status(201).json({ message: "User registered successfully!" });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.login = async (req, res) => {
  try {
    if (!req.body.data) return res.status(400).json({ message: "Invalid request" });
    
    const decryptedData = decryptAES(req.body.data);
    const { email, password } = decryptedData;
    
    const [rows] = await db.promise().query("SELECT * FROM users WHERE email = ?", [email]);
    if (!rows.length) return res.status(401).json({ message: "Invalid email or password" });
    
    const user = rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return res.status(401).json({ message: "Invalid email or password" });
    
    await db.promise().query("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?", [user.id]);
    
    // Set session so /dashboard route works
    req.session.user = { id: user.id, email: user.email, name: user.name, role: user.role };
    
    // Generate JWT (expires in 1 hour)
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "1h" });
    
    const responsePayload = { success: true, redirectTo: "/dashboard", user: req.session.user, token };
    const encryptedResponse = encryptAES(responsePayload);
    
    res.status(200).json({ data: encryptedResponse });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};


exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ message: "Logout failed" });
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out successfully!" });
  });
};
