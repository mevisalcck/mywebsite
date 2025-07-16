// routes/commentRoutes.js
const express = require("express");
const router = express.Router();
const marked = require("marked");

// WARNING: Disabling sanitization is dangerous. This is for learning only.
marked.setOptions({ sanitize: false });

// In-memory store for comments (simulate DB)
let commentsStore = {};

// Post a comment (stored XSS vulnerability)
router.post("/comment", (req, res) => {
  const { postId, markdown } = req.body;
  if (!postId || !markdown) {
    return res.status(400).json({ message: "Post ID and content required." });
  }
  
  const htmlContent = marked(markdown);
  if (!commentsStore[postId]) commentsStore[postId] = [];
  const comment = { id: commentsStore[postId].length + 1, html: htmlContent };
  commentsStore[postId].push(comment);
  
  res.json({ message: "Comment posted", comment });
});

// Get comments for a post (unsanitized output)
router.get("/comments", (req, res) => {
  const { postId } = req.query;
  if (!postId) return res.status(400).json({ message: "Post ID required." });
  const comments = commentsStore[postId] || [];
  
  let html = `<h1>Comments for Post ${postId}</h1>`;
  comments.forEach((c) => {
    html += `<div>${c.html}</div>`;
  });
  
  res.send(html);
});

module.exports = router;
