import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { X, Loader2, KeyRound, User, Mail, Sparkles } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { name: 'Alex Chen', username: 'alexchen', role: 'Product Designer', avatar: '/src/assets/images/avatar_alex_chen_1791296489008.jpg' },
  { name: 'Sarah Jenkins', username: 'sarah_j', role: 'Creative Director', avatar: '/src/assets/images/avatar_sarah_jenkins_1791296506366.jpg' },
  { name: 'David Kim', username: 'davidkim', role: 'Full Stack Dev', avatar: '/src/assets/images/avatar_david_kim_1791296522717.jpg' },
];

export const AuthModal: React.FC = () => {
  const { authModalOpen, authModalTab, closeAuthModal, openAuthModal, login, register } = useAuth();

  const [tab, setTab] = useState<'login' | 'register'>(authModalTab);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    setTab(authModalTab);
    setError(null);
  }, [authModalTab, authModalOpen]);

  if (!authModalOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError('Please provide your username/email and password.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await login(identifier.trim(), password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await register({
        name: name.trim(),
        username: username.trim(),
        email: email.trim(),
        password,
        bio: bio.trim(),
      });
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickLogin = async (demoUsername: string) => {
    setSubmitting(true);
    setError(null);
    try {
      await login(demoUsername, 'password123');
    } catch (err: any) {
      setError(err.message || 'Failed to login with demo account');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={closeAuthModal} />
      <div className="relative bg-white rounded-3xl border border-neutral-200 shadow-2xl w-full max-w-md p-6 z-10 flex flex-col gap-5">
        {/* Header & Tabs */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-xl">
            <button
              onClick={() => {
                setTab('login');
                setError(null);
              }}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                tab === 'login'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setTab('register');
                setError(null);
              }}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                tab === 'register'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              Register
            </button>
          </div>

          <button
            onClick={closeAuthModal}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
            {error}
          </div>
        )}

        {/* Login Form */}
        {tab === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="flex flex-col gap-3.5">
            <div>
              <label className="text-xs font-semibold text-neutral-700 mb-1 block">
                Username or Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="alexchen or alex@connectly.dev"
                  className="w-full text-xs sm:text-sm pl-9 pr-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700 mb-1 block">
                Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs sm:text-sm pl-9 pr-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm shadow-indigo-200 transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In to Connectly'}
            </button>
          </form>
        ) : (
          /* Register Form */
          <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-semibold text-neutral-700 mb-1 block">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Chen"
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-semibold text-neutral-700 mb-1 block">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="alexchen"
                  className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-700 mb-1 block">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@domain.com"
                  className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700 mb-1 block">
                Password (min 6 characters)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700 mb-1 block">
                Bio (optional)
              </label>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Software engineer & design enthusiast"
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white"
                maxLength={200}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account'}
            </button>
          </form>
        )}

        {/* Quick Demo Login Shortcut for Evaluation */}
        <div className="pt-4 border-t border-neutral-100 flex flex-col gap-2">
          <p className="text-[11px] font-semibold text-neutral-500 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Instant Demo Logins (CodeAlpha Testing)</span>
          </p>
          <div className="flex flex-col gap-1.5">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.username}
                type="button"
                onClick={() => handleQuickLogin(acc.username)}
                disabled={submitting}
                className="flex items-center justify-between p-2 rounded-xl bg-neutral-50 hover:bg-indigo-50 border border-neutral-200 hover:border-indigo-200 text-left transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <img
                    src={acc.avatar}
                    alt={acc.name}
                    className="w-6 h-6 rounded-full object-cover border border-neutral-200"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <span className="text-xs font-semibold text-neutral-900 group-hover:text-indigo-600">
                      {acc.name}
                    </span>
                    <span className="text-[11px] text-neutral-400 ml-1.5">@{acc.username}</span>
                  </div>
                </div>
                <span className="text-[10px] text-neutral-400 group-hover:text-indigo-600 font-medium">
                  Login &rarr;
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
