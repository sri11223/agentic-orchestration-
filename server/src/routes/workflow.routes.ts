import { Router, Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { WorkflowModel } from '../models/workflow.model';
import { authenticate, authorize, checkOwnership } from '../middleware/auth.middleware';
import { rateLimit } from '../middleware/rate-limit';
import { cacheService } from '../services/cache.service';
import { lockService } from '../services/lock.service';
import { getCurrentRateLimits } from '../config/rate-limits';

const router = Router();

// Rate limiting for workflow operations - environment-aware
const rateLimits = getCurrentRateLimits();
const workflowRateLimit = rateLimit(rateLimits.workflows);

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
      console.log('🚀 GET /api/workflows route handler started');
      console.log('📝 Request query:', req.query);
      console.log('👤 Request user:', { 
        userId: req.user?.userId, 
        _id: req.user?._id, 
        id: req.user?.id, 
        role: req.user?.role 
      });

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('❌ Validation errors:', errors.array());
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      console.log('✅ Validation passed');

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      // Build query
      const query: any = {};
      
      // Get consistent user ID
      const userId = req.user?.userId || req.user?._id || req.user?.id;
      console.log('GET workflows - Using userId:', userId);
      
      // Filter by user permissions
      if (req.user.role !== 'admin') {
        query.$or = [
          { 'permissions.owners': userId },
          { 'permissions.editors': userId },
          { 'permissions.viewers': userId }
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

      console.log('Query being executed:', JSON.stringify(query, null, 2));

      // Check cache first (temporarily disabled for debugging)
      // const cacheKey = `workflows:${JSON.stringify(query)}:${page}:${limit}`;
      // const cachedResult = await cacheService.get(cacheKey);
      
      // if (cachedResult) {
      //   console.log('Returning cached result:', cachedResult);
      //   return res.json(cachedResult);
      // }

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

      console.log('Database query results:');
      console.log('- Total found:', total);
      console.log('- Workflows returned:', workflows.length);
      console.log('- Workflows:', workflows.map(w => ({ id: w._id, name: w.name, owners: w.permissions.owners })));

      const result = {
        workflows,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };

      // Cache result for 5 minutes (temporarily disabled for debugging)
      // await cacheService.set(cacheKey, result, 300);

      console.log('Sending result:', result);
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

/**
 * Get workflow by ID
 */
router.get('/:id',
  authenticate,
  workflowRateLimit,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Get consistent user ID
      const userId = req.user?.userId || req.user?._id || req.user?.id;
      console.log('GET workflow by ID - Using userId:', userId, 'Workflow ID:', id);
      
      // Find workflow by ID
      const workflow = await WorkflowModel.findById(id)
        .populate('metadata.creator', 'username email')
        .populate('metadata.lastEditor', 'username email');

      if (!workflow) {
        return res.status(404).json({
          error: 'Workflow not found',
          message: 'The requested workflow does not exist'
        });
      }

      // Check permissions
      if (req.user.role !== 'admin') {
        const hasPermission = 
          workflow.permissions.owners.includes(userId) ||
          workflow.permissions.editors.includes(userId) ||
          workflow.permissions.viewers.includes(userId);

        if (!hasPermission) {
          return res.status(403).json({
            error: 'Access denied',
            message: 'You do not have permission to access this workflow'
          });
        }
      }

      console.log('✅ Workflow found and access granted:', {
        id: workflow._id,
        name: workflow.name,
        owner: workflow.permissions.owners[0]
      });

      res.json({
        workflow
      });

    } catch (error) {
      console.error('Get workflow by ID error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch workflow'
      });
    }
  }
);

/**
 * Update workflow by ID
 */
router.put('/:id',
  authenticate,
  workflowRateLimit,
  [
    body('name').optional().isString().isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters'),
    body('description').optional().isString().isLength({ max: 500 }).withMessage('Description must be max 500 characters'),
    body('nodes').optional().isArray().withMessage('Nodes must be an array'),
    body('edges').optional().isArray().withMessage('Edges must be an array'),
    body('status').optional().isIn(['draft', 'active', 'archived']).withMessage('Invalid status'),
    body('category').optional().isString().withMessage('Category must be a string'),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
    body('metadata').optional().isObject().withMessage('Metadata must be an object')
  ],
  async (req: Request, res: Response) => {
    try {
      console.log('🔄 PUT /api/workflows/:id route handler started');
      console.log('📝 Workflow ID:', req.params.id);
      console.log('👤 User:', { userId: req.user?.userId, _id: req.user?._id });

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('❌ Validation errors:', errors.array());
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { id } = req.params;
      const updateData = req.body;

      // Find workflow and check permissions
      const workflow = await WorkflowModel.findById(id);
      if (!workflow) {
        console.log('❌ Workflow not found:', id);
        return res.status(404).json({
          error: 'Workflow not found'
        });
      }

      // Check if user has permission to update
      const userId = req.user.userId || req.user._id || req.user.id;
      const hasPermission = req.user.role === 'admin' || 
                           workflow.permissions.owners.includes(userId) ||
                           workflow.permissions.editors.includes(userId);

      if (!hasPermission) {
        console.log('❌ Access denied for user:', userId);
        return res.status(403).json({
          error: 'Access denied',
          message: 'You do not have permission to update this workflow'
        });
      }

      // Update workflow
      const updatedWorkflow = await WorkflowModel.findByIdAndUpdate(
        id,
        {
          ...updateData,
          'metadata.updatedAt': new Date(),
          'metadata.updatedBy': userId
        },
        { 
          new: true, 
          runValidators: true 
        }
      );

      if (!updatedWorkflow) {
        console.log('❌ Failed to update workflow:', id);
        return res.status(500).json({
          error: 'Failed to update workflow'
        });
      }

      // Clear cache
      await cacheService.del(`workflow:${id}`);
      await cacheService.del(`workflows:user:${req.user._id}`);

      console.log('✅ Workflow updated successfully:', {
        id: updatedWorkflow._id,
        name: updatedWorkflow.name,
        nodesCount: updatedWorkflow.nodes?.length || 0,
        edgesCount: updatedWorkflow.edges?.length || 0
      });

      // Convert _id to id for frontend compatibility
      const responseWorkflow = {
        ...updatedWorkflow.toObject(),
        id: String(updatedWorkflow._id)
      }; 

      res.json({
        message: 'Workflow updated successfully',
        workflow: responseWorkflow
      });

    } catch (error) {
      console.error('Update workflow error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to update workflow'
      });
    }
  }
);

export default router;