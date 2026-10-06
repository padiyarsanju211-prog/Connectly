import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { config } from './server/config.js';
import { connectDatabase } from './server/db.js';
import { seedDatabase } from './server/seed.js';
import authRoutes from './server/routes/authRoutes.js';
import userRoutes from './server/routes/userRoutes.js';
import postRoutes from './server/routes/postRoutes.js';
import commentRoutes from './server/routes/commentRoutes.js';
import statsRoutes from './server/routes/statsRoutes.js';
import { errorHandler } from './server/middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();

  // Basic middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Connect Database & Run Seed
  try {
    await connectDatabase();
    await seedDatabase(false);
  } catch (err) {
    console.error('[Connectly] Database initialization error:', err);
  }

  // REST API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/posts', postRoutes);
  app.use('/api/posts/:postId/comments', commentRoutes);
  app.use('/api/status', statsRoutes);

  // Serve static assets directory
  const assetsDir = path.resolve(__dirname, 'src/assets');
  if (fs.existsSync(assetsDir)) {
    app.use('/src/assets', express.static(assetsDir));
  }

  // Error handling middleware for API
  app.use('/api', errorHandler);

  const isProduction = process.env.NODE_ENV === 'production';
  const port = config.port;

  if (!isProduction) {
    // Development mode: Mount Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
    console.log('[Connectly] Vite middleware attached for hot development');
  } else {
    // Production mode: Serve built client assets
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[Connectly] Server running at http://0.0.0.0:${port}`);
  });
}

startServer().catch(err => {
  console.error('[Connectly] Fatal server startup error:', err);
  process.exit(1);
});
