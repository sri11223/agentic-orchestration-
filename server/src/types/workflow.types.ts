export interface INode {
  id: string;
  type: NodeType;
  data: Record<string, any>;
  position: { x: number; y: number };
}

export interface IEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  condition?: string;
}

export enum NodeType {
  AI_PROCESSOR = 'ai_processor',
  HUMAN_TASK = 'human_task',
  DECISION = 'decision',
  ACTION = 'action',
  TIMER = 'timer',
  TRIGGER = 'trigger'
}

export interface IWorkflowExecution {
  id: string;
  workflowId: string;
  status: WorkflowStatus;
  currentNodeId: string;
  data: Record<string, any>;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}

export enum WorkflowStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface IExecutionEvent {
  id: string;
  executionId: string;
  type: EventType;
  nodeId: string;
  data: Record<string, any>;
  timestamp: Date;
}

export enum EventType {
  NODE_STARTED = 'node_started',
  NODE_COMPLETED = 'node_completed',
  NODE_FAILED = 'node_failed',
  WORKFLOW_STARTED = 'workflow_started',
  WORKFLOW_COMPLETED = 'workflow_completed',
  WORKFLOW_FAILED = 'workflow_failed',
  HUMAN_TASK_CREATED = 'human_task_created',
  HUMAN_TASK_COMPLETED = 'human_task_completed'
}