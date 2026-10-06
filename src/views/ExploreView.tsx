import React, { useState, useEffect } from 'react';
import { User, Post } from '../types/index.js';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { PostCard } from '../components/PostCard.js';
import { Search, Users, UserPlus, UserCheck, Sparkles, Tag, Loader2 } from 'lucide-react';

interface ExploreViewProps {
  onNavigateUser: (username: string) => void;
  onSelectTag: (tag: string) => void;
  onEditPost: (post: Post) => void;
}

export const ExploreView: React.FC<ExploreViewProps> = ({
  onNavigateUser,
  onSelectTag,
  onEditPost,
}) => {
  const { user: currentUser, openAuthModal } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [creators, setCreators] = useState<User[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadExploreData();
  }, [searchQuery]);

  const loadExploreData = async () => {
    try {
      setLoading(true);
      const [usersRes, postsRes] = await Promise.all([
        searchQuery ? api.users.search(searchQuery) : api.users.search(''),
        api.posts.getFeed('all'),
      ]);

      if (usersRes.success && usersRes.users) {
        setCreators(usersRes.users);
      }
      if (postsRes.success && postsRes.posts) {
        // Sort by likes + comments
        const sorted = [...postsRes.posts].sort(
          (a, b) => (b.likesCount + b.commentsCount) - (a.likesCount + a.commentsCount)
        );
        setTrendingPosts(sorted.slice(0, 5));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFollow = async (targetId: string) => {
    if (!currentUser) {
      openAuthModal('login');
      return;
    }
    try {
      const res = await api.users.toggleFollow(targetId);
      if (res.success) {
        setFollowingMap(prev => ({ ...prev, [targetId]: res.following }));
        setCreators(prev =>
          prev.map(u => (u._id === targetId ? { ...u, followersCount: res.followersCount } : u))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const POPULAR_TOPICS = [
    { tag: 'fullstack', label: 'Full Stack Development', desc: 'Architecture, REST APIs, databases' },
    { tag: 'mongodb', label: 'MongoDB & Mongoose', desc: 'Schemas, indexes, and queries' },
    { tag: 'design', label: 'Product & UI Design', desc: 'Design systems, accessibility, typography' },
    { tag: 'typescript', label: 'TypeScript & React', desc: 'Type safety and modern state management' },
  ];

  return (
    <div className="flex-1 flex flex-col gap-6 min-w-0">
      {/* Header and Search */}
      <div className="bg-white rounded-3xl border border-neutral-200 p-6 shadow-xs flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <span>Discover Connectly</span>
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Connect with engineers, designers, and founders across the platform.
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search creators by name, skill, or @username..."
            className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white transition-all placeholder:text-neutral-400"
          />
        </div>
      </div>

      {/* Featured Creators Grid */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-indigo-600" />
            <span>Community Creators</span>
          </h3>
          <span className="text-xs text-neutral-400 tabular-nums">{creators.length} creators</span>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center text-neutral-400">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          </div>
        ) : creators.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-center text-xs text-neutral-500">
            No creators found matching "{searchQuery}".
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {creators.map(creator => {
              const isSelf = currentUser && (currentUser._id === creator._id || currentUser._id === (creator as any));
              const isFollowing = followingMap[creator._id];

              return (
                <div
                  key={creator._id}
                  className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs flex flex-col justify-between gap-3 hover:border-neutral-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      onClick={() => onNavigateUser(creator.username)}
                      className="flex items-center gap-3 cursor-pointer min-w-0 flex-1 group"
                    >
                      <img
                        src={creator.avatar || '/src/assets/images/avatar_alex_chen_1791296489008.jpg'}
                        alt={creator.name}
                        className="w-11 h-11 rounded-full object-cover border border-neutral-200 group-hover:ring-2 group-hover:ring-indigo-400 transition-all shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-neutral-900 group-hover:text-indigo-600 truncate transition-colors">
                          {creator.name}
                        </h4>
                        <p className="text-[11px] text-neutral-400 truncate">@{creator.username}</p>
                      </div>
                    </div>

                    {!isSelf && (
                      <button
                        onClick={() => handleToggleFollow(creator._id)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shrink-0 flex items-center gap-1 ${
                          isFollowing
                            ? 'bg-neutral-100 hover:bg-red-50 hover:text-red-600 text-neutral-700'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                      >
                        {isFollowing ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Following</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Follow</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {creator.bio && (
                    <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                      {creator.bio}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-[11px] text-neutral-400 pt-2 border-t border-neutral-100">
                    <span>
                      <strong className="text-neutral-700 tabular-nums">{creator.postsCount || 0}</strong> posts
                    </span>
                    <span>
                      <strong className="text-neutral-700 tabular-nums">{creator.followersCount || 0}</strong> followers
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Explore Topics */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider px-1 flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-indigo-600" />
          <span>Trending Discussion Topics</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {POPULAR_TOPICS.map((topic) => (
            <div
              key={topic.tag}
              onClick={() => onSelectTag(topic.tag)}
              className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs hover:border-indigo-300 hover:shadow-sm cursor-pointer transition-all flex flex-col gap-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-600">#{topic.tag}</span>
                <span className="text-[10px] text-neutral-400">Filter Feed &rarr;</span>
              </div>
              <h4 className="text-xs font-semibold text-neutral-900">{topic.label}</h4>
              <p className="text-[11px] text-neutral-500">{topic.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Trending Posts */}
      {trendingPosts.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider px-1">
            Top Community Posts
          </h3>
          <div className="flex flex-col gap-4">
            {trendingPosts.map(post => (
              <PostCard
                key={post._id}
                post={post}
                onNavigateUser={onNavigateUser}
                onEditPost={onEditPost}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
