import { Router, Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { WorkflowModel } from '../models/workflow.model';
import { authenticate, authorize, checkOwnership } from '../middleware/auth.middleware';
import { rateLimit } from '../middleware/rate-limit';
import { cacheService } from '../services/cache.service';
import { lockService } from '../services/lock.service';

const router = Router();

// Rate limiting for workflow operations - relaxed for testing
const workflowRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute (relaxed for testing)
  keyPrefix: 'workflow:'
});

/**
 * Get all workflows with filtering and pagination
 */
router.get('/',
  authenticate,
  workflowRateLimit,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isIn(['draft', 'active', 'archived']).withMessage('Invalid status'),
    query('category').optional().isString().withMessage('Category must be a string'),
    query('search').optional().isString().withMessage('Search must be a string')
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
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      // Build query
      const query: any = {};
      
      // Filter by user permissions
      if (req.user.role !== 'admin') {
        query.$or = [
          { 'permissions.owners': req.user._id },
          { 'permissions.editors': req.user._id },
          { 'permissions.viewers': req.user._id }
        ];
      }

      if (req.query.status) {
        query.status = req.query.status;
      }

      if (req.query.category) {
        query['metadata.category'] = req.query.category;
      }

      if (req.query.search) {
        query.$text = { $search: req.query.search };
      }

      // Check cache first
      const cacheKey = `workflows:${JSON.stringify(query)}:${page}:${limit}`;
      const cachedResult = await cacheService.get(cacheKey);
      
      if (cachedResult) {
        return res.json(cachedResult);
      }

      // Fetch from database
      const [workflows, total] = await Promise.all([
        WorkflowModel.find(query)
          .sort({ updatedAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('metadata.creator', 'username email')
          .populate('metadata.lastEditor', 'username email'),
        WorkflowModel.countDocuments(query)
      ]);

      const result = {
        workflows,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };

      // Cache result for 5 minutes
      await cacheService.set(cacheKey, result, 300);

      res.json(result);

    } catch (error) {
      console.error('Get workflows error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch workflows'
      });
    }
  }
);

/**
 * Create new workflow
 */
router.post('/',
  authenticate,
  workflowRateLimit,
  [
    body('name').notEmpty().isLength({ max: 100 }).withMessage('Name is required and must be under 100 characters'),
    body('description').optional().isLength({ max: 500 }).withMessage('Description must be under 500 characters'),
    body('nodes').isArray().withMessage('Nodes must be an array'),
    body('edges').isArray().withMessage('Edges must be an array')
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

      const userId = req.user?.userId || req.user?._id || req.user?.id;
      console.log('Using userId:', userId);

      const workflowData = {
        ...req.body,
        metadata: {
          ...req.body.metadata,
          creator: userId,
          lastEditor: userId
        },
        permissions: {
          owners: [userId],
          editors: [],
          viewers: []
        }
      };

      const workflow = new WorkflowModel(workflowData);
      await workflow.save();

      // Clear cache
      await cacheService.clearByPrefix('workflows');

      res.status(201).json({
        message: 'Workflow created successfully',
        workflow
      });

    } catch (error) {
      console.error('Create workflow error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to create workflow'
      });
    }
  }
);

export default router;