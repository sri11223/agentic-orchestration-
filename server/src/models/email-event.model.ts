import mongoose from 'mongoose';

export type EmailEventType = 'sent' | 'failed' | 'delivered' | 'opened' | 'clicked' | 'unsubscribed' | 'bounced';

export interface IEmailEvent {
  templateId?: string;
  campaignId?: string;
  recipient: string;
  messageId?: string;
  status: EmailEventType;
  error?: string;
  metadata?: Record<string, any>;
  occurredAt: Date;
}

const emailEventSchema = new mongoose.Schema<IEmailEvent>({
  templateId: { type: String },
  campaignId: { type: String },
  recipient: { type: String, required: true, index: true },
  messageId: { type: String, index: true },
  status: {
    type: String,
    enum: ['sent', 'failed', 'delivered', 'opened', 'clicked', 'unsubscribed', 'bounced'],
    required: true,
    index: true
  },
  error: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  occurredAt: { type: Date, default: Date.now, index: true }
}, {
  timestamps: true
});

emailEventSchema.index({ templateId: 1, status: 1, occurredAt: -1 });
emailEventSchema.index({ campaignId: 1, status: 1, occurredAt: -1 });
emailEventSchema.index({ recipient: 1, occurredAt: -1 });

export const EmailEventModel = mongoose.model<IEmailEvent>('EmailEvent', emailEventSchema);
