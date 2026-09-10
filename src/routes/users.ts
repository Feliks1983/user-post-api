import { Router } from "express";
import {
  createBlogUser,
  listUsers,
  getUserById,
  updateUser,
  toggleFollowUser,
  getFollowers,
  getFollowing,
  searchUsers,
} from "../services/userService";

export const router = Router();

router.get("/search", searchUsers);

router.get("/", listUsers);
router.post("/", createBlogUser);
router.get("/:id", getUserById);
router.patch("/:id", updateUser);
router.post("/:id/follow", toggleFollowUser);
router.get("/:id/followers", getFollowers);
router.get("/:id/following", getFollowing);