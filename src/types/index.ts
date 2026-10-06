export interface User {
  _id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  bio: string;
  location?: string;
  website?: string;
  coverImage?: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Post {
  _id: string;
  author: {
    _id: string;
    name: string;
    username: string;
    avatar: string;
  };
  content: string;
  mediaUrl?: string;
  likesCount: number;
  commentsCount: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  hasLiked?: boolean;
  isOwnPost?: boolean;
}

export interface Comment {
  _id: string;
  post: string;
  author: {
    _id: string;
    name: string;
    username: string;
    avatar: string;
  };
  content: string;
  createdAt: string;
  updatedAt?: string;
  isOwnComment?: boolean;
}

export interface DbStatus {
  isConnected: boolean;
  engine: 'mongodb' | 'embedded_persistent';
  uri?: string;
  userCount: number;
  postCount: number;
  commentCount: number;
  error?: string;
  system?: string;
  timestamp?: string;
}
