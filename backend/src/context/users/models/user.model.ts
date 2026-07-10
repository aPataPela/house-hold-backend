import mongoose, { Schema } from "mongoose";
import type { User } from "../../shared/types/entities";

const userSchema = new Schema(
  {
    _id: { type: String, required: true },
    id: { type: String, required: true },
    name: String,
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: String,
    createdAt: Date,
  },
  { versionKey: false },
);

export const UserModel = mongoose.model<User>("User", userSchema);
