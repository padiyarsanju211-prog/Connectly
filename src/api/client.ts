import { User, Post, Comment, DbStatus } from '../types/index.js';

const TOKEN_KEY = 'connectly_auth_token';

export const storage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  removeToken: () => localStorage.removeItem(TOKEN_KEY),
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = storage.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Auth
  auth: {
    async register(payload: { name: string; username: string; email: string; password: string; avatar?: string; bio?: string }) {
      return request<{ success: boolean; token: string; user: User; message: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    async login(payload: { identifier: string; password: string }) {
      return request<{ success: boolean; token: string; user: User; message: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    async getMe() {
      return request<{ success: boolean; user: User }>('/api/auth/me');
    },
    async reseed() {
      return request<{ success: boolean; message: string }>('/api/auth/seed', {
        method: 'POST',
      });
    },
  },

  // Users
  users: {
    async getProfile(username: string) {
      return request<{ success: boolean; user: User; isFollowing: boolean; isOwnProfile: boolean }>(`/api/users/profile/${username}`);
    },
    async updateProfile(payload: Partial<User>) {
      return request<{ success: boolean; user: User; message: string }>('/api/users/profile', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    },
    async search(query: string) {
      return request<{ success: boolean; users: User[] }>(`/api/users/search?q=${encodeURIComponent(query)}`);
    },
    async getSuggested() {
      return request<{ success: boolean; users: User[] }>('/api/users/suggested');
    },
    async getFollowers(username: string) {
      return request<{ success: boolean; followers: User[] }>(`/api/users/${username}/followers`);
    },
    async getFollowing(username: string) {
      return request<{ success: boolean; following: User[] }>(`/api/users/${username}/following`);
    },
    async toggleFollow(userId: string) {
      return request<{ success: boolean; following: boolean; followersCount: number; message: string }>(`/api/users/${userId}/follow`, {
        method: 'POST',
      });
    },
  },

  // Posts
  posts: {
    async getFeed(feed: 'all' | 'following' = 'all', tag?: string) {
      const params = new URLSearchParams({ feed });
      if (tag) params.set('tag', tag);
      return request<{ success: boolean; posts: Post[]; hasMore: boolean }>(`/api/posts?${params.toString()}`);
    },
    async getUserPosts(username: string) {
      return request<{ success: boolean; posts: Post[] }>(`/api/users/${username}/posts`);
    },
    async getById(id: string) {
      return request<{ success: boolean; post: Post }>(`/api/posts/${id}`);
    },
    async create(payload: { content: string; mediaUrl?: string; tags?: string[] }) {
      return request<{ success: boolean; post: Post; message: string }>('/api/posts', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    async update(id: string, payload: { content: string; mediaUrl?: string }) {
      return request<{ success: boolean; post: Post; message: string }>(`/api/posts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    },
    async delete(id: string) {
      return request<{ success: boolean; message: string }>(`/api/posts/${id}`, {
        method: 'DELETE',
      });
    },
    async toggleLike(id: string) {
      return request<{ success: boolean; liked: boolean; likesCount: number; message: string }>(`/api/posts/${id}/like`, {
        method: 'POST',
      });
    },
  },

  // Comments
  comments: {
    async getByPost(postId: string) {
      return request<{ success: boolean; comments: Comment[] }>(`/api/posts/${postId}/comments`);
    },
    async create(postId: string, content: string) {
      return request<{ success: boolean; comment: Comment; message: string }>(`/api/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
    },
    async delete(postId: string, commentId: string) {
      return request<{ success: boolean; message: string }>(`/api/posts/${postId}/comments/${commentId}`, {
        method: 'DELETE',
      });
    },
  },

  // System
  system: {
    async getStatus() {
      return request<{ success: boolean; status: DbStatus }>('/api/status');
    },
  },
};
