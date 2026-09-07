import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/database";
import { createBlogPost } from "./services/postService";
import { createBlogUser } from "./services/userService";

dotenv.config();

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Todo API is running",
  });
});

app.post("/api/posts", createBlogPost, (req, res) => {
  res.status(200).json({
    message: "Posts API is running",
  });
});

app.post("/api/users", createBlogUser, (req, res) => {
  res.status(200).json({
    message: "Users API is running",
  });
});

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
  });
}

start();
