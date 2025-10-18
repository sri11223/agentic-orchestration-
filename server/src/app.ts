import dotenv from 'dotenv';
dotenv.config(); // Load environment variables first

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { connectDatabase } from './database/connection';

// Import routes
import authRoutes from './routes/auth.routes';
import workflowRoutes from './routes/workflow.routes';
import executionRoutes from './routes/execution.routes';
import executionControlRoutes from './routes/execution-control.routes';
import dashboardRoutes from './routes/dashboard.routes';
import monitoringRoutes from './routes/monitoring.routes';
import adminRoutes from './routes/admin.routes';
import webhookRoutes from './routes/webhook.routes';

// Import middleware
import { rateLimit } from './middleware/rate-limit';
import { performanceMiddleware } from './services/performance-monitor.service';
import { securityOptimizationService } from './services/security-optimization.service';

const app = express();
const PORT = process.env.PORT || 3000;

// Advanced security middleware stack
const securityMiddleware = securityOptimizationService.getSecurityMiddleware();
securityMiddleware.forEach(middleware => app.use(middleware));

// Legacy security middleware (remove if conflicts)
/*
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
*/

// CORS configuration (remove if conflicts)
/*
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
}));
*/

// Request parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Performance monitoring middleware
app.use(performanceMiddleware());

// Compression middleware (remove if conflicts)
/*
app.use(compression());
*/

// Logging middleware
app.use(morgan('combined'));

// Global rate limiting (remove if conflicts)
/*
const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per window
  keyPrefix: 'global:'
});
app.use(globalRateLimit);
*/

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/executions', executionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api', executionControlRoutes);

// 404 handler - catch all unmatched routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', error);

  // Mongoose validation error
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: error.message,
      details: Object.values(error.errors).map((err: any) => ({
        field: err.path,
        message: err.message
      }))
    });
  }

  // Mongoose duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return res.status(409).json({
      error: 'Duplicate Error',
      message: `${field} already exists`,
      field
    });
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Authentication Error',
      message: 'Invalid token'
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Authentication Error',
      message: 'Token expired'
    });
  }

  // Default error
  res.status(error.statusCode || 500).json({
    error: error.name || 'Internal Server Error',
    message: error.message || 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown handler
const gracefulShutdown = (signal: string) => {
  console.log(`Received ${signal}. Starting graceful shutdown...`);
  
  const server = app.listen(PORT);
  
  server.close(() => {
    console.log('HTTP server closed.');
    
    // Close database connection
    process.exit(0);
  });

  // Force close after 30 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

// Handle process termination
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default app;