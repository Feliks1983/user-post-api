
import mongoose, { Types } from "mongoose";

export interface Comment {
  id?: mongoose.Types.ObjectId;
  text: string;
  author: mongoose.Types.ObjectId;
  createdAt: Date;
}

interface Post extends mongoose.Document {
  id: mongoose.Types.ObjectId;
  title: string;
  content: string;
  author: mongoose.Types.ObjectId;
  status: "draft" | "published" | "archived";
  tags: string[];
  categories: string[];
  likes: mongoose.Types.ObjectId[];
  comments: Comment[];
  likesCount: number;
  commentsCount: number;
  readingTime: number;
  excerpt?: string;
  publishedAt?: Date;
  views: number;
  generateExcerpt(length?: number): string;
  addComment(commentData: {
    text: string;
    author: Types.ObjectId | string;
  }): Promise<Post>;
  toggleLike(
    userId: Types.ObjectId | string,
  ): Promise<{ liked: boolean; likesCount: number }>;
}

export interface PostModel extends mongoose.Model<Post> {
  findByAuthor(
    authorId: Types.ObjectId | string,
  ): mongoose.Query<Post[], Post>;
  findPopular(limit?: number): mongoose.Query<Post[], Post>;
}

const commentSchema = new mongoose.Schema<Comment>(
  {
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true },
);

const postSchema = new mongoose.Schema<Post, PostModel>(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: {
        values: ["draft", "published", "archived"],
        message: "value is not a valid status",
      },
      default: "draft",
    },
    tags: { type: [String], default: [] },
    categories: { type: [String], default: [] },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    comments: [commentSchema],
    excerpt: {
      type: String,
      maxlength: [300, "Excerpt cannot exceed 300 characters"],
    },
    publishedAt: {
      type: Date,
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        delete ret.password;
        delete ret.__v;
        delete ret._id;
        return ret;
      },
    },
    toObject: { virtuals: true },
  },
);

postSchema.index({ author: 1 });
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

postSchema.methods.generateExcerpt = function (
  this: Post,
  length = 150,
): string {
  const plain = this.content.replace(/\s+/g, " ").trim();
  if (plain.length <= length) return plain;
  return `${plain.slice(0, length).trim()}...`;
};

postSchema.methods.addComment = async function (
  this: Post,
  commentData: { text: string; author: Types.ObjectId | string },
): Promise<Post> {
  this.comments.push({
    text: commentData.text,
    author: new mongoose.Types.ObjectId(commentData.author),
    createdAt: new Date(),
  } as Comment);
  await this.save();
  return this;
};

postSchema.methods.toggleLike = async function (
  this: Post,
  userId: Types.ObjectId | string,
): Promise<{ liked: boolean; likesCount: number }> {
  const id = userId.toString();
  const index = this.likes.findIndex((likeId) => likeId.toString() === id);
  let liked: boolean;

  if (index === -1) {
    this.likes.push(new mongoose.Types.ObjectId(id));
    liked = true;
  } else {
    this.likes.splice(index, 1);
    liked = false;
  }

  await this.save();
  return { liked, likesCount: this.likes.length };
};

postSchema.pre<Post>("save", function () {
  if (this.isModified("content") && !this.excerpt) {
    this.excerpt = this.generateExcerpt();
  }

  if (
    this.isModified("status") &&
    this.status === "published" &&
    !this.publishedAt
  ) {
    this.publishedAt = new Date();
  }
});

postSchema.statics.findByAuthor = function (
  this: PostModel,
  authorId: Types.ObjectId | string,
) {
  return this.find({ author: authorId }).sort({ createdAt: -1 });
};

postSchema.statics.findPopular = function (this: PostModel, limit = 10) {
  return this.aggregate([
    { $match: { status: "published" } },
    {
      $addFields: {
        popularityScore: {
          $add: [
            { $multiply: [{ $size: "$likes" }, 2] },
            { $size: "$comments" },
          ],
        },
      },
    },
    { $sort: { popularityScore: -1 } },
    { $limit: limit },
  ]) as unknown as mongoose.Query<Post[], Post>;
};

const Post = mongoose.model<Post, PostModel>("Post", postSchema);

export default Post;
