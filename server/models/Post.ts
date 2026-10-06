import mongoose, { Document, Schema } from 'mongoose';

export interface IPost extends Document {
  author: mongoose.Types.ObjectId;
  content: string;
  mediaUrl?: string;
  likesCount: number;
  commentsCount: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema<IPost>(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Post author is required'],
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Post content is required'],
      trim: true,
      maxlength: [2000, 'Post content cannot exceed 2000 characters'],
    },
    mediaUrl: {
      type: String,
      default: '',
    },
    likesCount: {
      type: Number,
      default: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Index for feed queries
PostSchema.index({ createdAt: -1 });

export const Post = mongoose.models.Post || mongoose.model<IPost>('Post', PostSchema);
