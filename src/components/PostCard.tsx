import React, { useState } from 'react';
import { Post } from '../types/index.js';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { Heart, MessageCircle, MoreHorizontal, Edit3, Trash2, Share2, Check } from 'lucide-react';
import { CommentSection } from './CommentSection.js';

interface PostCardProps {
  post: Post;
  onNavigateUser: (username: string) => void;
  onPostDeleted?: (postId: string) => void;
  onEditPost?: (post: Post) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onNavigateUser,
  onPostDeleted,
  onEditPost,
}) => {
  const { user, openAuthModal } = useAuth();
  const [likesCount, setLikesCount] = useState<number>(post.likesCount || 0);
  const [hasLiked, setHasLiked] = useState<boolean>(post.hasLiked ?? false);
  const [isLiking, setIsLiking] = useState<boolean>(false);
  const [showComments, setShowComments] = useState<boolean>(false);
  const [commentsCount, setCommentsCount] = useState<number>(post.commentsCount || 0);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);

  const author = post.author || {
    name: 'Unknown User',
    username: 'unknown',
    avatar: '/src/assets/images/avatar_alex_chen_1791296489008.jpg',
  };

  const isAuthor = user && (user._id === author._id || user._id === (author as any));

  const handleLike = async () => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    if (isLiking) return;

    // Optimistic UI update
    const previousLiked = hasLiked;
    const previousCount = likesCount;
    setHasLiked(!previousLiked);
    setLikesCount(previousLiked ? Math.max(0, previousCount - 1) : previousCount + 1);
    setIsLiking(true);

    try {
      const res = await api.posts.toggleLike(post._id);
      if (res.success) {
        setHasLiked(res.liked);
        setLikesCount(res.likesCount);
      }
    } catch {
      // Revert on error
      setHasLiked(previousLiked);
      setLikesCount(previousCount);
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      const res = await api.posts.delete(post._id);
      if (res.success && onPostDeleted) {
        onPostDeleted(post._id);
      }
    } catch (err: any) {
      alert(err.message || 'Could not delete post');
    }
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.origin + `?post=${post._id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  // Highlight hashtags nicely
  const renderFormattedContent = (text: string) => {
    const parts = text.split(/(#[a-zA-Z0-9_]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('#')) {
        return (
          <span key={i} className="text-indigo-600 font-medium hover:underline cursor-pointer">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <article className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs transition-shadow hover:shadow-sm">
      {/* Header: Author + Timestamp + Options */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div
          onClick={() => onNavigateUser(author.username)}
          className="flex items-center gap-3 cursor-pointer group min-w-0"
        >
          <img
            src={author.avatar || '/src/assets/images/avatar_alex_chen_1791296489008.jpg'}
            alt={author.name}
            className="w-10 h-10 rounded-full object-cover border border-neutral-200 shrink-0 group-hover:ring-2 group-hover:ring-indigo-400 transition-all"
            referrerPolicy="no-referrer"
          />
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-neutral-900 group-hover:text-indigo-600 transition-colors truncate">
              {author.name}
            </h4>
            <div className="flex items-center gap-1.5 text-xs text-neutral-500">
              <span className="truncate">@{author.username}</span>
              <span aria-hidden="true">·</span>
              <span className="shrink-0 tabular-nums">{formatRelativeTime(post.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Action Menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
            aria-label="Post options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 mt-1 w-44 bg-white border border-neutral-200 rounded-xl shadow-lg z-40 py-1 text-xs">
                {isAuthor ? (
                  <>
                    {onEditPost && (
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onEditPost(post);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-neutral-700 hover:bg-neutral-50 text-left"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-neutral-500" />
                        <span>Edit Post</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        handleDelete();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 text-left font-medium"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      <span>Delete Post</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onNavigateUser(author.username);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-neutral-700 hover:bg-neutral-50 text-left"
                  >
                    <span>View Profile</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    handleShare();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-neutral-700 hover:bg-neutral-50 text-left border-t border-neutral-100"
                >
                  <Share2 className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Copy Link</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Post Text Content */}
      <div className="text-sm text-neutral-800 leading-relaxed whitespace-pre-wrap break-words">
        {renderFormattedContent(post.content)}
      </div>

      {/* Post Media / Image if provided */}
      {post.mediaUrl && !imageError && (
        <div className="mt-3.5 rounded-xl overflow-hidden border border-neutral-200 bg-neutral-100 max-h-[420px] flex items-center justify-center">
          <img
            src={post.mediaUrl}
            alt="Post attachment"
            className="w-full h-auto max-h-[420px] object-cover"
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
          />
        </div>
      )}

      {/* Post Tags (Clean typography without pill cliches) */}
      {post.tags && post.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-indigo-600">
          {post.tags.map((t, idx) => (
            <span key={idx} className="font-medium hover:underline cursor-pointer">
              #{t}
            </span>
          ))}
        </div>
      )}

      {/* Engagement Stats & Actions Bar */}
      <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-neutral-500">
        <div className="flex items-center gap-5">
          {/* Like Button */}
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 text-xs font-semibold transition-colors group ${
              hasLiked ? 'text-rose-600' : 'hover:text-rose-600 text-neutral-500'
            }`}
            aria-label={hasLiked ? 'Unlike post' : 'Like post'}
          >
            <Heart
              className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                hasLiked ? 'fill-rose-600 text-rose-600' : 'text-current'
              }`}
            />
            <span className="tabular-nums">{likesCount}</span>
          </button>

          {/* Comment Button */}
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-indigo-600 transition-colors group"
            aria-label="View or add comments"
          >
            <MessageCircle className="w-4 h-4 transition-transform group-hover:scale-110" />
            <span className="tabular-nums">{commentsCount}</span>
          </button>
        </div>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-700 transition-colors"
          title="Share post"
          aria-label="Share post"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-600 font-medium text-[11px]">Copied</span>
            </>
          ) : (
            <Share2 className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Comment Section Drawer */}
      {showComments && (
        <CommentSection
          postId={post._id}
          onCommentCountChange={(count) => setCommentsCount(count)}
          onNavigateUser={onNavigateUser}
        />
      )}
    </article>
  );
};
