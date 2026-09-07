import { ObjectId } from "mongodb";
import mongoose, { Schema, Model, Types } from "mongoose";

export interface Comment {
  id?: Types.ObjectId;
  text: string;
  author: Types.ObjectId;
  createdAt: Date;
}

interface Post {
  id: Types.ObjectId;
  title: string;
  content: string;
  author: {
    _id: { type: Types.ObjectId };
    username: string;
    avatar: string;
  };
  tags: string[];
  categories: string[];
  likes: Types.ObjectId[];
  comments: Comment[];
  likesCount: number;
  commentsCount: number;
  readingTime: number;
}

export interface PostModel extends Model<Post> {
  findByAuthor(authorId: Types.ObjectId | string): mongoose.Query<Post[], Post>;
  findPopular(limit?: number): mongoose.Query<Post[], Post>;
}

const commentSchema = new Schema<Comment>(
  {
    text: {
      type: String,
      required: [true, "Comment text is required"],
      trim: true,
      maxlength: [1000, "Comment cannot exceed 1000 characters"],
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Comment author is required"],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true },
);

const postSchema = new Schema<Post, PostModel>(
  {
    id: ObjectId,
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: {
      _id: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Author is required"],
      },
    },
    tags: { type: [String], default: [] },
    categories: { type: [String], default: [] },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

postSchema.index({ author: 1 });
postSchema.index({ status: 1 });
postSchema.index({ tags: 1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ title: "text", content: "text", tags: "text" });

postSchema.virtual("likesCount").get(function (this: Post) {
  return this.likes?.length || 0;
});

postSchema.virtual("commentsCount").get(function (this: Post) {
  return this.comments?.length || 0;
});

postSchema.virtual("readingTime").get(function (this: Post) {
  const words = this.content ? this.content.trim().split(/\s+/).length : 0;
  return Math.max(1, Math.ceil(words / 200));
});

const Post = mongoose.model<Post>("Post", postSchema);

export default Post;
