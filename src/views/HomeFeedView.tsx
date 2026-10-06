import React, { useState, useEffect } from 'react';
import { Post } from '../types/index.js';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { PostCard } from '../components/PostCard.js';
import { Loader2, Plus, Users, Sparkles, Filter, X } from 'lucide-react';

interface HomeFeedViewProps {
  onNavigateUser: (username: string) => void;
  onOpenCreatePost: () => void;
  onEditPost: (post: Post) => void;
  selectedTag?: string;
  onSelectTag?: (tag: string | undefined) => void;
}

export const HomeFeedView: React.FC<HomeFeedViewProps> = ({
  onNavigateUser,
  onOpenCreatePost,
  onEditPost,
  selectedTag,
  onSelectTag,
}) => {
  const { user, openAuthModal } = useAuth();
  const [feedType, setFeedType] = useState<'all' | 'following'>('all');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, [feedType, selectedTag]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.posts.getFeed(feedType, selectedTag);
      if (res.success && res.posts) {
        setPosts(res.posts);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handlePostDeleted = (postId: string) => {
    setPosts(prev => prev.filter(p => p._id !== postId));
  };

  return (
    <div className="flex-1 flex flex-col gap-5 min-w-0">
      {/* Quick Create Card if logged in */}
      {user ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <img
              src={user.avatar || '/src/assets/images/avatar_alex_chen_1791296489008.jpg'}
              alt={user.name}
              className="w-10 h-10 rounded-full object-cover border border-neutral-200 shrink-0"
              referrerPolicy="no-referrer"
            />
            <button
              onClick={onOpenCreatePost}
              className="flex-1 text-left px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200/70 text-xs sm:text-sm text-neutral-500 rounded-xl transition-colors"
            >
              Share what you're building, thinking, or designing...
            </button>
            <button
              onClick={onOpenCreatePost}
              className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors shrink-0 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Post</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-neutral-900">Welcome to Connectly</h3>
            <p className="text-xs text-neutral-600 mt-0.5">
              A full-stack social media platform with JWT authentication, MongoDB models, and real user feeds.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => openAuthModal('login')}
              className="px-3.5 py-2 text-xs font-semibold text-neutral-700 hover:bg-white/80 rounded-xl transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => openAuthModal('register')}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>
      )}

      {/* Feed Filters & Controls */}
      <div className="flex items-center justify-between gap-3">
        {/* Segmented control */}
        <div className="flex items-center gap-1 p-1 bg-white border border-neutral-200 rounded-xl shadow-xs">
          <button
            onClick={() => setFeedType('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              feedType === 'all'
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            All Activity
          </button>
          <button
            onClick={() => {
              if (!user) {
                openAuthModal('login');
                return;
              }
              setFeedType('following');
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              feedType === 'following'
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Following</span>
          </button>
        </div>

        {/* Selected tag filter pill */}
        {selectedTag && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg">
            <span>#{selectedTag}</span>
            <button
              onClick={() => onSelectTag && onSelectTag(undefined)}
              className="hover:text-indigo-900"
              aria-label="Clear tag filter"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 text-red-700 text-xs rounded-2xl border border-red-200">
          {error}
        </div>
      )}

      {/* Posts List */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3 text-neutral-400">
          <Loader2 className="w-7 h-7 animate-spin text-indigo-600" />
          <span className="text-xs">Loading feed...</span>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-10 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-neutral-900">
              {feedType === 'following' ? 'No posts from people you follow yet' : 'No posts in feed'}
            </h4>
            <p className="text-xs text-neutral-500 max-w-sm mt-1">
              {feedType === 'following'
                ? 'Follow other creators to see their updates here, or check out the All Activity feed.'
                : 'Be the first to share an update or project snapshot!'}
            </p>
          </div>
          {user ? (
            <button
              onClick={onOpenCreatePost}
              className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              Create First Post
            </button>
          ) : (
            <button
              onClick={() => openAuthModal('login')}
              className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              Sign In to Post
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {posts.map(post => (
            <PostCard
              key={post._id}
              post={post}
              onNavigateUser={onNavigateUser}
              onPostDeleted={handlePostDeleted}
              onEditPost={onEditPost}
            />
          ))}
        </div>
      )}
    </div>
  );
};
