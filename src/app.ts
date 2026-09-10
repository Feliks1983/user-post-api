import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/database";
// import { createBlogPost, addCommentToPost, toggleLikePost } from "./services/postService";
// import { createBlogUser, toggleFollowUser } from "./services/userService";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import {router as apiPost} from './routes/posts';
import {router as apiUser} from './routes/users'
dotenv.config();

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Todo API is running",
  });
});

app.use("/api/posts", apiPost, (req, res) => {
  res.status(200).json({
    message: "Posts API is running",
  });
});

app.use("/api/users", apiUser, (req, res) => {
  res.status(200).json({
    message: "Users API is running",
  });
});

app.use(notFoundHandler);
app.use(errorHandler);
const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
  });
}

start();
