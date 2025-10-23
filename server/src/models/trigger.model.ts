import mongoose from 'mongoose';

// Base trigger configuration interface
export interface ITriggerConfig {
  type: 'email-trigger' | 'webhook-trigger' | 'schedule-trigger' | 'manual-trigger';
  enabled: boolean;
  workflowId: string;
  nodeId: string;
  config: any; // Type-specific configuration
  metadata?: {
    createdAt: Date;
    updatedAt: Date;
    lastTriggered?: Date;
    triggerCount?: number;
    errors?: Array<{
      timestamp: Date;
      error: string;
      details?: string;
    }>;
  };
}

// Email trigger specific configuration
export interface IEmailTriggerConfig extends ITriggerConfig {
  type: 'email-trigger';
  config: {
    emailAddress: string;
    subjectFilter?: string;
    senderFilter?: string;
    frequency: number; // in minutes
    markAsRead: boolean;
    lastChecked?: Date;
    imapConfig?: {
      host: string;
      port: number;
      secure: boolean;
      username: string;
      password: string;
    };
  };
}

// Webhook trigger specific configuration
export interface IWebhookTriggerConfig extends ITriggerConfig {
  type: 'webhook-trigger';
  config: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    auth: 'none' | 'api-key' | 'bearer' | 'basic';
    apiKeyHeader?: string;
    tokenPrefix?: string;
    responseCode: number;
    webhookUrl: string; // Generated URL
    secretKey?: string;
  };
}

// Schedule trigger specific configuration
export interface IScheduleTriggerConfig extends ITriggerConfig {
  type: 'schedule-trigger';
  config: {
    scheduleType: 'interval' | 'cron' | 'daily' | 'weekly' | 'monthly';
    intervalValue?: number;
    intervalUnit?: 'seconds' | 'minutes' | 'hours' | 'days';
    cronExpression?: string;
    dailyTime?: string;
    weekDay?: string;
    weeklyTime?: string;
    monthDay?: number;
    monthlyTime?: string;
    enabled: boolean;
    nextExecution?: Date;
    timezone?: string;
  };
}

// Manual trigger specific configuration
export interface IManualTriggerConfig extends ITriggerConfig {
  type: 'manual-trigger';
  config: {
    buttonText: string;
    description?: string;
    confirmBeforeRun: boolean;
    allowedUsers?: string[]; // User IDs who can trigger
    requirePermission?: boolean;
  };
}

// Trigger execution history
export interface ITriggerExecution {
  triggerId: string;
  workflowId: string;
  executionId: string;
  triggerType: string;
  triggerData: any;
  status: 'success' | 'failed' | 'pending';
  error?: string;
  duration?: number;
  triggeredAt: Date;
  completedAt?: Date;
  metadata?: any;
}

// Main trigger schema
const triggerSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['email-trigger', 'webhook-trigger', 'schedule-trigger', 'manual-trigger'],
    required: true
  },
  enabled: {
    type: Boolean,
    default: true
  },
  workflowId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workflow',
    required: true
  },
  nodeId: {
    type: String,
    required: true
  },
  config: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  metadata: {
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    lastTriggered: Date,
    triggerCount: {
      type: Number,
      default: 0
    },
    errors: [{
      timestamp: Date,
      error: String,
      details: String
    }]
  }
}, {
  timestamps: true
});

// Trigger execution history schema
const triggerExecutionSchema = new mongoose.Schema({
  triggerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trigger',
    required: true
  },
  workflowId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workflow',
    required: true
  },
  executionId: {
    type: String,
    required: true
  },
  triggerType: {
    type: String,
    enum: ['email-trigger', 'webhook-trigger', 'schedule-trigger', 'manual-trigger'],
    required: true
  },
  triggerData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'pending'],
    default: 'pending'
  },
  error: String,
  duration: Number,
  triggeredAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Add indexes for performance
triggerSchema.index({ workflowId: 1, type: 1 });
triggerSchema.index({ enabled: 1, type: 1 });
triggerSchema.index({ 'config.scheduleType': 1, 'config.nextExecution': 1 });

triggerExecutionSchema.index({ triggerId: 1, triggeredAt: -1 });
triggerExecutionSchema.index({ workflowId: 1, status: 1 });
triggerExecutionSchema.index({ triggerType: 1, triggeredAt: -1 });

// Methods for trigger management
triggerSchema.methods.updateLastTriggered = function() {
  this.metadata.lastTriggered = new Date();
  this.metadata.triggerCount = (this.metadata.triggerCount || 0) + 1;
  this.metadata.updatedAt = new Date();
  return this.save();
};

triggerSchema.methods.addError = function(error: string, details?: string) {
  if (!this.metadata.errors) {
    this.metadata.errors = [];
  }
  this.metadata.errors.push({
    timestamp: new Date(),
    error,
    details
  });
  // Keep only last 10 errors
  if (this.metadata.errors.length > 10) {
    this.metadata.errors = this.metadata.errors.slice(-10);
  }
  this.metadata.updatedAt = new Date();
  return this.save();
};

triggerSchema.methods.disable = function() {
  this.enabled = false;
  this.metadata.updatedAt = new Date();
  return this.save();
};

triggerSchema.methods.enable = function() {
  this.enabled = true;
  this.metadata.updatedAt = new Date();
  return this.save();
};

// Static methods for querying
triggerSchema.statics.findByWorkflow = function(workflowId: string) {
  return this.find({ workflowId, enabled: true });
};

triggerSchema.statics.findByType = function(type: string) {
  return this.find({ type, enabled: true });
};

triggerSchema.statics.findSchedulesDue = function() {
  const now = new Date();
  return this.find({
    type: 'schedule-trigger',
    enabled: true,
    'config.enabled': true,
    'config.nextExecution': { $lte: now }
  });
};

export const TriggerModel = mongoose.model<ITriggerConfig>('Trigger', triggerSchema);
export const TriggerExecutionModel = mongoose.model<ITriggerExecution>('TriggerExecution', triggerExecutionSchema);