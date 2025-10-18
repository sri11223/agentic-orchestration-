import axios, { AxiosInstance } from 'axios';
import { EventBus } from '../engine/event-bus';

export interface PushNotificationConfig {
  provider: 'fcm' | 'apns' | 'web_push' | 'custom';
  credentials: {
    // FCM (Firebase Cloud Messaging)
    serverKey?: string;
    projectId?: string;
    
    // APNS (Apple Push Notification Service)
    keyId?: string;
    teamId?: string;
    privateKey?: string;
    
    // Web Push
    vapidPublicKey?: string;
    vapidPrivateKey?: string;
    
    // Custom webhook
    webhookUrl?: string;
    headers?: Record<string, string>;
  };
}

export interface PushNotificationMessage {
  to: string | string[]; // Device token(s) or topic
  title: string;
  body: string;
  data?: Record<string, any>; // Custom data payload
  options?: {
    icon?: string;
    image?: string;
    badge?: string;
    sound?: string;
    clickAction?: string;
    url?: string; // For web notifications
    priority?: 'normal' | 'high';
    ttl?: number; // Time to live in seconds
    collapseKey?: string;
    tag?: string; // For web notifications
    requireInteraction?: boolean; // For web notifications
    silent?: boolean;
    actions?: Array<{
      action: string;
      title: string;
      icon?: string;
    }>;
  };
  scheduling?: {
    sendAt?: Date;
    timezone?: string;
  };
}

export interface PushNotificationResult {
  success: boolean;
  messageId?: string;
  successCount?: number;
  failureCount?: number;
  results?: Array<{
    messageId?: string;
    registrationToken?: string;
    error?: string;
  }>;
  error?: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  options?: any;
  variables?: string[]; // List of variables that can be substituted
}

export class PushNotificationService {
  private fcmClient?: AxiosInstance;
  private webPushClient?: any; // Would use web-push library in production
  private eventBus: EventBus;
  private templates: Map<string, NotificationTemplate> = new Map();

  constructor() {
    this.eventBus = EventBus.getInstance();
    this.initializeTemplates();
  }

  /**
   * Send push notification
   */
  async sendNotification(
    config: PushNotificationConfig,
    message: PushNotificationMessage
  ): Promise<PushNotificationResult> {
    try {
      // Check if message is scheduled
      if (message.scheduling?.sendAt && message.scheduling.sendAt > new Date()) {
        return await this.scheduleNotification(config, message);
      }

      switch (config.provider) {
        case 'fcm':
          return await this.sendFCMNotification(config, message);
        case 'apns':
          return await this.sendAPNSNotification(config, message);
        case 'web_push':
          return await this.sendWebPushNotification(config, message);
        case 'custom':
          return await this.sendCustomNotification(config, message);
        default:
          throw new Error(`Unsupported push notification provider: ${config.provider}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Send Firebase Cloud Messaging notification
   */
  private async sendFCMNotification(
    config: PushNotificationConfig,
    message: PushNotificationMessage
  ): Promise<PushNotificationResult> {
    const client = this.getFCMClient(config.credentials.serverKey!);
    
    const fcmPayload = this.buildFCMPayload(message);
    
    try {
      const response = await client.post('/fcm/send', fcmPayload);
      
      return {
        success: response.data.success > 0,
        messageId: response.data.multicast_id?.toString(),
        successCount: response.data.success,
        failureCount: response.data.failure,
        results: response.data.results
      };
    } catch (error: any) {
      throw new Error(`FCM send failed: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Send Apple Push Notification Service notification
   */
  private async sendAPNSNotification(
    config: PushNotificationConfig,
    message: PushNotificationMessage
  ): Promise<PushNotificationResult> {
    // This would require proper APNS implementation with JWT tokens
    // For now, simulate the response
    console.log('APNS notification would be sent:', message);
    
    return {
      success: true,
      messageId: `apns_${Date.now()}`,
      successCount: Array.isArray(message.to) ? message.to.length : 1,
      failureCount: 0
    };
  }

  /**
   * Send Web Push notification
   */
  private async sendWebPushNotification(
    config: PushNotificationConfig,
    message: PushNotificationMessage
  ): Promise<PushNotificationResult> {
    // This would require web-push library implementation
    // For now, simulate the response
    console.log('Web Push notification would be sent:', message);
    
    return {
      success: true,
      messageId: `web_push_${Date.now()}`,
      successCount: Array.isArray(message.to) ? message.to.length : 1,
      failureCount: 0
    };
  }

  /**
   * Send custom webhook notification
   */
  private async sendCustomNotification(
    config: PushNotificationConfig,
    message: PushNotificationMessage
  ): Promise<PushNotificationResult> {
    if (!config.credentials.webhookUrl) {
      throw new Error('Webhook URL is required for custom notifications');
    }

    const payload = {
      notification: {
        title: message.title,
        body: message.body,
        data: message.data,
        options: message.options
      },
      recipients: Array.isArray(message.to) ? message.to : [message.to],
      timestamp: new Date().toISOString()
    };

    try {
      const response = await axios.post(config.credentials.webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          ...config.credentials.headers
        }
      });

      return {
        success: response.status >= 200 && response.status < 300,
        messageId: response.data?.messageId || `custom_${Date.now()}`,
        successCount: Array.isArray(message.to) ? message.to.length : 1,
        failureCount: 0
      };
    } catch (error: any) {
      throw new Error(`Custom notification failed: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Schedule notification for later delivery
   */
  private async scheduleNotification(
    config: PushNotificationConfig,
    message: PushNotificationMessage
  ): Promise<PushNotificationResult> {
    const scheduleTime = message.scheduling!.sendAt!;
    const delay = scheduleTime.getTime() - Date.now();

    if (delay <= 0) {
      // Send immediately if time has already passed
      return await this.sendNotification(config, { ...message, scheduling: undefined });
    }

    // Schedule using setTimeout (in production, you'd use a proper job queue)
    setTimeout(async () => {
      try {
        await this.sendNotification(config, { ...message, scheduling: undefined });
        this.eventBus.emitEvent('notification:scheduled_sent', {
          messageId: `scheduled_${Date.now()}`,
          sentAt: new Date().toISOString()
        });
      } catch (error) {
        this.eventBus.emitEvent('notification:scheduled_failed', {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }, delay);

    return {
      success: true,
      messageId: `scheduled_${Date.now()}`,
      successCount: 0, // Will be sent later
      failureCount: 0
    };
  }

  /**
   * Send bulk notifications
   */
  async sendBulkNotifications(
    config: PushNotificationConfig,
    messages: PushNotificationMessage[]
  ): Promise<PushNotificationResult[]> {
    const results: PushNotificationResult[] = [];
    
    for (const message of messages) {
      try {
        const result = await this.sendNotification(config, message);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return results;
  }

  /**
   * Send notification using template
   */
  async sendTemplatedNotification(
    config: PushNotificationConfig,
    templateId: string,
    variables: Record<string, any>,
    recipients: string | string[]
  ): Promise<PushNotificationResult> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const message: PushNotificationMessage = {
      to: recipients,
      title: this.replaceVariables(template.title, variables),
      body: this.replaceVariables(template.body, variables),
      data: template.data ? this.replaceObjectVariables(template.data, variables) : undefined,
      options: template.options
    };

    return await this.sendNotification(config, message);
  }

  /**
   * Create notification template
   */
  createTemplate(template: Omit<NotificationTemplate, 'id'>): NotificationTemplate {
    const id = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullTemplate: NotificationTemplate = { ...template, id };
    
    this.templates.set(id, fullTemplate);
    
    this.eventBus.emitEvent('notification:template_created', { templateId: id });
    
    return fullTemplate;
  }

  /**
   * Get all templates
   */
  getTemplates(): NotificationTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Delete template
   */
  deleteTemplate(templateId: string): boolean {
    const deleted = this.templates.delete(templateId);
    if (deleted) {
      this.eventBus.emitEvent('notification:template_deleted', { templateId });
    }
    return deleted;
  }

  /**
   * Subscribe device to topic (for FCM)
   */
  async subscribeToTopic(
    config: PushNotificationConfig,
    tokens: string[],
    topic: string
  ): Promise<{ successCount: number; failureCount: number; errors?: any[] }> {
    if (config.provider !== 'fcm') {
      throw new Error('Topic subscription only supported for FCM');
    }

    const client = this.getFCMClient(config.credentials.serverKey!);
    
    try {
      const response = await client.post('/iid/v1:batchAdd', {
        to: `/topics/${topic}`,
        registration_tokens: tokens
      });

      return {
        successCount: response.data.successCount || 0,
        failureCount: response.data.failureCount || 0,
        errors: response.data.errors
      };
    } catch (error: any) {
      throw new Error(`Topic subscription failed: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Unsubscribe device from topic (for FCM)
   */
  async unsubscribeFromTopic(
    config: PushNotificationConfig,
    tokens: string[],
    topic: string
  ): Promise<{ successCount: number; failureCount: number; errors?: any[] }> {
    if (config.provider !== 'fcm') {
      throw new Error('Topic unsubscription only supported for FCM');
    }

    const client = this.getFCMClient(config.credentials.serverKey!);
    
    try {
      const response = await client.post('/iid/v1:batchRemove', {
        to: `/topics/${topic}`,
        registration_tokens: tokens
      });

      return {
        successCount: response.data.successCount || 0,
        failureCount: response.data.failureCount || 0,
        errors: response.data.errors
      };
    } catch (error: any) {
      throw new Error(`Topic unsubscription failed: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Validate device token
   */
  async validateToken(config: PushNotificationConfig, token: string): Promise<boolean> {
    try {
      // Send a test notification with dry_run flag
      const testMessage: PushNotificationMessage = {
        to: token,
        title: 'Test',
        body: 'Token validation'
      };

      if (config.provider === 'fcm') {
        const client = this.getFCMClient(config.credentials.serverKey!);
        const payload = { ...this.buildFCMPayload(testMessage), dry_run: true };
        
        const response = await client.post('/fcm/send', payload);
        return response.data.success > 0;
      }

      return true; // For other providers, assume valid
    } catch {
      return false;
    }
  }

  // Private helper methods
  private getFCMClient(serverKey: string): AxiosInstance {
    if (!this.fcmClient) {
      this.fcmClient = axios.create({
        baseURL: 'https://fcm.googleapis.com',
        headers: {
          'Authorization': `key=${serverKey}`,
          'Content-Type': 'application/json'
        }
      });
    }
    return this.fcmClient;
  }

  private buildFCMPayload(message: PushNotificationMessage): any {
    const payload: any = {
      notification: {
        title: message.title,
        body: message.body,
        icon: message.options?.icon,
        image: message.options?.image,
        sound: message.options?.sound,
        click_action: message.options?.clickAction
      },
      data: message.data || {},
      priority: message.options?.priority || 'normal',
      time_to_live: message.options?.ttl || 3600
    };

    if (Array.isArray(message.to)) {
      payload.registration_ids = message.to;
    } else if (message.to.startsWith('/topics/')) {
      payload.to = message.to;
    } else {
      payload.to = message.to;
    }

    if (message.options?.collapseKey) {
      payload.collapse_key = message.options.collapseKey;
    }

    return payload;
  }

  private replaceVariables(template: string, variables: Record<string, any>): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(regex, String(value));
    }
    return result;
  }

  private replaceObjectVariables(obj: Record<string, any>, variables: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        result[key] = this.replaceVariables(value, variables);
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  private initializeTemplates(): void {
    // Initialize some common templates
    const defaultTemplates: Omit<NotificationTemplate, 'id'>[] = [
      {
        name: 'Welcome Notification',
        title: 'Welcome {{userName}}!',
        body: 'Thanks for joining {{appName}}. Get started now!',
        variables: ['userName', 'appName'],
        options: {
          icon: '/icons/welcome.png',
          clickAction: '/onboarding'
        }
      },
      {
        name: 'Task Reminder',
        title: 'Task Due Soon',
        body: 'Your task "{{taskName}}" is due {{dueTime}}',
        variables: ['taskName', 'dueTime'],
        options: {
          icon: '/icons/task.png',
          priority: 'high'
        }
      },
      {
        name: 'Workflow Complete',
        title: 'Workflow Completed',
        body: 'Your workflow "{{workflowName}}" has completed successfully',
        variables: ['workflowName'],
        data: {
          type: 'workflow_complete',
          workflowId: '{{workflowId}}'
        }
      }
    ];

    for (const template of defaultTemplates) {
      this.createTemplate(template);
    }
  }

  /**
   * Get notification analytics
   */
  getAnalytics(): any {
    // This would integrate with your analytics system
    return {
      totalSent: 0,
      successRate: 0,
      topTemplates: [],
      deviceTypes: {},
      timeOfDayStats: {}
    };
  }
}