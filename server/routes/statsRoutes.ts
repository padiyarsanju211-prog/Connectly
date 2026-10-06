import express from 'express';
import { getDbStatus, dataStore } from '../db.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const status = getDbStatus();
    let totalUsers = status.userCount;
    let totalPosts = status.postCount;

    if (status.isConnected) {
      const { User } = await import('../models/User.js');
      const { Post } = await import('../models/Post.js');
      totalUsers = await User.countDocuments();
      totalPosts = await Post.countDocuments();
    } else {
      const memDb = dataStore.getMemoryDb();
      totalUsers = memDb.users.length;
      totalPosts = memDb.posts.length;
    }

    res.json({
      success: true,
      status: {
        ...status,
        userCount: totalUsers,
        postCount: totalPosts,
        system: 'Connectly Social Platform API v1.0',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
