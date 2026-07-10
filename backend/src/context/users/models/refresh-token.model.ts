import mongoose, { Schema } from "mongoose";
import type { RefreshToken } from "../../shared/types/entities";

const refreshTokenSchema = new Schema(
  {
    _id: { type: String, required: true },
    id: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    createdAt: Date,
    revokedAt: Date,
  },
  { versionKey: false },
);

export const RefreshTokenModel = mongoose.model<RefreshToken>("RefreshToken", refreshTokenSchema);
