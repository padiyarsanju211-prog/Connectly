import express, { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { dataStore } from '../db.js';
import { seedDatabase } from '../seed.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

function generateToken(payload: { id: string; username: string; email: string }): string {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  } as jwt.SignOptions);
}

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { name, username, email, password, avatar, bio } = req.body;

    if (!name || !username || !email || !password) {
      res.status(400).json({
        success: false,
        message: 'Name, username, email, and password are required.',
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.',
      });
      return;
    }

    const cleanUsername = username.toLowerCase().trim();
    const cleanEmail = email.toLowerCase().trim();

    // Check if username already exists
    const existingUsername = await dataStore.findUserByUsername(cleanUsername);
    if (existingUsername) {
      res.status(409).json({
        success: false,
        message: 'Username is already taken. Please choose another.',
      });
      return;
    }

    // Check if email already exists
    const existingEmail = await dataStore.findUserByEmail(cleanEmail);
    if (existingEmail) {
      res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
      return;
    }

    const newUser = await dataStore.createUser({
      name,
      username: cleanUsername,
      email: cleanEmail,
      password,
      avatar,
      bio,
    });

    const token = generateToken({
      id: newUser._id.toString(),
      username: newUser.username,
      email: newUser.email,
    });

    res.status(201).json({
      success: true,
      message: 'Account registered successfully!',
      token,
      user: newUser,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { identifier, password } = req.body; // identifier can be username or email

    if (!identifier || !password) {
      res.status(400).json({
        success: false,
        message: 'Username/Email and password are required.',
      });
      return;
    }

    const cleanIdent = identifier.trim().toLowerCase();

    // Find by email or username
    let user = await dataStore.findUserByEmail(cleanIdent);
    if (!user) {
      user = await dataStore.findUserByUsername(cleanIdent);
      if (user && dataStore.isMongo()) {
        user = await dataStore.findUserByIdWithPassword(user._id.toString());
      }
    }

    if (!user || !user.password) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your username/email and password.',
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your username/email and password.',
      });
      return;
    }

    const safeUser = { ...user };
    delete safeUser.password;

    const token = generateToken({
      id: safeUser._id.toString(),
      username: safeUser.username,
      email: safeUser.email,
    });

    res.json({
      success: true,
      message: 'Logged in successfully!',
      token,
      user: safeUser,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;
    const user = await dataStore.findUserById(userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User session not found.',
      });
      return;
    }

    const safeUser = { ...user };
    delete (safeUser as any).password;

    res.json({
      success: true,
      user: safeUser,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/seed (dev/test helper)
router.post('/seed', async (req, res, next) => {
  try {
    await seedDatabase(true);
    res.json({
      success: true,
      message: 'Database reseeded successfully with demo accounts and posts!',
    });
  } catch (err) {
    next(err);
  }
});

export default router;
