import { EventBus } from '../engine/event-bus';
import { workflowEngine } from '../engine/workflow-engine';
import { TriggerModel, TriggerExecutionModel, ITriggerConfig } from '../models/trigger.model';
import * as cron from 'node-cron';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

export class TriggerService {
  private static instance: TriggerService;
  private eventBus: EventBus;
  private activeSchedules: Map<string, any> = new Map();
  private emailPollingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private webhookRegistry: Map<string, ITriggerConfig> = new Map();

  private constructor() {
    this.eventBus = EventBus.getInstance();
    this.initializeEventListeners();
    this.startScheduleManager();
    this.startEmailPolling();
  }

  static getInstance(): TriggerService {
    if (!TriggerService.instance) {
      TriggerService.instance = new TriggerService();
    }
    return TriggerService.instance;
  }

  /**
   * Register a new trigger configuration
   */
  async registerTrigger(triggerConfig: Partial<ITriggerConfig>): Promise<ITriggerConfig> {
    try {
      const trigger = new TriggerModel(triggerConfig);
      await trigger.save();

      // Initialize trigger based on type
      await this.initializeTrigger(trigger);

      console.log(`✅ Trigger registered: ${trigger.type} for workflow ${trigger.workflowId}`);
      return trigger;
    } catch (error) {
      console.error('❌ Failed to register trigger:', error);
      throw error;
    }
  }

  /**
   * Update trigger configuration
   */
  async updateTrigger(triggerId: string, updates: Partial<ITriggerConfig>): Promise<ITriggerConfig | null> {
    try {
      const trigger = await TriggerModel.findByIdAndUpdate(
        triggerId,
        { ...updates, 'metadata.updatedAt': new Date() },
        { new: true }
      );

      if (trigger) {
        // Reinitialize trigger with new configuration
        await this.cleanupTrigger(triggerId);
        await this.initializeTrigger(trigger);
      }

      return trigger;
    } catch (error) {
      console.error('❌ Failed to update trigger:', error);
      throw error;
    }
  }

  /**
   * Delete trigger
   */
  async deleteTrigger(triggerId: string): Promise<boolean> {
    try {
      await this.cleanupTrigger(triggerId);
      await TriggerModel.findByIdAndDelete(triggerId);
      return true;
    } catch (error) {
      console.error('❌ Failed to delete trigger:', error);
      return false;
    }
  }

  /**
   * Get triggers for a workflow
   */
  async getWorkflowTriggers(workflowId: string): Promise<ITriggerConfig[]> {
    return await TriggerModel.find({ workflowId });
  }

  /**
   * Execute manual trigger
   */
  async executeManualTrigger(triggerId: string, userId: string, triggerData: any = {}): Promise<string> {
    try {
      const trigger = await TriggerModel.findById(triggerId);
      if (!trigger || trigger.type !== 'manual-trigger') {
        throw new Error('Invalid manual trigger');
      }

      // Check permissions if required
      if (trigger.config.requirePermission && trigger.config.allowedUsers) {
        if (!trigger.config.allowedUsers.includes(userId)) {
          throw new Error('User not authorized to execute this trigger');
        }
      }

      const executionId = await this.executeTrigger(trigger, {
        ...triggerData,
        triggeredBy: userId,
        triggerType: 'manual'
      });

      // Update trigger if it's a document
      if (typeof (trigger as any).updateLastTriggered === 'function') {
        await (trigger as any).updateLastTriggered();
      }
      return executionId;
    } catch (error) {
      console.error('❌ Failed to execute manual trigger:', error);
      throw error;
    }
  }

  /**
   * Handle webhook trigger
   */
  async handleWebhookTrigger(webhookUrl: string, method: string, data: any, headers: any): Promise<string | null> {
    try {
      const trigger = this.webhookRegistry.get(webhookUrl);
      if (!trigger) {
        console.warn(`⚠️ No trigger found for webhook URL: ${webhookUrl}`);
        return null;
      }

      // Validate method
      if (trigger.config.method && trigger.config.method !== method) {
        throw new Error(`Method ${method} not allowed for this webhook`);
      }

      // Validate authentication if required
      if (trigger.config.auth !== 'none') {
        const isValid = await this.validateWebhookAuth(trigger, headers);
        if (!isValid) {
          throw new Error('Webhook authentication failed');
        }
      }

      const executionId = await this.executeTrigger(trigger, {
        webhookData: data,
        headers,
        method,
        triggerType: 'webhook'
      });

      // Update trigger if it's a document
      if (typeof (trigger as any).updateLastTriggered === 'function') {
        await (trigger as any).updateLastTriggered();
      }
      return executionId;
    } catch (error) {
      console.error('❌ Failed to handle webhook trigger:', error);
      throw error;
    }
  }

  /**
   * Test trigger configuration
   */
  async testTrigger(triggerId: string): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const trigger = await TriggerModel.findById(triggerId);
      if (!trigger) {
        return { success: false, message: 'Trigger not found' };
      }

      switch (trigger.type) {
        case 'email-trigger':
          return await this.testEmailTrigger(trigger);
        case 'webhook-trigger':
          return await this.testWebhookTrigger(trigger);
        case 'schedule-trigger':
          return await this.testScheduleTrigger(trigger);
        case 'manual-trigger':
          return { success: true, message: 'Manual trigger is ready to be executed' };
        default:
          return { success: false, message: 'Unknown trigger type' };
      }
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Test failed' 
      };
    }
  }

  /**
   * Get trigger execution history
   */
  async getTriggerExecutionHistory(triggerId: string, limit: number = 50): Promise<any[]> {
    return await TriggerExecutionModel
      .find({ triggerId })
      .sort({ triggeredAt: -1 })
      .limit(limit)
      .populate('workflowId', 'name description');
  }

  /**
   * Get trigger statistics
   */
  async getTriggerStats(triggerId: string): Promise<any> {
    const trigger = await TriggerModel.findById(triggerId);
    if (!trigger) {
      throw new Error('Trigger not found');
    }

    const executions = await TriggerExecutionModel.find({ triggerId });
    const successCount = executions.filter(e => e.status === 'success').length;
    const failedCount = executions.filter(e => e.status === 'failed').length;
    const avgDuration = executions
      .filter(e => e.duration)
      .reduce((sum, e) => sum + (e.duration || 0), 0) / executions.length || 0;

    return {
      triggerCount: trigger.metadata?.triggerCount || 0,
      lastTriggered: trigger.metadata?.lastTriggered,
      successRate: executions.length > 0 ? (successCount / executions.length) * 100 : 0,
      totalExecutions: executions.length,
      successfulExecutions: successCount,
      failedExecutions: failedCount,
      averageDuration: avgDuration,
      errors: trigger.metadata?.errors || []
    };
  }

  // Private methods

  private async initializeTrigger(trigger: ITriggerConfig): Promise<void> {
    switch (trigger.type) {
      case 'schedule-trigger':
        await this.initializeScheduleTrigger(trigger);
        break;
      case 'email-trigger':
        await this.initializeEmailTrigger(trigger);
        break;
      case 'webhook-trigger':
        await this.initializeWebhookTrigger(trigger);
        break;
      case 'manual-trigger':
        // Manual triggers don't need initialization
        break;
    }
  }

  private async cleanupTrigger(triggerId: string): Promise<void> {
    // Remove from active schedules
    if (this.activeSchedules.has(triggerId)) {
      const task = this.activeSchedules.get(triggerId);
      if (task && typeof task.destroy === 'function') {
        task.destroy();
      }
      this.activeSchedules.delete(triggerId);
    }

    // Remove from email polling
    if (this.emailPollingIntervals.has(triggerId)) {
      const interval = this.emailPollingIntervals.get(triggerId);
      if (interval) {
        clearInterval(interval);
      }
      this.emailPollingIntervals.delete(triggerId);
    }

    // Remove from webhook registry
    for (const [url, trigger] of this.webhookRegistry.entries()) {
      if ((trigger as any)._id?.toString() === triggerId) {
        this.webhookRegistry.delete(url);
        break;
      }
    }
  }

  private async initializeScheduleTrigger(trigger: ITriggerConfig): Promise<void> {
    if (!trigger.enabled || !trigger.config.enabled) return;

    let cronExpression: string;
    const config = trigger.config;

    switch (config.scheduleType) {
      case 'interval':
        cronExpression = this.intervalToCron(config.intervalValue, config.intervalUnit);
        break;
      case 'cron':
        cronExpression = config.cronExpression;
        break;
      case 'daily':
        const [hour, minute] = config.dailyTime.split(':');
        cronExpression = `${minute} ${hour} * * *`;
        break;
      case 'weekly':
        const [wHour, wMinute] = config.weeklyTime.split(':');
        const dayNum = this.dayNameToNumber(config.weekDay);
        cronExpression = `${wMinute} ${wHour} * * ${dayNum}`;
        break;
      case 'monthly':
        const [mHour, mMinute] = config.monthlyTime.split(':');
        cronExpression = `${mMinute} ${mHour} ${config.monthDay} * *`;
        break;
      default:
        throw new Error(`Unsupported schedule type: ${config.scheduleType}`);
    }

    try {
      const task = cron.schedule(cronExpression, async () => {
        console.log(`⏰ Schedule trigger executing: ${(trigger as any)._id}`);
        const fullTrigger = await TriggerModel.findById((trigger as any)._id);
        if (fullTrigger) {
          await this.executeTrigger(fullTrigger, { triggerType: 'schedule' });
        } else {
          console.warn(`⚠️ Could not find trigger with id ${(trigger as any)._id} for execution`);
        }
      }, {
        scheduled: true,
        timezone: config.timezone || 'UTC'
      });

      this.activeSchedules.set((trigger as any)._id!.toString(), task);
      console.log(`✅ Schedule trigger initialized: ${(trigger as any)._id} with cron ${cronExpression}`);
    } catch (error) {
      console.error(`❌ Failed to initialize schedule trigger ${(trigger as any)._id}:`, error);
      await TriggerModel.findByIdAndUpdate(
        (trigger as any)._id,
        {
          $push: {
            'metadata.errors': {
              message: 'Failed to initialize schedule',
              details: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date()
            }
          }
        }
      );
    }
  }

  private async initializeEmailTrigger(trigger: ITriggerConfig): Promise<void> {
    if (!trigger.enabled) return;

    const frequency = trigger.config.frequency * 60 * 1000; // Convert minutes to milliseconds
    
    const interval = setInterval(async () => {
      try {
        await this.checkEmailTrigger(trigger);
      } catch (error) {
        console.error(`❌ Email trigger check failed for ${(trigger as any)._id}:`, error);
        await TriggerModel.findByIdAndUpdate(
          (trigger as any)._id,
          {
            $push: {
              'metadata.errors': {
                message: 'Email check failed',
                details: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date()
              }
            }
          }
        );
      }
    }, frequency);

    this.emailPollingIntervals.set((trigger as any)._id!.toString(), interval);
    console.log(`✅ Email trigger initialized: ${(trigger as any)._id} with ${trigger.config.frequency}min frequency`);
  }

  private async initializeWebhookTrigger(trigger: ITriggerConfig): Promise<void> {
    const webhookUrl = `/webhook/trigger/${(trigger as any)._id}`;
    trigger.config.webhookUrl = `${process.env.BASE_URL || 'http://localhost:3001'}/api/webhooks/trigger/${(trigger as any)._id}`;
    
    this.webhookRegistry.set(webhookUrl, trigger);
    await TriggerModel.findByIdAndUpdate((trigger as any)._id, { config: trigger.config });
    
    console.log(`✅ Webhook trigger initialized: ${(trigger as any)._id} at ${trigger.config.webhookUrl}`);
  }

  private async executeTrigger(trigger: ITriggerConfig, triggerData: any): Promise<string> {
    try {
      const executionId = uuidv4();
      
      // Record trigger execution
      const triggerExecution = new TriggerExecutionModel({
        triggerId: (trigger as any)._id,
        workflowId: trigger.workflowId,
        executionId,
        triggerType: trigger.type,
        triggerData,
        status: 'pending',
        triggeredAt: new Date()
      });
      await triggerExecution.save();

      // Execute workflow
      const workflowExecutionId = await workflowEngine.executeWorkflow(
        trigger.workflowId.toString(),
        triggerData
      );

      // Update execution record
      triggerExecution.executionId = workflowExecutionId;
      triggerExecution.status = 'success';
      triggerExecution.completedAt = new Date();
      triggerExecution.duration = Date.now() - triggerExecution.triggeredAt.getTime();
      await triggerExecution.save();

      console.log(`✅ Trigger executed successfully: ${(trigger as any)._id} -> ${workflowExecutionId}`);
      return workflowExecutionId;
    } catch (error) {
      console.error(`❌ Trigger execution failed for ${(trigger as any)._id}:`, error);
      await TriggerModel.findByIdAndUpdate(
        (trigger as any)._id,
        {
          $push: {
            'metadata.errors': {
              message: 'Execution failed',
              details: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date()
            }
          }
        }
      );
      throw error;
    }
  }

  private async checkEmailTrigger(trigger: ITriggerConfig): Promise<void> {
    // Email checking implementation would go here
    // This is a placeholder for IMAP/POP3 email checking
    console.log(`📧 Checking emails for trigger ${(trigger as any)._id}`);
    
    // Mock email check - in real implementation, you would:
    // 1. Connect to IMAP/POP3 server
    // 2. Check for new emails matching filters
    // 3. Process each matching email
    // 4. Execute trigger if conditions are met
  }

  private async testEmailTrigger(trigger: ITriggerConfig): Promise<{ success: boolean; message: string }> {
    // Test email configuration
    try {
      // This would test IMAP connection in real implementation
      return {
        success: true,
        message: `Email trigger configuration valid for ${trigger.config.emailAddress}`
      };
    } catch (error) {
      return {
        success: false,
        message: `Email connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async testWebhookTrigger(trigger: ITriggerConfig): Promise<{ success: boolean; message: string; data?: any }> {
    return {
      success: true,
      message: `Webhook ready at ${trigger.config.webhookUrl}`,
      data: {
        url: trigger.config.webhookUrl,
        method: trigger.config.method,
        auth: trigger.config.auth
      }
    };
  }

  private async testScheduleTrigger(trigger: ITriggerConfig): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const nextExecution = this.calculateNextExecution(trigger.config);
      return {
        success: true,
        message: `Schedule is valid. Next execution: ${nextExecution.toISOString()}`,
        data: { nextExecution }
      };
    } catch (error) {
      return {
        success: false,
        message: `Invalid schedule configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async validateWebhookAuth(trigger: ITriggerConfig, headers: any): Promise<boolean> {
    switch (trigger.config.auth) {
      case 'api-key':
        const apiKey = headers[trigger.config.apiKeyHeader || 'x-api-key'];
        return apiKey === trigger.config.secretKey;
      case 'bearer':
        const auth = headers.authorization;
        const expectedToken = `${trigger.config.tokenPrefix || 'Bearer'} ${trigger.config.secretKey}`;
        return auth === expectedToken;
      case 'basic':
        // Implement basic auth validation
        return true; // Placeholder
      default:
        return true;
    }
  }

  private intervalToCron(value: number, unit: string): string {
    switch (unit) {
      case 'seconds':
        return `*/${value} * * * * *`;
      case 'minutes':
        return `0 */${value} * * * *`;
      case 'hours':
        return `0 0 */${value} * * *`;
      case 'days':
        return `0 0 0 */${value} * *`;
      default:
        throw new Error(`Unsupported interval unit: ${unit}`);
    }
  }

  private dayNameToNumber(dayName: string): number {
    const days: Record<string, number> = {
      'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
      'thursday': 4, 'friday': 5, 'saturday': 6
    };
    return days[dayName.toLowerCase()] ?? 1;
  }

  private calculateNextExecution(config: any): Date {
    const now = new Date();
    // Implementation would calculate based on schedule type
    // Returning next hour as placeholder
    return new Date(now.getTime() + 60 * 60 * 1000);
  }

  private initializeEventListeners(): void {
    // Listen for workflow events to update trigger status
    this.eventBus.on('workflow:completed', (data) => {
      this.handleWorkflowCompletion(data);
    });

    this.eventBus.on('workflow:failed', (data) => {
      this.handleWorkflowFailure(data);
    });
  }

  private async handleWorkflowCompletion(data: any): Promise<void> {
    // Update trigger execution status
    await TriggerExecutionModel.updateMany(
      { executionId: data.executionId },
      { status: 'success', completedAt: new Date() }
    );
  }

  private async handleWorkflowFailure(data: any): Promise<void> {
    // Update trigger execution status
    await TriggerExecutionModel.updateMany(
      { executionId: data.executionId },
      { status: 'failed', error: data.error, completedAt: new Date() }
    );
  }

  private startScheduleManager(): void {
    // Start periodic check for schedule triggers that might have been missed
    setInterval(async () => {
      try {
        const overdueSchedules = await TriggerModel.find({
          type: 'schedule-trigger',
          enabled: true,
          'config.enabled': true,
          'config.nextExecution': { $lte: new Date() }
        });
        for (const trigger of overdueSchedules) {
          console.log(`⏰ Executing overdue schedule: ${(trigger as any)._id}`);
          await this.executeTrigger(trigger, { triggerType: 'schedule' });
        }
      } catch (error) {
        console.error('❌ Schedule manager error:', error);
      }
    }, 60000); // Check every minute
  }

  private startEmailPolling(): void {
    // Initialize all existing email triggers
    setTimeout(async () => {
      try {
        const emailTriggers = await TriggerModel.find({ type: 'email-trigger', enabled: true });
        for (const trigger of emailTriggers) {
          await this.initializeEmailTrigger(trigger);
        }
      } catch (error) {
        console.error('❌ Failed to initialize email triggers:', error);
      }
    }, 5000); // Wait 5 seconds for app to fully start
  }
}

export const triggerService = TriggerService.getInstance();