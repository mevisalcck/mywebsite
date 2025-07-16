// controllers/userController.js
exports.getUser = async (req, res) => {
    try {
      const [user] = await req.app.get("db").promise().query(
        "SELECT name, email, created_at, last_login, profile_picture FROM users WHERE id = ?",
        [req.session.user.id]
      );
      if (user.length === 0) return res.status(404).json({ message: "User not found" });
      res.json({ user: user[0] });
    } catch (err) {
      console.error("Get User Error:", err);
      res.status(500).json({ message: "Server error" });
    }
  };
  
  exports.updateProfile = async (req, res) => {
    const { name, email } = req.body;
    try {
      const [existing] = await req.app.get("db").promise().query(
        "SELECT id FROM users WHERE email = ? AND id != ?",
        [email, req.session.user.id]
      );
      if (existing.length > 0) {
        return res.status(400).json({ message: "Email already in use by another account." });
      }
      await req.app.get("db").promise().query(
        "UPDATE users SET name = ?, email = ? WHERE id = ?",
        [name, email, req.session.user.id]
      );
      req.session.user.name = name;
      req.session.user.email = email;
      res.json({ message: "Profile updated successfully!" });
    } catch (err) {
      console.error("Update Profile Error:", err);
      res.status(500).json({ message: "Server error" });
    }
  };
  
  exports.changePassword = async (req, res) => {
    const { newPassword } = req.body;
    if (!newPassword) return res.status(400).json({ message: "Password is required" });
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await req.app.get("db").promise().query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, req.session.user.id]);
      res.json({ message: "Password updated successfully!" });
    } catch (err) {
      console.error("Change Password Error:", err);
      res.status(500).json({ message: "Server error" });
    }
  };
  
  exports.deleteAccount = async (req, res) => {
    try {
      await req.app.get("db").promise().query("DELETE FROM users WHERE id = ?", [req.session.user.id]);
      req.session.destroy();
      res.json({ message: "Account deleted successfully!" });
    } catch (err) {
      console.error("Delete Account Error:", err);
      res.status(500).json({ message: "Server error" });
    }
  };
  