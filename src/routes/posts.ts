import { Router } from "express";
import {
  createBlogPost,
  listPosts,
  getPostById,
  updatePost,
  deletePost,
  addCommentToPost,
  toggleLikePost,
  getPostsByAuthor,
  searchPosts,
} from "../services/postService";

const router = Router();

router.get("/search", searchPosts);
router.get("/author/:authorId", getPostsByAuthor);
router.get("/", listPosts);
router.post("/", createBlogPost);
router.get("/:id", getPostById);
router.patch("/:id", updatePost);
router.delete("/:id", deletePost);
router.post("/:id/comments", addCommentToPost);
router.post("/:id/like", toggleLikePost);