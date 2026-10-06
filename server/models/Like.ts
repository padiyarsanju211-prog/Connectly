import mongoose, { Document, Schema } from 'mongoose';

export interface ILike extends Document {
  user: mongoose.Types.ObjectId;
  post: mongoose.Types.ObjectId;
  createdAt: Date;
}

const LikeSchema = new Schema<ILike>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound unique index to prevent duplicate likes
LikeSchema.index({ user: 1, post: 1 }, { unique: true });

export const Like = mongoose.models.Like || mongoose.model<ILike>('Like', LikeSchema);
