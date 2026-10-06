import React, { useState, useEffect } from 'react';
import { User } from '../types/index.js';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { X, Loader2, Users, UserPlus, UserCheck } from 'lucide-react';

interface UserListModalProps {
  username: string;
  type: 'followers' | 'following';
  isOpen: boolean;
  onClose: () => void;
  onNavigateUser: (username: string) => void;
}

export const UserListModal: React.FC<UserListModalProps> = ({
  username,
  type,
  isOpen,
  onClose,
  onNavigateUser,
}) => {
  const { user, openAuthModal } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      loadList();
    }
  }, [isOpen, username, type]);

  const loadList = async () => {
    try {
      setLoading(true);
      const res =
        type === 'followers'
          ? await api.users.getFollowers(username)
          : await api.users.getFollowing(username);
      if (res.success) {
        setUsers(type === 'followers' ? (res as any).followers : (res as any).following);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleToggleFollow = async (targetId: string) => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    try {
      const res = await api.users.toggleFollow(targetId);
      if (res.success) {
        setFollowingMap(prev => ({ ...prev, [targetId]: res.following }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative bg-white rounded-2xl border border-neutral-200 shadow-xl w-full max-w-md p-5 z-10 flex flex-col gap-3 max-h-[85vh]">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <h3 className="text-base font-bold text-neutral-900 capitalize flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <span>@{username}'s {type}</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 flex flex-col gap-3 py-1">
          {loading ? (
            <div className="py-8 flex justify-center text-neutral-400">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-500">
              No {type} yet.
            </div>
          ) : (
            users.map(u => {
              const isSelf = user && (user._id === u._id || user._id === (u as any));
              const isFollowing = followingMap[u._id];

              return (
                <div key={u._id} className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-neutral-50">
                  <div
                    onClick={() => {
                      onClose();
                      onNavigateUser(u.username);
                    }}
                    className="flex items-center gap-3 cursor-pointer min-w-0 flex-1"
                  >
                    <img
                      src={u.avatar || '/src/assets/images/avatar_alex_chen_1791296489008.jpg'}
                      alt={u.name}
                      className="w-10 h-10 rounded-full object-cover border border-neutral-200"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-neutral-900 truncate hover:text-indigo-600">
                        {u.name}
                      </p>
                      <p className="text-[11px] text-neutral-400 truncate">@{u.username}</p>
                    </div>
                  </div>

                  {!isSelf && user && (
                    <button
                      onClick={() => handleToggleFollow(u._id)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-neutral-100 hover:bg-indigo-50 hover:text-indigo-600 transition-colors shrink-0"
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
