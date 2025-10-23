import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { triggerService } from '../services/trigger.service';
import { authenticate } from '../middleware/auth.middleware';
import { rateLimit } from '../middleware/rate-limit';

const router = Router();

// Rate limiting for trigger operations
const triggerRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  keyPrefix: 'trigger:'
});

/**
 * Register a new trigger
 * POST /api/triggers
 */
router.post('/',
  authenticate,
  triggerRateLimit,
  [
    body('type').isIn(['email-trigger', 'webhook-trigger', 'schedule-trigger', 'manual-trigger']).withMessage('Invalid trigger type'),
    body('workflowId').isMongoId().withMessage('Valid workflow ID required'),
    body('nodeId').notEmpty().withMessage('Node ID is required'),
    body('config').isObject().withMessage('Configuration object required'),
    body('enabled').optional().isBoolean().withMessage('Enabled must be boolean')
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

      const triggerConfig = {
        ...req.body,
        enabled: req.body.enabled !== false // Default to true
      };

      const trigger = await triggerService.registerTrigger(triggerConfig);

      res.status(201).json({
        message: 'Trigger registered successfully',
        trigger
      });

    } catch (error) {
      console.error('Create trigger error:', error);
      res.status(500).json({
        error: 'Failed to register trigger',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Get all triggers for a workflow
 * GET /api/triggers/workflow/:workflowId
 */
router.get('/workflow/:workflowId',
  authenticate,
  [
    param('workflowId').isMongoId().withMessage('Valid workflow ID required')
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

      const { workflowId } = req.params;
      const triggers = await triggerService.getWorkflowTriggers(workflowId);

      res.json({
        message: 'Triggers retrieved successfully',
        triggers
      });

    } catch (error) {
      console.error('Get workflow triggers error:', error);
      res.status(500).json({
        error: 'Failed to retrieve triggers',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Update trigger configuration
 * PUT /api/triggers/:triggerId
 */
router.put('/:triggerId',
  authenticate,
  triggerRateLimit,
  [
    param('triggerId').isMongoId().withMessage('Valid trigger ID required'),
    body('config').optional().isObject().withMessage('Configuration must be object'),
    body('enabled').optional().isBoolean().withMessage('Enabled must be boolean')
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

      const { triggerId } = req.params;
      const updates = req.body;

      const trigger = await triggerService.updateTrigger(triggerId, updates);

      if (!trigger) {
        return res.status(404).json({
          error: 'Trigger not found'
        });
      }

      res.json({
        message: 'Trigger updated successfully',
        trigger
      });

    } catch (error) {
      console.error('Update trigger error:', error);
      res.status(500).json({
        error: 'Failed to update trigger',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Delete trigger
 * DELETE /api/triggers/:triggerId
 */
router.delete('/:triggerId',
  authenticate,
  [
    param('triggerId').isMongoId().withMessage('Valid trigger ID required')
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

      const { triggerId } = req.params;
      const success = await triggerService.deleteTrigger(triggerId);

      if (!success) {
        return res.status(404).json({
          error: 'Trigger not found or deletion failed'
        });
      }

      res.json({
        message: 'Trigger deleted successfully'
      });

    } catch (error) {
      console.error('Delete trigger error:', error);
      res.status(500).json({
        error: 'Failed to delete trigger',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Execute manual trigger
 * POST /api/triggers/:triggerId/execute
 */
router.post('/:triggerId/execute',
  authenticate,
  triggerRateLimit,
  [
    param('triggerId').isMongoId().withMessage('Valid trigger ID required'),
    body('triggerData').optional().isObject().withMessage('Trigger data must be object')
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

      const { triggerId } = req.params;
      const { triggerData = {} } = req.body;
      const userId = req.user._id || req.user.userId || req.user.id;

      const executionId = await triggerService.executeManualTrigger(
        triggerId,
        userId,
        triggerData
      );

      res.json({
        message: 'Manual trigger executed successfully',
        executionId
      });

    } catch (error) {
      console.error('Execute manual trigger error:', error);
      res.status(500).json({
        error: 'Failed to execute manual trigger',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Test trigger configuration
 * POST /api/triggers/:triggerId/test
 */
router.post('/:triggerId/test',
  authenticate,
  [
    param('triggerId').isMongoId().withMessage('Valid trigger ID required')
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

      const { triggerId } = req.params;
      const result = await triggerService.testTrigger(triggerId);

      res.json({
        message: 'Trigger test completed',
        result
      });

    } catch (error) {
      console.error('Test trigger error:', error);
      res.status(500).json({
        error: 'Failed to test trigger',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Get trigger execution history
 * GET /api/triggers/:triggerId/history
 */
router.get('/:triggerId/history',
  authenticate,
  [
    param('triggerId').isMongoId().withMessage('Valid trigger ID required'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
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

      const { triggerId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;

      const history = await triggerService.getTriggerExecutionHistory(triggerId, limit);

      res.json({
        message: 'Trigger history retrieved successfully',
        history
      });

    } catch (error) {
      console.error('Get trigger history error:', error);
      res.status(500).json({
        error: 'Failed to retrieve trigger history',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Get trigger statistics
 * GET /api/triggers/:triggerId/stats
 */
router.get('/:triggerId/stats',
  authenticate,
  [
    param('triggerId').isMongoId().withMessage('Valid trigger ID required')
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

      const { triggerId } = req.params;
      const stats = await triggerService.getTriggerStats(triggerId);

      res.json({
        message: 'Trigger statistics retrieved successfully',
        stats
      });

    } catch (error) {
      console.error('Get trigger stats error:', error);
      res.status(500).json({
        error: 'Failed to retrieve trigger statistics',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Handle webhook trigger execution
 * POST /api/triggers/webhook/:triggerId
 * This endpoint is called by external systems to trigger workflows
 */
router.post('/webhook/:triggerId',
  // No authentication required for webhooks
  [
    param('triggerId').isMongoId().withMessage('Valid trigger ID required')
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

      const { triggerId } = req.params;
      const webhookUrl = `/webhook/trigger/${triggerId}`;
      const method = req.method;
      const data = req.body;
      const headers = req.headers;

      const executionId = await triggerService.handleWebhookTrigger(
        webhookUrl,
        method,
        data,
        headers
      );

      if (!executionId) {
        return res.status(404).json({
          error: 'Webhook trigger not found or inactive'
        });
      }

      res.json({
        success: true,
        message: 'Webhook trigger executed successfully',
        executionId
      });

    } catch (error) {
      console.error('Webhook trigger error:', error);
      res.status(500).json({
        error: 'Failed to execute webhook trigger',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Enable/disable trigger
 * PATCH /api/triggers/:triggerId/toggle
 */
router.patch('/:triggerId/toggle',
  authenticate,
  [
    param('triggerId').isMongoId().withMessage('Valid trigger ID required'),
    body('enabled').isBoolean().withMessage('Enabled status required')
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

      const { triggerId } = req.params;
      const { enabled } = req.body;

      const trigger = await triggerService.updateTrigger(triggerId, { enabled });

      if (!trigger) {
        return res.status(404).json({
          error: 'Trigger not found'
        });
      }

      res.json({
        message: `Trigger ${enabled ? 'enabled' : 'disabled'} successfully`,
        trigger
      });

    } catch (error) {
      console.error('Toggle trigger error:', error);
      res.status(500).json({
        error: 'Failed to toggle trigger',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

export default router;