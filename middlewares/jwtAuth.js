// middlewares/jwtAuth.js
const jwt = require("jsonwebtoken");
const SECRET_KEY = "your_jwt_secret_key"; // Must match what you used when signing tokens

module.exports = function jwtAuth(req, res, next) {
  let token;
  const authHeader = req.headers["authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }
  if (!token && req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }
  if (!token) return res.status(401).json({ message: "No token provided" });
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      console.log("JWT verification error:", err);
      return res.status(403).json({ message: "Invalid or expired token" });
    }
    req.user = decoded;
    next();
  });
};
