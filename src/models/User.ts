import { ObjectId } from "mongodb";
import mongoose from "mongoose";

interface User {
  id: ObjectId;
  username: string;
  email: string;
  password: string;
  profile: {
    firstName: string;
    lastName: string;
    bio: string;
  };
  fullName: string;
  followersCount: number;
  followingCount: number;
}

const userSchema = new mongoose.Schema<User>(
  {
    id: ObjectId,
    username: { type: String, required: true, trim: true, index: true },
    email: {
      type: String,
      required: true,
      match: /.+@.+\..+/,
      trim: true,
      index: true,
    },
    password: { type: String, required: true, minlength: 6 },
    profile: {
      firstName: String,
      lastName: String,
      bio: String,
    },
    fullName: String,
    followersCount: Number,
    followingCount: Number,
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  },
);

userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ "profile.firstName": 1, "profile.lastName": 1 });
userSchema.index({
  username: "text",
  "profile.firstName": "text",
  "profile.lastName": "text",
});

userSchema.virtual("fullName").get(function (this: User) {
  return `${this.profile.firstName} ${this.profile.lastName}`.trim();
});

userSchema.virtual("followersCount").get(function (this: User) {
  return this.followersCount;
});

userSchema.virtual("followingCount").get(function (this: User) {
  return this.followingCount;
});

const User = mongoose.model<User>("User", userSchema);

export default User;
