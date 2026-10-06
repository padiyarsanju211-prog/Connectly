import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { Navbar } from './components/Navbar.js';
import { Sidebar } from './components/Sidebar.js';
import { SuggestedUsers } from './components/SuggestedUsers.js';
import { DbStatusBadge } from './components/DbStatusBadge.js';
import { HomeFeedView } from './views/HomeFeedView.js';
import { ProfileView } from './views/ProfileView.js';
import { ExploreView } from './views/ExploreView.js';
import { CreatePostModal } from './components/CreatePostModal.js';
import { EditPostModal } from './components/EditPostModal.js';
import { UserSearchModal } from './components/UserSearchModal.js';
import { AuthModal } from './components/AuthModal.js';
import { Post } from './types/index.js';
import { Home, Compass, User as UserIcon, Plus } from 'lucide-react';

function MainLayout() {
  const { user, openAuthModal } = useAuth();
  const [currentView, setCurrentView] = useState<'feed' | 'profile' | 'explore'>('feed');
  const [selectedUsername, setSelectedUsername] = useState<string>('alexchen');
  const [selectedTag, setSelectedTag] = useState<string | undefined>(undefined);
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [editPost, setEditPost] = useState<Post | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [feedKey, setFeedKey] = useState(0);

  // Keyboard shortcut Ctrl+K to search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNavigate = (view: string, param?: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (view === 'profile') {
      if (param) {
        setSelectedUsername(param);
      } else if (user) {
        setSelectedUsername(user.username);
      }
      setCurrentView('profile');
    } else if (view === 'explore') {
      setCurrentView('explore');
    } else {
      setCurrentView('feed');
    }
  };

  const handleSelectTag = (tag: string | undefined) => {
    setSelectedTag(tag);
    setCurrentView('feed');
  };

  const handlePostCreated = () => {
    setFeedKey(k => k + 1);
  };

  const handlePostUpdated = () => {
    setFeedKey(k => k + 1);
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col text-neutral-900 pb-16 md:pb-0">
      {/* Top Bar */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenCreatePost={() => {
          if (!user) openAuthModal('login');
          else setCreatePostOpen(true);
        }}
        onOpenSearch={() => setSearchOpen(true)}
      />

      {/* Main 3-Column Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full flex flex-col md:flex-row gap-6 items-start">
        {/* Left Sidebar */}
        <Sidebar
          currentView={currentView}
          onNavigate={handleNavigate}
          onOpenCreatePost={() => {
            if (!user) openAuthModal('login');
            else setCreatePostOpen(true);
          }}
          selectedTag={selectedTag}
          onSelectTag={handleSelectTag}
        />

        {/* Center Main Content */}
        {currentView === 'feed' && (
          <HomeFeedView
            key={`feed-${feedKey}-${selectedTag || 'all'}`}
            onNavigateUser={(uname) => handleNavigate('profile', uname)}
            onOpenCreatePost={() => {
              if (!user) openAuthModal('login');
              else setCreatePostOpen(true);
            }}
            onEditPost={(p) => setEditPost(p)}
            selectedTag={selectedTag}
            onSelectTag={handleSelectTag}
          />
        )}

        {currentView === 'profile' && (
          <ProfileView
            key={`profile-${selectedUsername}-${feedKey}`}
            username={selectedUsername}
            onNavigateUser={(uname) => handleNavigate('profile', uname)}
            onEditPost={(p) => setEditPost(p)}
          />
        )}

        {currentView === 'explore' && (
          <ExploreView
            key={`explore-${feedKey}`}
            onNavigateUser={(uname) => handleNavigate('profile', uname)}
            onSelectTag={(t) => handleSelectTag(t)}
            onEditPost={(p) => setEditPost(p)}
          />
        )}

        {/* Right Sidebar: Suggested users + System Status */}
        <div className="hidden lg:flex flex-col gap-6 w-72 shrink-0">
          <SuggestedUsers
            onNavigate={(view, param) => handleNavigate(view, param)}
            onRefreshFeed={() => setFeedKey(k => k + 1)}
          />
          <DbStatusBadge onDataReset={() => setFeedKey(k => k + 1)} />
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-neutral-200 px-6 py-2 flex items-center justify-around">
        <button
          onClick={() => handleNavigate('feed')}
          className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
            currentView === 'feed' ? 'text-indigo-600 font-semibold' : 'text-neutral-500'
          }`}
        >
          <Home className="w-5 h-5" />
          <span>Feed</span>
        </button>

        <button
          onClick={() => handleNavigate('explore')}
          className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
            currentView === 'explore' ? 'text-indigo-600 font-semibold' : 'text-neutral-500'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span>Explore</span>
        </button>

        <button
          onClick={() => {
            if (!user) openAuthModal('login');
            else setCreatePostOpen(true);
          }}
          className="flex flex-col items-center justify-center w-10 h-10 rounded-full bg-indigo-600 text-white shadow-sm shadow-indigo-300"
          aria-label="New post"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </button>

        <button
          onClick={() => {
            if (user) handleNavigate('profile', user.username);
            else openAuthModal('login');
          }}
          className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
            currentView === 'profile' ? 'text-indigo-600 font-semibold' : 'text-neutral-500'
          }`}
        >
          <UserIcon className="w-5 h-5" />
          <span>Profile</span>
        </button>
      </nav>

      {/* Modals */}
      <CreatePostModal
        isOpen={createPostOpen}
        onClose={() => setCreatePostOpen(false)}
        onPostCreated={handlePostCreated}
      />

      <EditPostModal
        post={editPost}
        isOpen={Boolean(editPost)}
        onClose={() => setEditPost(null)}
        onPostUpdated={handlePostUpdated}
      />

      <UserSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigateUser={(uname) => {
          setSearchOpen(false);
          handleNavigate('profile', uname);
        }}
      />

      <AuthModal />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
