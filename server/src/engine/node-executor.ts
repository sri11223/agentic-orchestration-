import { INode, NodeType } from '../types/workflow.types';
import { ExecutionContext } from './workflow-engine';
import { AIService } from '../services/ai.service';
import { EventBus } from './event-bus';
import { GmailService } from '../services/gmail.service';
import { TelegramService } from '../services/telegram.service';
import { HttpService } from '../services/http.service';
import { DatabaseService } from '../services/database.service';

export interface NodeExecutionResult {
  type: 'success' | 'error' | 'pause';
  output?: any;
  error?: string;
  reason?: string;
  data?: any;
}

export class NodeExecutor {
  private aiService: AIService;
  private eventBus: EventBus;
  private gmailService: GmailService;
  private telegramService: TelegramService;
  private httpService: HttpService;
  private databaseService: DatabaseService;

  constructor() {
    this.aiService = new AIService();
    this.eventBus = EventBus.getInstance();
    this.gmailService = new GmailService();
    this.telegramService = new TelegramService();
    this.httpService = new HttpService();
    this.databaseService = new DatabaseService();
  }

  /**
   * Execute a node based on its type
   */
  async executeNode(node: INode, context: ExecutionContext): Promise<NodeExecutionResult> {
    try {
      switch (node.type) {
        case NodeType.TRIGGER:
          return this.executeTriggerNode(node, context);
        
        case NodeType.AI_PROCESSOR:
          return this.executeAINode(node, context);
        
        case NodeType.DECISION:
          return this.executeDecisionNode(node, context);
        
        case NodeType.HUMAN_TASK:
          return this.executeHumanTaskNode(node, context);
        
        case NodeType.ACTION:
          return this.executeActionNode(node, context);
        
        case NodeType.TIMER:
          return this.executeTimerNode(node, context);
        
        default:
          return {
            type: 'error',
            error: `Unknown node type: ${node.type}`
          };
      }
    } catch (error) {
      return {
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Execute trigger node (workflow start)
   */
  private async executeTriggerNode(node: INode, context: ExecutionContext): Promise<NodeExecutionResult> {
    return {
      type: 'success',
      output: {
        trigger: node.data.triggerType || 'manual',
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Execute AI processing node
   */
  private async executeAINode(node: INode, context: ExecutionContext): Promise<NodeExecutionResult> {
    const { aiProvider, prompt, model, temperature, maxTokens } = node.data;
    
    if (!prompt) {
      return { type: 'error', error: 'AI node requires prompt configuration' };
    }

    // Replace variables in prompt
    const processedPrompt = this.replaceVariables(prompt, context.variables);

    this.eventBus.emitEvent('ai:request', {
      executionId: context.executionId,
      nodeId: node.id,
      provider: aiProvider,
      model,
      prompt: processedPrompt
    });

    try {
      const response = await this.aiService.generateResponse({
        provider: aiProvider || 'gemini',
        model: model || 'gemini-1.5-flash',
        prompt: processedPrompt,
        temperature: temperature || 0.7,
        maxTokens: maxTokens || 1000
      });

      this.eventBus.emitEvent('ai:response', {
        executionId: context.executionId,
        nodeId: node.id,
        response: response.text,
        tokensUsed: response.tokensUsed,
        cost: response.cost
      });

      // Parse AI response if it's JSON
      let parsedResponse = response.text;
      if (node.data.parseJson) {
        try {
          parsedResponse = JSON.parse(response.text);
        } catch (error) {
          console.warn('Failed to parse AI response as JSON:', error);
        }
      }

      return {
        type: 'success',
        output: {
          aiResponse: parsedResponse,
          tokensUsed: response.tokensUsed,
          cost: response.cost,
          model: response.model
        }
      };

    } catch (error) {
      return {
        type: 'error',
        error: `AI node failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Execute decision node
   */
  private async executeDecisionNode(node: INode, context: ExecutionContext): Promise<NodeExecutionResult> {
    const { conditions } = node.data;
    
    if (!conditions || !Array.isArray(conditions)) {
      return { type: 'error', error: 'Decision node requires conditions array' };
    }

    // Evaluate each condition
    const results: Record<string, boolean> = {};
    for (const condition of conditions) {
      results[condition.name] = this.evaluateCondition(condition.expression, context.variables);
    }

    return {
      type: 'success',
      output: {
        conditionResults: results,
        decisionPath: Object.keys(results).find(key => results[key]) || 'default'
      }
    };
  }

  /**
   * Execute human task node (requires human intervention)
   */
  private async executeHumanTaskNode(node: INode, context: ExecutionContext): Promise<NodeExecutionResult> {
    const { 
      title, 
      description, 
      assignee, 
      approvalType = 'email',
      timeout = 3600000 // 1 hour default
    } = node.data;

    if (!assignee) {
      return {
        type: 'error',
        error: 'Human task node requires assignee email address'
      };
    }

    // Create approval request
    const approvalData = {
      executionId: context.executionId,
      nodeId: node.id,
      title: this.replaceVariables(title, context.variables),
      description: this.replaceVariables(description, context.variables),
      assignee,
      approvalType,
      timeout,
      variables: context.variables,
      approvalUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/approvals/${context.executionId}`
    };

    this.eventBus.emitEvent('human:approval_requested', approvalData);

    // Pause execution - workflow will resume when human responds
    return {
      type: 'pause',
      reason: 'Waiting for human approval via email',
      data: approvalData
    };
  }

  /**
   * Execute action node (API calls, database operations, etc.)
   */
  private async executeActionNode(node: INode, context: ExecutionContext): Promise<NodeExecutionResult> {
    const { actionType, config } = node.data;

    switch (actionType) {
      case 'http_request':
        return this.executeHttpRequest(config, context);
      
      case 'email':
        return this.executeSendEmail(config, context);
      
      case 'database':
        return this.executeDatabaseAction(config, context);
      
      case 'log':
        return this.executeLogAction(config, context);
      
      default:
        return {
          type: 'error',
          error: `Unknown action type: ${actionType}`
        };
    }
  }

  /**
   * Execute timer node (delay execution)
   */
  private async executeTimerNode(node: INode, context: ExecutionContext): Promise<NodeExecutionResult> {
    const { delay, unit = 'seconds' } = node.data;
    
    if (!delay || delay <= 0) {
      return { type: 'error', error: 'Timer node requires positive delay value' };
    }

    const multipliers = {
      milliseconds: 1,
      seconds: 1000,
      minutes: 60000,
      hours: 3600000
    };

    const delayMs = delay * (multipliers[unit as keyof typeof multipliers] || 1000);

    // For short delays, use setTimeout
    if (delayMs < 60000) { // Less than 1 minute
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return {
        type: 'success',
        output: {
          delayed: true,
          delayMs,
          resumedAt: new Date().toISOString()
        }
      };
    }

    // For longer delays, pause and schedule resume
    setTimeout(() => {
      this.eventBus.emitEvent('timer:expired', {
        executionId: context.executionId,
        nodeId: node.id
      });
    }, delayMs);

    return {
      type: 'pause',
      reason: `Timer delay: ${delay} ${unit}`,
      data: { delayMs, resumeAt: new Date(Date.now() + delayMs).toISOString() }
    };
  }

  /**
   * Execute HTTP request action
   */
  private async executeHttpRequest(config: any, context: ExecutionContext): Promise<NodeExecutionResult> {
    const { url, method = 'GET', headers = {}, body } = config;
    
    if (!url) {
      return { type: 'error', error: 'HTTP request requires URL' };
    }

    try {
      const processedUrl = this.replaceVariables(url, context.variables);
      const processedBody = body ? this.replaceVariables(JSON.stringify(body), context.variables) : undefined;

      // Use HttpService which wraps axios and has better error handling
      const reqConfig: any = {
        url: processedUrl,
        method,
        headers: { 'Content-Type': 'application/json', ...headers }
      };
      if (processedBody) reqConfig.data = JSON.parse(processedBody);

      const r = await this.httpService.request(reqConfig);
      if (!r.success) {
        return { type: 'error', error: `HTTP request failed: ${r.error}` };
      }

      return {
        type: 'success',
        output: {
          httpResponse: r.data,
          statusCode: r.status,
          headers: r.headers
        }
      };

    } catch (error) {
      return {
        type: 'error',
        error: `HTTP request failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Execute send email action
   */
  private async executeSendEmail(config: any, context: ExecutionContext): Promise<NodeExecutionResult> {
    const { to, subject, body } = config;
    
    if (!to || !subject || !body) {
      return { type: 'error', error: 'Email action requires to, subject, and body' };
    }

    const toResolved = this.replaceVariables(to, context.variables);
    const subjectResolved = this.replaceVariables(subject, context.variables);
    const bodyResolved = this.replaceVariables(body, context.variables);

    try {
      const resp = await this.gmailService.sendEmail({ to: toResolved, subject: subjectResolved, body: bodyResolved, isHtml: false });
      return {
        type: 'success',
        output: {
          emailSent: resp.status === 'sent',
          simulated: false,
          recipient: toResolved,
          subject: subjectResolved,
          messageId: resp.messageId || null
        }
      };
    } catch (error) {
      return { type: 'error', error: `Send email failed: ${error instanceof Error ? error.message : String(error)}` };
    }
  }

  /**
   * Execute database action
   */
  private async executeDatabaseAction(config: any, context: ExecutionContext): Promise<NodeExecutionResult> {
    const { operation, table, data } = config;
    try {
      // Replace variables in data if it's an object
      const jsonData = typeof data === 'string' ? JSON.parse(this.replaceVariables(data, context.variables)) : data;
      // Use DatabaseService which wraps Mongoose models
      if (operation === 'insert') {
        const rec = await this.databaseService.insertToCollection(table, jsonData);
        return { type: 'success', output: { databaseResult: true, record: rec } };
      }
      if (operation === 'update') {
        const rec = await this.databaseService.updateExecutionRecord(jsonData.id, jsonData.patch || {});
        return { type: 'success', output: { databaseResult: true, record: rec } };
      }

      // Fallback: log and simulate
      console.log('Database operation not implemented:', operation, table, jsonData);
      return { type: 'success', output: { databaseResult: true, operation, table } };
    } catch (error) {
      return { type: 'error', error: `Database action failed: ${error instanceof Error ? error.message : String(error)}` };
    }
  }

  // Optional: helper to send Telegram messages when used as an action outside of messaging nodes
  private async executeTelegramSend(config: any, context: ExecutionContext): Promise<NodeExecutionResult> {
    const { chatId, message } = config;
    if (!chatId || !message) return { type: 'error', error: 'Telegram action requires chatId and message' };
    try {
      const msg = this.replaceVariables(message, context.variables);
      const r = await this.telegramService.sendMessage({ chatId, text: msg });
      return { type: 'success', output: { sent: r.success === true, messageId: r.messageId || null } };
    } catch (error) {
      return { type: 'error', error: `Telegram send failed: ${error instanceof Error ? error.message : String(error)}` };
    }
  }

  /**
   * Execute log action
   */
  private async executeLogAction(config: any, context: ExecutionContext): Promise<NodeExecutionResult> {
    const { message, level = 'info' } = config;
    const processedMessage = this.replaceVariables(message, context.variables);
    
    console.log(`[${level.toUpperCase()}] ${processedMessage}`);
    
    return {
      type: 'success',
      output: {
        logged: true,
        message: processedMessage,
        level
      }
    };
  }

  /**
   * Replace variables in text with values from context
   */
  private replaceVariables(text: string, variables: Record<string, any>): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      return variables[varName] !== undefined ? String(variables[varName]) : match;
    });
  }

  /**
   * Evaluate condition expression
   */
  private evaluateCondition(expression: string, variables: Record<string, any>): boolean {
    try {
      // Replace variables in expression
      const processedExpression = this.replaceVariables(expression, variables);
      
      // Simple expression evaluation (production would use proper parser)
      // Support: variable > value, variable == value, etc.
      const operators = ['>=', '<=', '!=', '==', '>', '<', 'contains'];
      
      for (const op of operators) {
        if (processedExpression.includes(op)) {
          const [left, right] = processedExpression.split(op).map(s => s.trim());
          const leftVal = isNaN(Number(left)) ? left.replace(/['"]/g, '') : Number(left);
          const rightVal = isNaN(Number(right)) ? right.replace(/['"]/g, '') : Number(right);
          
          switch (op) {
            case '>': return Number(leftVal) > Number(rightVal);
            case '<': return Number(leftVal) < Number(rightVal);
            case '>=': return Number(leftVal) >= Number(rightVal);
            case '<=': return Number(leftVal) <= Number(rightVal);
            case '==': return leftVal == rightVal;
            case '!=': return leftVal != rightVal;
            case 'contains': return String(leftVal).includes(String(rightVal));
          }
        }
      }
      
      return false;
    } catch (error) {
      console.warn('Failed to evaluate condition:', expression, error);
      return false;
    }
  }
}