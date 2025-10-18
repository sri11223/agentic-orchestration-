import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { UserModel, IUser } from '../models/user.model';
import { authService } from '../services/auth.service';
import { rateLimit } from '../middleware/rate-limit';

const router = Router();

// Rate limiting for auth endpoints - relaxed for testing
const authRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 attempts per window (relaxed for testing)
  keyPrefix: 'auth:'
});

/**
 * Register new user
 */
router.post('/register', 
  authRateLimit,
  [
    body('username')
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be between 3 and 30 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('firstName')
      .trim()
      .isLength({ min: 2 })
      .withMessage('First name is required'),
    body('lastName')
      .trim()
      .isLength({ min: 2 })
      .withMessage('Last name is required')
  ],
  async (req: Request, res: Response) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { username, email, password, firstName, lastName } = req.body;

      // Check if user already exists
      console.log(`Registration attempt: username="${username}", email="${email}"`);
      
      const existingUser = await UserModel.findOne({
        $or: [{ email }, { username }]
      });

      if (existingUser) {
        console.log(`Conflict found: existing user has username="${existingUser.username}", email="${existingUser.email}"`);
        return res.status(409).json({
          error: 'User already exists',
          message: 'Email or username is already taken',
          conflictField: existingUser.email === email ? 'email' : 'username'
        });
      }

      // Create new user
      const user = new UserModel({
        username,
        email,
        password,
        firstName,
        lastName
      });

      await user.save();

      // Generate tokens
      const tokens = authService.generateTokens(user);
      
      // Store refresh token
      user.refreshTokens.push(tokens.refreshToken);
      await user.save();

      // Cache user session
      await authService.cacheUserSession((user._id as any).toString(), {
        userId: user._id,
        email: user.email,
        role: user.role
      });

      res.status(201).json({
        message: 'User registered successfully',
        user: user.toJSON(),
        tokens
      });

    } catch (error: any) {
      console.error('=== REGISTRATION ERROR DEBUG ===');
      console.error('Error name:', error?.name);
      console.error('Error code:', error?.code);
      console.error('Error message:', error?.message);
      console.error('Full error:', error);
      console.error('================================');
      
      // Handle specific MongoDB errors
      if (error?.name === 'ValidationError') {
        return res.status(400).json({
          error: 'Validation Error',
          message: error.message,
          details: Object.values(error.errors).map((err: any) => ({
            field: err.path,
            message: err.message
          }))
        });
      }
      
      if (error?.code === 11000) {
        return res.status(409).json({
          error: 'Duplicate Error',
          message: 'User already exists',
          debug: {
            keyPattern: error.keyPattern,
            keyValue: error.keyValue,
            index: error.index
          }
        });
      }
      
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to register user',
        details: error?.message || 'Unknown error'
      });
    }
  }
);

/**
 * Login user
 */
router.post('/login',
  authRateLimit,
  [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { email, password } = req.body;

      // Find user
      const user = await UserModel.findOne({ email, isActive: true });
      if (!user) {
        return res.status(401).json({
          error: 'Authentication failed',
          message: 'Invalid credentials'
        });
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          error: 'Authentication failed',
          message: 'Invalid credentials'
        });
      }

      // Generate tokens
      const tokens = authService.generateTokens(user);
      
      // Store refresh token
      user.refreshTokens.push(tokens.refreshToken);
      user.lastLogin = new Date();
      await user.save();

      // Cache user session
      await authService.cacheUserSession((user._id as any).toString(), {
        userId: user._id,
        email: user.email,
        role: user.role
      });

      res.json({
        message: 'Login successful',
        user: user.toJSON(),
        tokens
      });

    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to login'
      });
    }
  }
);

/**
 * Refresh access token
 */
router.post('/refresh',
  async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json({
          error: 'Refresh token required'
        });
      }

      // Verify refresh token
      const payload = authService.verifyRefreshToken(refreshToken);
      if (!payload) {
        return res.status(401).json({
          error: 'Invalid refresh token'
        });
      }

      // Find user and check if refresh token exists
      const user = await UserModel.findById(payload.userId);
      if (!user || !user.refreshTokens.includes(refreshToken)) {
        return res.status(401).json({
          error: 'Invalid refresh token'
        });
      }

      // Generate new tokens
      const tokens = authService.generateTokens(user);
      
      // Replace old refresh token
      user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);
      user.refreshTokens.push(tokens.refreshToken);
      await user.save();

      res.json({
        tokens
      });

    } catch (error: any) {
      console.error('Token refresh error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to refresh token'
      });
    }
  }
);

/**
 * Logout user
 */
router.post('/logout',
  async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;
      const authHeader = req.headers.authorization;
      const accessToken = authService.extractTokenFromHeader(authHeader);

      if (accessToken) {
        // Blacklist access token
        await authService.blacklistToken(accessToken);
        
        // Get user ID from token
        const payload = authService.verifyAccessToken(accessToken);
        if (payload) {
          // Clear user session cache
          await authService.clearUserSession(payload.userId);
          
          // Remove refresh token if provided
          if (refreshToken) {
            const user = await UserModel.findById(payload.userId);
            if (user) {
              user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);
              await user.save();
            }
          }
        }
      }

      res.json({
        message: 'Logout successful'
      });

    } catch (error: any) {
      console.error('Logout error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to logout'
      });
    }
  }
);

export default router;