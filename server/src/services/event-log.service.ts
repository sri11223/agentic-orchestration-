import { EventType } from '../types/workflow.types';
import { EventLogModel } from '../models/event-log.model';

export interface IEventLog {
  type: EventType;
  executionId: string;
  nodeId?: string;
  data?: Record<string, any>;
  timestamp?: Date;
}

export class EventLogService {
  async logEvent(event: IEventLog): Promise<void> {
    try {
      await EventLogModel.create({
        ...event,
        timestamp: event.timestamp || new Date()
      });
    } catch (error) {
      console.error('Failed to log event:', error);
      // We don't throw here to prevent workflow execution from failing due to logging issues
    }
  }

  async getExecutionEvents(executionId: string): Promise<IEventLog[]> {
    return await EventLogModel.find({ executionId }).sort({ timestamp: 1 }) as any;
  }

  async getNodeEvents(nodeId: string): Promise<IEventLog[]> {
    return await EventLogModel.find({ nodeId }).sort({ timestamp: 1 }) as any;
  }

  async replayExecution(executionId: string, toTimestamp?: Date): Promise<IEventLog[]> {
    const query: any = { executionId };
    if (toTimestamp) {
      query.timestamp = { $lte: toTimestamp };
    }
    return await EventLogModel.find(query).sort({ timestamp: 1 }) as any;
  }
}