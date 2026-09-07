import { Request, Response } from "express";
import User from "../models/User";
import { ObjectId } from "mongodb";

export async function createBlogUser(req: Request, res: Response) {
  try {
    const userData = req.body;

    if (!ObjectId.isValid(userData.author)) {
      return res.status(400).json({
        message: "Invalid author ID format",
        error: "Author must be a valid ObjectId",
      });
    }
    
    const user = await User.create(userData);

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
