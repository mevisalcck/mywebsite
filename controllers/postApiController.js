// controllers/postApiController.js
exports.getAllPosts = async (req, res) => {
    try {
      const [posts] = await db.promise().query("SELECT * FROM posts");
      res.json({ posts });
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Server error" });
    }
  };
  
  exports.createPost = async (req, res) => {
    try {
      // Example: { title, content } from JSON body
      const { title, content } = req.body;
      if (!title || !content) {
        return res.status(400).json({ message: "Title and content required" });
      }
      // userId from session
      const userId = req.session.user.id;
      const [result] = await db.promise().query(
        "INSERT INTO posts (userId, title, content) VALUES (?, ?, ?)",
        [userId, title, content]
      );
      res.status(201).json({ message: "Post created", postId: result.insertId });
    } catch (error) {
      console.error("Create Post Error:", error);
      res.status(500).json({ message: "Server error" });
    }
  };
  
  // ... more functions like getPostById, updatePost, deletePost
  