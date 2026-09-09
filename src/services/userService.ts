import { Request, Response } from "express";
import User from "../models/User";

export async function createBlogUser(req: Request, res: Response) {
  try {
    const userData = req.body;
    
    const user = await User.create(userData);

      if (!user) {
        res.status(404).json({
          message: "User not found",
        });
        return;
      }

    res.status(201).json({
      message: "User created users",
      user,
    });
  } catch (error) {
    console.error(error);

    res.status(400).json({
      message: "Failed to create users",
      error,
    });
  }
}

export async function listUsers(req: Request, res: Response) {
  try {
    const { page = "1", limit = "10" } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find().sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      User.countDocuments(),
    ]);

    res.status(200).json({
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      message: "Failed to list users",
      error: error instanceof Error ? error.message : error,
    });
  }
}

export async function getUserById(req: Request, res: Response) {
  try {
    const id = req.params.id as string;

    const user = await User.findById(id)
      .populate("followers", "username profile.firstName profile.lastName")
      .populate("following", "username profile.firstName profile.lastName");

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      message: "Failed to get user",
      error: error instanceof Error ? error.message : error,
    });
  }
}

export async function updateUser(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const updates = { ...req.body };
    delete updates.password;
    delete updates.email;
    delete updates.followers;
    delete updates.following;

    const user = await User.findById(id);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    Object.assign(user, updates);
    await user.save();

    res.status(200).json({ message: "User updated", user });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      message: "Failed to update user",
      error: error instanceof Error ? error.message : error,
    });
  }
}

export async function toggleFollowUser(req: Request, res: Response) {
  try {
    const id  = req.params.id as string;
    const { userId } = req.body;

    if (!id) {
      res.status(400).json({ message: "Post id is required" });
      return;
    }

    if (!userId) {
      res.status(400).json({
        message: "userId is required",
      });
      return;
    }

    const currentUser = await User.findById(userId);

    if (!currentUser) {
      res.status(404).json({
        message: "User (userId) not found",
      });
      return;
    }

    const result = await currentUser.toggleFollow(id);

    res.status(200).json({
      message: result.following ? "Followed" : "Unfollowed",
      ...result,
    });
  } catch (error) {
    console.error(error);

    res.status(400).json({
      message: "Failed to toggle follow",
      error: error instanceof Error ? error.message : error,
    });
  }
}

export async function getFollowers(req: Request, res: Response) {
  try {
    const id = req.params.id as string;

    const user = await User.findById(id).populate(
      "followers",
      "username profile.firstName profile.lastName",
    );

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({ followers: user.followers });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      message: "Failed to get followers",
      error: error instanceof Error ? error.message : error,
    });
  }
}

export async function getFollowing(req: Request, res: Response) {
  try {
    const id = req.params.id as string;

    const user = await User.findById(id).populate(
      "following",
      "username profile.firstName profile.lastName",
    );

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({ following: user.following });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      message: "Failed to get following",
      error: error instanceof Error ? error.message : error,
    });
  }
}

export async function searchUsers(req: Request, res: Response) {
  try {
    const { q } = req.query as Record<string, string>;

    if (!q) {
      res.status(400).json({ message: "Query parameter 'q' is required" });
      return;
    }

    const users = await User.find(
      { $text: { $search: q } },
      { score: { $meta: "textScore" } },
    ).sort({ score: { $meta: "textScore" } });

    res.status(200).json({ users });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      message: "Failed to search users",
      error: error instanceof Error ? error.message : error,
    });
  }
}
