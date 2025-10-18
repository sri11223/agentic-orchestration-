import { EventEmitter } from 'events';

export interface WorkflowEvent {
  type: string;
  executionId: string;
  nodeId?: string;
  data?: any;
  timestamp: Date;
}

export class EventBus extends EventEmitter {
  private static instance: EventBus;
  private eventHistory: WorkflowEvent[] = [];

  private constructor() {
    super();
    this.setMaxListeners(1000); // Allow many listeners
  }

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Emit a workflow event
   */
  emitEvent(type: string, data: any): void {
    const event: WorkflowEvent = {
      type,
      executionId: data.executionId,
      nodeId: data.nodeId,
      data,
      timestamp: new Date()
    };

    // Store in history
    this.eventHistory.push(event);
    
    // Keep only last 1000 events to prevent memory leak
    if (this.eventHistory.length > 1000) {
      this.eventHistory.shift();
    }

    // Emit the event
    this.emit(type, data);
    this.emit('*', event); // Wildcard listener for all events

    console.log(`Event emitted: ${type}`, data);
  }

  /**
   * Get event history for an execution
   */
  getExecutionEvents(executionId: string): WorkflowEvent[] {
    return this.eventHistory.filter(event => event.executionId === executionId);
  }

  /**
   * Get all recent events
   */
  getRecentEvents(limit: number = 100): WorkflowEvent[] {
    return this.eventHistory.slice(-limit);
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
  }
}

// Event type constants
export const EventTypes = {
  EXECUTION_STARTED: 'execution:started',
  EXECUTION_COMPLETED: 'execution:completed',
  EXECUTION_FAILED: 'execution:failed',
  EXECUTION_PAUSED: 'execution:paused',
  EXECUTION_RESUMED: 'execution:resumed',
  NODE_STARTED: 'node:started',
  NODE_COMPLETED: 'node:completed',
  NODE_FAILED: 'node:failed',
  HUMAN_APPROVAL_REQUESTED: 'human:approval_requested',
  HUMAN_APPROVED: 'human:approved',
  HUMAN_REJECTED: 'human:rejected',
  AI_REQUEST: 'ai:request',
  AI_RESPONSE: 'ai:response'
} as const;