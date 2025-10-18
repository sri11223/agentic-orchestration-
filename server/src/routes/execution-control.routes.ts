import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { workflowEngine } from '../engine/workflow-engine';
import { EventBus } from '../engine/event-bus';
import { authenticate } from '../middleware/auth.middleware';
import { rateLimit } from '../middleware/rate-limit';

const router = Router();
const eventBus = EventBus.getInstance();

// Rate limiting for execution operations
const executionRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 executions per minute
  keyPrefix: 'execution:'
});

/**
 * Execute a workflow
 */
router.post('/workflows/:workflowId/execute',
  authenticate,
  executionRateLimit,
  [
    param('workflowId').isMongoId().withMessage('Invalid workflow ID'),
    body('triggerData').optional().isObject().withMessage('Trigger data must be an object')
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
      const { triggerData = {} } = req.body;

      // Add user context to trigger data
      const contextData = {
        ...triggerData,
        userId: req.user._id,
        userEmail: req.user.email,
        executedAt: new Date().toISOString()
      };

      const executionId = await workflowEngine.executeWorkflow(workflowId, contextData);

      res.status(202).json({
        message: 'Workflow execution started',
        executionId,
        status: 'started'
      });

    } catch (error) {
      console.error('Workflow execution error:', error);
      res.status(500).json({
        error: 'Execution failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Get execution status and history
 */
router.get('/executions/:executionId',
  authenticate,
  [
    param('executionId').notEmpty().withMessage('Execution ID is required')
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

      const { executionId } = req.params;
      const execution = await workflowEngine.getExecutionStatus(executionId);

      if (!execution) {
        return res.status(404).json({
          error: 'Execution not found'
        });
      }

      // Get execution events
      const events = eventBus.getExecutionEvents(executionId);

      res.json({
        execution,
        events,
        progress: {
          totalNodes: execution.executionHistory.length,
          completedNodes: execution.executionHistory.filter(h => !h.error).length,
          failedNodes: execution.executionHistory.filter(h => h.error).length,
          currentStatus: execution.status
        }
      });

    } catch (error) {
      console.error('Get execution status error:', error);
      res.status(500).json({
        error: 'Failed to get execution status',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Resume paused execution
 */
router.post('/executions/:executionId/resume',
  authenticate,
  [
    param('executionId').notEmpty().withMessage('Execution ID is required'),
    body('resumeData').optional().isObject().withMessage('Resume data must be an object')
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

      const { executionId } = req.params;
      const { resumeData = {} } = req.body;

      await workflowEngine.resumeWorkflow(executionId, resumeData);

      res.json({
        message: 'Workflow execution resumed',
        executionId
      });

    } catch (error) {
      console.error('Resume execution error:', error);
      res.status(500).json({
        error: 'Failed to resume execution',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Cancel running execution
 */
router.post('/executions/:executionId/cancel',
  authenticate,
  [
    param('executionId').notEmpty().withMessage('Execution ID is required')
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

      const { executionId } = req.params;
      await workflowEngine.cancelExecution(executionId);

      res.json({
        message: 'Workflow execution cancelled',
        executionId
      });

    } catch (error) {
      console.error('Cancel execution error:', error);
      res.status(500).json({
        error: 'Failed to cancel execution',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Handle human approval response (supports both authenticated users and email token auth)
 */
router.post('/approvals/:executionId/respond',
  // Make authentication optional for email-based approvals
  async (req: Request, res: Response, next: any) => {
    const token = req.query.token as string;
    if (token) {
      // Email-based approval with token
      const { emailService } = await import('../services/email.service');
      if (emailService.verifyApprovalToken(token, req.params.executionId)) {
        req.user = { _id: 'email-approval', email: 'email-approval' }; // Mock user for email approvals
        return next();
      } else {
        return res.status(401).json({ error: 'Invalid or expired approval token' });
      }
    } else {
      // Regular authenticated approval
      return authenticate(req, res, next);
    }
  },
  [
    param('executionId').notEmpty().withMessage('Execution ID is required'),
    body('action').optional().isIn(['approve', 'reject']).withMessage('Action must be approve or reject'),
    body('comment').optional().isString().withMessage('Comment must be a string'),
    body('data').optional().isObject().withMessage('Data must be an object')
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

      const { executionId } = req.params;
      const action = (req.body.action || req.query.action) as string;
      const comment = req.body.comment || '';
      const { data = {} } = req.body;

      if (!action || !['approve', 'reject'].includes(action)) {
        return res.status(400).json({
          error: 'Action must be approve or reject'
        });
      }

      const approvalData = {
        executionId,
        action,
        comment,
        approvedBy: req.user._id,
        approvedAt: new Date().toISOString(),
        approvalMethod: req.query.token ? 'email' : 'dashboard',
        ...data
      };

      if (action === 'approve') {
        eventBus.emitEvent('human:approved', approvalData);
      } else {
        eventBus.emitEvent('human:rejected', approvalData);
      }

      // For email-based approvals, return an HTML response
      if (req.query.token) {
        const statusEmoji = action === 'approve' ? '✅' : '❌';
        const statusColor = action === 'approve' ? '#28a745' : '#dc3545';
        
        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Approval ${action === 'approve' ? 'Approved' : 'Rejected'}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 40px; background: #f5f5f5; }
        .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; padding: 40px; }
        .icon { font-size: 64px; margin-bottom: 20px; }
        .title { color: ${statusColor}; font-size: 24px; font-weight: 600; margin-bottom: 10px; }
        .message { color: #666; margin-bottom: 30px; }
        .execution-id { background: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">${statusEmoji}</div>
        <div class="title">Workflow ${action === 'approve' ? 'Approved' : 'Rejected'}</div>
        <div class="message">
            Thank you! Your ${action} has been recorded and the workflow will ${action === 'approve' ? 'continue' : 'be stopped'}.
        </div>
        <div class="execution-id">
            Execution ID: ${executionId}
        </div>
    </div>
</body>
</html>`;
        
        return res.send(html);
      }

      // Regular JSON response for dashboard approvals
      res.json({
        message: `Approval ${action}d successfully`,
        executionId,
        action
      });

    } catch (error) {
      console.error('Approval response error:', error);
      res.status(500).json({
        error: 'Failed to process approval',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Get real-time execution events (Server-Sent Events)
 */
router.get('/executions/:executionId/events',
  authenticate,
  async (req: Request, res: Response) => {
    const { executionId } = req.params;

    // Set up Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: 'connected', executionId })}\n\n`);

    // Listen for events related to this execution
    const eventHandler = (event: any) => {
      if (event.executionId === executionId) {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      }
    };

    eventBus.on('*', eventHandler);

    // Clean up on client disconnect
    req.on('close', () => {
      eventBus.off('*', eventHandler);
    });
  }
);

/**
 * Get workflow execution statistics
 */
router.get('/workflows/:workflowId/executions/stats',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { workflowId } = req.params;

      // This would typically query the database for execution statistics
      // For demo purposes, return mock data
      const stats = {
        totalExecutions: 45,
        successfulExecutions: 38,
        failedExecutions: 4,
        pausedExecutions: 3,
        averageDuration: 2400000, // 40 minutes in milliseconds
        successRate: 84.4,
        lastExecution: new Date().toISOString(),
        recentExecutions: [
          {
            id: 'exec_1',
            status: 'completed',
            duration: 1800000,
            startTime: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: 'exec_2',
            status: 'failed',
            duration: 600000,
            startTime: new Date(Date.now() - 7200000).toISOString()
          }
        ]
      };

      res.json(stats);

    } catch (error) {
      console.error('Get execution stats error:', error);
      res.status(500).json({
        error: 'Failed to get execution statistics',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

export default router;