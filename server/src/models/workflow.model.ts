import mongoose, { Document } from 'mongoose';
import { INode, IEdge, NodeType } from '../types/workflow.types';

interface IWorkflow extends Document {
  name: string;
  description: string;
  version: number;
  nodes: INode[];
  edges: IEdge[];
  status: 'draft' | 'active' | 'archived';
  metadata: {
    creator: string;
    lastEditor: string;
    tags: string[];
    category: string;
    aiProviders: string[];
    estimatedDuration: number;
    avgExecutionTime: number;
    successRate: number;
  };
  settings: {
    timeout: number;
    maxRetries: number;
    concurrency: number;
    notifyOnFailure: boolean;
    notifyOnSuccess: boolean;
    notificationChannels: string[];
  };
  permissions: {
    owners: string[];
    editors: string[];
    viewers: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const nodeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { 
    type: String, 
    enum: Object.values(NodeType),
    required: true 
  },
  data: {
    title: String,
    description: String,
    actionType: String,  // Added for action nodes
    triggerType: String, // Added for trigger nodes
    config: mongoose.Schema.Types.Mixed,
    validation: {
      required: { type: Boolean, default: false },
      schema: mongoose.Schema.Types.Mixed
    }
  },
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true }
  },
  metadata: {
    createdAt: { type: Date, default: Date.now },
    lastExecuted: Date,
    avgExecutionTime: Number,
    successRate: Number,
    errorRate: Number
  }
});

const edgeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  source: { type: String, required: true },
  target: { type: String, required: true },
  type: { type: String, required: true },
  data: {
    condition: String,
    priority: { type: Number, default: 1 },
    retryOnFail: { type: Boolean, default: false }
  }
});

const workflowSchema = new mongoose.Schema<IWorkflow>({
  name: { 
    type: String, 
    required: true,
    trim: true,
    index: true 
  },
  description: String,
  version: { 
    type: Number, 
    default: 1,
    validate: {
      validator: Number.isInteger,
      message: 'Version must be an integer'
    }
  },
  nodes: [nodeSchema],
  edges: [edgeSchema],
  status: { 
    type: String, 
    enum: ['draft', 'active', 'archived'],
    default: 'draft',
    index: true
  },
  metadata: {
    creator: { type: String, required: true },
    lastEditor: String,
    tags: [String],
    category: String,
    aiProviders: [String],
    estimatedDuration: Number,
    avgExecutionTime: Number,
    successRate: { 
      type: Number,
      min: 0,
      max: 100 
    }
  },
  settings: {
    timeout: { 
      type: Number,
      default: 3600000 // 1 hour in milliseconds
    },
    maxRetries: { 
      type: Number,
      default: 3
    },
    concurrency: { 
      type: Number,
      default: 1
    },
    notifyOnFailure: { 
      type: Boolean,
      default: true
    },
    notifyOnSuccess: { 
      type: Boolean,
      default: false
    },
    notificationChannels: {
      type: [String],
      default: ['email']
    }
  },
  permissions: {
    owners: [String],
    editors: [String],
    viewers: [String]
  }
}, {
  timestamps: true,
  versionKey: '__v'
});

// Indexes for performance optimization
workflowSchema.index({ 'metadata.tags': 1 });
workflowSchema.index({ 'metadata.category': 1 });
workflowSchema.index({ createdAt: 1 });
workflowSchema.index({ status: 1, createdAt: -1 });
workflowSchema.index({ name: 1 });
workflowSchema.index({ 'permissions.owners': 1 });
workflowSchema.index({ 'permissions.editors': 1 });
workflowSchema.index({ 'permissions.viewers': 1 });
workflowSchema.index({ version: -1 });
workflowSchema.index({ 'metadata.successRate': -1 });
workflowSchema.index({ 'metadata.avgExecutionTime': 1 });

// Middleware for version control
workflowSchema.pre('save', async function(next) {
  if (this.isModified() && (this as any).status === 'active') {
    (this as any).version += 1;
  }
  next();
});

// Methods
workflowSchema.methods.archive = async function() {
  this.status = 'archived';
  return await this.save();
};

workflowSchema.methods.activate = async function() {
  this.status = 'active';
  return await this.save();
};

workflowSchema.methods.duplicate = async function() {
  const duplicate = new WorkflowModel({
    ...this.toObject(),
    name: `${this.name} (Copy)`,
    status: 'draft',
    version: 1,
    metadata: {
      ...this.metadata,
      creator: this.metadata.lastEditor,
    }
  });
  return await duplicate.save();
};

// Static methods for analytics
workflowSchema.statics.getAnalytics = async function() {
  return await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgSuccessRate: { $avg: '$metadata.successRate' },
        avgExecutionTime: { $avg: '$metadata.avgExecutionTime' }
      }
    }
  ]);
};

export const WorkflowModel = mongoose.model<IWorkflow>('Workflow', workflowSchema);