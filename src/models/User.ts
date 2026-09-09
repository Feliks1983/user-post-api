import mongoose, {Document} from "mongoose";
import bcrypt from "bcryptjs";

export interface Profile {
  firstName: string;
  lastName: string;
  bio?: string;
}

interface User extends Document {
  username: string;
  email: string;
  password: string;
  profile: Profile;
  fullName: string;
  followers: mongoose.Types.ObjectId[];
  following: mongoose.Types.ObjectId[];
  followersCount: number;
  followingCount: number;
  comparePassword(candidate: string): Promise<boolean>;
  toggleFollow(
    targetUserId: mongoose.Types.ObjectId | string,
  ): Promise<{
    following: boolean;
    followersCount: number;
    followingCount: number;
  }>;
}

export interface UserModel extends mongoose.Model<User> {
  findByUsernameOrEmail(identifier: string): Promise<User | null>;
}

const profileSchema = new mongoose.Schema<Profile>(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [280, "Bio cannot exceed 280 characters"],
      default: "",
    },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema<User, UserModel>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    profile: {
      type: profileSchema,
      required: true,
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
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
  return this.followers?.length ?? 0;
});

userSchema.virtual("followingCount").get(function (this: User) {
  return this.following?.length ?? 0;
});

userSchema.pre<User>("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (
  this: User,
  candidate: string,
): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toggleFollow = async function (
  this: User,
  targetUserId: mongoose.Types.ObjectId | string,
): Promise<{
  following: boolean;
  followersCount: number;
  followingCount: number;
}> {
  const targetId = targetUserId.toString();

  if (targetId === this._id.toString()) {
    throw new Error("Cannot follow yourself");
  }

  const target = await User.findById(targetId);
  if (!target) {
    throw new Error("User to follow not found");
  }

  const alreadyFollowing = this.following.some(
    (id) => id.toString() === targetId,
  );

  if (alreadyFollowing) {
    this.following = this.following.filter((id) => id.toString() !== targetId);
    target.followers = target.followers.filter(
      (id) => id.toString() !== this._id.toString(),
    );
  } else {
    this.following.push(new mongoose.Types.ObjectId(targetId));
    target.followers.push(this._id);
  }

  await this.save();
  await target.save();

  return {
    following: !alreadyFollowing,
    followersCount: this.followers.length,
    followingCount: this.following.length,
  };
};

userSchema.statics.findByUsernameOrEmail = function (
  this: UserModel,
  identifier: string,
) {
  return this.findOne({
    $or: [{ username: identifier }, { email: identifier.toLowerCase() }],
  }).select("+password");
};

const User = mongoose.model<User, UserModel>("User", userSchema);

export default User;
