import mongoose from 'mongoose';
import { WorkflowStatus } from '../types/workflow.types';

const workflowExecutionSchema = new mongoose.Schema({
  workflowId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workflow',
    required: true
  },
  status: {
    type: String,
    enum: Object.values(WorkflowStatus),
    default: WorkflowStatus.PENDING
  },
  currentNodeId: String,
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  error: String,
  startedAt: {
    type: Date,
    required: true
  },
  completedAt: Date
}, {
  timestamps: true
});

export const WorkflowExecutionModel = mongoose.model('WorkflowExecution', workflowExecutionSchema);