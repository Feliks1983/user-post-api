import { Request, Response } from "express";
import Post from "../models/Post";

export async function createBlogPost(req: Request, res: Response) {
  try {
    const postData = req.body;
    const post = await Post.create(postData);

    if (!post) {
      res.status(404).json({
        message: "Post not found",
      });
      return;
    }

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

export async function listPosts(req: Request, res: Response) {
  try {
    const {
      status,
      tag,
      category,
      author,
      page = "1",
      limit = "10",
    } = req.query as Record<string, string>;

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (tag) filter.tags = tag;
    if (category) filter.categories = category;
    if (author) filter.author = author;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("author", "username profile.firstName profile.lastName"),
      Post.countDocuments(filter),
    ]);

    res.status(200).json({
      posts,
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
      message: "Failed to list posts",
      error: error instanceof Error ? error.message : error,
    });
  }
}

export async function updatePost(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const { userId, ...updates } = req.body;

    const post = await Post.findById(id);

    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    if (post.author.toString() !== userId) {
      res.status(403).json({ message: "Only the author can update this post" });
      return;
    }

    delete updates.author;

    Object.assign(post, updates);
    await post.save();

    res.status(200).json({ message: "Post updated", post });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      message: "Failed to update post",
      error: error instanceof Error ? error.message : error,
    });
  }
}

export async function deletePost(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const { userId } = req.body;

    const post = await Post.findById(id);

    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    if (post.author.toString() !== userId) {
      res.status(403).json({ message: "Only the author can delete this post" });
      return;
    }

    await post.deleteOne();

    res.status(200).json({ message: "Post deleted" });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      message: "Failed to delete post",
      error: error instanceof Error ? error.message : error,
    });
  }
}

export async function getPostById(req: Request, res: Response) {
  try {
    const id = req.params.id as string;

    const post = await Post.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true },
    ).populate("author", "username profile.firstName profile.lastName");

    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    res.status(200).json({ post });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      message: "Failed to get post",
      error: error instanceof Error ? error.message : error,
    });
  }
}

export async function addCommentToPost(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { text, author } = req.body;

    const post = await Post.findById(id);

    if (!post) {
      res.status(404).json({
        message: "Post not found",
      });
      return;
    }

    await post.addComment({ text, author });

    res.status(201).json({
      message: "Comment added",
      post,
    });
  } catch (error) {
    console.error(error);

    res.status(400).json({
      message: "Failed to add comment",
      error,
    });
  }
}

export async function toggleLikePost(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const post = await Post.findById(id);

    if (!post) {
      res.status(404).json({
        message: "Post not found",
      });
      return;
    }

    const result = await post.toggleLike(userId);

    res.status(200).json({
      message: result.liked ? "Post liked" : "Post unliked",
      ...result,
      post,
    });
  } catch (error) {
    console.error(error);

    res.status(400).json({
      message: "Failed to toggle like",
      error,
    });
  }
}

export async function getPostsByAuthor(req: Request, res: Response) {
  try {
    const authorId = req.params.authorId as string;

    const posts = await Post.findByAuthor(authorId).populate(
      "author",
      "username profile.firstName profile.lastName",
    );

    res.status(200).json({ posts });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      message: "Failed to get posts by author",
      error: error instanceof Error ? error.message : error,
    });
  }
}

export async function searchPosts(req: Request, res: Response) {
  try {
    const { q } = req.query as Record<string, string>;

    if (!q) {
      res.status(400).json({ message: "Query parameter 'q' is required" });
      return;
    }

    const posts = await Post.find(
      { $text: { $search: q } },
      { score: { $meta: "textScore" } },
    ).sort({ score: { $meta: "textScore" } });

    res.status(200).json({ posts });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      message: "Failed to search posts",
      error: error instanceof Error ? error.message : error,
    });
  }
}
