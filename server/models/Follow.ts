import mongoose, { Document, Schema } from 'mongoose';

export interface IFollow extends Document {
  follower: mongoose.Types.ObjectId;  // The user initiating the follow
  following: mongoose.Types.ObjectId; // The user being followed
  createdAt: Date;
}

const FollowSchema = new Schema<IFollow>(
  {
    follower: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    following: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound unique index to prevent duplicate follows
FollowSchema.index({ follower: 1, following: 1 }, { unique: true });

export const Follow = mongoose.models.Follow || mongoose.model<IFollow>('Follow', FollowSchema);
