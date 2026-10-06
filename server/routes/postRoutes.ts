import express, { Response } from 'express';
import { dataStore } from '../db.js';
import { requireAuth, optionalAuth, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// GET /api/posts
router.get('/', optionalAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const feedType = (req.query.feed as string) || 'all';
    const tag = req.query.tag as string | undefined;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = parseInt(req.query.skip as string) || 0;

    let followingUserIds: string[] | undefined = undefined;

    if (feedType === 'following') {
      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          message: 'Sign in to view your personalized following feed.',
        });
        return;
      }
      followingUserIds = await dataStore.getFollowingUserIds(req.user.id);
      // Include user's own posts in their following feed as well
      followingUserIds.push(req.user.id);
    }

    const posts = await dataStore.getPosts({
      limit,
      skip,
      followingUserIds,
      tag,
    });

    let likedPostIds: string[] = [];
    if (req.user?.id && posts.length > 0) {
      const ids = posts.map(p => p._id.toString());
      likedPostIds = await dataStore.getUserLikedPostIds(req.user.id, ids);
    }

    const formattedPosts = posts.map(p => ({
      ...p,
      hasLiked: likedPostIds.includes(p._id.toString()),
      isOwnPost: req.user?.id ? (p.author?._id?.toString() === req.user.id || p.author?.toString() === req.user.id) : false,
    }));

    res.json({
      success: true,
      posts: formattedPosts,
      hasMore: posts.length === limit,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/posts (Create post)
router.post('/', requireAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const authorId = req.user!.id;
    const { content, mediaUrl, tags } = req.body;

    if (!content || !content.trim()) {
      res.status(400).json({
        success: false,
        message: 'Post content cannot be empty.',
      });
      return;
    }

    // Auto-extract hashtags from content if not explicitly supplied
    let postTags: string[] = [];
    if (Array.isArray(tags) && tags.length > 0) {
      postTags = tags.map(t => t.toLowerCase().replace(/#/g, '').trim());
    } else {
      const matches = content.match(/#(\w+)/g);
      if (matches) {
        postTags = matches.map((t: string) => t.substring(1).toLowerCase());
      }
    }

    const newPost = await dataStore.createPost({
      authorId,
      content,
      mediaUrl: mediaUrl || '',
      tags: postTags,
    });

    res.status(201).json({
      success: true,
      message: 'Post published successfully!',
      post: {
        ...newPost,
        hasLiked: false,
        isOwnPost: true,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/posts/:id
router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const postId = req.params.id;
    const post = await dataStore.getPostById(postId);

    if (!post) {
      res.status(404).json({
        success: false,
        message: 'Post not found.',
      });
      return;
    }

    let hasLiked = false;
    if (req.user?.id) {
      hasLiked = await dataStore.hasUserLikedPost(postId, req.user.id);
    }

    res.json({
      success: true,
      post: {
        ...post,
        hasLiked,
        isOwnPost: req.user?.id ? (post.author?._id?.toString() === req.user.id || post.author?.toString() === req.user.id) : false,
      },
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/posts/:id (Edit post)
router.put('/:id', requireAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const postId = req.params.id;
    const userId = req.user!.id;
    const { content, mediaUrl } = req.body;

    const post = await dataStore.getPostById(postId);
    if (!post) {
      res.status(404).json({
        success: false,
        message: 'Post not found.',
      });
      return;
    }

    const postAuthorId = post.author?._id ? post.author._id.toString() : post.author?.toString();
    if (postAuthorId !== userId) {
      res.status(403).json({
        success: false,
        message: 'You can only edit your own posts.',
      });
      return;
    }

    if (!content || !content.trim()) {
      res.status(400).json({
        success: false,
        message: 'Post content cannot be empty.',
      });
      return;
    }

    const updated = await dataStore.updatePost(postId, content, mediaUrl);

    res.json({
      success: true,
      message: 'Post updated successfully!',
      post: updated,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/posts/:id (Delete post)
router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const postId = req.params.id;
    const userId = req.user!.id;

    const post = await dataStore.getPostById(postId);
    if (!post) {
      res.status(404).json({
        success: false,
        message: 'Post not found.',
      });
      return;
    }

    const postAuthorId = post.author?._id ? post.author._id.toString() : post.author?.toString();
    if (postAuthorId !== userId) {
      res.status(403).json({
        success: false,
        message: 'You can only delete your own posts.',
      });
      return;
    }

    const deleted = await dataStore.deletePost(postId, userId);

    if (!deleted) {
      res.status(400).json({
        success: false,
        message: 'Could not delete post.',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Post deleted successfully!',
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/posts/:id/like (Toggle like/unlike)
router.post('/:id/like', requireAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const postId = req.params.id;
    const userId = req.user!.id;

    const result = await dataStore.toggleLike(postId, userId);

    res.json({
      success: true,
      liked: result.liked,
      likesCount: result.likesCount,
      message: result.liked ? 'Post liked' : 'Post unliked',
    });
  } catch (err: any) {
    next(err);
  }
});

// GET /api/posts/:id/likes
router.get('/:id/likes', optionalAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const postId = req.params.id;
    let hasLiked = false;
    if (req.user?.id) {
      hasLiked = await dataStore.hasUserLikedPost(postId, req.user.id);
    }
    const post = await dataStore.getPostById(postId);
    res.json({
      success: true,
      likesCount: post?.likesCount || 0,
      hasLiked,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
