import React, { useState } from 'react';
import { api } from '../api/client.js';
import { Post } from '../types/index.js';
import { X, Loader2, Image } from 'lucide-react';

interface EditPostModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
  onPostUpdated: (updatedPost: Post) => void;
}

export const EditPostModal: React.FC<EditPostModalProps> = ({
  post,
  isOpen,
  onClose,
  onPostUpdated,
}) => {
  if (!isOpen || !post) return null;

  const [content, setContent] = useState(post.content);
  const [mediaUrl, setMediaUrl] = useState(post.mediaUrl || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Content cannot be empty');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await api.posts.update(post._id, {
        content: content.trim(),
        mediaUrl: mediaUrl.trim() || undefined,
      });
      if (res.success && res.post) {
        onPostUpdated(res.post);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update post');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative bg-white rounded-2xl border border-neutral-200 shadow-xl w-full max-w-lg p-5 z-10 flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <h3 className="text-base font-bold text-neutral-900">Edit Post</h3>
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
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="w-full text-sm text-neutral-800 border border-neutral-200 rounded-xl p-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none transition-all"
            maxLength={2000}
            autoFocus
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
              <Image className="w-3.5 h-3.5 text-neutral-400" />
              <span>Image URL (optional)</span>
            </label>
            <input
              type="url"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="text-xs bg-white border border-neutral-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
            <span className="text-xs text-neutral-400 tabular-nums">
              {content.length}/2000
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !content.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
