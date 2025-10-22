import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware';
import { AIService } from '../services/ai.service';

const router = Router();
const aiService = new AIService();

/**
 * Test AI configuration endpoint
 */
router.post('/test',
  authenticate,
  [
    body('prompt').notEmpty().withMessage('Prompt is required'),
    body('taskType').optional().isString(),
    body('aiProvider').optional().isString(),
    body('model').optional().isString(),
    body('temperature').optional().isFloat({ min: 0, max: 2 }),
    body('maxTokens').optional().isInt({ min: 1, max: 4000 })
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

      const {
        prompt,
        taskType = 'auto',
        aiProvider,
        model,
        temperature = 0.7,
        maxTokens = 1000
      } = req.body;

      console.log('🧪 Testing AI configuration:', {
        prompt: prompt.substring(0, 100) + '...',
        taskType,
        aiProvider,
        model,
        temperature,
        maxTokens
      });

      let result;

      if (aiProvider) {
        // Test specific provider
        result = await aiService.generateResponse({
          provider: aiProvider,
          model: model || 'default',
          prompt,
          temperature,
          maxTokens
        });
      } else {
        // Test smart routing
        result = await aiService.processNode({
          id: 'test-node',
          type: 'AI_PROCESSOR',
          data: {
            taskType,
            prompt,
            temperature,
            maxTokens
          }
        } as any, {} as any);
      }

      console.log('✅ AI test successful:', {
        provider: result.provider || 'smart-routing',
        tokensUsed: (result as any).tokensUsed || (result as any).tokens,
        confidence: (result as any).confidence
      });

      res.json({
        text: 'text' in result ? result.text : result.result,
        provider: result.provider || 'smart-routing',
        tokensUsed: 'tokensUsed' in result ? (result as any).tokensUsed : 0,
        cost: 'cost' in result ? (result as any).cost : 0,
        confidence: 'confidence' in result ? (result as any).confidence : 0.9,
        model: 'model' in result && result.model ? result.model : (model || 'auto')
      });

    } catch (error) {
      console.error('❌ AI test failed:', error);
      res.status(500).json({
        error: 'AI test failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

export default router;