import express, { Response } from 'express';
import { dataStore } from '../db.js';
import { requireAuth, optionalAuth, AuthRequest } from '../middleware/auth.js';

const router = express.Router({ mergeParams: true });

// GET /api/posts/:postId/comments
router.get('/', optionalAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const { postId } = req.params;
    const comments = await dataStore.getCommentsByPost(postId);

    const formatted = comments.map(c => ({
      ...c,
      isOwnComment: req.user?.id ? (c.author?._id?.toString() === req.user.id || c.author?.toString() === req.user.id) : false,
    }));

    res.json({
      success: true,
      comments: formatted,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/posts/:postId/comments
router.post('/', requireAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const { postId } = req.params;
    const authorId = req.user!.id;
    const { content } = req.body;

    if (!content || !content.trim()) {
      res.status(400).json({
        success: false,
        message: 'Comment content cannot be empty.',
      });
      return;
    }

    const post = await dataStore.getPostById(postId);
    if (!post) {
      res.status(404).json({
        success: false,
        message: 'Post not found.',
      });
      return;
    }

    const comment = await dataStore.createComment(postId, authorId, content);

    res.status(201).json({
      success: true,
      message: 'Comment added successfully!',
      comment: {
        ...comment,
        isOwnComment: true,
      },
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/posts/:postId/comments/:commentId
router.delete('/:commentId', requireAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const { commentId } = req.params;
    const userId = req.user!.id;

    const deleted = await dataStore.deleteComment(commentId, userId);

    if (!deleted) {
      res.status(403).json({
        success: false,
        message: 'Unable to delete comment. You can only delete your own comments.',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Comment deleted successfully!',
    });
  } catch (err) {
    next(err);
  }
});

export default router;
