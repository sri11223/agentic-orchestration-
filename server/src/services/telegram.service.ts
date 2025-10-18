import axios, { AxiosInstance } from 'axios';
import { EventBus } from '../engine/event-bus';

export interface TelegramConfig {
  botToken: string;
  webhookUrl?: string;
}

export interface TelegramMessage {
  chatId: string | number;
  text: string;
  parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  disableWebPagePreview?: boolean;
  disableNotification?: boolean;
  replyToMessageId?: number;
  keyboard?: TelegramKeyboard;
}

export interface TelegramKeyboard {
  type: 'inline' | 'reply';
  buttons: Array<Array<{
    text: string;
    url?: string;
    callbackData?: string;
  }>>;
  oneTimeKeyboard?: boolean;
  resizeKeyboard?: boolean;
}

export interface TelegramFile {
  chatId: string | number;
  file: Buffer | string; // Buffer for binary data or file_id for existing files
  filename?: string;
  caption?: string;
  parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
}

export interface TelegramWebhookUpdate {
  updateId: number;
  message?: {
    messageId: number;
    from: {
      id: number;
      isBot: boolean;
      firstName: string;
      lastName?: string;
      username?: string;
    };
    chat: {
      id: number;
      type: 'private' | 'group' | 'supergroup' | 'channel';
      title?: string;
      username?: string;
      firstName?: string;
      lastName?: string;
    };
    date: number;
    text?: string;
    photo?: Array<{
      fileId: string;
      fileUniqueId: string;
      width: number;
      height: number;
      fileSize?: number;
    }>;
    document?: {
      fileId: string;
      fileUniqueId: string;
      fileName?: string;
      mimeType?: string;
      fileSize?: number;
    };
  };
  callbackQuery?: {
    id: string;
    from: {
      id: number;
      isBot: boolean;
      firstName: string;
      lastName?: string;
      username?: string;
    };
    message?: any;
    data?: string;
  };
}

export class TelegramService {
  private botToken: string | null = null;
  private apiClient: AxiosInstance | null = null;
  private eventBus: EventBus;
  private webhookUrl: string | null = null;

  constructor() {
    this.eventBus = EventBus.getInstance();
  }

  /**
   * Initialize Telegram bot with token
   */
  async initialize(config: TelegramConfig): Promise<void> {
    this.botToken = config.botToken;
    this.webhookUrl = config.webhookUrl || null;

    // Create API client
    this.apiClient = axios.create({
      baseURL: `https://api.telegram.org/bot${this.botToken}`,
      timeout: 30000,
    });

    // Test bot connection
    const botInfo = await this.getBotInfo();
    console.log('Telegram bot initialized:', botInfo.username);

    // Setup webhook if URL provided
    if (this.webhookUrl) {
      await this.setupWebhook();
    }
  }

  /**
   * Send text message
   */
  async sendMessage(message: TelegramMessage): Promise<{ messageId: number; success: boolean }> {
    if (!this.apiClient) {
      throw new Error('Telegram service not initialized');
    }

    try {
      const payload: any = {
        chat_id: message.chatId,
        text: message.text,
        parse_mode: message.parseMode,
        disable_web_page_preview: message.disableWebPagePreview,
        disable_notification: message.disableNotification,
        reply_to_message_id: message.replyToMessageId,
      };

      // Add keyboard if provided
      if (message.keyboard) {
        if (message.keyboard.type === 'inline') {
          payload.reply_markup = {
            inline_keyboard: message.keyboard.buttons.map(row => 
              row.map(button => ({
                text: button.text,
                url: button.url,
                callback_data: button.callbackData,
              }))
            ),
          };
        } else if (message.keyboard.type === 'reply') {
          payload.reply_markup = {
            keyboard: message.keyboard.buttons.map(row => 
              row.map(button => ({ text: button.text }))
            ),
            one_time_keyboard: message.keyboard.oneTimeKeyboard,
            resize_keyboard: message.keyboard.resizeKeyboard,
          };
        }
      }

      const response = await this.apiClient.post('/sendMessage', payload);
      
      this.eventBus.emitEvent('telegram:message_sent', {
        messageId: response.data.result.message_id,
        chatId: message.chatId,
        text: message.text,
        timestamp: new Date(),
      });

      return {
        messageId: response.data.result.message_id,
        success: true,
      };
    } catch (error) {
      console.error('Telegram send message error:', error);
      throw new Error(`Failed to send Telegram message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send photo
   */
  async sendPhoto(file: TelegramFile): Promise<{ messageId: number; success: boolean }> {
    if (!this.apiClient) {
      throw new Error('Telegram service not initialized');
    }

    try {
      const formData = new FormData();
      formData.append('chat_id', file.chatId.toString());
      
      if (Buffer.isBuffer(file.file)) {
        const blob = new Blob([file.file]);
        formData.append('photo', blob, file.filename || 'photo.jpg');
      } else {
        formData.append('photo', file.file); // file_id
      }

      if (file.caption) {
        formData.append('caption', file.caption);
      }
      if (file.parseMode) {
        formData.append('parse_mode', file.parseMode);
      }

      const response = await this.apiClient.post('/sendPhoto', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return {
        messageId: response.data.result.message_id,
        success: true,
      };
    } catch (error) {
      console.error('Telegram send photo error:', error);
      throw new Error(`Failed to send Telegram photo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send document
   */
  async sendDocument(file: TelegramFile): Promise<{ messageId: number; success: boolean }> {
    if (!this.apiClient) {
      throw new Error('Telegram service not initialized');
    }

    try {
      const formData = new FormData();
      formData.append('chat_id', file.chatId.toString());
      
      if (Buffer.isBuffer(file.file)) {
        const blob = new Blob([file.file]);
        formData.append('document', blob, file.filename || 'document.pdf');
      } else {
        formData.append('document', file.file); // file_id
      }

      if (file.caption) {
        formData.append('caption', file.caption);
      }

      const response = await this.apiClient.post('/sendDocument', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return {
        messageId: response.data.result.message_id,
        success: true,
      };
    } catch (error) {
      console.error('Telegram send document error:', error);
      throw new Error(`Failed to send Telegram document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Answer callback query (for inline keyboard buttons)
   */
  async answerCallbackQuery(callbackQueryId: string, text?: string, showAlert?: boolean): Promise<void> {
    if (!this.apiClient) {
      throw new Error('Telegram service not initialized');
    }

    try {
      await this.apiClient.post('/answerCallbackQuery', {
        callback_query_id: callbackQueryId,
        text,
        show_alert: showAlert,
      });
    } catch (error) {
      console.error('Telegram callback query error:', error);
    }
  }

  /**
   * Get bot information
   */
  async getBotInfo(): Promise<{ id: number; username: string; firstName: string }> {
    if (!this.apiClient) {
      throw new Error('Telegram service not initialized');
    }

    try {
      const response = await this.apiClient.get('/getMe');
      return {
        id: response.data.result.id,
        username: response.data.result.username,
        firstName: response.data.result.first_name,
      };
    } catch (error) {
      console.error('Telegram get bot info error:', error);
      throw new Error(`Failed to get bot info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Setup webhook for receiving updates
   */
  async setupWebhook(): Promise<void> {
    if (!this.apiClient || !this.webhookUrl) {
      throw new Error('Telegram service or webhook URL not configured');
    }

    try {
      await this.apiClient.post('/setWebhook', {
        url: this.webhookUrl,
        max_connections: 40,
        allowed_updates: ['message', 'callback_query'],
      });

      console.log('Telegram webhook configured:', this.webhookUrl);
    } catch (error) {
      console.error('Telegram webhook setup error:', error);
      throw new Error(`Failed to setup webhook: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Remove webhook
   */
  async removeWebhook(): Promise<void> {
    if (!this.apiClient) {
      return;
    }

    try {
      await this.apiClient.post('/deleteWebhook');
      console.log('Telegram webhook removed');
    } catch (error) {
      console.error('Telegram webhook removal error:', error);
    }
  }

  /**
   * Process incoming webhook update
   */
  processWebhookUpdate(update: TelegramWebhookUpdate): void {
    try {
      if (update.message) {
        // Handle incoming message
        this.eventBus.emitEvent('telegram:message_received', {
          update,
          message: update.message,
          timestamp: new Date(),
        });

        // Handle specific message types
        if (update.message.text) {
          this.eventBus.emitEvent('telegram:text_received', {
            chatId: update.message.chat.id,
            text: update.message.text,
            userId: update.message.from.id,
            username: update.message.from.username,
            timestamp: new Date(),
          });
        }

        if (update.message.photo) {
          this.eventBus.emitEvent('telegram:photo_received', {
            chatId: update.message.chat.id,
            photos: update.message.photo,
            userId: update.message.from.id,
            timestamp: new Date(),
          });
        }

        if (update.message.document) {
          this.eventBus.emitEvent('telegram:document_received', {
            chatId: update.message.chat.id,
            document: update.message.document,
            userId: update.message.from.id,
            timestamp: new Date(),
          });
        }
      }

      if (update.callbackQuery) {
        // Handle callback query (inline keyboard button pressed)
        this.eventBus.emitEvent('telegram:callback_query', {
          queryId: update.callbackQuery.id,
          userId: update.callbackQuery.from.id,
          data: update.callbackQuery.data,
          timestamp: new Date(),
        });
      }
    } catch (error) {
      console.error('Telegram webhook processing error:', error);
    }
  }

  /**
   * Get file download URL
   */
  async getFileUrl(fileId: string): Promise<string> {
    if (!this.apiClient) {
      throw new Error('Telegram service not initialized');
    }

    try {
      const response = await this.apiClient.get('/getFile', {
        params: { file_id: fileId },
      });

      const filePath = response.data.result.file_path;
      return `https://api.telegram.org/file/bot${this.botToken}/${filePath}`;
    } catch (error) {
      console.error('Telegram get file URL error:', error);
      throw new Error(`Failed to get file URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Download file content
   */
  async downloadFile(fileId: string): Promise<Buffer> {
    const fileUrl = await this.getFileUrl(fileId);

    try {
      const response = await axios.get(fileUrl, {
        responseType: 'arraybuffer',
      });

      return Buffer.from(response.data);
    } catch (error) {
      console.error('Telegram file download error:', error);
      throw new Error(`Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get chat information
   */
  async getChatInfo(chatId: string | number): Promise<any> {
    if (!this.apiClient) {
      throw new Error('Telegram service not initialized');
    }

    try {
      const response = await this.apiClient.get('/getChat', {
        params: { chat_id: chatId },
      });

      return response.data.result;
    } catch (error) {
      console.error('Telegram get chat info error:', error);
      throw new Error(`Failed to get chat info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Test Telegram connection
   */
  async testConnection(): Promise<{ status: string; botInfo?: any }> {
    if (!this.apiClient) {
      return { status: 'not_configured' };
    }

    try {
      const botInfo = await this.getBotInfo();
      return {
        status: 'connected',
        botInfo,
      };
    } catch (error) {
      console.error('Telegram connection test failed:', error);
      return { status: 'error' };
    }
  }
}