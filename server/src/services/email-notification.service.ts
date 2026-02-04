import { GmailService, EmailMessage } from './gmail.service';
import { EventBus } from '../engine/event-bus';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  variables: string[];
  category: 'notification' | 'marketing' | 'transactional' | 'system';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailCampaign {
  id: string;
  name: string;
  templateId: string;
  recipients: EmailRecipient[];
  scheduledAt?: Date;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  stats: {
    sent: number;
    delivered: number;
    failed: number;
    opened?: number;
    clicked?: number;
  };
  createdAt: Date;
}

export interface EmailRecipient {
  email: string;
  name?: string;
  variables?: Record<string, any>;
  subscriptionStatus?: 'active' | 'unsubscribed' | 'bounced';
}

export interface AutomationRule {
  id: string;
  name: string;
  trigger: {
    event: string;
    conditions?: Array<{
      field: string;
      operator: string;
      value: any;
    }>;
  };
  action: {
    templateId: string;
    delay?: number; // in minutes
    recipientField: string;
  };
  isActive: boolean;
}

export interface EmailAnalytics {
  totalSent: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  unsubscribeRate: number;
  topTemplates: Array<{
    templateId: string;
    name: string;
    sent: number;
    openRate: number;
  }>;
  timeStats: Record<string, number>;
}

export class EmailNotificationService {
  private gmailService: GmailService;
  private eventBus: EventBus;
  private templates: Map<string, EmailTemplate> = new Map();
  private campaigns: Map<string, EmailCampaign> = new Map();
  private automationRules: Map<string, AutomationRule> = new Map();
  private emailStats: Map<string, any> = new Map();

  constructor() {
    this.gmailService = new GmailService();
    this.eventBus = EventBus.getInstance();
    this.initializeDefaultTemplates();
    this.setupEventListeners();
  }

  /**
   * Create email template
   */
  createTemplate(templateData: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>): EmailTemplate {
    const template: EmailTemplate = {
      ...templateData,
      id: `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.templates.set(template.id, template);
    
    this.eventBus.emitEvent('email:template_created', {
      templateId: template.id,
      name: template.name
    });

    return template;
  }

  /**
   * Update email template
   */
  updateTemplate(templateId: string, updates: Partial<EmailTemplate>): EmailTemplate {
    const existing = this.templates.get(templateId);
    if (!existing) {
      throw new Error(`Template ${templateId} not found`);
    }

    const updated: EmailTemplate = {
      ...existing,
      ...updates,
      id: templateId,
      updatedAt: new Date()
    };

    this.templates.set(templateId, updated);
    
    this.eventBus.emitEvent('email:template_updated', { templateId });
    
    return updated;
  }

  /**
   * Send single email using template
   */
  async sendTemplatedEmail(
    templateId: string,
    recipient: EmailRecipient,
    customVariables?: Record<string, any>
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const template = this.templates.get(templateId);
      if (!template) {
        throw new Error(`Template ${templateId} not found`);
      }

      if (!template.isActive) {
        throw new Error(`Template ${templateId} is not active`);
      }

      // Merge variables
      const variables = {
        ...recipient.variables,
        ...customVariables,
        recipientEmail: recipient.email,
        recipientName: recipient.name || recipient.email,
        currentDate: new Date().toLocaleDateString(),
        currentTime: new Date().toLocaleTimeString()
      };

      // Process template
      const processedSubject = this.processTemplate(template.subject, variables);
      const processedHtmlBody = this.processTemplate(template.htmlBody, variables);
      const processedTextBody = template.textBody ? this.processTemplate(template.textBody, variables) : undefined;

      // Send email
      const emailMessage: EmailMessage = {
        to: recipient.email,
        subject: processedSubject,
        body: processedHtmlBody,
        isHtml: true
      };

      const result = await this.gmailService.sendEmail(emailMessage);

      // Track email
      this.trackEmailSent(templateId, recipient.email, result.messageId);

      return {
        success: true,
        messageId: result.messageId
      };

    } catch (error) {
      this.trackEmailFailed(templateId, recipient.email, error instanceof Error ? error.message : String(error));
      
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Send bulk emails using template
   */
  async sendBulkTemplatedEmails(
    templateId: string,
    recipients: EmailRecipient[],
    globalVariables?: Record<string, any>
  ): Promise<{
    campaignId: string;
    sent: number;
    failed: number;
    results: Array<{ email: string; success: boolean; messageId?: string; error?: string }>;
  }> {
    const campaign = this.createCampaign(templateId, recipients);
    const results: Array<{ email: string; success: boolean; messageId?: string; error?: string }> = [];

    let sent = 0;
    let failed = 0;

    // Process recipients in batches to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (recipient) => {
        const result = await this.sendTemplatedEmail(templateId, recipient, globalVariables);
        
        if (result.success) {
          sent++;
        } else {
          failed++;
        }

        return {
          email: recipient.email,
          success: result.success,
          messageId: result.messageId,
          error: result.error
        };
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Small delay between batches
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Update campaign stats
    campaign.stats.sent = sent;
    campaign.stats.failed = failed;
    campaign.status = failed > 0 ? 'failed' : 'sent';
    this.campaigns.set(campaign.id, campaign);

    this.eventBus.emitEvent('email:campaign_completed', {
      campaignId: campaign.id,
      sent,
      failed
    });

    return {
      campaignId: campaign.id,
      sent,
      failed,
      results
    };
  }

  /**
   * Schedule email campaign
   */
  async scheduleEmailCampaign(
    templateId: string,
    recipients: EmailRecipient[],
    scheduledAt: Date,
    globalVariables?: Record<string, any>
  ): Promise<{ campaignId: string }> {
    const campaign = this.createCampaign(templateId, recipients, scheduledAt);
    
    const delay = scheduledAt.getTime() - Date.now();
    
    if (delay <= 0) {
      // Send immediately if time has passed
      await this.sendBulkTemplatedEmails(templateId, recipients, globalVariables);
    } else {
      // Schedule for later
      setTimeout(async () => {
        try {
          await this.sendBulkTemplatedEmails(templateId, recipients, globalVariables);
        } catch (error) {
          console.error('Scheduled email campaign failed:', error);
          campaign.status = 'failed';
          this.campaigns.set(campaign.id, campaign);
        }
      }, delay);
    }

    return { campaignId: campaign.id };
  }

  /**
   * Create automation rule
   */
  createAutomationRule(ruleData: Omit<AutomationRule, 'id'>): AutomationRule {
    const rule: AutomationRule = {
      ...ruleData,
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    this.automationRules.set(rule.id, rule);
    
    this.eventBus.emitEvent('email:automation_rule_created', { ruleId: rule.id });
    
    return rule;
  }

  /**
   * Process automation event
   */
  async processAutomationEvent(eventType: string, eventData: Record<string, any>): Promise<void> {
    const matchingRules = Array.from(this.automationRules.values()).filter(rule => 
      rule.isActive && rule.trigger.event === eventType
    );

    for (const rule of matchingRules) {
      try {
        // Check conditions
        if (rule.trigger.conditions && !this.evaluateConditions(rule.trigger.conditions, eventData)) {
          continue;
        }

        // Extract recipient email
        const recipientEmail = this.extractRecipientEmail(rule.action.recipientField, eventData);
        if (!recipientEmail) {
          console.warn(`No recipient email found for rule ${rule.id}`);
          continue;
        }

        const recipient: EmailRecipient = {
          email: recipientEmail,
          variables: eventData
        };

        // Apply delay if specified
        if (rule.action.delay && rule.action.delay > 0) {
          setTimeout(async () => {
            await this.sendTemplatedEmail(rule.action.templateId, recipient);
          }, rule.action.delay * 60 * 1000); // Convert minutes to milliseconds
        } else {
          await this.sendTemplatedEmail(rule.action.templateId, recipient);
        }

        this.eventBus.emitEvent('email:automation_triggered', {
          ruleId: rule.id,
          recipientEmail,
          templateId: rule.action.templateId
        });

      } catch (error) {
        console.error(`Automation rule ${rule.id} failed:`, error);
      }
    }
  }

  /**
   * Send system notification email
   */
  async sendSystemNotification(
    type: 'workflow_complete' | 'workflow_failed' | 'system_alert' | 'user_action',
    recipients: string[],
    data: Record<string, any>
  ): Promise<void> {
    const templateMap: Record<string, string> = {
      workflow_complete: 'system_workflow_complete',
      workflow_failed: 'system_workflow_failed',
      system_alert: 'system_alert',
      user_action: 'system_user_action'
    };

    const templateId = templateMap[type];
    if (!templateId) {
      console.warn(`No template found for system notification type: ${type}`);
      return;
    }

    // Check if template exists, create if not
    if (!this.templates.has(templateId)) {
      this.createSystemTemplate(templateId, type);
    }

    const emailRecipients: EmailRecipient[] = recipients.map(email => ({
      email,
      variables: data
    }));

    await this.sendBulkTemplatedEmails(templateId, emailRecipients);
  }

  /**
   * Get email analytics
   */
  getAnalytics(timeRange?: { start: Date; end: Date }): EmailAnalytics {
    const entries = Array.from(this.emailStats.values()).filter(entry => {
      if (!timeRange) return true;
      const sentAt = new Date(entry.sentAt);
      return sentAt >= timeRange.start && sentAt <= timeRange.end;
    });

    const totalSent = entries.length;
    const totalDelivered = entries.filter(entry => entry.status === 'sent').length;
    const totalFailed = entries.filter(entry => entry.status === 'failed').length;

    const templateCounts = entries.reduce<Record<string, number>>((acc, entry) => {
      acc[entry.templateId] = (acc[entry.templateId] || 0) + 1;
      return acc;
    }, {});

    const timeStats = entries.reduce<Record<string, number>>((acc, entry) => {
      const date = new Date(entry.sentAt);
      const hourLabel = `${String(date.getHours()).padStart(2, '0')}:00`;
      acc[hourLabel] = (acc[hourLabel] || 0) + 1;
      return acc;
    }, {});

    const topTemplates = Object.entries(templateCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([templateId, sent]) => ({
        templateId,
        name: this.templates.get(templateId)?.name || templateId,
        sent,
        openRate: 0
      }));

    return {
      totalSent,
      deliveryRate: totalSent > 0 ? totalDelivered / totalSent : 0,
      openRate: 0,
      clickRate: 0,
      bounceRate: totalSent > 0 ? totalFailed / totalSent : 0,
      unsubscribeRate: 0,
      topTemplates,
      timeStats
    };
  }

  /**
   * Get all templates
   */
  getTemplates(category?: string): EmailTemplate[] {
    const templates = Array.from(this.templates.values());
    return category ? templates.filter(t => t.category === category) : templates;
  }

  /**
   * Get campaign details
   */
  getCampaign(campaignId: string): EmailCampaign | null {
    return this.campaigns.get(campaignId) || null;
  }

  /**
   * Get all automation rules
   */
  getAutomationRules(): AutomationRule[] {
    return Array.from(this.automationRules.values());
  }

  // Private helper methods
  private createCampaign(
    templateId: string,
    recipients: EmailRecipient[],
    scheduledAt?: Date
  ): EmailCampaign {
    const campaign: EmailCampaign = {
      id: `camp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `Campaign ${new Date().toLocaleDateString()}`,
      templateId,
      recipients,
      scheduledAt,
      status: scheduledAt ? 'scheduled' : 'sending',
      stats: {
        sent: 0,
        delivered: 0,
        failed: 0
      },
      createdAt: new Date()
    };

    this.campaigns.set(campaign.id, campaign);
    return campaign;
  }

  private processTemplate(template: string, variables: Record<string, any>): string {
    let processed = template;
    
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      processed = processed.replace(regex, String(value));
    }

    return processed;
  }

  private evaluateConditions(conditions: any[], eventData: Record<string, any>): boolean {
    return conditions.every(condition => {
      const value = eventData[condition.field];
      
      switch (condition.operator) {
        case 'equals':
          return value === condition.value;
        case 'not_equals':
          return value !== condition.value;
        case 'contains':
          return String(value).includes(String(condition.value));
        case 'exists':
          return value !== undefined && value !== null;
        default:
          return true;
      }
    });
  }

  private extractRecipientEmail(field: string, data: Record<string, any>): string | null {
    const value = data[field];
    if (typeof value === 'string' && value.includes('@')) {
      return value;
    }
    return null;
  }

  private trackEmailSent(templateId: string, email: string, messageId?: string): void {
    const key = `${templateId}:${email}`;
    this.emailStats.set(key, {
      templateId,
      email,
      messageId,
      sentAt: new Date(),
      status: 'sent'
    });
  }

  private trackEmailFailed(templateId: string, email: string, error: string): void {
    const key = `${templateId}:${email}`;
    this.emailStats.set(key, {
      templateId,
      email,
      error,
      sentAt: new Date(),
      status: 'failed'
    });
  }

  private initializeDefaultTemplates(): void {
    const defaultTemplates: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'Welcome Email',
        subject: 'Welcome to {{appName}}, {{recipientName}}!',
        htmlBody: `
          <h1>Welcome {{recipientName}}!</h1>
          <p>Thank you for joining {{appName}}. We're excited to have you on board!</p>
          <p>Here's what you can do next:</p>
          <ul>
            <li>Complete your profile</li>
            <li>Explore our features</li>
            <li>Create your first workflow</li>
          </ul>
          <p>If you have any questions, feel free to reach out to our support team.</p>
        `,
        variables: ['appName', 'recipientName'],
        category: 'transactional',
        isActive: true
      },
      {
        name: 'Password Reset',
        subject: 'Reset your password for {{appName}}',
        htmlBody: `
          <h1>Password Reset Request</h1>
          <p>Hi {{recipientName}},</p>
          <p>We received a request to reset your password. Click the link below to reset it:</p>
          <p><a href="{{resetLink}}" style="background: #007cba; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `,
        variables: ['appName', 'recipientName', 'resetLink'],
        category: 'transactional',
        isActive: true
      },
      {
        name: 'Workflow Completed',
        subject: 'Workflow "{{workflowName}}" completed successfully',
        htmlBody: `
          <h1>Workflow Completed</h1>
          <p>Your workflow <strong>{{workflowName}}</strong> has completed successfully.</p>
          <p><strong>Execution Details:</strong></p>
          <ul>
            <li>Started: {{startTime}}</li>
            <li>Completed: {{endTime}}</li>
            <li>Duration: {{duration}}</li>
            <li>Nodes executed: {{nodeCount}}</li>
          </ul>
          <p><a href="{{workflowUrl}}">View workflow details</a></p>
        `,
        variables: ['workflowName', 'startTime', 'endTime', 'duration', 'nodeCount', 'workflowUrl'],
        category: 'notification',
        isActive: true
      }
    ];

    for (const template of defaultTemplates) {
      this.createTemplate(template);
    }
  }

  private createSystemTemplate(templateId: string, type: string): void {
    const systemTemplates: Record<string, Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>> = {
      system_workflow_complete: {
        name: 'System: Workflow Complete',
        subject: 'Workflow "{{workflowName}}" completed',
        htmlBody: '<h1>Workflow Completed</h1><p>{{workflowName}} finished at {{completedAt}}</p>',
        variables: ['workflowName', 'completedAt'],
        category: 'system',
        isActive: true
      },
      system_workflow_failed: {
        name: 'System: Workflow Failed',
        subject: 'Workflow "{{workflowName}}" failed',
        htmlBody: '<h1>Workflow Failed</h1><p>{{workflowName}} failed with error: {{error}}</p>',
        variables: ['workflowName', 'error'],
        category: 'system',
        isActive: true
      },
      system_alert: {
        name: 'System Alert',
        subject: 'System Alert: {{alertType}}',
        htmlBody: '<h1>System Alert</h1><p>{{message}}</p>',
        variables: ['alertType', 'message'],
        category: 'system',
        isActive: true
      }
    };

    const template = systemTemplates[templateId];
    if (template) {
      this.templates.set(templateId, {
        ...template,
        id: templateId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }

  private setupEventListeners(): void {
    // Listen for workflow events to trigger notifications
    this.eventBus.on('workflow:completed', async (data: any) => {
      await this.processAutomationEvent('workflow_completed', data);
    });

    this.eventBus.on('workflow:failed', async (data: any) => {
      await this.processAutomationEvent('workflow_failed', data);
    });

    this.eventBus.on('user:registered', async (data: any) => {
      await this.processAutomationEvent('user_registered', data);
    });

    this.eventBus.on('form:submitted', async (data: any) => {
      await this.processAutomationEvent('form_submitted', data);
    });
  }
}
