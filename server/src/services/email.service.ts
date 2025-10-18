import nodemailer from 'nodemailer';
import { EventBus } from '../engine/event-bus';

export interface ApprovalRequest {
  executionId: string;
  nodeId: string;
  title: string;
  description: string;
  assignee: string;
  variables: Record<string, any>;
  timeout: number;
  approvalUrl: string;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export class EmailService {
  private transporter!: nodemailer.Transporter;
  private eventBus: EventBus;
  private baseUrl: string;

  constructor() {
    this.eventBus = EventBus.getInstance();
    this.baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    this.initializeTransporter();
    this.setupEventHandlers();
  }

  private initializeTransporter(): void {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  private setupEventHandlers(): void {
    this.eventBus.on('human:approval_requested', async (data: ApprovalRequest) => {
      await this.sendApprovalEmail(data);
    });
  }

  /**
   * Send approval email to the assigned user
   */
  private async sendApprovalEmail(request: ApprovalRequest): Promise<void> {
    try {
      const approvalUrl = `${this.baseUrl}/approvals/${request.executionId}`;
      const approveUrl = `${this.baseUrl}/api/approvals/${request.executionId}/respond?action=approve&token=${this.generateApprovalToken(request.executionId)}`;
      const rejectUrl = `${this.baseUrl}/api/approvals/${request.executionId}/respond?action=reject&token=${this.generateApprovalToken(request.executionId)}`;

      const template = this.generateApprovalTemplate({
        title: request.title,
        description: request.description,
        variables: request.variables,
        approvalUrl,
        approveUrl,
        rejectUrl,
        executionId: request.executionId
      });

      const mailOptions = {
        from: process.env.SMTP_USER || 'noreply@agentic-platform.com',
        to: request.assignee,
        subject: template.subject,
        text: template.text,
        html: template.html
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Approval email sent:', info.messageId);

      // Set timeout for approval
      this.setApprovalTimeout(request);

    } catch (error) {
      console.error('Failed to send approval email:', error);
      
      // Emit error event
      this.eventBus.emitEvent('email:failed', {
        executionId: request.executionId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Generate approval email template
   */
  private generateApprovalTemplate(data: {
    title: string;
    description: string;
    variables: Record<string, any>;
    approvalUrl: string;
    approveUrl: string;
    rejectUrl: string;
    executionId: string;
  }): EmailTemplate {
    const subject = `🔔 Approval Required: ${data.title}`;
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Workflow Approval Required</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 30px; }
        .approval-box { background: #f8f9ff; border: 1px solid #e1e5f2; border-radius: 6px; padding: 20px; margin: 20px 0; }
        .variable-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        .variable-table th, .variable-table td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #eee; }
        .variable-table th { background: #f8f9fa; font-weight: 600; }
        .button-container { text-align: center; margin: 30px 0; }
        .btn { display: inline-block; padding: 12px 30px; margin: 0 10px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; }
        .btn-approve { background: #28a745; color: white; }
        .btn-reject { background: #dc3545; color: white; }
        .btn:hover { opacity: 0.9; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
        .execution-info { background: #e9ecef; padding: 15px; border-radius: 4px; margin: 15px 0; font-family: monospace; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔔 Workflow Approval Required</h1>
            <p>Your approval is needed to continue workflow execution</p>
        </div>
        
        <div class="content">
            <div class="approval-box">
                <h2>${data.title}</h2>
                <p>${data.description}</p>
            </div>

            ${Object.keys(data.variables).length > 0 ? `
            <h3>📊 Context Data</h3>
            <table class="variable-table">
                <thead>
                    <tr>
                        <th>Variable</th>
                        <th>Value</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(data.variables).map(([key, value]) => `
                    <tr>
                        <td><strong>${key}</strong></td>
                        <td>${this.formatValue(value)}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
            ` : ''}

            <div class="button-container">
                <a href="${data.approveUrl}" class="btn btn-approve">✅ Approve</a>
                <a href="${data.rejectUrl}" class="btn btn-reject">❌ Reject</a>
            </div>

            <p style="text-align: center; color: #666; margin-top: 20px;">
                Or <a href="${data.approvalUrl}">view detailed approval page</a>
            </p>

            <div class="execution-info">
                <strong>Execution ID:</strong> ${data.executionId}<br>
                <strong>Requested At:</strong> ${new Date().toLocaleString()}
            </div>
        </div>

        <div class="footer">
            <p>This is an automated message from the Agentic Orchestration Platform.</p>
            <p>If you have questions, please contact your system administrator.</p>
        </div>
    </div>
</body>
</html>`;

    const text = `
WORKFLOW APPROVAL REQUIRED

${data.title}

${data.description}

Context Data:
${Object.entries(data.variables).map(([key, value]) => `${key}: ${this.formatValue(value)}`).join('\n')}

To approve this workflow, visit: ${data.approveUrl}
To reject this workflow, visit: ${data.rejectUrl}

Execution ID: ${data.executionId}
Requested At: ${new Date().toLocaleString()}

This is an automated message from the Agentic Orchestration Platform.
`;

    return { subject, html, text };
  }

  /**
   * Format variable values for display
   */
  private formatValue(value: any): string {
    if (value === null || value === undefined) {
      return '<em>null</em>';
    }
    if (typeof value === 'object') {
      return `<pre>${JSON.stringify(value, null, 2)}</pre>`;
    }
    if (typeof value === 'boolean') {
      return value ? '✓ true' : '✗ false';
    }
    return String(value);
  }

  /**
   * Generate approval token for security
   */
  private generateApprovalToken(executionId: string): string {
    // In production, this should use proper JWT or HMAC
    return Buffer.from(`${executionId}:${Date.now()}`).toString('base64');
  }

  /**
   * Verify approval token
   */
  public verifyApprovalToken(token: string, executionId: string): boolean {
    try {
      const decoded = Buffer.from(token, 'base64').toString();
      const [tokenExecutionId, timestamp] = decoded.split(':');
      
      // Check if execution ID matches
      if (tokenExecutionId !== executionId) {
        return false;
      }

      // Check if token is not older than 24 hours
      const tokenTime = parseInt(timestamp);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      return (now - tokenTime) < maxAge;
    } catch (error) {
      return false;
    }
  }

  /**
   * Set timeout for approval request
   */
  private setApprovalTimeout(request: ApprovalRequest): void {
    setTimeout(() => {
      this.eventBus.emitEvent('approval:timeout', {
        executionId: request.executionId,
        nodeId: request.nodeId,
        timeout: request.timeout
      });
    }, request.timeout);
  }

  /**
   * Send workflow completion notification
   */
  public async sendCompletionNotification(
    recipientEmail: string,
    executionId: string,
    workflowName: string,
    status: 'completed' | 'failed' | 'cancelled',
    duration: number,
    results?: any
  ): Promise<void> {
    try {
      const subject = `🎯 Workflow ${status.toUpperCase()}: ${workflowName}`;
      
      const statusEmoji = {
        completed: '✅',
        failed: '❌',
        cancelled: '⏹️'
      };

      const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: ${status === 'completed' ? '#28a745' : status === 'failed' ? '#dc3545' : '#6c757d'}; color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .status-box { background: #f8f9fa; border-radius: 6px; padding: 20px; margin: 20px 0; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${statusEmoji[status]} Workflow ${status.charAt(0).toUpperCase() + status.slice(1)}</h1>
            <p>${workflowName}</p>
        </div>
        
        <div class="content">
            <div class="status-box">
                <h2>Execution Summary</h2>
                <p><strong>Status:</strong> ${status.toUpperCase()}</p>
                <p><strong>Duration:</strong> ${this.formatDuration(duration)}</p>
                <p><strong>Execution ID:</strong> ${executionId}</p>
                <p><strong>Completed At:</strong> ${new Date().toLocaleString()}</p>
            </div>

            ${results ? `
            <h3>Results</h3>
            <pre style="background: #f8f9fa; padding: 15px; border-radius: 4px; overflow-x: auto;">${JSON.stringify(results, null, 2)}</pre>
            ` : ''}

            <p style="text-align: center; margin-top: 30px;">
                <a href="${this.baseUrl}/executions/${executionId}" 
                   style="display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 6px;">
                   View Full Details
                </a>
            </p>
        </div>
    </div>
</body>
</html>`;

      await this.transporter.sendMail({
        from: process.env.SMTP_USER || 'noreply@agentic-platform.com',
        to: recipientEmail,
        subject,
        html
      });

      console.log(`Completion notification sent to ${recipientEmail}`);

    } catch (error) {
      console.error('Failed to send completion notification:', error);
    }
  }

  /**
   * Format duration in milliseconds to human readable format
   */
  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Test email configuration
   */
  public async testEmailConfiguration(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email configuration test failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();