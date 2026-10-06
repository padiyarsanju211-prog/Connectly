import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { config } from './config.js';
import { User } from './models/User.js';
import { Post } from './models/Post.js';
import { Comment } from './models/Comment.js';
import { Follow } from './models/Follow.js';
import { Like } from './models/Like.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE_PATH = path.join(__dirname, '../.connectly_db.json');

export type DbStatus = {
  isConnected: boolean;
  engine: 'mongodb' | 'embedded_persistent';
  uri?: string;
  userCount: number;
  postCount: number;
  commentCount: number;
  error?: string;
};

let isMongoConnected = false;
let mongoErrorMessage: string | undefined;

// Persistent file-backed store for embedded mode
interface PersistentDb {
  users: any[];
  posts: any[];
  comments: any[];
  follows: any[];
  likes: any[];
}

let memoryDb: PersistentDb = {
  users: [],
  posts: [],
  comments: [],
  follows: [],
  likes: [],
};

// Load persistent DB from disk
function loadMemoryDbFromDisk() {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const data = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      memoryDb = JSON.parse(data);
    }
  } catch (err) {
    console.warn('[Connectly DB] Could not read local persistent DB file, starting fresh:', err);
  }
}

// Save persistent DB to disk
export function saveMemoryDbToDisk() {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(memoryDb, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Connectly DB] Failed to save DB to disk:', err);
  }
}

export async function connectDatabase(): Promise<void> {
  loadMemoryDbFromDisk();

  if (config.mongodbUri && config.mongodbUri.trim() !== '') {
    try {
      console.log(`[Connectly DB] Attempting MongoDB connection...`);
      await mongoose.connect(config.mongodbUri, {
        serverSelectionTimeoutMS: 4000,
      });
      isMongoConnected = true;
      console.log('[Connectly DB] Successfully connected to MongoDB / Mongoose!');
      return;
    } catch (err: any) {
      console.warn(`[Connectly DB] MongoDB connection failed (${err.message}). Using resilient embedded persistent storage.`);
      mongoErrorMessage = err.message;
      isMongoConnected = false;
    }
  } else {
    console.log('[Connectly DB] No MONGODB_URI set in environment. Using resilient embedded persistent storage (data stored in .connectly_db.json).');
  }
}

export function getDbStatus(): DbStatus {
  return {
    isConnected: isMongoConnected,
    engine: isMongoConnected ? 'mongodb' : 'embedded_persistent',
    uri: isMongoConnected ? config.mongodbUri.replace(/:([^:@]{1,})@/, ':****@') : undefined,
    userCount: isMongoConnected ? 0 : memoryDb.users.length,
    postCount: isMongoConnected ? 0 : memoryDb.posts.length,
    commentCount: isMongoConnected ? 0 : memoryDb.comments.length,
    error: mongoErrorMessage,
  };
}

// Unified Store that operates transparently with Mongoose or Persistent Embedded Store
export const dataStore = {
  isMongo() {
    return isMongoConnected;
  },

  // USERS
  async findUserById(id: string) {
    if (isMongoConnected) {
      return User.findById(id).lean();
    }
    return memoryDb.users.find(u => u._id === id || u.id === id) || null;
  },

  async findUserByIdWithPassword(id: string) {
    if (isMongoConnected) {
      return User.findById(id).select('+password').lean();
    }
    return memoryDb.users.find(u => u._id === id || u.id === id) || null;
  },

  async findUserByUsername(username: string) {
    const cleanUsername = username.toLowerCase().trim();
    if (isMongoConnected) {
      return User.findOne({ username: cleanUsername }).lean();
    }
    return memoryDb.users.find(u => u.username.toLowerCase() === cleanUsername) || null;
  },

  async findUserByEmail(email: string) {
    const cleanEmail = email.toLowerCase().trim();
    if (isMongoConnected) {
      return User.findOne({ email: cleanEmail }).select('+password').lean();
    }
    return memoryDb.users.find(u => u.email.toLowerCase() === cleanEmail) || null;
  },

  async createUser(userData: {
    name: string;
    username: string;
    email: string;
    password: string;
    avatar?: string;
    bio?: string;
    location?: string;
    website?: string;
  }) {
    if (isMongoConnected) {
      const user = new User(userData);
      await user.save();
      const obj = user.toObject();
      delete obj.password;
      return obj;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    const newUser = {
      _id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      name: userData.name.trim(),
      username: userData.username.toLowerCase().trim(),
      email: userData.email.toLowerCase().trim(),
      password: hashedPassword,
      avatar: userData.avatar || '/src/assets/images/avatar_alex_chen_1791296489008.jpg',
      bio: userData.bio || '',
      location: userData.location || '',
      website: userData.website || '',
      coverImage: '/src/assets/images/community_workspace_1791296557615.jpg',
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    memoryDb.users.push(newUser);
    saveMemoryDbToDisk();

    const safeUser = { ...newUser };
    delete (safeUser as any).password;
    return safeUser;
  },

  async updateUser(id: string, updates: Partial<{
    name: string;
    bio: string;
    location: string;
    website: string;
    avatar: string;
    coverImage: string;
  }>) {
    if (isMongoConnected) {
      return User.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true }).lean();
    }
    const idx = memoryDb.users.findIndex(u => u._id === id || u.id === id);
    if (idx === -1) return null;
    memoryDb.users[idx] = {
      ...memoryDb.users[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveMemoryDbToDisk();
    const safeUser = { ...memoryDb.users[idx] };
    delete safeUser.password;
    return safeUser;
  },

  async searchUsers(query: string, limit = 10) {
    const q = query.toLowerCase().trim();
    if (isMongoConnected) {
      return User.find({
        $or: [
          { username: { $regex: q, $options: 'i' } },
          { name: { $regex: q, $options: 'i' } },
        ],
      })
        .limit(limit)
        .select('-password')
        .lean();
    }
    return memoryDb.users
      .filter(u => u.username.toLowerCase().includes(q) || u.name.toLowerCase().includes(q))
      .slice(0, limit)
      .map(u => {
        const copy = { ...u };
        delete copy.password;
        return copy;
      });
  },

  // POSTS
  async createPost(postData: {
    authorId: string;
    content: string;
    mediaUrl?: string;
    tags?: string[];
  }) {
    if (isMongoConnected) {
      const post = new Post({
        author: postData.authorId,
        content: postData.content,
        mediaUrl: postData.mediaUrl || '',
        tags: postData.tags || [],
      });
      await post.save();
      await User.findByIdAndUpdate(postData.authorId, { $inc: { postsCount: 1 } });
      const populated = await Post.findById(post._id).populate('author', 'name username avatar').lean();
      return populated;
    }

    const author = memoryDb.users.find(u => u._id === postData.authorId || u.id === postData.authorId);
    const newPost = {
      _id: 'post_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      author: postData.authorId,
      content: postData.content.trim(),
      mediaUrl: postData.mediaUrl || '',
      tags: postData.tags || [],
      likesCount: 0,
      commentsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    memoryDb.posts.unshift(newPost);
    if (author) {
      author.postsCount = (author.postsCount || 0) + 1;
    }
    saveMemoryDbToDisk();

    return {
      ...newPost,
      author: author ? { _id: author._id, name: author.name, username: author.username, avatar: author.avatar } : null,
    };
  },

  async getPosts(options: {
    limit?: number;
    skip?: number;
    authorId?: string;
    followingUserIds?: string[];
    tag?: string;
  } = {}) {
    const limit = options.limit || 20;

    if (isMongoConnected) {
      const filter: any = {};
      if (options.authorId) {
        filter.author = options.authorId;
      } else if (options.followingUserIds && options.followingUserIds.length > 0) {
        filter.author = { $in: options.followingUserIds };
      }
      if (options.tag) {
        filter.tags = options.tag;
      }
      return Post.find(filter)
        .sort({ createdAt: -1 })
        .skip(options.skip || 0)
        .limit(limit)
        .populate('author', 'name username avatar')
        .lean();
    }

    let posts = [...memoryDb.posts];
    if (options.authorId) {
      posts = posts.filter(p => p.author === options.authorId);
    } else if (options.followingUserIds && options.followingUserIds.length > 0) {
      const set = new Set(options.followingUserIds);
      posts = posts.filter(p => set.has(p.author));
    }
    if (options.tag) {
      posts = posts.filter(p => p.tags && p.tags.includes(options.tag!));
    }

    posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const paginated = posts.slice(options.skip || 0, (options.skip || 0) + limit);

    return paginated.map(p => {
      const author = memoryDb.users.find(u => u._id === p.author || u.id === p.author);
      return {
        ...p,
        author: author ? { _id: author._id, name: author.name, username: author.username, avatar: author.avatar } : null,
      };
    });
  },

  async getPostById(id: string) {
    if (isMongoConnected) {
      return Post.findById(id).populate('author', 'name username avatar').lean();
    }
    const p = memoryDb.posts.find(item => item._id === id || item.id === id);
    if (!p) return null;
    const author = memoryDb.users.find(u => u._id === p.author || u.id === p.author);
    return {
      ...p,
      author: author ? { _id: author._id, name: author.name, username: author.username, avatar: author.avatar } : null,
    };
  },

  async updatePost(id: string, content: string, mediaUrl?: string) {
    if (isMongoConnected) {
      return Post.findByIdAndUpdate(
        id,
        { $set: { content, ...(mediaUrl !== undefined ? { mediaUrl } : {}) } },
        { new: true }
      ).populate('author', 'name username avatar').lean();
    }
    const idx = memoryDb.posts.findIndex(p => p._id === id || p.id === id);
    if (idx === -1) return null;
    memoryDb.posts[idx].content = content;
    if (mediaUrl !== undefined) {
      memoryDb.posts[idx].mediaUrl = mediaUrl;
    }
    memoryDb.posts[idx].updatedAt = new Date().toISOString();
    saveMemoryDbToDisk();
    const p = memoryDb.posts[idx];
    const author = memoryDb.users.find(u => u._id === p.author || u.id === p.author);
    return {
      ...p,
      author: author ? { _id: author._id, name: author.name, username: author.username, avatar: author.avatar } : null,
    };
  },

  async deletePost(id: string, authorId: string) {
    if (isMongoConnected) {
      const post = await Post.findOne({ _id: id, author: authorId });
      if (!post) return false;
      await Post.findByIdAndDelete(id);
      await Comment.deleteMany({ post: id });
      await Like.deleteMany({ post: id });
      await User.findByIdAndUpdate(authorId, { $inc: { postsCount: -1 } });
      return true;
    }

    const idx = memoryDb.posts.findIndex(p => (p._id === id || p.id === id) && p.author === authorId);
    if (idx === -1) return false;
    memoryDb.posts.splice(idx, 1);
    // Delete comments & likes associated
    memoryDb.comments = memoryDb.comments.filter(c => c.post !== id);
    memoryDb.likes = memoryDb.likes.filter(l => l.post !== id);
    const author = memoryDb.users.find(u => u._id === authorId || u.id === authorId);
    if (author && author.postsCount > 0) {
      author.postsCount--;
    }
    saveMemoryDbToDisk();
    return true;
  },

  // COMMENTS
  async createComment(postId: string, authorId: string, content: string) {
    if (isMongoConnected) {
      const comment = new Comment({
        post: postId,
        author: authorId,
        content: content.trim(),
      });
      await comment.save();
      await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });
      const populated = await Comment.findById(comment._id).populate('author', 'name username avatar').lean();
      return populated;
    }

    const newComment = {
      _id: 'comment_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      post: postId,
      author: authorId,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    memoryDb.comments.push(newComment);
    const post = memoryDb.posts.find(p => p._id === postId || p.id === postId);
    if (post) {
      post.commentsCount = (post.commentsCount || 0) + 1;
    }
    saveMemoryDbToDisk();

    const author = memoryDb.users.find(u => u._id === authorId || u.id === authorId);
    return {
      ...newComment,
      author: author ? { _id: author._id, name: author.name, username: author.username, avatar: author.avatar } : null,
    };
  },

  async getCommentsByPost(postId: string) {
    if (isMongoConnected) {
      return Comment.find({ post: postId })
        .sort({ createdAt: 1 })
        .populate('author', 'name username avatar')
        .lean();
    }

    const comments = memoryDb.comments.filter(c => c.post === postId);
    comments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return comments.map(c => {
      const author = memoryDb.users.find(u => u._id === c.author || u.id === c.author);
      return {
        ...c,
        author: author ? { _id: author._id, name: author.name, username: author.username, avatar: author.avatar } : null,
      };
    });
  },

  async deleteComment(commentId: string, authorId: string) {
    if (isMongoConnected) {
      const comment = await Comment.findOne({ _id: commentId, author: authorId });
      if (!comment) return false;
      await Comment.findByIdAndDelete(commentId);
      await Post.findByIdAndUpdate(comment.post, { $inc: { commentsCount: -1 } });
      return true;
    }

    const idx = memoryDb.comments.findIndex(c => (c._id === commentId || c.id === commentId) && c.author === authorId);
    if (idx === -1) return false;
    const comment = memoryDb.comments[idx];
    memoryDb.comments.splice(idx, 1);
    const post = memoryDb.posts.find(p => p._id === comment.post || p.id === comment.post);
    if (post && post.commentsCount > 0) {
      post.commentsCount--;
    }
    saveMemoryDbToDisk();
    return true;
  },

  // LIKES
  async toggleLike(postId: string, userId: string): Promise<{ liked: boolean; likesCount: number }> {
    if (isMongoConnected) {
      const existing = await Like.findOne({ post: postId, user: userId });
      if (existing) {
        await Like.findByIdAndDelete(existing._id);
        const post = await Post.findByIdAndUpdate(postId, { $inc: { likesCount: -1 } }, { new: true });
        return { liked: false, likesCount: post?.likesCount || 0 };
      } else {
        await Like.create({ post: postId, user: userId });
        const post = await Post.findByIdAndUpdate(postId, { $inc: { likesCount: 1 } }, { new: true });
        return { liked: true, likesCount: post?.likesCount || 0 };
      }
    }

    const idx = memoryDb.likes.findIndex(l => l.post === postId && l.user === userId);
    const post = memoryDb.posts.find(p => p._id === postId || p.id === postId);
    if (!post) throw new Error('Post not found');

    if (idx !== -1) {
      // Unlike
      memoryDb.likes.splice(idx, 1);
      post.likesCount = Math.max(0, (post.likesCount || 0) - 1);
      saveMemoryDbToDisk();
      return { liked: false, likesCount: post.likesCount };
    } else {
      // Like
      memoryDb.likes.push({
        _id: 'like_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        post: postId,
        user: userId,
        createdAt: new Date().toISOString(),
      });
      post.likesCount = (post.likesCount || 0) + 1;
      saveMemoryDbToDisk();
      return { liked: true, likesCount: post.likesCount };
    }
  },

  async hasUserLikedPost(postId: string, userId: string): Promise<boolean> {
    if (isMongoConnected) {
      const count = await Like.countDocuments({ post: postId, user: userId });
      return count > 0;
    }
    return memoryDb.likes.some(l => l.post === postId && l.user === userId);
  },

  async getUserLikedPostIds(userId: string, postIds: string[]): Promise<string[]> {
    if (isMongoConnected) {
      const likes = await Like.find({ user: userId, post: { $in: postIds } }).select('post').lean();
      return likes.map(l => l.post.toString());
    }
    const set = new Set(postIds);
    return memoryDb.likes
      .filter(l => l.user === userId && set.has(l.post))
      .map(l => l.post);
  },

  // FOLLOWS
  async toggleFollow(followerId: string, followingId: string): Promise<{ following: boolean; followersCount: number }> {
    if (followerId === followingId) {
      throw new Error('You cannot follow yourself');
    }

    if (isMongoConnected) {
      const existing = await Follow.findOne({ follower: followerId, following: followingId });
      if (existing) {
        await Follow.findByIdAndDelete(existing._id);
        const targetUser = await User.findByIdAndUpdate(followingId, { $inc: { followersCount: -1 } }, { new: true });
        await User.findByIdAndUpdate(followerId, { $inc: { followingCount: -1 } });
        return { following: false, followersCount: targetUser?.followersCount || 0 };
      } else {
        await Follow.create({ follower: followerId, following: followingId });
        const targetUser = await User.findByIdAndUpdate(followingId, { $inc: { followersCount: 1 } }, { new: true });
        await User.findByIdAndUpdate(followerId, { $inc: { followingCount: 1 } });
        return { following: true, followersCount: targetUser?.followersCount || 0 };
      }
    }

    const idx = memoryDb.follows.findIndex(f => f.follower === followerId && f.following === followingId);
    const followerUser = memoryDb.users.find(u => u._id === followerId || u.id === followerId);
    const targetUser = memoryDb.users.find(u => u._id === followingId || u.id === followingId);
    if (!targetUser) throw new Error('Target user not found');

    if (idx !== -1) {
      // Unfollow
      memoryDb.follows.splice(idx, 1);
      targetUser.followersCount = Math.max(0, (targetUser.followersCount || 0) - 1);
      if (followerUser) {
        followerUser.followingCount = Math.max(0, (followerUser.followingCount || 0) - 1);
      }
      saveMemoryDbToDisk();
      return { following: false, followersCount: targetUser.followersCount };
    } else {
      // Follow
      memoryDb.follows.push({
        _id: 'fol_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        follower: followerId,
        following: followingId,
        createdAt: new Date().toISOString(),
      });
      targetUser.followersCount = (targetUser.followersCount || 0) + 1;
      if (followerUser) {
        followerUser.followingCount = (followerUser.followingCount || 0) + 1;
      }
      saveMemoryDbToDisk();
      return { following: true, followersCount: targetUser.followersCount };
    }
  },

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    if (isMongoConnected) {
      const count = await Follow.countDocuments({ follower: followerId, following: followingId });
      return count > 0;
    }
    return memoryDb.follows.some(f => f.follower === followerId && f.following === followingId);
  },

  async getFollowers(userId: string) {
    if (isMongoConnected) {
      const records = await Follow.find({ following: userId }).populate('follower', 'name username avatar bio followersCount').lean();
      return records.map(r => r.follower);
    }
    const followerIds = memoryDb.follows.filter(f => f.following === userId).map(f => f.follower);
    return memoryDb.users
      .filter(u => followerIds.includes(u._id))
      .map(u => {
        const copy = { ...u };
        delete copy.password;
        return copy;
      });
  },

  async getFollowing(userId: string) {
    if (isMongoConnected) {
      const records = await Follow.find({ follower: userId }).populate('following', 'name username avatar bio followersCount').lean();
      return records.map(r => r.following);
    }
    const followingIds = memoryDb.follows.filter(f => f.follower === userId).map(f => f.following);
    return memoryDb.users
      .filter(u => followingIds.includes(u._id))
      .map(u => {
        const copy = { ...u };
        delete copy.password;
        return copy;
      });
  },

  async getFollowingUserIds(userId: string): Promise<string[]> {
    if (isMongoConnected) {
      const records = await Follow.find({ follower: userId }).select('following').lean();
      return records.map(r => r.following.toString());
    }
    return memoryDb.follows.filter(f => f.follower === userId).map(f => f.following);
  },

  // Reset or seed
  getMemoryDb() {
    return memoryDb;
  },
  setMemoryDb(data: PersistentDb) {
    memoryDb = data;
    saveMemoryDbToDisk();
  },
};
