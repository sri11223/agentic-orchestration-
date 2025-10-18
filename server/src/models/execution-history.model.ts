import mongoose, { Document } from 'mongoose';
import { WorkflowStatus } from '../types/workflow.types';

interface IExecutionHistory extends Document {
  workflowId: mongoose.Types.ObjectId;
  status: WorkflowStatus;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  nodeExecutions: Array<{
    nodeId: string;
    startTime: Date;
    endTime?: Date;
    status: 'success' | 'failed' | 'skipped';
    error?: string;
    output?: any;
    metrics: {
      duration: number;
      memoryUsage: number;
      aiTokensUsed?: number;
      aiCost?: number;
    };
  }>;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  error?: {
    message: string;
    code: string;
    nodeId?: string;
    stack?: string;
  };
  metrics: {
    totalDuration: number;
    totalCost: number;
    aiTokensUsed: number;
    peakMemoryUsage: number;
    nodeCount: number;
    successfulNodes: number;
    failedNodes: number;
  };
  tags: string[];
}

const executionHistorySchema = new mongoose.Schema<IExecutionHistory>({
  _id: {
    type: String,
    required: true
  },
  workflowId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workflow',
    required: true
  },
  status: {
    type: String,
    enum: Object.values(WorkflowStatus),
    required: true,
    index: true
  },
  startTime: {
    type: Date,
    required: true,
    index: true
  },
  endTime: Date,
  duration: Number,
  nodeExecutions: [{
    nodeId: { type: String, required: true },
    startTime: { type: Date, required: true },
    endTime: Date,
    status: {
      type: String,
      enum: ['success', 'failed', 'skipped'],
      required: true
    },
    error: String,
    output: mongoose.Schema.Types.Mixed,
    metrics: {
      duration: Number,
      memoryUsage: Number,
      aiTokensUsed: Number,
      aiCost: Number
    }
  }],
  inputs: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  outputs: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  error: {
    message: String,
    code: String,
    nodeId: String,
    stack: String
  },
  metrics: {
    totalDuration: { type: Number, default: 0 },
    totalCost: { type: Number, default: 0 },
    aiTokensUsed: { type: Number, default: 0 },
    peakMemoryUsage: { type: Number, default: 0 },
    nodeCount: { type: Number, default: 0 },
    successfulNodes: { type: Number, default: 0 },
    failedNodes: { type: Number, default: 0 }
  },
  tags: [String]
}, {
  timestamps: true
});

// Indexes for analytics queries
executionHistorySchema.index({ 'metrics.totalDuration': 1 });
executionHistorySchema.index({ 'metrics.totalCost': 1 });
executionHistorySchema.index({ startTime: 1, status: 1 });
executionHistorySchema.index({ tags: 1 });

// Methods for analytics
executionHistorySchema.statics.getMetricsSummary = async function(workflowId: string) {
  return await this.aggregate([
    {
      $match: { workflowId: new mongoose.Types.ObjectId(workflowId) }
    },
    {
      $group: {
        _id: null,
        avgDuration: { $avg: '$metrics.totalDuration' },
        avgCost: { $avg: '$metrics.totalCost' },
        totalExecutions: { $sum: 1 },
        successRate: {
          $avg: {
            $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
          }
        },
        avgTokensUsed: { $avg: '$metrics.aiTokensUsed' }
      }
    }
  ]);
};

// Pre-save middleware to calculate metrics
executionHistorySchema.pre('save', function(next) {
  if (this.endTime) {
    this.duration = this.endTime.getTime() - this.startTime.getTime();
  }
  
  const metrics = this.nodeExecutions.reduce((acc, node) => {
    if (node.status === 'success') acc.successfulNodes++;
    if (node.status === 'failed') acc.failedNodes++;
    if (node.metrics) {
      acc.totalDuration += node.metrics.duration || 0;
      acc.totalCost += node.metrics.aiCost || 0;
      acc.aiTokensUsed += node.metrics.aiTokensUsed || 0;
      acc.peakMemoryUsage = Math.max(acc.peakMemoryUsage, node.metrics.memoryUsage || 0);
    }
    return acc;
  }, {
    successfulNodes: 0,
    failedNodes: 0,
    totalDuration: 0,
    totalCost: 0,
    aiTokensUsed: 0,
    peakMemoryUsage: 0
  });

  this.metrics = {
    ...this.metrics,
    ...metrics,
    nodeCount: this.nodeExecutions.length
  };

  next();
});

// Performance indexes
executionHistorySchema.index({ workflowId: 1, startTime: -1 });
executionHistorySchema.index({ status: 1, startTime: -1 });
executionHistorySchema.index({ startTime: -1 });
executionHistorySchema.index({ 'metrics.totalCost': -1 });
executionHistorySchema.index({ 'metrics.aiTokensUsed': -1 });
executionHistorySchema.index({ tags: 1 });
executionHistorySchema.index({ 'nodeExecutions.status': 1, startTime: -1 });
executionHistorySchema.index({ 'nodeExecutions.nodeId': 1, startTime: -1 });

export const ExecutionHistoryModel = mongoose.model<IExecutionHistory>('ExecutionHistory', executionHistorySchema);