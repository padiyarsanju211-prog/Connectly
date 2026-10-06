import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { Search, Plus, User, LogOut, Sparkles, Layers } from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, param?: string) => void;
  onOpenCreatePost: () => void;
  onOpenSearch: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenCreatePost,
  onOpenSearch,
}) => {
  const { user, logout, openAuthModal } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('feed')}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-sm shadow-indigo-200 transition-transform group-hover:scale-105">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-neutral-900 group-hover:text-indigo-600 transition-colors">
              Connectly
            </span>
          </button>
        </div>

        {/* Zone 2: Navigation Links & Search */}
        <div className="hidden md:flex items-center gap-1 sm:gap-4 flex-1 max-w-md mx-4">
          <button
            onClick={onOpenSearch}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-neutral-500 bg-neutral-100 hover:bg-neutral-200/80 rounded-xl transition-colors text-left"
            aria-label="Search users or tags"
          >
            <Search className="w-4 h-4 text-neutral-400 shrink-0" />
            <span className="truncate">Search creators, #tags, or topics...</span>
            <kbd className="hidden lg:inline-block ml-auto text-[10px] font-mono uppercase bg-white border border-neutral-200 rounded px-1.5 py-0.5 text-neutral-400">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={onOpenSearch}
            className="md:hidden p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          {user ? (
            <>
              <button
                onClick={onOpenCreatePost}
                className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm shadow-indigo-200 transition-colors whitespace-nowrap active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span className="hidden sm:inline">New Post</span>
              </button>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-indigo-500/20 transition-all focus:outline-none"
                  aria-label="Open user menu"
                >
                  <img
                    src={user.avatar || '/src/assets/images/avatar_alex_chen_1791296489008.jpg'}
                    alt={user.name}
                    className="w-9 h-9 rounded-full object-cover border border-neutral-200"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </button>

                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-neutral-200 rounded-2xl shadow-lg z-50 py-1.5 text-sm animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-4 py-3 border-b border-neutral-100">
                        <p className="font-semibold text-neutral-900 truncate">{user.name}</p>
                        <p className="text-xs text-neutral-500 truncate">@{user.username}</p>
                      </div>

                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          onNavigate('profile', user.username);
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-neutral-700 hover:bg-neutral-50 hover:text-indigo-600 transition-colors text-left"
                      >
                        <User className="w-4 h-4 text-neutral-400" />
                        <span>View Profile</span>
                      </button>

                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          onNavigate('explore');
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-neutral-700 hover:bg-neutral-50 hover:text-indigo-600 transition-colors text-left"
                      >
                        <Sparkles className="w-4 h-4 text-neutral-400" />
                        <span>Explore Creators</span>
                      </button>

                      <div className="border-t border-neutral-100 my-1" />

                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors text-left font-medium"
                      >
                        <LogOut className="w-4 h-4 text-red-500" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openAuthModal('login')}
                className="px-3.5 py-1.5 text-xs sm:text-sm font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-colors whitespace-nowrap"
              >
                Sign In
              </button>
              <button
                onClick={() => openAuthModal('register')}
                className="px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm shadow-indigo-200 transition-colors whitespace-nowrap"
              >
                Create Account
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
