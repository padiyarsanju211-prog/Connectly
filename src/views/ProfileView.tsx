import React, { useState, useEffect } from 'react';
import { User, Post } from '../types/index.js';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { PostCard } from '../components/PostCard.js';
import { ProfileModal } from '../components/ProfileModal.js';
import { UserListModal } from '../components/UserListModal.js';
import {
  MapPin,
  Link as LinkIcon,
  Calendar,
  Edit2,
  UserPlus,
  UserCheck,
  Loader2,
  FileText,
  Users,
} from 'lucide-react';

interface ProfileViewProps {
  username: string;
  onNavigateUser: (username: string) => void;
  onEditPost: (post: Post) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  username,
  onNavigateUser,
  onEditPost,
}) => {
  const { user: currentUser, openAuthModal } = useAuth();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [isOwnProfile, setIsOwnProfile] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editProfileOpen, setEditProfileOpen] = useState<boolean>(false);
  const [followModalType, setFollowModalType] = useState<'followers' | 'following' | null>(null);

  useEffect(() => {
    fetchProfileData();
  }, [username, currentUser]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [userRes, postsRes] = await Promise.all([
        api.users.getProfile(username),
        api.posts.getUserPosts(username),
      ]);

      if (userRes.success && userRes.user) {
        setProfileUser(userRes.user);
        setIsFollowing(userRes.isFollowing);
        setIsOwnProfile(userRes.isOwnProfile);
      }

      if (postsRes.success && postsRes.posts) {
        setPosts(postsRes.posts);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFollow = async () => {
    if (!currentUser) {
      openAuthModal('login');
      return;
    }
    if (!profileUser) return;

    try {
      const res = await api.users.toggleFollow(profileUser._id);
      if (res.success) {
        setIsFollowing(res.following);
        setProfileUser(prev =>
          prev ? { ...prev, followersCount: res.followersCount } : null
        );
      }
    } catch (err: any) {
      alert(err.message || 'Follow action failed');
    }
  };

  const handlePostDeleted = (postId: string) => {
    setPosts(prev => prev.filter(p => p._id !== postId));
    setProfileUser(prev =>
      prev ? { ...prev, postsCount: Math.max(0, (prev.postsCount || 1) - 1) } : null
    );
  };

  if (loading) {
    return (
      <div className="flex-1 py-20 flex flex-col items-center justify-center gap-3 text-neutral-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <span className="text-xs">Loading profile...</span>
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="flex-1 bg-white rounded-2xl border border-neutral-200 p-12 text-center">
        <h3 className="text-base font-bold text-neutral-900 mb-1">User not found</h3>
        <p className="text-xs text-neutral-500 mb-4">{error || `No user found for @${username}`}</p>
        <button
          onClick={() => onNavigateUser('alexchen')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
        >
          Explore Other Creators
        </button>
      </div>
    );
  }

  const formattedJoinDate = (() => {
    try {
      return new Date(profileUser.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  })();

  return (
    <div className="flex-1 flex flex-col gap-5 min-w-0">
      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl border border-neutral-200 overflow-hidden shadow-xs">
        {/* Cover Image */}
        <div className="h-36 sm:h-48 w-full bg-neutral-200 relative overflow-hidden">
          <img
            src={profileUser.coverImage || '/src/assets/images/community_workspace_1791296557615.jpg'}
            alt="Cover"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Profile Info Row */}
        <div className="px-6 pb-6 pt-0 relative">
          {/* Avatar + Action Button */}
          <div className="flex items-end justify-between -mt-12 sm:-mt-16 mb-4 gap-4">
            <div className="relative">
              <img
                src={profileUser.avatar || '/src/assets/images/avatar_alex_chen_1791296489008.jpg'}
                alt={profileUser.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-white shadow-md bg-white"
                referrerPolicy="no-referrer"
              />
            </div>

            <div>
              {isOwnProfile ? (
                <button
                  onClick={() => setEditProfileOpen(true)}
                  className="px-4 py-2 bg-white hover:bg-neutral-50 border border-neutral-300 text-neutral-700 text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <button
                  onClick={handleToggleFollow}
                  className={`px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-colors flex items-center gap-2 shadow-xs ${
                    isFollowing
                      ? 'bg-neutral-100 hover:bg-red-50 hover:text-red-600 text-neutral-800'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="w-4 h-4" />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Follow</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* User Bio & Meta */}
          <div className="flex flex-col gap-3">
            <div>
              <h2 className="text-xl font-bold text-neutral-900 tracking-tight">{profileUser.name}</h2>
              <p className="text-xs text-neutral-500 font-medium">@{profileUser.username}</p>
            </div>

            {profileUser.bio && (
              <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed max-w-2xl whitespace-pre-wrap">
                {profileUser.bio}
              </p>
            )}

            {/* Extra details (Location, Website, Joined) */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-500 pt-1">
              {profileUser.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                  <span>{profileUser.location}</span>
                </div>
              )}
              {profileUser.website && (
                <div className="flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-neutral-400" />
                  <a
                    href={profileUser.website.startsWith('http') ? profileUser.website : `https://${profileUser.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:underline"
                  >
                    {profileUser.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
              {formattedJoinDate && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Joined {formattedJoinDate}</span>
                </div>
              )}
            </div>

            {/* Counts & Follower Lists */}
            <div className="flex items-center gap-6 pt-3 border-t border-neutral-100 text-xs sm:text-sm">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-neutral-900 tabular-nums">{profileUser.postsCount || posts.length}</span>
                <span className="text-neutral-500">Posts</span>
              </div>

              <button
                onClick={() => setFollowModalType('followers')}
                className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors"
              >
                <span className="font-bold text-neutral-900 tabular-nums">{profileUser.followersCount || 0}</span>
                <span className="text-neutral-500">Followers</span>
              </button>

              <button
                onClick={() => setFollowModalType('following')}
                className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors"
              >
                <span className="font-bold text-neutral-900 tabular-nums">{profileUser.followingCount || 0}</span>
                <span className="text-neutral-500">Following</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* User's Posts Feed */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>Posts by {profileUser.name}</span>
          </h3>
          <span className="text-xs text-neutral-400 tabular-nums">
            {posts.length} {posts.length === 1 ? 'post' : 'posts'}
          </span>
        </div>

        {posts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-200 p-10 text-center text-xs text-neutral-500">
            No posts published by @{profileUser.username} yet.
          </div>
        ) : (
          posts.map(post => (
            <PostCard
              key={post._id}
              post={post}
              onNavigateUser={onNavigateUser}
              onPostDeleted={handlePostDeleted}
              onEditPost={onEditPost}
            />
          ))
        )}
      </div>

      {/* Edit Profile Modal */}
      {isOwnProfile && (
        <ProfileModal
          user={profileUser}
          isOpen={editProfileOpen}
          onClose={() => setEditProfileOpen(false)}
          onProfileUpdated={(updated) => setProfileUser(updated)}
        />
      )}

      {/* Followers / Following Modal */}
      {followModalType && (
        <UserListModal
          username={profileUser.username}
          type={followModalType}
          isOpen={Boolean(followModalType)}
          onClose={() => setFollowModalType(null)}
          onNavigateUser={onNavigateUser}
        />
      )}
    </div>
  );
};
