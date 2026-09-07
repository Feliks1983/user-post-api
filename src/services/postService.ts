import { Request, Response } from "express";
import Post from "../models/Post";
import { ObjectId } from "mongodb";

export async function createBlogPost(req: Request, res: Response) {
  try {
    const postData = req.body;

    if (!ObjectId.isValid(postData.author)) {
      return res.status(400).json({
        message: "Invalid author ID format",
        error: "Author must be a valid ObjectId",
      });
    }

    const post = await Post.create(postData);

    res.status(201).json({
      message: "User created users",
      post,
    });
  } catch (error) {
    console.error(error);

    res.status(400).json({
      message: "Failed to create users",
      error,
    });
  }
}
