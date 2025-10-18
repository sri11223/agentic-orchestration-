import { INode, IWorkflowExecution, NodeType, WorkflowStatus, EventType } from '../types/workflow.types';
import { EventEmitter } from 'events';
import { AIService } from '../services/ai.service';
import { WorkflowExecutionModel } from '../models/workflow-execution.model';
import { EventLogService } from '../services/event-log.service';

export class WorkflowEngine {
  private eventEmitter: EventEmitter;
  private aiService: AIService;
  private eventLogService: EventLogService;

  constructor() {
    this.eventEmitter = new EventEmitter();
    this.aiService = new AIService();
    this.eventLogService = new EventLogService();
    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.eventEmitter.on(EventType.NODE_COMPLETED, this.handleNodeCompletion.bind(this));
    this.eventEmitter.on(EventType.NODE_FAILED, this.handleNodeFailure.bind(this));
  }

  public async executeWorkflow(workflowId: string, initialData: Record<string, any> = {}): Promise<IWorkflowExecution> {
    try {
      const execution = await WorkflowExecutionModel.create({
        workflowId,
        status: WorkflowStatus.RUNNING,
        data: initialData,
        startedAt: new Date()
      });

      await this.eventLogService.logEvent({
        type: EventType.WORKFLOW_STARTED,
        executionId: execution.id,
        data: { workflowId }
      });

      // Start execution with first node
      const firstNode = await this.getStartNode(workflowId);
      await this.executeNode(firstNode, execution as any);

      return execution as any;
    } catch (error) {
      await this.handleWorkflowFailure(workflowId, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  private async executeNode(node: INode, execution: IWorkflowExecution): Promise<void> {
    try {
      await this.eventLogService.logEvent({
        type: EventType.NODE_STARTED,
        executionId: execution.id,
        nodeId: node.id,
        data: node.data
      });

      let result;
      switch (node.type) {
        case NodeType.AI_PROCESSOR:
          result = await this.aiService.processNode(node, execution.data);
          break;
        case NodeType.HUMAN_TASK:
          await this.createHumanTask(node, execution);
          return; // Pause execution until human completes task
        case NodeType.DECISION:
          result = await this.processDecisionNode(node, execution.data);
          break;
        case NodeType.ACTION:
          result = await this.executeAction(node, execution.data);
          break;
        default:
          throw new Error(`Unsupported node type: ${node.type}`);
      }

      this.eventEmitter.emit(EventType.NODE_COMPLETED, {
        nodeId: node.id,
        executionId: execution.id,
        result
      });
    } catch (error) {
      this.eventEmitter.emit(EventType.NODE_FAILED, {
        nodeId: node.id,
        executionId: execution.id,
        error
      });
    }
  }

  private async handleNodeCompletion(data: { nodeId: string; executionId: string; result: any }) {
    const { nodeId, executionId, result } = data;
    const execution = await WorkflowExecutionModel.findById(executionId);
    if (!execution) return;

    // Update execution data with node result
    execution.data = { ...execution.data, [nodeId]: result };
    await execution.save();

    // Get next nodes and continue execution
    const nextNodes = await this.getNextNodes(nodeId, execution.workflowId.toString());
    if (nextNodes.length === 0) {
      await this.completeWorkflow(execution as any);
    } else {
      for (const nextNode of nextNodes) {
        await this.executeNode(nextNode, execution as any);
      }
    }
  }

  private async handleNodeFailure(data: { nodeId: string; executionId: string; error: Error }) {
    const { nodeId, executionId, error } = data;
    const execution = await WorkflowExecutionModel.findById(executionId);
    if (!execution) return;

    execution.status = WorkflowStatus.FAILED;
    execution.error = error.message;
    await execution.save();

    await this.eventLogService.logEvent({
      type: EventType.NODE_FAILED,
      executionId,
      nodeId,
      data: { error: error.message }
    });
  }

  private async completeWorkflow(execution: IWorkflowExecution) {
    execution.status = WorkflowStatus.COMPLETED;
    execution.completedAt = new Date();
    await (execution as any).save();

    await this.eventLogService.logEvent({
      type: EventType.WORKFLOW_COMPLETED,
      executionId: execution.id,
      data: execution.data
    });
  }

  // Helper methods to be implemented
  private async getStartNode(workflowId: string): Promise<INode> {
    // Implementation to get the first node of the workflow
    throw new Error('Not implemented');
  }

  private async getNextNodes(nodeId: string, workflowId: string): Promise<INode[]> {
    // Implementation to get next nodes based on edges
    throw new Error('Not implemented');
  }

  private async processDecisionNode(node: INode, data: Record<string, any>): Promise<string> {
    // Implementation for decision logic
    throw new Error('Not implemented');
  }

  private async executeAction(node: INode, data: Record<string, any>): Promise<any> {
    // Implementation for action execution
    throw new Error('Not implemented');
  }

  private async createHumanTask(node: INode, execution: IWorkflowExecution): Promise<void> {
    // Implementation for human task creation
    throw new Error('Not implemented');
  }

  private async handleWorkflowFailure(workflowId: string, error: Error): Promise<void> {
    // Implementation for workflow failure handling
    throw new Error('Not implemented');
  }
}