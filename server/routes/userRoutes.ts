import express, { Response } from 'express';
import { dataStore } from '../db.js';
import { requireAuth, optionalAuth, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// GET /api/users/search?q=...
router.get('/search', async (req, res, next) => {
  try {
    const q = (req.query.q as string) || '';
    if (!q.trim()) {
      res.json({ success: true, users: [] });
      return;
    }
    const users = await dataStore.searchUsers(q);
    res.json({ success: true, users });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/suggested
router.get('/suggested', optionalAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const currentUserId = req.user?.id;
    let followingIds: string[] = [];

    if (currentUserId) {
      followingIds = await dataStore.getFollowingUserIds(currentUserId);
    }

    let allUsers = await dataStore.searchUsers('', 20);
    // Exclude current user and already followed users if possible
    const filtered = allUsers.filter(u => {
      const uId = u._id.toString();
      return uId !== currentUserId && !followingIds.includes(uId);
    });

    res.json({
      success: true,
      users: (filtered.length > 0 ? filtered : allUsers.filter(u => u._id.toString() !== currentUserId)).slice(0, 5),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/profile/:username
router.get('/profile/:username', optionalAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const { username } = req.params;
    const user = await dataStore.findUserByUsername(username);

    if (!user) {
      res.status(404).json({
        success: false,
        message: `User @${username} was not found.`,
      });
      return;
    }

    const safeUser = { ...user };
    delete (safeUser as any).password;

    let isFollowing = false;
    if (req.user?.id && req.user.id !== safeUser._id.toString()) {
      isFollowing = await dataStore.isFollowing(req.user.id, safeUser._id.toString());
    }

    res.json({
      success: true,
      user: safeUser,
      isFollowing,
      isOwnProfile: req.user?.id === safeUser._id.toString(),
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/profile (Update current user's profile)
router.put('/profile', requireAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;
    const { name, bio, location, website, avatar, coverImage } = req.body;

    const updates: any = {};
    if (name !== undefined) updates.name = name.trim();
    if (bio !== undefined) updates.bio = bio.trim();
    if (location !== undefined) updates.location = location.trim();
    if (website !== undefined) updates.website = website.trim();
    if (avatar !== undefined) updates.avatar = avatar;
    if (coverImage !== undefined) updates.coverImage = coverImage;

    const updatedUser = await dataStore.updateUser(userId, updates);

    if (!updatedUser) {
      res.status(404).json({
        success: false,
        message: 'User profile not found.',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Profile updated successfully!',
      user: updatedUser,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/:username/posts
router.get('/:username/posts', optionalAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const { username } = req.params;
    const user = await dataStore.findUserByUsername(username);

    if (!user) {
      res.status(404).json({
        success: false,
        message: `User @${username} was not found.`,
      });
      return;
    }

    const posts = await dataStore.getPosts({ authorId: user._id.toString() });

    let likedPostIds: string[] = [];
    if (req.user?.id && posts.length > 0) {
      const ids = posts.map(p => p._id.toString());
      likedPostIds = await dataStore.getUserLikedPostIds(req.user.id, ids);
    }

    const postsWithLikedState = posts.map(p => ({
      ...p,
      hasLiked: likedPostIds.includes(p._id.toString()),
    }));

    res.json({
      success: true,
      posts: postsWithLikedState,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/:username/followers
router.get('/:username/followers', async (req, res, next) => {
  try {
    const { username } = req.params;
    const user = await dataStore.findUserByUsername(username);

    if (!user) {
      res.status(404).json({
        success: false,
        message: `User @${username} was not found.`,
      });
      return;
    }

    const followers = await dataStore.getFollowers(user._id.toString());
    res.json({
      success: true,
      followers,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/:username/following
router.get('/:username/following', async (req, res, next) => {
  try {
    const { username } = req.params;
    const user = await dataStore.findUserByUsername(username);

    if (!user) {
      res.status(404).json({
        success: false,
        message: `User @${username} was not found.`,
      });
      return;
    }

    const following = await dataStore.getFollowing(user._id.toString());
    res.json({
      success: true,
      following,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/users/:id/follow (Toggle follow/unfollow)
router.post('/:id/follow', requireAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const followerId = req.user!.id;
    const followingId = req.params.id;

    if (followerId === followingId) {
      res.status(400).json({
        success: false,
        message: 'You cannot follow yourself.',
      });
      return;
    }

    const result = await dataStore.toggleFollow(followerId, followingId);

    res.json({
      success: true,
      following: result.following,
      followersCount: result.followersCount,
      message: result.following ? 'Followed user' : 'Unfollowed user',
    });
  } catch (err: any) {
    next(err);
  }
});

// GET /api/users/:id/follow-status
router.get('/:id/follow-status', requireAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const followerId = req.user!.id;
    const followingId = req.params.id;

    const isFollowing = await dataStore.isFollowing(followerId, followingId);
    res.json({
      success: true,
      isFollowing,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
