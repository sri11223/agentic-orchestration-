import mongoose from 'mongoose';
import { EventType } from '../types/workflow.types';

const eventLogSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: Object.values(EventType),
    required: true
  },
  executionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkflowExecution',
    required: true
  },
  nodeId: {
    type: String
  },
  data: {
    type: mongoose.Schema.Types.Mixed
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient querying
eventLogSchema.index({ executionId: 1, timestamp: 1 });
eventLogSchema.index({ nodeId: 1, timestamp: 1 });

export const EventLogModel = mongoose.model('EventLog', eventLogSchema);