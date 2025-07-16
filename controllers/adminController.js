// controllers/adminController.js
const db = require("../config/database");

exports.getAllUsers = async (req, res) => {
  try {
    const [users] = await db.promise().query("SELECT id, name, email, role, profile_picture FROM users");
    res.json({ users });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteUser = async (req, res) => {
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
};

exports.updateUserRole = async (req, res) => {
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
};
