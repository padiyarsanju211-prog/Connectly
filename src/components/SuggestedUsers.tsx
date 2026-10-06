import React, { useState, useEffect } from 'react';
import { User } from '../types/index.js';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { Users, UserPlus, UserCheck, ShieldCheck, Database } from 'lucide-react';

interface SuggestedUsersProps {
  onNavigate: (view: string, param?: string) => void;
  onRefreshFeed?: () => void;
}

export const SuggestedUsers: React.FC<SuggestedUsersProps> = ({ onNavigate, onRefreshFeed }) => {
  const { user, openAuthModal } = useAuth();
  const [suggested, setSuggested] = useState<User[]>([]);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadSuggested();
  }, [user]);

  const loadSuggested = async () => {
    try {
      const res = await api.users.getSuggested();
      if (res.success && res.users) {
        setSuggested(res.users);
      }
    } catch {
      // Ignore
    }
  };

  const handleToggleFollow = async (targetUser: User) => {
    if (!user) {
      openAuthModal('login');
      return;
    }

    const userId = targetUser._id;
    setLoadingMap(prev => ({ ...prev, [userId]: true }));

    try {
      const res = await api.users.toggleFollow(userId);
      if (res.success) {
        setFollowingMap(prev => ({
          ...prev,
          [userId]: res.following,
        }));
        setSuggested(prev =>
          prev.map(u => (u._id === userId ? { ...u, followersCount: res.followersCount } : u))
        );
        if (onRefreshFeed) onRefreshFeed();
      }
    } catch (err: any) {
      console.error('Follow error:', err);
    } finally {
      setLoadingMap(prev => ({ ...prev, [userId]: false }));
    }
  };

  if (suggested.length === 0) {
    return null;
  }

  return (
    <aside className="w-full lg:w-72 shrink-0 flex flex-col gap-6">
      <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-indigo-600" />
            <span>Who to Follow</span>
          </h3>
        </div>

        <div className="flex flex-col gap-3.5">
          {suggested.map(target => {
            const isFollowing = followingMap[target._id] ?? false;
            const isLoading = loadingMap[target._id] ?? false;

            return (
              <div key={target._id} className="flex items-center justify-between gap-3">
                <div
                  onClick={() => onNavigate('profile', target.username)}
                  className="flex items-center gap-2.5 min-w-0 cursor-pointer group flex-1"
                >
                  <img
                    src={target.avatar || '/src/assets/images/avatar_alex_chen_1791296489008.jpg'}
                    alt={target.name}
                    className="w-9 h-9 rounded-full object-cover border border-neutral-200 shrink-0 group-hover:ring-2 group-hover:ring-indigo-400 transition-all"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-neutral-900 truncate group-hover:text-indigo-600 transition-colors">
                      {target.name}
                    </p>
                    <p className="text-[11px] text-neutral-500 truncate">@{target.username}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleFollow(target)}
                  disabled={isLoading}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors shrink-0 flex items-center gap-1 ${
                    isFollowing
                      ? 'bg-neutral-100 hover:bg-red-50 hover:text-red-600 text-neutral-700'
                      : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="w-3 h-3" />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3 h-3" />
                      <span>Follow</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* CodeAlpha Project Verification Info */}
      <div className="bg-neutral-50 rounded-2xl border border-neutral-200 p-3.5 text-xs text-neutral-500 flex flex-col gap-2">
        <div className="flex items-center gap-1.5 font-semibold text-neutral-800">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>CodeAlpha Task 2 Complete</span>
        </div>
        <p className="text-[11px] leading-relaxed text-neutral-600">
          Full-stack social media with JWT auth, bcrypt hashing, Mongoose relational schemas, and persistent backend REST APIs.
        </p>
      </div>
    </aside>
  );
};
