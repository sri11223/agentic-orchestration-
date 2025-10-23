import { Router, Request, Response } from 'express';
import { query, validationResult } from 'express-validator';
import { ExecutionHistoryModel } from '../models/execution-history.model';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { rateLimit } from '../middleware/rate-limit';
import { cacheService } from '../services/cache.service';

const router = Router();

// Rate limiting for execution routes - increased for workflow builder usage
const executionRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 500, // 500 requests per minute (for checking execution status frequently)
  keyPrefix: 'execution:'
});

/**
 * Get execution history with filtering and pagination
 */
router.get('/',
  authenticate,
  executionRateLimit,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('workflowId').optional().isMongoId().withMessage('Invalid workflow ID'),
    query('status').optional().isIn(['running', 'completed', 'failed', 'cancelled']).withMessage('Invalid status'),
    query('startDate').optional().isISO8601().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date')
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

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      // Build query
      const query: any = {};

      if (req.query.workflowId) {
        query.workflowId = req.query.workflowId;
      }

      if (req.query.status) {
        query.status = req.query.status;
      }

      if (req.query.startDate || req.query.endDate) {
        query.startTime = {};
        if (req.query.startDate) {
          query.startTime.$gte = new Date(req.query.startDate as string);
        }
        if (req.query.endDate) {
          query.startTime.$lte = new Date(req.query.endDate as string);
        }
      }

      // Check cache first
      const cacheKey = `executions:${JSON.stringify(query)}:${page}:${limit}`;
      const cachedResult = await cacheService.get(cacheKey);
      
      if (cachedResult) {
        return res.json(cachedResult);
      }

      // Fetch from database
      const [executions, total] = await Promise.all([
        ExecutionHistoryModel.find(query)
          .sort({ startTime: -1 })
          .skip(skip)
          .limit(limit)
          .populate('workflowId', 'name description'),
        ExecutionHistoryModel.countDocuments(query)
      ]);

      const result = {
        executions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };

      // Cache result for 2 minutes
      await cacheService.set(cacheKey, result, 120);

      res.json(result);

    } catch (error) {
      console.error('Get executions error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch execution history'
      });
    }
  }
);

/**
 * Get execution by ID
 */
router.get('/:id',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const execution = await ExecutionHistoryModel.findById(id)
        .populate('workflowId', 'name description permissions');

      if (!execution) {
        return res.status(404).json({
          error: 'Execution not found'
        });
      }

      // Check permissions
      const workflow = execution.workflowId as any;
      const userId = req.user._id || req.user.id || req.user.userId;
      console.log('🔍 Permission check:', {
        userId: userId,
        userObject: req.user,
        userRole: req.user.role,
        workflowId: workflow._id,
        workflowPermissions: workflow.permissions,
        executionId: id
      });
      
      if (req.user.role !== 'admin') {
        const hasPermission = workflow.permissions && (
          workflow.permissions.owners.includes(userId) ||
          workflow.permissions.editors.includes(userId) ||
          workflow.permissions.viewers.includes(userId)
        );
        
        if (!hasPermission) {
          console.log('❌ Access denied for user:', userId, 'to workflow:', workflow._id);
          return res.status(403).json({
            error: 'Access denied',
            message: 'You do not have permission to view this execution'
          });
        }
      }

      // Disable caching for real-time status updates
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

      const responseData = {
        execution: execution,
        events: (execution as any).events || []
      };
      
      res.json(responseData);

    } catch (error) {
      console.error('Get execution error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch execution'
      });
    }
  }
);

/**
 * Get execution analytics
 */
router.get('/analytics/summary',
  authenticate,
  authorize(['admin']),
  async (req: Request, res: Response) => {
    try {
      const cacheKey = 'execution:analytics:summary';
      const cachedAnalytics = await cacheService.get(cacheKey);
      
      if (cachedAnalytics) {
        return res.json(cachedAnalytics);
      }

      const analytics = await ExecutionHistoryModel.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            avgDuration: { $avg: '$metrics.totalDuration' },
            avgCost: { $avg: '$metrics.totalCost' },
            totalCost: { $sum: '$metrics.totalCost' },
            totalTokens: { $sum: '$metrics.aiTokensUsed' }
          }
        }
      ]);

      const dailyStats = await ExecutionHistoryModel.aggregate([
        {
          $match: {
            startTime: {
              $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$startTime'
              }
            },
            executions: { $sum: 1 },
            avgDuration: { $avg: '$metrics.totalDuration' },
            totalCost: { $sum: '$metrics.totalCost' }
          }
        },
        {
          $sort: { '_id': 1 }
        }
      ]);

      const result = {
        summary: analytics,
        dailyStats
      };

      // Cache for 1 hour
      await cacheService.set(cacheKey, result, 3600);

      res.json(result);

    } catch (error) {
      console.error('Get execution analytics error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch execution analytics'
      });
    }
  }
);

/**
 * Get workflow execution statistics
 */
router.get('/workflow/:workflowId/stats',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { workflowId } = req.params;

      const cacheKey = `execution:workflow:${workflowId}:stats`;
      const cachedStats = await cacheService.get(cacheKey);
      
      if (cachedStats) {
        return res.json(cachedStats);
      }

      const stats = await ExecutionHistoryModel.aggregate([
        {
          $match: { workflowId: workflowId }
        },
        {
          $group: {
            _id: null,
            totalExecutions: { $sum: 1 },
            successfulExecutions: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            failedExecutions: {
              $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
            },
            avgDuration: { $avg: '$metrics.totalDuration' },
            avgCost: { $avg: '$metrics.totalCost' },
            totalCost: { $sum: '$metrics.totalCost' },
            totalTokens: { $sum: '$metrics.aiTokensUsed' }
          }
        }
      ]);

      const result = stats[0] || {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        avgDuration: 0,
        avgCost: 0,
        totalCost: 0,
        totalTokens: 0
      };

      // Calculate success rate
      result.successRate = result.totalExecutions > 0 
        ? (result.successfulExecutions / result.totalExecutions) * 100 
        : 0;

      // Cache for 10 minutes
      await cacheService.set(cacheKey, result, 600);

      res.json(result);

    } catch (error) {
      console.error('Get workflow stats error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch workflow statistics'
      });
    }
  }
);

/**
 * Delete execution (admin only)
 */
router.delete('/:id',
  authenticate,
  authorize(['admin']),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const execution = await ExecutionHistoryModel.findByIdAndDelete(id);
      if (!execution) {
        return res.status(404).json({
          error: 'Execution not found'
        });
      }

      // Clear cache
      await Promise.all([
        cacheService.del(`execution:${id}`),
        cacheService.clearByPrefix('executions'),
        cacheService.clearByPrefix('execution:analytics'),
        cacheService.clearByPrefix(`execution:workflow:${execution.workflowId}`)
      ]);

      res.json({
        message: 'Execution deleted successfully'
      });

    } catch (error) {
      console.error('Delete execution error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to delete execution'
      });
    }
  }
);

export default router;