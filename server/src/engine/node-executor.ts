import { INode, NodeType } from '../types/workflow.types';
import { ExecutionContext } from './workflow-engine';
import { AIService } from '../services/ai.service';
import { EventBus } from './event-bus';
import { GmailService } from '../services/gmail.service';
import { TelegramService } from '../services/telegram.service';
import { HttpService } from '../services/http.service';
import { DatabaseService } from '../services/database.service';
import { FileOperationsService } from '../services/file-operations.service';
import { FormBuilderService } from '../services/form-builder.service';
import { DataTransformationService } from '../services/data-transformation.service';
import { PushNotificationService } from '../services/push-notification.service';
import { EmailNotificationService } from '../services/email-notification.service';

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
  private fileOperationsService: FileOperationsService;
  private formBuilderService: FormBuilderService;
  private dataTransformationService: DataTransformationService;
  private pushNotificationService: PushNotificationService;
  private emailNotificationService: EmailNotificationService;

  constructor() {
    this.aiService = new AIService();
    this.eventBus = EventBus.getInstance();
    this.gmailService = new GmailService();
    this.telegramService = new TelegramService();
    this.httpService = new HttpService();
    this.databaseService = new DatabaseService();
    this.fileOperationsService = new FileOperationsService();
    this.formBuilderService = new FormBuilderService();
    this.dataTransformationService = new DataTransformationService();
    this.pushNotificationService = new PushNotificationService();
    this.emailNotificationService = new EmailNotificationService();
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
        
        case NodeType.FILE_OPERATIONS:
          return this.executeFileOperationsNode(node, context);
        
        case NodeType.FORM_BUILDER:
          return this.executeFormBuilderNode(node, context);
        
        case NodeType.DATA_TRANSFORM:
          return this.executeDataTransformNode(node, context);
        
        case NodeType.PUSH_NOTIFICATION:
          return this.executePushNotificationNode(node, context);
        
        case NodeType.EMAIL_AUTOMATION:
          return this.executeEmailAutomationNode(node, context);
        
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
   * Execute AI processing node with smart provider routing
   */
  private async executeAINode(node: INode, context: ExecutionContext): Promise<NodeExecutionResult> {
    const { 
      prompt, 
      taskType, 
      aiProvider, 
      model, 
      temperature, 
      maxTokens, 
      parseJson,
      context: nodeContext
    } = node.data;
    
    if (!prompt) {
      return { type: 'error', error: 'AI node requires prompt configuration' };
    }

    // Replace variables in prompt
    const processedPrompt = this.replaceVariables(prompt, context.variables);

    // Auto-detect task type if not specified
    const detectedTaskType = taskType || this.detectTaskType(processedPrompt, node.data);

    this.eventBus.emitEvent('ai:request', {
      executionId: context.executionId,
      nodeId: node.id,
      taskType: detectedTaskType,
      prompt: processedPrompt,
      autoRouting: !aiProvider // True if using smart routing
    });

    try {
      if (aiProvider) {
        // Use specific provider if requested
        const aiResponse = await this.aiService.generateResponse({
          provider: aiProvider,
          model: model || 'default',
          prompt: processedPrompt,
          temperature: temperature || 0.7,
          maxTokens: maxTokens || 1000
        });

        this.eventBus.emitEvent('ai:response', {
          executionId: context.executionId,
          nodeId: node.id,
          response: aiResponse.text,
          provider: aiResponse.provider,
          confidence: 0.9, // Default confidence for specific provider
          tokensUsed: aiResponse.tokensUsed,
          cost: aiResponse.cost,
          taskType: detectedTaskType
        });

        // Parse AI response if requested
        let parsedResponse: any = aiResponse.text;
        if (parseJson) {
          try {
            parsedResponse = JSON.parse(aiResponse.text);
          } catch (error) {
            console.warn('Failed to parse AI response as JSON:', error);
          }
        }

        return {
          type: 'success',
          output: {
            aiResponse: parsedResponse,
            provider: aiResponse.provider,
            confidence: 0.9,
            tokensUsed: aiResponse.tokensUsed,
            cost: aiResponse.cost,
            taskType: detectedTaskType,
            model: aiResponse.model
          }
        };

      } else {
        // Use smart task routing
        const smartResponse = await this.aiService.processNode({
          id: node.id,
          type: 'AI_PROCESSOR',
          data: {
            taskType: detectedTaskType,
            prompt: processedPrompt,
            options: {
              temperature: temperature || 0.7,
              maxTokens: maxTokens || 1000,
              context: nodeContext
            }
          }
        }, context.variables);

        this.eventBus.emitEvent('ai:response', {
          executionId: context.executionId,
          nodeId: node.id,
          response: smartResponse.result,
          provider: smartResponse.provider,
          confidence: smartResponse.confidence || 0.8,
          tokensUsed: smartResponse.tokens || 0,
          cost: 0, // Free providers
          taskType: detectedTaskType
        });

        // Parse AI response if requested
        let parsedResponse: any = smartResponse.result;
        if (parseJson) {
          try {
            parsedResponse = JSON.parse(smartResponse.result);
          } catch (error) {
            console.warn('Failed to parse AI response as JSON:', error);
          }
        }

        return {
          type: 'success',
          output: {
            aiResponse: parsedResponse,
            provider: smartResponse.provider,
            confidence: smartResponse.confidence || 0.8,
            tokensUsed: smartResponse.tokens || 0,
            cost: 0, // Free providers
            taskType: detectedTaskType,
            model: 'auto-selected'
          }
        };
      }

    } catch (error) {
      this.eventBus.emitEvent('ai:error', {
        executionId: context.executionId,
        nodeId: node.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        taskType: detectedTaskType
      });

      return {
        type: 'error',
        error: `AI node failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Auto-detect task type from prompt and node configuration
   */
  private detectTaskType(prompt: string, nodeData: any): string {
    const promptLower = prompt.toLowerCase();
    
    // Check for explicit task type hints in node data
    if (nodeData.taskType) return nodeData.taskType;
    
    // Auto-detection based on prompt keywords
    if (promptLower.includes('sentiment') || promptLower.includes('emotion')) {
      return 'sentiment_analysis';
    }
    if (promptLower.includes('summarize') || promptLower.includes('summary')) {
      return 'summarization';
    }
    if (promptLower.includes('translate') || promptLower.includes('translation')) {
      return 'translation';
    }
    if (promptLower.includes('code') || promptLower.includes('program') || promptLower.includes('function')) {
      return 'code_generation';
    }
    if (promptLower.includes('math') || promptLower.includes('calculate') || promptLower.includes('equation')) {
      return 'math_reasoning';
    }
    if (promptLower.includes('decide') || promptLower.includes('choose') || promptLower.includes('quick')) {
      return 'quick_decision';
    }
    if (promptLower.includes('analyze') || promptLower.includes('analysis')) {
      return 'text_analysis';
    }
    if (promptLower.includes('extract') || promptLower.includes('extraction')) {
      return 'data_extraction';
    }
    if (promptLower.includes('chinese') || promptLower.includes('中文')) {
      return 'chinese_tasks';
    }
    if (prompt.length > 2000) {
      return 'long_context';
    }
    
    // Default to content generation
    return 'content_generation';
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
   * Execute file operations node
   */
  private async executeFileOperationsNode(node: INode, context: ExecutionContext): Promise<NodeExecutionResult> {
    const { provider, operation, path, fileName, fileContent, config } = node.data;

    if (!provider || !operation) {
      return {
        type: 'error',
        error: 'File operations node requires provider and operation'
      };
    }

    try {
      const fileOperation = {
        operation,
        provider: {
          type: provider.type,
          credentials: provider.credentials
        },
        path: path ? this.replaceVariables(path, context.variables) : undefined,
        fileName: fileName ? this.replaceVariables(fileName, context.variables) : undefined,
        fileContent: fileContent ? this.replaceVariables(fileContent, context.variables) : undefined,
        ...config
      };

      const result = await this.fileOperationsService.executeFileOperation(fileOperation);

      return {
        type: 'success',
        output: {
          fileOperationResult: result,
          success: result.success,
          fileId: result.fileId,
          fileName: result.fileName,
          fileUrl: result.fileUrl,
          files: result.files
        }
      };
    } catch (error) {
      return {
        type: 'error',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Execute form builder node
   */
  private async executeFormBuilderNode(node: INode, context: ExecutionContext): Promise<NodeExecutionResult> {
    const { operation, formConfig, submissionData, formId } = node.data;

    try {
      switch (operation) {
        case 'create_form':
          const form = await this.formBuilderService.createForm(formConfig);
          return {
            type: 'success',
            output: {
              formCreated: true,
              formId: form.id,
              formUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/forms/${form.id}`
            }
          };

        case 'submit_form':
          if (!formId || !submissionData) {
            throw new Error('Form submission requires formId and submissionData');
          }
          
          const processedData = this.replaceObjectVariables(submissionData, context.variables);
          const submission = await this.formBuilderService.submitForm(formId, processedData);
          
          return {
            type: 'success',
            output: {
              formSubmitted: true,
              submissionId: submission.submissionId,
              success: submission.success,
              message: submission.message
            }
          };

        case 'get_submissions':
          if (!formId) {
            throw new Error('Getting submissions requires formId');
          }
          
          const submissions = await this.formBuilderService.getFormSubmissions(formId);
          return {
            type: 'success',
            output: {
              submissions: submissions.submissions,
              totalSubmissions: submissions.total
            }
          };

        default:
          throw new Error(`Unknown form operation: ${operation}`);
      }
    } catch (error) {
      return {
        type: 'error',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Execute data transformation node
   */
  private async executeDataTransformNode(node: INode, context: ExecutionContext): Promise<NodeExecutionResult> {
    const { inputData, transformConfig } = node.data;

    if (!inputData || !transformConfig) {
      return {
        type: 'error',
        error: 'Data transform node requires inputData and transformConfig'
      };
    }

    try {
      // Process input data with variables
      const processedInputData = typeof inputData === 'string' 
        ? this.replaceVariables(inputData, context.variables)
        : this.replaceObjectVariables(inputData, context.variables);

      const result = await this.dataTransformationService.transformData(processedInputData, transformConfig);

      return {
        type: 'success',
        output: {
          transformationResult: result,
          success: result.success,
          data: result.data,
          format: result.format,
          recordCount: result.recordCount,
          logs: result.logs
        }
      };
    } catch (error) {
      return {
        type: 'error',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Execute push notification node
   */
  private async executePushNotificationNode(node: INode, context: ExecutionContext): Promise<NodeExecutionResult> {
    const { config, message, templateId, recipients } = node.data;

    if (!config) {
      return {
        type: 'error',
        error: 'Push notification node requires config'
      };
    }

    try {
      let result;

      if (templateId && recipients) {
        // Send templated notification
        const processedVariables = this.replaceObjectVariables(context.variables, context.variables);
        result = await this.pushNotificationService.sendTemplatedNotification(
          config,
          templateId,
          processedVariables,
          recipients
        );
      } else if (message) {
        // Send direct notification
        const processedMessage = {
          ...message,
          title: this.replaceVariables(message.title, context.variables),
          body: this.replaceVariables(message.body, context.variables),
          to: Array.isArray(message.to) 
            ? message.to.map((recipient: string) => this.replaceVariables(recipient, context.variables))
            : this.replaceVariables(message.to, context.variables)
        };

        result = await this.pushNotificationService.sendNotification(config, processedMessage);
      } else {
        throw new Error('Push notification requires either message or templateId with recipients');
      }

      return {
        type: 'success',
        output: {
          notificationSent: result.success,
          messageId: result.messageId,
          successCount: result.successCount,
          failureCount: result.failureCount,
          results: result.results
        }
      };
    } catch (error) {
      return {
        type: 'error',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Execute email automation node
   */
  private async executeEmailAutomationNode(node: INode, context: ExecutionContext): Promise<NodeExecutionResult> {
    const { operation, templateId, recipients, variables, scheduleAt, automationRule } = node.data;

    try {
      switch (operation) {
        case 'send_single':
          if (!templateId || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
            throw new Error('Single email requires templateId and recipients array');
          }

          const recipient = {
            email: this.replaceVariables(recipients[0].email || recipients[0], context.variables),
            name: recipients[0].name ? this.replaceVariables(recipients[0].name, context.variables) : undefined,
            variables: { ...context.variables, ...variables }
          };

          const singleResult = await this.emailNotificationService.sendTemplatedEmail(templateId, recipient);
          
          return {
            type: 'success',
            output: {
              emailSent: singleResult.success,
              messageId: singleResult.messageId,
              error: singleResult.error
            }
          };

        case 'send_bulk':
          if (!templateId || !recipients) {
            throw new Error('Bulk email requires templateId and recipients');
          }

          const processedRecipients = recipients.map((recipient: any) => ({
            email: this.replaceVariables(recipient.email, context.variables),
            name: recipient.name ? this.replaceVariables(recipient.name, context.variables) : undefined,
            variables: { ...context.variables, ...recipient.variables, ...variables }
          }));

          const bulkResult = await this.emailNotificationService.sendBulkTemplatedEmails(
            templateId,
            processedRecipients,
            { ...context.variables, ...variables }
          );

          return {
            type: 'success',
            output: {
              campaignId: bulkResult.campaignId,
              emailsSent: bulkResult.sent,
              emailsFailed: bulkResult.failed,
              results: bulkResult.results
            }
          };

        case 'schedule_campaign':
          if (!templateId || !recipients || !scheduleAt) {
            throw new Error('Scheduled campaign requires templateId, recipients, and scheduleAt');
          }

          const scheduledResult = await this.emailNotificationService.scheduleEmailCampaign(
            templateId,
            recipients,
            new Date(scheduleAt),
            { ...context.variables, ...variables }
          );

          return {
            type: 'success',
            output: {
              campaignScheduled: true,
              campaignId: scheduledResult.campaignId
            }
          };

        case 'create_automation':
          if (!automationRule) {
            throw new Error('Create automation requires automationRule');
          }

          const rule = await this.emailNotificationService.createAutomationRule(automationRule);

          return {
            type: 'success',
            output: {
              automationCreated: true,
              ruleId: rule.id
            }
          };

        case 'send_system_notification':
          const { notificationType, systemRecipients, systemData } = node.data;
          
          if (!notificationType || !systemRecipients) {
            throw new Error('System notification requires notificationType and systemRecipients');
          }

          await this.emailNotificationService.sendSystemNotification(
            notificationType,
            systemRecipients,
            { ...context.variables, ...systemData }
          );

          return {
            type: 'success',
            output: {
              systemNotificationSent: true,
              type: notificationType,
              recipients: systemRecipients.length
            }
          };

        default:
          throw new Error(`Unknown email automation operation: ${operation}`);
      }
    } catch (error) {
      return {
        type: 'error',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Replace variables in object recursively
   */
  private replaceObjectVariables(obj: any, variables: Record<string, any>): any {
    if (typeof obj === 'string') {
      return this.replaceVariables(obj, variables);
    } else if (Array.isArray(obj)) {
      return obj.map(item => this.replaceObjectVariables(item, variables));
    } else if (obj && typeof obj === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.replaceObjectVariables(value, variables);
      }
      return result;
    }
    return obj;
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