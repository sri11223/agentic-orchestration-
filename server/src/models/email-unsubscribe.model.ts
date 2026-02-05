import mongoose from 'mongoose';

export interface IEmailUnsubscribe {
  email: string;
  templateId?: string;
  campaignId?: string;
  reason?: string;
  unsubscribedAt: Date;
}

const emailUnsubscribeSchema = new mongoose.Schema<IEmailUnsubscribe>({
  email: { type: String, required: true, index: true },
  templateId: { type: String },
  campaignId: { type: String },
  reason: { type: String },
  unsubscribedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

emailUnsubscribeSchema.index({ email: 1, templateId: 1 });

export const EmailUnsubscribeModel = mongoose.model<IEmailUnsubscribe>('EmailUnsubscribe', emailUnsubscribeSchema);
