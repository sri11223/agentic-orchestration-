import { Request, Response, NextFunction } from 'express';
import { UserModel } from '../models/user.model';
import { authService } from '../services/auth.service';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

/**
 * JWT Authentication middleware
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authService.extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No token provided'
      });
    }

    // Check if token is blacklisted
    const isBlacklisted = await authService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      return res.status(401).json({
        error: 'Token invalid',
        message: 'Token has been revoked'
      });
    }

    // Verify token
    const payload = authService.verifyAccessToken(token);
    if (!payload) {
      return res.status(401).json({
        error: 'Token invalid',
        message: 'Invalid or expired token'
      });
    }

    // Check cached session first
    let user = await authService.getCachedUserSession(payload.userId);
    
    if (!user) {
      // If not in cache, fetch from database
      user = await UserModel.findById(payload.userId).select('-password -refreshTokens');
      if (!user || !user.isActive) {
        return res.status(401).json({
          error: 'User not found',
          message: 'User does not exist or is inactive'
        });
      }
      
      // Cache user session
      await authService.cacheUserSession(payload.userId, user);
    }

    req.user = user;
    next();

  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      error: 'Authentication error',
      message: 'Failed to authenticate user'
    });
  }
};

/**
 * API Key authentication middleware
 */
export const authenticateApiKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      return res.status(401).json({
        error: 'API key required',
        message: 'No API key provided'
      });
    }

    // Find user with this API key
    const user = await UserModel.findOne({
      'apiKeys.key': apiKey,
      'apiKeys.isActive': true,
      isActive: true
    }).select('-password -refreshTokens');

    if (!user) {
      return res.status(401).json({
        error: 'Invalid API key',
        message: 'API key not found or inactive'
      });
    }

    // Update last used timestamp
    const apiKeyEntry = user.apiKeys.find(key => key.key === apiKey);
    if (apiKeyEntry) {
      apiKeyEntry.lastUsed = new Date();
      await user.save();
    }

    req.user = user;
    next();

  } catch (error) {
    console.error('API key authentication error:', error);
    return res.status(500).json({
      error: 'Authentication error',
      message: 'Failed to authenticate API key'
    });
  }
};

/**
 * Role-based authorization middleware
 */
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User not authenticated'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

/**
 * Optional authentication middleware (for public routes that can benefit from user context)
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authService.extractTokenFromHeader(authHeader);

    if (token) {
      const isBlacklisted = await authService.isTokenBlacklisted(token);
      if (!isBlacklisted) {
        const payload = authService.verifyAccessToken(token);
        if (payload) {
          const user = await UserModel.findById(payload.userId).select('-password -refreshTokens');
          if (user && user.isActive) {
            req.user = user;
          }
        }
      }
    }

    next();
  } catch (error) {
    // Continue without authentication if there's an error
    next();
  }
};

/**
 * Resource ownership middleware (check if user owns the resource)
 */
export const checkOwnership = (resourceIdParam: string = 'id') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required'
        });
      }

      const resourceId = req.params[resourceIdParam];
      
      // Admin can access all resources
      if (req.user.role === 'admin') {
        return next();
      }

      // For workflow resources, check ownership
      if (req.route.path.includes('workflow')) {
        const { WorkflowModel } = await import('../models/workflow.model');
        const workflow = await WorkflowModel.findById(resourceId);
        
        if (!workflow) {
          return res.status(404).json({
            error: 'Resource not found'
          });
        }

        const isOwner = workflow.permissions.owners.includes(req.user._id.toString());
        const isEditor = workflow.permissions.editors.includes(req.user._id.toString());
        const isViewer = workflow.permissions.viewers.includes(req.user._id.toString());

        if (!isOwner && !isEditor && !isViewer) {
          return res.status(403).json({
            error: 'Access denied',
            message: 'You do not have permission to access this resource'
          });
        }
      }

      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      return res.status(500).json({
        error: 'Authorization error'
      });
    }
  };
};