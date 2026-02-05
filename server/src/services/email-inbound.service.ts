import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import POP3Client from 'poplib';

export interface EmailInboundConfig {
  type: 'imap' | 'pop3';
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
}

export interface EmailInboundFilter {
  from?: string;
  subject?: string;
  bodyContains?: string;
  isUnread?: boolean;
  receivedAfter?: Date;
}

export interface InboundEmail {
  id: string;
  from: string;
  to: string[];
  subject: string;
  body: string;
  timestamp: Date;
  attachments: Array<{
    filename: string;
    mimeType: string;
    size: number;
  }>;
  isUnread: boolean;
}

export class EmailInboundService {
  async fetchRecentEmails(
    config: EmailInboundConfig,
    filter: EmailInboundFilter,
    limit: number,
    markAsRead: boolean
  ): Promise<InboundEmail[]> {
    if (config.type === 'imap') {
      return this.fetchImapEmails(config, filter, limit, markAsRead);
    }
    return this.fetchPop3Emails(config, filter, limit);
  }

  async testConnection(config: EmailInboundConfig): Promise<{ status: 'connected' | 'failed'; message?: string }> {
    if (config.type === 'imap') {
      const client = new ImapFlow({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
          user: config.username,
          pass: config.password
        }
      });

      try {
        await client.connect();
        await client.logout();
        return { status: 'connected' };
      } catch (error) {
        return { status: 'failed', message: error instanceof Error ? error.message : String(error) };
      }
    }

    return this.testPop3Connection(config);
  }

  private async fetchImapEmails(
    config: EmailInboundConfig,
    filter: EmailInboundFilter,
    limit: number,
    markAsRead: boolean
  ): Promise<InboundEmail[]> {
    const client = new ImapFlow({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.username,
        pass: config.password
      }
    });

    await client.connect();
    const lock = await client.getMailboxLock('INBOX');
    try {
      const searchCriteria: any[] = [];
      if (filter.isUnread) {
        searchCriteria.push('UNSEEN');
      }
      if (filter.receivedAfter) {
        searchCriteria.push(['SINCE', filter.receivedAfter]);
      }
      if (filter.from) {
        searchCriteria.push(['FROM', filter.from]);
      }
      if (filter.subject) {
        searchCriteria.push(['SUBJECT', filter.subject]);
      }

      const messageIds = await client.search(searchCriteria.length > 0 ? searchCriteria : ['ALL']);
      const limitedIds = messageIds.slice(-limit);

      const emails: InboundEmail[] = [];
      for (const uid of limitedIds) {
        const message = await client.fetchOne(uid, { envelope: true, source: true, flags: true });
        const parsed = await simpleParser(message.source);
        const body = parsed.text || parsed.html || '';
        if (filter.bodyContains && !body.includes(filter.bodyContains)) {
          continue;
        }

        emails.push({
          id: String(uid),
          from: parsed.from?.text || '',
          to: parsed.to?.value?.map(value => value.address) || [],
          subject: parsed.subject || '',
          body,
          timestamp: parsed.date || new Date(),
          attachments: (parsed.attachments || []).map(attachment => ({
            filename: attachment.filename || 'attachment',
            mimeType: attachment.contentType,
            size: attachment.size
          })),
          isUnread: !message.flags?.includes('\\Seen')
        });

        if (markAsRead) {
          await client.messageFlagsAdd(uid, ['\\Seen']);
        }
      }

      return emails;
    } finally {
      lock.release();
      await client.logout();
    }
  }

  private fetchPop3Emails(
    config: EmailInboundConfig,
    filter: EmailInboundFilter,
    limit: number
  ): Promise<InboundEmail[]> {
    return new Promise((resolve, reject) => {
      const client = new POP3Client(config.port, config.host, {
        tlserrs: false,
        enabletls: config.secure,
        debug: false
      });

      const messages: InboundEmail[] = [];
      let messageCount = 0;

      client.on('error', error => {
        reject(error);
      });

      client.on('connect', () => {
        client.login(config.username, config.password);
      });

      client.on('login', (status: boolean) => {
        if (!status) {
          return reject(new Error('POP3 login failed'));
        }
        client.stat();
      });

      client.on('stat', (status: boolean, data: any) => {
        if (!status) {
          return reject(new Error('POP3 STAT failed'));
        }
        messageCount = data.count || 0;
        const start = Math.max(1, messageCount - limit + 1);
        for (let i = start; i <= messageCount; i += 1) {
          client.retr(i);
        }
        if (messageCount === 0) {
          client.quit();
        }
      });

      client.on('retr', async (status: boolean, msgNumber: number, data: string) => {
        if (status) {
          const parsed = await simpleParser(data);
          const body = parsed.text || parsed.html || '';
          if (filter.receivedAfter && parsed.date && parsed.date < filter.receivedAfter) {
            return;
          }
          if (filter.from && !parsed.from?.text?.includes(filter.from)) {
            return;
          }
          if (filter.subject && !parsed.subject?.includes(filter.subject)) {
            return;
          }
          if (filter.bodyContains && !body.includes(filter.bodyContains)) {
            return;
          }
          messages.push({
            id: String(msgNumber),
            from: parsed.from?.text || '',
            to: parsed.to?.value?.map(value => value.address) || [],
            subject: parsed.subject || '',
            body,
            timestamp: parsed.date || new Date(),
            attachments: (parsed.attachments || []).map(attachment => ({
              filename: attachment.filename || 'attachment',
              mimeType: attachment.contentType,
              size: attachment.size
            })),
            isUnread: true
          });
        }

        if (msgNumber === messageCount) {
          client.quit();
        }
      });

      client.on('quit', () => {
        resolve(messages);
      });
    });
  }

  private testPop3Connection(config: EmailInboundConfig): Promise<{ status: 'connected' | 'failed'; message?: string }> {
    return new Promise(resolve => {
      const client = new POP3Client(config.port, config.host, {
        tlserrs: false,
        enabletls: config.secure,
        debug: false
      });

      client.on('error', error => {
        resolve({ status: 'failed', message: error instanceof Error ? error.message : String(error) });
      });

      client.on('connect', () => {
        client.login(config.username, config.password);
      });

      client.on('login', (status: boolean) => {
        if (!status) {
          resolve({ status: 'failed', message: 'POP3 login failed' });
        } else {
          client.quit();
        }
      });

      client.on('quit', () => {
        resolve({ status: 'connected' });
      });
    });
  }
}
