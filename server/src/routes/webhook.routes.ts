import express from 'express';
import { EventBus } from '../engine/event-bus';
import { workflowEngine } from '../engine/workflow-engine';

const router = express.Router();

/**
 * @route POST /api/webhooks/workflow-trigger
 * @desc Trigger workflow execution via webhook
 * @access Public (with webhook validation)
 */
router.post('/workflow-trigger', async (req, res) => {
  try {
    const { workflowId, data, webhookSecret } = req.body;

    // Validate webhook secret if provided
    if (process.env.WEBHOOK_SECRET && webhookSecret !== process.env.WEBHOOK_SECRET) {
      return res.status(401).json({
        success: false,
        message: 'Invalid webhook secret'
      });
    }

    if (!workflowId) {
      return res.status(400).json({
        success: false,
        message: 'Workflow ID is required'
      });
    }

    // Trigger workflow execution
    const executionId = await workflowEngine.executeWorkflow(workflowId, data);

    res.json({
      success: true,
      message: 'Workflow triggered successfully',
      data: {
        executionId,
        workflowId,
        triggeredAt: new Date()
      }
    });

  } catch (error) {
    console.error('Webhook workflow trigger error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger workflow',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/webhooks/form-submission
 * @desc Handle form submissions from external sources
 * @access Public
 */
router.post('/form-submission', async (req, res) => {
  try {
    const { formId, submission, metadata } = req.body;

    if (!formId || !submission) {
      return res.status(400).json({
        success: false,
        message: 'Form ID and submission data are required'
      });
    }

    // Emit form submission event
    const eventBus = EventBus.getInstance();
    eventBus.emit('form:submission', {
      formId,
      submission,
      metadata: {
        ...metadata,
        submittedAt: new Date(),
        source: 'webhook',
        userAgent: req.get('User-Agent'),
        ip: req.ip
      }
    });

    res.json({
      success: true,
      message: 'Form submission received',
      data: {
        formId,
        submissionId: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        receivedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Form submission webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process form submission',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/webhooks/integration/:service
 * @desc Handle webhooks from external services (GitHub, Slack, etc.)
 * @access Public
 */
router.post('/integration/:service', async (req, res) => {
  try {
    const { service } = req.params;
    const payload = req.body;
    const headers = req.headers;

    // Log the webhook for debugging
    console.log(`Webhook received from ${service}:`, {
      headers: Object.keys(headers),
      payloadSize: JSON.stringify(payload).length
    });

    // Emit integration webhook event
    const eventBus = EventBus.getInstance();
    eventBus.emit('integration:webhook', {
      service,
      payload,
      headers,
      receivedAt: new Date()
    });

    // Service-specific handling
    switch (service) {
      case 'github':
        await handleGitHubWebhook(payload, headers);
        break;
        
      case 'slack':
        await handleSlackWebhook(payload, headers);
        break;
        
      case 'stripe':
        await handleStripeWebhook(payload, headers);
        break;
        
      case 'mailgun':
        await handleMailgunWebhook(payload, headers);
        break;
        
      default:
        console.log(`No specific handler for service: ${service}`);
    }

    res.json({
      success: true,
      message: `${service} webhook processed`,
      timestamp: new Date()
    });

  } catch (error) {
    console.error(`Integration webhook error for ${req.params.service}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to process integration webhook',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/webhooks/ai-completion
 * @desc Handle AI provider webhooks for long-running tasks
 * @access Public (with API key validation)
 */
router.post('/ai-completion', async (req, res) => {
  try {
    const { taskId, result, status, metadata } = req.body;
    const apiKey = req.headers['x-api-key'];

    if (!apiKey || apiKey !== process.env.AI_WEBHOOK_SECRET) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API key'
      });
    }

    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: 'Task ID is required'
      });
    }

    // Emit AI completion event
    const eventBus = EventBus.getInstance();
    eventBus.emit('ai:completion', {
      taskId,
      result,
      status,
      metadata,
      completedAt: new Date()
    });

    res.json({
      success: true,
      message: 'AI completion webhook processed',
      taskId
    });

  } catch (error) {
    console.error('AI completion webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process AI completion webhook',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/webhooks/health
 * @desc Health check for webhook endpoints
 * @access Public
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Webhook endpoints are healthy',
    endpoints: [
      '/webhook/workflow-trigger',
      '/webhook/form-submission',
      '/webhook/integration/:service',
      '/webhook/ai-completion'
    ],
    timestamp: new Date()
  });
});

/**
 * Handle GitHub webhook events
 */
async function handleGitHubWebhook(payload: any, headers: any) {
  const event = headers['x-github-event'];
  
  console.log(`GitHub ${event} event received`);
  
  switch (event) {
    case 'push':
      // Handle push events - could trigger CI/CD workflows
      console.log('GitHub push event:', {
        repository: payload.repository?.name,
        commits: payload.commits?.length,
        pusher: payload.pusher?.name
      });
      break;
      
    case 'pull_request':
      // Handle PR events
      console.log('GitHub PR event:', {
        action: payload.action,
        repository: payload.repository?.name,
        pr: payload.pull_request?.number
      });
      break;
      
    case 'issues':
      // Handle issue events
      console.log('GitHub issue event:', {
        action: payload.action,
        repository: payload.repository?.name,
        issue: payload.issue?.number
      });
      break;
  }
}

/**
 * Handle Slack webhook events
 */
async function handleSlackWebhook(payload: any, headers: any) {
  console.log('Slack webhook received:', {
    type: payload.type,
    event: payload.event?.type,
    challenge: payload.challenge ? 'present' : 'not present'
  });

  // Handle Slack URL verification
  if (payload.type === 'url_verification') {
    return payload.challenge;
  }

  // Handle other Slack events
  if (payload.event) {
    switch (payload.event.type) {
      case 'message':
        console.log('Slack message event');
        break;
        
      case 'app_mention':
        console.log('Slack app mention event');
        break;
    }
  }
}

/**
 * Handle Stripe webhook events
 */
async function handleStripeWebhook(payload: any, headers: any) {
  const event = payload.type;
  
  console.log(`Stripe ${event} event received`);
  
  switch (event) {
    case 'payment_intent.succeeded':
      console.log('Payment succeeded:', payload.data.object.id);
      break;
      
    case 'customer.subscription.created':
      console.log('Subscription created:', payload.data.object.id);
      break;
      
    case 'invoice.payment_failed':
      console.log('Payment failed:', payload.data.object.id);
      break;
  }
}

/**
 * Handle Mailgun webhook events
 */
async function handleMailgunWebhook(payload: any, headers: any) {
  const eventData = payload['event-data'];
  
  if (eventData) {
    console.log(`Mailgun ${eventData.event} event:`, {
      recipient: eventData.recipient,
      message: eventData.message?.headers?.subject
    });
  }
}

export default router;