import { createLogger, transports, format } from 'winston';
import path from 'path';

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

// Create the logger
const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  levels,
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    format.errors({ stack: true }),
    format.colorize({ all: true }),
    format.printf(({ timestamp, level, message, stack, ...meta }) => {
      let log = `${timestamp} [${level}]: ${message}`;
      
      if (stack) {
        log += `\n${stack}`;
      }
      
      if (Object.keys(meta).length > 0) {
        log += `\n${JSON.stringify(meta, null, 2)}`;
      }
      
      return log;
    })
  ),
  transports: [
    // Console transport
    new transports.Console({
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
    }),
    
    // File transport for errors
    new transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: format.combine(
        format.uncolorize(),
        format.json()
      )
    }),
    
    // File transport for all logs
    new transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 10,
      format: format.combine(
        format.uncolorize(),
        format.json()
      )
    })
  ],
  
  // Handle uncaught exceptions
  exceptionHandlers: [
    new transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
      format: format.combine(
        format.uncolorize(),
        format.json()
      )
    })
  ],
  
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new transports.File({
      filename: path.join(logsDir, 'rejections.log'),
      format: format.combine(
        format.uncolorize(),
        format.json()
      )
    })
  ]
});

// Add colors to winston
import winston from 'winston';
winston.addColors(colors);

// Create a stream object for morgan
const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  }
};

// Utility functions
export const logError = (error: Error, context?: any) => {
  logger.error(error.message, {
    stack: error.stack,
    context,
    timestamp: new Date().toISOString()
  });
};

export const logInfo = (message: string, meta?: any) => {
  logger.info(message, meta);
};

export const logWarn = (message: string, meta?: any) => {
  logger.warn(message, meta);
};

export const logDebug = (message: string, meta?: any) => {
  logger.debug(message, meta);
};

export const logHttp = (message: string, meta?: any) => {
  logger.http(message, meta);
};

// Log request details
export const logRequest = (req: any, res: any, responseTime?: number) => {
  logger.http('HTTP Request', {
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    responseTime: responseTime ? `${responseTime}ms` : undefined,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.id
  });
};

// Log database operations
export const logDatabase = (operation: string, collection: string, query?: any, result?: any) => {
  logger.debug('Database Operation', {
    operation,
    collection,
    query,
    result: result ? { count: Array.isArray(result) ? result.length : 1 } : undefined
  });
};

// Log authentication events
export const logAuth = (event: string, userId?: string, details?: any) => {
  logger.info('Authentication Event', {
    event,
    userId,
    details,
    timestamp: new Date().toISOString()
  });
};

// Log performance metrics
export const logPerformance = (operation: string, duration: number, details?: any) => {
  logger.info('Performance Metric', {
    operation,
    duration: `${duration}ms`,
    details,
    timestamp: new Date().toISOString()
  });
};

export { logger, stream };