import React, { useState } from 'react';
import { User } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';
import { X, Loader2, Camera, Check } from 'lucide-react';

interface ProfileModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated: (updatedUser: User) => void;
}

const AVATAR_OPTIONS = [
  { label: 'Alex', url: '/src/assets/images/avatar_alex_chen_1791296489008.jpg' },
  { label: 'Sarah', url: '/src/assets/images/avatar_sarah_jenkins_1791296506366.jpg' },
  { label: 'David', url: '/src/assets/images/avatar_david_kim_1791296522717.jpg' },
  { label: 'Elena', url: '/src/assets/images/avatar_elena_rostova_1791296544028.jpg' },
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  user,
  isOpen,
  onClose,
  onProfileUpdated,
}) => {
  const { updateProfile } = useAuth();
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio || '');
  const [location, setLocation] = useState(user.location || '');
  const [website, setWebsite] = useState(user.website || '');
  const [avatar, setAvatar] = useState(user.avatar || '');
  const [customAvatar, setCustomAvatar] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name cannot be empty');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const chosenAvatar = customAvatar.trim() || avatar;
      const updated = await updateProfile({
        name: name.trim(),
        bio: bio.trim(),
        location: location.trim(),
        website: website.trim(),
        avatar: chosenAvatar,
      });
      onProfileUpdated(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative bg-white rounded-2xl border border-neutral-200 shadow-xl w-full max-w-md p-5 z-10 flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <h3 className="text-base font-bold text-neutral-900">Edit Profile</h3>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Avatar Selection */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-neutral-700">Profile Photo</label>
            <div className="flex items-center gap-3">
              {AVATAR_OPTIONS.map((opt, i) => {
                const isSelected = (customAvatar ? '' : avatar) === opt.url;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setAvatar(opt.url);
                      setCustomAvatar('');
                    }}
                    className={`relative w-12 h-12 rounded-full overflow-hidden border-2 transition-transform ${
                      isSelected
                        ? 'border-indigo-600 scale-105 ring-2 ring-indigo-200'
                        : 'border-neutral-200 hover:border-neutral-400'
                    }`}
                  >
                    <img
                      src={opt.url}
                      alt={opt.label}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-indigo-600/30 flex items-center justify-center text-white">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-1">
              <input
                type="url"
                value={customAvatar}
                onChange={(e) => setCustomAvatar(e.target.value)}
                placeholder="Or paste custom image URL..."
                className="w-full text-xs bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-neutral-700">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-xs sm:text-sm border border-neutral-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
              maxLength={50}
              required
            />
          </div>

          {/* Bio */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-neutral-700">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={2}
              className="text-xs sm:text-sm border border-neutral-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 resize-none"
              maxLength={200}
              placeholder="Tell others about what you do or what you're passionate about..."
            />
            <span className="text-[10px] text-neutral-400 text-right tabular-nums">
              {bio.length}/200
            </span>
          </div>

          {/* Location & Website in 2 columns */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-neutral-700">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. San Francisco, CA"
                className="text-xs border border-neutral-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                maxLength={100}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-neutral-700">Website</label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://..."
                className="text-xs border border-neutral-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                maxLength={100}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save Profile</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
