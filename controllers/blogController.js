// controllers/blogController.js
// For simplicity, we'll use an in-memory posts array.
// In production, this would be a database model.
let posts = [
    {
      id: 1,
      userId: 1,
      title: "Welcome to the Insecure Blog",
      content: "This is the first post. Feel free to comment!",
      comments: []
    }
  ];
  
  exports.getPosts = (req, res) => {
    res.json(posts);
  };
  
  exports.createPost = (req, res) => {
    // Vulnerability: Accepting userId from client input (IDOR)
    const { title, content } = req.body;
    if  (!title || !content) {
      return res.status(400).json({ message: "title, and content are required." });
    }
    const newPost = {
      title,
      content,
      comments: []
    };
    posts.push(newPost);
    res.json({ message: "Post created successfully!", post: newPost });
  };
  
  exports.updatePost = (req, res) => {
    const { postId, title, content } = req.body;
    const post = posts.find(p => p.id === parseInt(postId));
    if (!post) return res.status(404).json({ message: "Post not found." });
    // Vulnerability: No ownership check
    if (title) post.title = title;
    if (content) post.content = content;
    res.json({ message: "Post updated successfully!", post });
  };
  
  exports.addComment = (req, res) => {
    const { postId, userId, comment } = req.body;
    const post = posts.find(p => p.id === parseInt(postId));
    if (!post) return res.status(404).json({ message: "Post not found." });
    if (!userId || !comment) return res.status(400).json({ message: "User ID and comment are required." });
    const newComment = {
      id: post.comments.length + 1,
      userId: parseInt(userId),
      text: comment
    };
    post.comments.push(newComment);
    res.json({ message: "Comment added!", post });
  };
  
  exports.searchPosts = (req, res) => {
    const query = req.query.query || "";
    // Vulnerability: Naively filtering posts; in a real app, this would be SQL injection risk.
    const results = posts.filter(post => post.title.includes(query));
    res.json(results);
  };
  