import axios from 'axios';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import nodemailer from 'nodemailer';
import { EventBus } from '../engine/event-bus';

export interface GmailConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  accessToken?: string;
  userEmail: string;
}

export interface EmailMessage {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  isHtml?: boolean;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface EmailFilter {
  from?: string;
  subject?: string;
  bodyContains?: string;
  hasAttachment?: boolean;
  isUnread?: boolean;
  receivedAfter?: Date;
}

export interface ParsedEmail {
  id: string;
  threadId: string;
  from: string;
  to: string[];
  cc?: string[];
  subject: string;
  body: string;
  timestamp: Date;
  attachments: Array<{
    filename: string;
    mimeType: string;
    size: number;
    attachmentId: string;
  }>;
  isUnread: boolean;
}

export class GmailService {
  private oauth2Client: OAuth2Client | null = null;
  private gmail: any;
  private transporter: any;
  private eventBus: EventBus;
  private watchingEmails: boolean = false;

  constructor() {
    this.eventBus = EventBus.getInstance();
    this.initializeGoogleAuth();
  }

  /**
   * Initialize Google OAuth2 client
   */
  private initializeGoogleAuth() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.warn('Gmail service: Google OAuth credentials not configured');
      return;
    }

    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      process.env.GOOGLE_REDIRECT_URI || 'urn:ietf:wg:oauth:2.0:oob'
    );

    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  /**
   * Set user credentials for Gmail access
   */
  async setUserCredentials(config: GmailConfig): Promise<void> {
    if (!this.oauth2Client) {
      throw new Error('Gmail service not properly initialized');
    }

    this.oauth2Client.setCredentials({
      access_token: config.accessToken,
      refresh_token: config.refreshToken,
    });

    // Create nodemailer transporter for sending emails
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: config.userEmail,
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        refreshToken: config.refreshToken,
        accessToken: config.accessToken,
      },
    });

    console.log('Gmail service: User credentials configured');
  }

  /**
   * Send email using Gmail API
   */
  async sendEmail(message: EmailMessage): Promise<{ messageId: string; status: string }> {
    if (!this.transporter) {
      throw new Error('Gmail credentials not configured');
    }

    try {
      const mailOptions = {
        from: this.transporter.options.auth.user,
        to: message.to,
        cc: message.cc,
        bcc: message.bcc,
        subject: message.subject,
        text: message.isHtml ? undefined : message.body,
        html: message.isHtml ? message.body : undefined,
        attachments: message.attachments,
      };

      const result = await this.transporter.sendMail(mailOptions);

      this.eventBus.emitEvent('gmail:email_sent', {
        messageId: result.messageId,
        to: message.to,
        subject: message.subject,
        timestamp: new Date(),
      });

      return {
        messageId: result.messageId,
        status: 'sent',
      };
    } catch (error) {
      console.error('Gmail send error:', error);
      throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Watch for new emails matching filter
   */
  async startEmailWatch(filter: EmailFilter, webhookUrl?: string): Promise<string> {
    if (!this.gmail) {
      throw new Error('Gmail service not initialized');
    }

    try {
      // Set up Gmail push notifications if webhook URL provided
      if (webhookUrl) {
        const watchResponse = await this.gmail.users.watch({
          userId: 'me',
          requestBody: {
            topicName: process.env.GMAIL_PUBSUB_TOPIC,
            labelIds: ['INBOX'],
          },
        });

        console.log('Gmail watch setup:', watchResponse.data);
      }

      // Start polling for emails (fallback method)
      this.watchingEmails = true;
      this.pollForNewEmails(filter);

      return 'email_watch_started';
    } catch (error) {
      console.error('Gmail watch error:', error);
      throw new Error(`Failed to start email watch: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Stop watching for emails
   */
  async stopEmailWatch(): Promise<void> {
    this.watchingEmails = false;

    if (this.gmail) {
      try {
        await this.gmail.users.stop({ userId: 'me' });
        console.log('Gmail watch stopped');
      } catch (error) {
        console.warn('Error stopping Gmail watch:', error);
      }
    }
  }

  /**
   * Poll for new emails (fallback method when webhooks not available)
   */
  private async pollForNewEmails(filter: EmailFilter) {
    if (!this.watchingEmails || !this.gmail) return;

    try {
      const query = this.buildGmailQuery(filter);
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: 10,
      });

      if (response.data.messages) {
        for (const message of response.data.messages) {
          const parsedEmail = await this.parseEmail(message.id);
          
          this.eventBus.emitEvent('gmail:email_received', {
            email: parsedEmail,
            filter,
            timestamp: new Date(),
          });
        }
      }
    } catch (error) {
      console.error('Gmail polling error:', error);
    }

    // Poll again in 30 seconds
    setTimeout(() => this.pollForNewEmails(filter), 30000);
  }

  /**
   * Build Gmail search query from filter
   */
  private buildGmailQuery(filter: EmailFilter): string {
    const queryParts: string[] = [];

    if (filter.from) queryParts.push(`from:${filter.from}`);
    if (filter.subject) queryParts.push(`subject:"${filter.subject}"`);
    if (filter.bodyContains) queryParts.push(`"${filter.bodyContains}"`);
    if (filter.hasAttachment) queryParts.push('has:attachment');
    if (filter.isUnread) queryParts.push('is:unread');
    if (filter.receivedAfter) {
      const timestamp = Math.floor(filter.receivedAfter.getTime() / 1000);
      queryParts.push(`after:${timestamp}`);
    }

    return queryParts.join(' ');
  }

  /**
   * Fetch recent emails matching filter
   */
  async fetchRecentEmails(filter: EmailFilter, maxResults: number = 10): Promise<ParsedEmail[]> {
    if (!this.gmail) {
      throw new Error('Gmail service not initialized');
    }

    const query = this.buildGmailQuery(filter);
    const response = await this.gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults,
    });

    const emails: ParsedEmail[] = [];
    if (response.data.messages) {
      for (const message of response.data.messages) {
        const parsed = await this.parseEmail(message.id);
        emails.push(parsed);
      }
    }

    return emails;
  }

  /**
   * Parse Gmail message to structured format
   */
  private async parseEmail(messageId: string): Promise<ParsedEmail> {
    const response = await this.gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });

    const message = response.data;
    const headers = message.payload.headers;

    // Extract header values
    const getHeader = (name: string) => {
      const header = headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase());
      return header ? header.value : '';
    };

    // Parse body
    let body = '';
    if (message.payload.body?.data) {
      body = Buffer.from(message.payload.body.data, 'base64').toString();
    } else if (message.payload.parts) {
      for (const part of message.payload.parts) {
        if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
          if (part.body?.data) {
            body = Buffer.from(part.body.data, 'base64').toString();
            break;
          }
        }
      }
    }

    // Parse attachments
    const attachments: ParsedEmail['attachments'] = [];
    if (message.payload.parts) {
      for (const part of message.payload.parts) {
        if (part.filename && part.body?.attachmentId) {
          attachments.push({
            filename: part.filename,
            mimeType: part.mimeType || 'application/octet-stream',
            size: part.body.size || 0,
            attachmentId: part.body.attachmentId,
          });
        }
      }
    }

    return {
      id: messageId,
      threadId: message.threadId,
      from: getHeader('From'),
      to: getHeader('To').split(',').map((email: string) => email.trim()),
      cc: getHeader('Cc') ? getHeader('Cc').split(',').map((email: string) => email.trim()) : undefined,
      subject: getHeader('Subject'),
      body,
      timestamp: new Date(parseInt(message.internalDate)),
      attachments,
      isUnread: message.labelIds?.includes('UNREAD') || false,
    };
  }

  /**
   * Download email attachment
   */
  async downloadAttachment(messageId: string, attachmentId: string): Promise<Buffer> {
    if (!this.gmail) {
      throw new Error('Gmail service not initialized');
    }

    try {
      const response = await this.gmail.users.messages.attachments.get({
        userId: 'me',
        messageId,
        id: attachmentId,
      });

      return Buffer.from(response.data.data, 'base64');
    } catch (error) {
      console.error('Gmail attachment download error:', error);
      throw new Error(`Failed to download attachment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Mark email as read
   */
  async markAsRead(messageId: string): Promise<void> {
    if (!this.gmail) return;

    try {
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          removeLabelIds: ['UNREAD'],
        },
      });
    } catch (error) {
      console.error('Gmail mark as read error:', error);
    }
  }

  /**
   * Generate OAuth2 authorization URL
   */
  generateAuthUrl(): string {
    if (!this.oauth2Client) {
      throw new Error('Gmail service not initialized');
    }

    const scopes = [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.modify',
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<{ accessToken: string; refreshToken: string }> {
    if (!this.oauth2Client) {
      throw new Error('Gmail service not initialized');
    }

    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      
      return {
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token!,
      };
    } catch (error) {
      console.error('Gmail token exchange error:', error);
      throw new Error(`Failed to exchange code for tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Test Gmail connection
   */
  async testConnection(): Promise<{ status: string; userEmail?: string }> {
    if (!this.gmail) {
      return { status: 'not_configured' };
    }

    try {
      const profile = await this.gmail.users.getProfile({ userId: 'me' });
      return {
        status: 'connected',
        userEmail: profile.data.emailAddress,
      };
    } catch (error) {
      console.error('Gmail connection test failed:', error);
      return { status: 'error' };
    }
  }
}
