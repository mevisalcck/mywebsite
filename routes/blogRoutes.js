// routes/blogRoutes.js
const express = require("express");
const router = express.Router();
const db = require("../config/database");
const jwtAuth = require("../middlewares/jwtAuth");
const crypto = require("crypto");

// -----------------------
// CREATE A NEW POST
// -----------------------
router.post("/post", jwtAuth, async (req, res) => {
  const { title, content } = req.body;
  const userId = req.user.id;
  if (!title || !content) {
    return res.status(400).json({ message: "Title and content are required." });
  }
  try {
    const [result] = await db.promise().query(
      "INSERT INTO blog_posts (user_id, title, content) VALUES (?, ?, ?)",
      [userId, title, content]
    );
    res.json({ message: "Post created!", postId: result.insertId });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// -----------------------
// GET ALL POSTS WITH COMMENTS
// -----------------------
router.get("/posts", async (req, res) => {
  try {
    const [posts] = await db.promise().query(`
      SELECT bp.id, bp.title, bp.content, bp.created_at, u.name as author
      FROM blog_posts bp
      JOIN users u ON bp.user_id = u.id
      ORDER BY bp.created_at DESC
    `);
    
    for (let post of posts) {
      const [comments] = await db.promise().query(`
        SELECT c.comment, c.created_at, u.name as commenter
        FROM comments c
        JOIN users u ON c.userId = u.id
        WHERE c.postId = ?
        ORDER BY c.id ASC
      `, [post.id]);
      post.comments = comments;
    }
    
    res.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// -----------------------
// ADD A COMMENT TO A POST
// -----------------------
router.post("/:postId/comments", jwtAuth, async (req, res) => {
  const { comment } = req.body;
  const postId = req.params.postId;
  const userId = req.user.id;
  if (!postId || !comment) {
    return res.status(400).json({ message: "Post ID and comment are required." });
  }
  try {
    await db.promise().query(
      "INSERT INTO comments (postId, userId, comment) VALUES (?, ?, ?)",
      [postId, userId, comment]
    );
    res.json({ message: "Comment added!" });
  } catch (error) {
    console.error("Error posting comment:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// -----------------------
// DELETE A POST
// -----------------------
router.delete("/post/:id", jwtAuth, async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;
  try {
    const [posts] = await db.promise().query(
      "SELECT * FROM blog_posts WHERE id = ? AND user_id = ?",
      [postId, userId]
    );
    if (posts.length === 0) {
      return res.status(403).json({ message: "You can't delete someone else's posts, bitch!" });
    }
    await db.promise().query("DELETE FROM blog_posts WHERE id = ?", [postId]);
    res.json({ message: "Post deleted successfully!" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// -----------------------
// SEARCH POSTS (Optional)
// -----------------------
router.get("/search", async (req, res) => {
  const query = req.query.query || "";
  try {
    const [results] = await db.promise().query(
      "SELECT bp.id, bp.title, bp.content, bp.created_at, u.name as author FROM blog_posts bp JOIN users u ON bp.user_id = u.id WHERE bp.title LIKE ? OR bp.content LIKE ? ORDER BY bp.created_at DESC",
      [`%${query}%`, `%${query}%`]
    );
    for (let post of results) {
      const [comments] = await db.promise().query(`
        SELECT c.comment, c.created_at, u.name as commenter
        FROM comments c
        JOIN users u ON c.userId = u.id
        WHERE c.postId = ?
        ORDER BY c.id ASC
      `, [post.id]);
      post.comments = comments;
    }
    res.json(results);
  } catch (error) {
    console.error("Error searching posts:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
