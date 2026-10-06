import React, { useState } from 'react';
import { api } from '../api/client.js';
import { Post } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';
import { X, Image, Tag, Loader2, Sparkles } from 'lucide-react';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: (post: Post) => void;
}

const PRESET_IMAGES = [
  { label: 'Creative Workspace', url: '/src/assets/images/community_workspace_1791296557615.jpg' },
  { label: 'Studio Showcase', url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Tech Setup', url: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=1200&q=80' },
];

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  onPostCreated,
}) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Please write something before publishing.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const tags = tagsInput
        ? tagsInput.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean)
        : undefined;

      const res = await api.posts.create({
        content: content.trim(),
        mediaUrl: mediaUrl.trim() || undefined,
        tags,
      });

      if (res.success && res.post) {
        onPostCreated(res.post);
        setContent('');
        setMediaUrl('');
        setTagsInput('');
        setShowImageInput(false);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="fixed inset-0"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl border border-neutral-200 shadow-xl w-full max-w-lg p-5 z-10 flex flex-col gap-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <h3 className="text-base font-bold text-neutral-900">Create New Post</h3>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
            aria-label="Close modal"
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
          {/* User preview */}
          {user && (
            <div className="flex items-center gap-2.5">
              <img
                src={user.avatar || '/src/assets/images/avatar_alex_chen_1791296489008.jpg'}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover border border-neutral-200"
                referrerPolicy="no-referrer"
              />
              <span className="text-xs font-semibold text-neutral-900">{user.name}</span>
            </div>
          )}

          {/* Post Content */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's happening in your projects or tech journey?..."
            rows={4}
            className="w-full text-sm text-neutral-800 placeholder:text-neutral-400 border border-neutral-200 rounded-xl p-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none transition-all"
            maxLength={2000}
            autoFocus
          />

          {/* Media URL Input */}
          {showImageInput ? (
            <div className="flex flex-col gap-2 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
                  <Image className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Image URL / Media</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowImageInput(false);
                    setMediaUrl('');
                  }}
                  className="text-[11px] text-neutral-400 hover:text-neutral-600"
                >
                  Remove
                </button>
              </div>

              <input
                type="url"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="text-xs bg-white border border-neutral-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
              />

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] text-neutral-400 font-medium">Quick presets:</span>
                {PRESET_IMAGES.map((preset, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setMediaUrl(preset.url)}
                    className="text-[10px] px-2 py-0.5 bg-white border border-neutral-200 hover:border-indigo-300 rounded font-medium text-neutral-600 hover:text-indigo-600 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {mediaUrl && (
                <div className="mt-1 rounded-lg overflow-hidden max-h-36 border border-neutral-200">
                  <img
                    src={mediaUrl}
                    alt="Preview"
                    className="w-full h-36 object-cover"
                    referrerPolicy="no-referrer"
                    onError={() => setError('Image failed to load from provided URL')}
                  />
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowImageInput(true)}
              className="flex items-center gap-1.5 text-xs text-neutral-600 hover:text-indigo-600 font-medium w-fit transition-colors"
            >
              <Image className="w-4 h-4 text-neutral-400" />
              <span>Attach an image</span>
            </button>
          )}

          {/* Tags */}
          <div className="flex items-center gap-2">
            <Tag className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Tags separated by comma (e.g. typescript, mongodb, react)"
              className="flex-1 text-xs text-neutral-800 placeholder:text-neutral-400 border border-neutral-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
            <span className="text-xs text-neutral-400 tabular-nums">
              {content.length}/2000
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !content.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-sm shadow-indigo-200 transition-colors flex items-center gap-1.5"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Publish Post</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
