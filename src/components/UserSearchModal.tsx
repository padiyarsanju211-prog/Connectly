import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types/index.js';
import { api } from '../api/client.js';
import { Search, X, Loader2, User as UserIcon } from 'lucide-react';

interface UserSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateUser: (username: string) => void;
}

export const UserSearchModal: React.FC<UserSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigateUser,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await api.users.search(query);
        if (res.success && res.users) {
          setResults(res.users);
        }
      } catch {
        // Ignore
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-neutral-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative bg-white rounded-2xl border border-neutral-200 shadow-2xl w-full max-w-lg overflow-hidden z-10 flex flex-col">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 p-4 border-b border-neutral-200">
          <Search className="w-5 h-5 text-neutral-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search creators by name or @username..."
            className="flex-1 text-sm bg-transparent border-none focus:outline-none placeholder:text-neutral-400 text-neutral-900"
          />
          {loading && <Loader2 className="w-4 h-4 text-indigo-600 animate-spin shrink-0" />}
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Results */}
        <div className="max-h-96 overflow-y-auto p-2 flex flex-col gap-1">
          {query.trim() === '' ? (
            <div className="py-8 text-center text-xs text-neutral-400">
              Type to search for people on Connectly
            </div>
          ) : results.length === 0 && !loading ? (
            <div className="py-8 text-center text-xs text-neutral-400">
              No users matching "{query}"
            </div>
          ) : (
            results.map((u) => (
              <div
                key={u._id}
                onClick={() => {
                  onClose();
                  onNavigateUser(u.username);
                }}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-neutral-50 cursor-pointer transition-colors"
              >
                <img
                  src={u.avatar || '/src/assets/images/avatar_alex_chen_1791296489008.jpg'}
                  alt={u.name}
                  className="w-10 h-10 rounded-full object-cover border border-neutral-200"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-neutral-900 truncate">{u.name}</p>
                  <p className="text-[11px] text-neutral-400 truncate">@{u.username}</p>
                </div>
                <span className="text-[11px] text-neutral-400 font-medium">
                  {u.followersCount || 0} followers
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
