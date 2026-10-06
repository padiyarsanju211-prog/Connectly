import bcrypt from 'bcryptjs';
import { dataStore } from './db.js';
import { User } from './models/User.js';
import { Post } from './models/Post.js';
import { Comment } from './models/Comment.js';
import { Follow } from './models/Follow.js';
import { Like } from './models/Like.js';

export async function seedDatabase(force: boolean = false): Promise<void> {
  const isMongo = dataStore.isMongo();

  if (isMongo) {
    const existingCount = await User.countDocuments();
    if (existingCount > 0 && !force) {
      console.log(`[Connectly Seed] MongoDB already has ${existingCount} users. Skipping auto-seed.`);
      return;
    }
    if (force) {
      console.log('[Connectly Seed] Force-clearing MongoDB collections...');
      await User.deleteMany({});
      await Post.deleteMany({});
      await Comment.deleteMany({});
      await Follow.deleteMany({});
      await Like.deleteMany({});
    }
  } else {
    const memDb = dataStore.getMemoryDb();
    if (memDb.users.length > 0 && !force) {
      console.log(`[Connectly Seed] Persistent DB already has ${memDb.users.length} users. Skipping auto-seed.`);
      return;
    }
  }

  console.log('[Connectly Seed] Seeding initial Connectly dataset...');

  // Default hashed password for 'password123'
  const hashedPassword = await bcrypt.hash('password123', 10);

  const initialUsers = [
    {
      _id: 'usr_alexchen_01',
      name: 'Alex Chen',
      username: 'alexchen',
      email: 'alex@connectly.dev',
      password: hashedPassword,
      avatar: '/src/assets/images/avatar_alex_chen_1791296489008.jpg',
      bio: 'Product Designer & UI Architect. Building interfaces for humans. Fan of minimalist typography and smooth UX.',
      location: 'San Francisco, CA',
      website: 'https://alexchen.design',
      coverImage: '/src/assets/images/community_workspace_1791296557615.jpg',
      followersCount: 3,
      followingCount: 2,
      postsCount: 2,
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: 'usr_sarah_02',
      name: 'Sarah Jenkins',
      username: 'sarah_j',
      email: 'sarah@connectly.dev',
      password: hashedPassword,
      avatar: '/src/assets/images/avatar_sarah_jenkins_1791296506366.jpg',
      bio: 'Creative Director @ StudioCraft. Sharing design systems, product strategy, and creative inspiration.',
      location: 'New York, NY',
      website: 'https://studiocraft.co',
      coverImage: '/src/assets/images/community_workspace_1791296557615.jpg',
      followersCount: 2,
      followingCount: 3,
      postsCount: 2,
      createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: 'usr_david_03',
      name: 'David Kim',
      username: 'davidkim',
      email: 'david@connectly.dev',
      password: hashedPassword,
      avatar: '/src/assets/images/avatar_david_kim_1791296522717.jpg',
      bio: 'Full-stack engineer & open-source contributor. React 19, TypeScript, Express, and distributed databases.',
      location: 'Seattle, WA',
      website: 'https://davidkim.dev',
      coverImage: '/src/assets/images/community_workspace_1791296557615.jpg',
      followersCount: 2,
      followingCount: 2,
      postsCount: 2,
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: 'usr_elena_04',
      name: 'Elena Rostova',
      username: 'elena_r',
      email: 'elena@connectly.dev',
      password: hashedPassword,
      avatar: '/src/assets/images/avatar_elena_rostova_1791296544028.jpg',
      bio: 'Senior Product Manager. Passionate about developer productivity, design thinking, and engineering culture.',
      location: 'Berlin, Germany',
      website: 'https://elenarostova.io',
      coverImage: '/src/assets/images/community_workspace_1791296557615.jpg',
      followersCount: 2,
      followingCount: 2,
      postsCount: 1,
      createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const initialPosts = [
    {
      _id: 'post_01',
      author: 'usr_alexchen_01',
      content: 'Morning sprint in the workspace! We just finalized the architecture for Connectly Task 2. Clean separation between Express REST routes, Mongoose relational schemas, and responsive UI. How is everyone structuring their state management this week?',
      mediaUrl: '/src/assets/images/community_workspace_1791296557615.jpg',
      tags: ['fullstack', 'architecture', 'typescript'],
      likesCount: 3,
      commentsCount: 2,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: 'post_02',
      author: 'usr_sarah_02',
      content: 'Typography and micro-interactions elevate good software into memorable software. Remember: 60% dominant neutral background, 30% structural surfaces, and 10% high-intent accent colors. Never rely on color alone to convey crucial state.',
      mediaUrl: '',
      tags: ['design', 'ui', 'principles'],
      likesCount: 4,
      commentsCount: 2,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 9).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: 'post_03',
      author: 'usr_david_03',
      content: 'Pro tip for Mongoose indexes: Always create compound unique indexes on relationship tables like Follow ({ follower: 1, following: 1 }) and Like ({ user: 1, post: 1 }) to guarantee zero duplicates even under concurrent network requests.',
      mediaUrl: '',
      tags: ['mongodb', 'backend', 'performance'],
      likesCount: 3,
      commentsCount: 1,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: 'post_04',
      author: 'usr_elena_04',
      content: 'Great product development is about velocity and feedback loops. When your frontend and backend adhere to clean typed contracts, shipping features feels effortless. Kudos to the CodeAlpha cohort!',
      mediaUrl: '',
      tags: ['product', 'engineering', 'leadership'],
      likesCount: 2,
      commentsCount: 1,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: 'post_05',
      author: 'usr_alexchen_01',
      content: 'Shipped dark-mode optical compensation for text legibility. When displaying light type on deep graphite backdrops, slightly increasing character tracking and weight preserves visual balance.',
      mediaUrl: '',
      tags: ['css', 'frontend', 'craft'],
      likesCount: 2,
      commentsCount: 0,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 40).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: 'post_06',
      author: 'usr_david_03',
      content: 'JWT stateless authentication with bcrypt password hashing is rock solid for modern REST APIs. Tokens contain standard user payloads, signed with HMAC-SHA256.',
      mediaUrl: '',
      tags: ['security', 'auth', 'jwt'],
      likesCount: 3,
      commentsCount: 0,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const initialComments = [
    {
      _id: 'comm_01',
      post: 'post_01',
      author: 'usr_sarah_02',
      content: 'The workspace looks serene! Excited to test the real-time like and follow updates.',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: 'comm_02',
      post: 'post_01',
      author: 'usr_david_03',
      content: 'Strongly agree with the clean separation. Makes writing API integration tests so much easier.',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: 'comm_03',
      post: 'post_02',
      author: 'usr_alexchen_01',
      content: '100% on the 60-30-10 rule. Visual hierarchy prevents visual fatigue for active users.',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: 'comm_04',
      post: 'post_02',
      author: 'usr_elena_04',
      content: 'Pinning this for our team UI guild meeting tomorrow!',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: 'comm_05',
      post: 'post_03',
      author: 'usr_alexchen_01',
      content: 'Crucial insight on compound indexes. Saves from nasty race conditions.',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 16).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: 'comm_06',
      post: 'post_04',
      author: 'usr_sarah_02',
      content: 'Well said Elena. High velocity + high quality is the sweet spot.',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const initialFollows = [
    { _id: 'fol_01', follower: 'usr_alexchen_01', following: 'usr_sarah_02', createdAt: new Date().toISOString() },
    { _id: 'fol_02', follower: 'usr_alexchen_01', following: 'usr_david_03', createdAt: new Date().toISOString() },
    { _id: 'fol_03', follower: 'usr_sarah_02', following: 'usr_alexchen_01', createdAt: new Date().toISOString() },
    { _id: 'fol_04', follower: 'usr_sarah_02', following: 'usr_david_03', createdAt: new Date().toISOString() },
    { _id: 'fol_05', follower: 'usr_sarah_02', following: 'usr_elena_04', createdAt: new Date().toISOString() },
    { _id: 'fol_06', follower: 'usr_david_03', following: 'usr_alexchen_01', createdAt: new Date().toISOString() },
    { _id: 'fol_07', follower: 'usr_david_03', following: 'usr_sarah_02', createdAt: new Date().toISOString() },
    { _id: 'fol_08', follower: 'usr_elena_04', following: 'usr_alexchen_01', createdAt: new Date().toISOString() },
    { _id: 'fol_09', follower: 'usr_elena_04', following: 'usr_sarah_02', createdAt: new Date().toISOString() },
  ];

  const initialLikes = [
    { _id: 'like_01', user: 'usr_sarah_02', post: 'post_01', createdAt: new Date().toISOString() },
    { _id: 'like_02', user: 'usr_david_03', post: 'post_01', createdAt: new Date().toISOString() },
    { _id: 'like_03', user: 'usr_elena_04', post: 'post_01', createdAt: new Date().toISOString() },
    { _id: 'like_04', user: 'usr_alexchen_01', post: 'post_02', createdAt: new Date().toISOString() },
    { _id: 'like_05', user: 'usr_david_03', post: 'post_02', createdAt: new Date().toISOString() },
    { _id: 'like_06', user: 'usr_elena_04', post: 'post_02', createdAt: new Date().toISOString() },
    { _id: 'like_07', user: 'usr_alexchen_01', post: 'post_03', createdAt: new Date().toISOString() },
    { _id: 'like_08', user: 'usr_sarah_02', post: 'post_03', createdAt: new Date().toISOString() },
    { _id: 'like_09', user: 'usr_elena_04', post: 'post_03', createdAt: new Date().toISOString() },
    { _id: 'like_10', user: 'usr_alexchen_01', post: 'post_04', createdAt: new Date().toISOString() },
    { _id: 'like_11', user: 'usr_sarah_02', post: 'post_04', createdAt: new Date().toISOString() },
    { _id: 'like_12', user: 'usr_sarah_02', post: 'post_05', createdAt: new Date().toISOString() },
    { _id: 'like_13', user: 'usr_david_03', post: 'post_05', createdAt: new Date().toISOString() },
    { _id: 'like_14', user: 'usr_alexchen_01', post: 'post_06', createdAt: new Date().toISOString() },
    { _id: 'like_15', user: 'usr_sarah_02', post: 'post_06', createdAt: new Date().toISOString() },
    { _id: 'like_16', user: 'usr_elena_04', post: 'post_06', createdAt: new Date().toISOString() },
  ];

  if (isMongo) {
    for (const u of initialUsers) {
      await User.create(u);
    }
    for (const p of initialPosts) {
      await Post.create(p);
    }
    for (const c of initialComments) {
      await Comment.create(c);
    }
    for (const f of initialFollows) {
      await Follow.create(f);
    }
    for (const l of initialLikes) {
      await Like.create(l);
    }
  } else {
    dataStore.setMemoryDb({
      users: initialUsers,
      posts: initialPosts,
      comments: initialComments,
      follows: initialFollows,
      likes: initialLikes,
    });
  }

  console.log('[Connectly Seed] Initial data successfully loaded!');
}
