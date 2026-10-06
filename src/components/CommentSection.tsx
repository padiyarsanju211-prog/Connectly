import React, { useState, useEffect } from 'react';
import { Comment } from '../types/index.js';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { Send, Trash2, Loader2, MessageSquare } from 'lucide-react';

interface CommentSectionProps {
  postId: string;
  onCommentCountChange?: (count: number) => void;
  onNavigateUser: (username: string) => void;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  postId,
  onCommentCountChange,
  onNavigateUser,
}) => {
  const { user, openAuthModal } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [newComment, setNewComment] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const res = await api.comments.getByPost(postId);
      if (res.success && res.comments) {
        setComments(res.comments);
        if (onCommentCountChange) {
          onCommentCountChange(res.comments.length);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal('login');
      return;
    }
    if (!newComment.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await api.comments.create(postId, newComment.trim());
      if (res.success && res.comment) {
        const updated = [...comments, res.comment];
        setComments(updated);
        setNewComment('');
        if (onCommentCountChange) {
          onCommentCountChange(updated.length);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Could not post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const res = await api.comments.delete(postId, commentId);
      if (res.success) {
        const updated = comments.filter(c => c._id !== commentId);
        setComments(updated);
        if (onCommentCountChange) {
          onCommentCountChange(updated.length);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete comment');
    }
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return 'just now';
      if (diffMin < 60) return `${diffMin}m`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours}h`;
      return `${Math.floor(diffHours / 24)}d`;
    } catch {
      return '';
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-neutral-100 flex flex-col gap-3">
      {/* Input box */}
      {user ? (
        <form onSubmit={handleAddComment} className="flex gap-2 items-start">
          <img
            src={user.avatar || '/src/assets/images/avatar_alex_chen_1791296489008.jpg'}
            alt={user.name}
            className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5 border border-neutral-200"
            referrerPolicy="no-referrer"
          />
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a thoughtful reply..."
              className="flex-1 bg-neutral-100 focus:bg-white text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-transparent focus:border-indigo-400 focus:outline-none transition-all placeholder:text-neutral-400"
              maxLength={500}
            />
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
              aria-label="Send comment"
            >
              {submitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="p-3 bg-neutral-50 rounded-xl text-center text-xs text-neutral-600 flex items-center justify-between">
          <span>Join the discussion to comment</span>
          <button
            onClick={() => openAuthModal('login')}
            className="text-indigo-600 hover:text-indigo-800 font-semibold text-xs ml-2"
          >
            Sign in
          </button>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 px-1">{error}</p>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="py-4 flex justify-center text-neutral-400">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : comments.length === 0 ? (
        <div className="py-3 text-center text-xs text-neutral-400 flex items-center justify-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5" />
          <span>No comments yet. Start the conversation!</span>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 mt-1">
          {comments.map(c => {
            const author = c.author || { name: 'User', username: 'user', avatar: '' };
            const isOwn = c.isOwnComment || (user && (author._id === user._id || (author as any) === user._id));

            return (
              <div key={c._id} className="flex gap-2.5 group items-start">
                <img
                  src={author.avatar || '/src/assets/images/avatar_alex_chen_1791296489008.jpg'}
                  alt={author.name}
                  onClick={() => onNavigateUser(author.username)}
                  className="w-7 h-7 rounded-full object-cover shrink-0 cursor-pointer hover:opacity-85 transition-opacity mt-0.5 border border-neutral-200"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 bg-neutral-50 rounded-xl p-2.5 border border-neutral-100">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        onClick={() => onNavigateUser(author.username)}
                        className="text-xs font-semibold text-neutral-900 cursor-pointer hover:text-indigo-600 transition-colors truncate"
                      >
                        {author.name}
                      </span>
                      <span className="text-[11px] text-neutral-400 truncate">
                        @{author.username}
                      </span>
                      <span className="text-neutral-300 text-xs">·</span>
                      <span className="text-[10px] text-neutral-400 tabular-nums">
                        {formatRelativeTime(c.createdAt)}
                      </span>
                    </div>

                    {isOwn && (
                      <button
                        onClick={() => handleDeleteComment(c._id)}
                        className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-500 p-1 transition-opacity"
                        title="Delete comment"
                        aria-label="Delete comment"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-neutral-700 whitespace-pre-wrap leading-relaxed">
                    {c.content}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
