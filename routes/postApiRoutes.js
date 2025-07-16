// routes/postApiRoutes.js
const express = require("express");
const router = express.Router();
const postApiController = require("../controllers/postApiController");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/", postApiController.getAllPosts);
router.post("/", authMiddleware, postApiController.createPost);
// router.get("/:id", postApiController.getPostById);
// router.patch("/:id", authMiddleware, postApiController.updatePost);
// router.delete("/:id", authMiddleware, postApiController.deletePost);

module.exports = router;
