import React from 'react';
import { useAuth } from '../context/AuthContext.js';
import { Home, Compass, User, Tag, Sparkles, Database, Plus } from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string, param?: string) => void;
  onOpenCreatePost: () => void;
  selectedTag?: string;
  onSelectTag?: (tag: string | undefined) => void;
}

const POPULAR_TAGS = ['fullstack', 'architecture', 'typescript', 'mongodb', 'design', 'auth'];

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  onOpenCreatePost,
  selectedTag,
  onSelectTag,
}) => {
  const { user, openAuthModal } = useAuth();

  return (
    <aside className="w-full md:w-64 shrink-0 flex flex-col gap-6">
      {/* Navigation Card */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-3 shadow-xs">
        <nav className="flex flex-col gap-1">
          <button
            onClick={() => {
              if (onSelectTag) onSelectTag(undefined);
              onNavigate('feed');
            }}
            className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
              currentView === 'feed' && !selectedTag
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
            }`}
          >
            <Home className="w-4 h-4 shrink-0 text-current" />
            <span>Home Feed</span>
          </button>

          <button
            onClick={() => onNavigate('explore')}
            className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
              currentView === 'explore'
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
            }`}
          >
            <Compass className="w-4 h-4 shrink-0 text-current" />
            <span>Explore Creators</span>
          </button>

          {user ? (
            <button
              onClick={() => onNavigate('profile', user.username)}
              className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                currentView === 'profile'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
              }`}
            >
              <User className="w-4 h-4 shrink-0 text-current" />
              <span>My Profile</span>
            </button>
          ) : (
            <button
              onClick={() => openAuthModal('login')}
              className="flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-colors text-left"
            >
              <User className="w-4 h-4 shrink-0 text-neutral-400" />
              <span>Sign In to Profile</span>
            </button>
          )}
        </nav>

        {user && (
          <div className="mt-3 pt-3 border-t border-neutral-100">
            <button
              onClick={onOpenCreatePost}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs shadow-indigo-100 transition-colors"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Draft New Post</span>
            </button>
          </div>
        )}
      </div>

      {/* User Summary Widget if Logged In */}
      {user && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs">
          <div
            onClick={() => onNavigate('profile', user.username)}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <img
              src={user.avatar || '/src/assets/images/avatar_alex_chen_1791296489008.jpg'}
              alt={user.name}
              className="w-11 h-11 rounded-full object-cover border border-neutral-200 group-hover:ring-2 group-hover:ring-indigo-400 transition-all"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-neutral-900 truncate group-hover:text-indigo-600 transition-colors">
                {user.name}
              </p>
              <p className="text-xs text-neutral-500 truncate">@{user.username}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-neutral-100 text-center">
            <div>
              <p className="text-sm font-bold text-neutral-900 tabular-nums">{user.postsCount || 0}</p>
              <p className="text-[11px] text-neutral-500 font-medium">Posts</p>
            </div>
            <div>
              <p className="text-sm font-bold text-neutral-900 tabular-nums">{user.followersCount || 0}</p>
              <p className="text-[11px] text-neutral-500 font-medium">Followers</p>
            </div>
            <div>
              <p className="text-sm font-bold text-neutral-900 tabular-nums">{user.followingCount || 0}</p>
              <p className="text-[11px] text-neutral-500 font-medium">Following</p>
            </div>
          </div>
        </div>
      )}

      {/* Trending Topics / Tags */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-indigo-600" />
            <span>Popular Tags</span>
          </h3>
          {selectedTag && (
            <button
              onClick={() => onSelectTag && onSelectTag(undefined)}
              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Clear filter
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {POPULAR_TAGS.map(t => {
            const isSelected = selectedTag === t;
            return (
              <button
                key={t}
                onClick={() => {
                  if (onSelectTag) {
                    onSelectTag(isSelected ? undefined : t);
                  }
                  if (currentView !== 'feed') {
                    onNavigate('feed');
                  }
                }}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  isSelected
                    ? 'bg-indigo-600 text-white'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                }`}
              >
                #{t}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
