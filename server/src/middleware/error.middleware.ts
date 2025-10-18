import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Custom error classes
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND_ERROR');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, 'CONFLICT_ERROR');
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
  }
}

// Error handling middleware
export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error
  console.error('Error occurred:', {
    name: error.name,
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Handle specific error types
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: error.name,
      message: error.message,
      code: error.code,
      timestamp: new Date().toISOString()
    });
  }

  // Handle Mongoose validation errors
  if (error.name === 'ValidationError') {
    const mongooseError = error as any;
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid input data',
      details: Object.values(mongooseError.errors).map((err: any) => ({
        field: err.path,
        message: err.message,
        value: err.value
      })),
      timestamp: new Date().toISOString()
    });
  }

  // Handle Mongoose duplicate key error
  if ((error as any).code === 11000) {
    const mongooseError = error as any;
    const field = Object.keys(mongooseError.keyValue)[0];
    const value = mongooseError.keyValue[field];
    
    return res.status(409).json({
      error: 'Duplicate Error',
      message: `Resource with ${field} '${value}' already exists`,
      field,
      value,
      timestamp: new Date().toISOString()
    });
  }

  // Handle Mongoose cast errors
  if (error.name === 'CastError') {
    const mongooseError = error as any;
    return res.status(400).json({
      error: 'Invalid ID',
      message: `Invalid ${mongooseError.path}: ${mongooseError.value}`,
      timestamp: new Date().toISOString()
    });
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Authentication Error',
      message: 'Invalid token',
      timestamp: new Date().toISOString()
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Authentication Error',
      message: 'Token expired',
      timestamp: new Date().toISOString()
    });
  }

  // Handle multer errors (file upload)
  if (error.name === 'MulterError') {
    const multerError = error as any;
    return res.status(400).json({
      error: 'File Upload Error',
      message: multerError.message,
      code: multerError.code,
      timestamp: new Date().toISOString()
    });
  }

  // Default error response
  const statusCode = (error as any).statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Something went wrong' 
    : error.message;

  res.status(statusCode).json({
    error: 'Internal Server Error',
    message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
  });
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
};