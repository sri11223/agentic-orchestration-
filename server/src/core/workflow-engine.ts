import { INode, IWorkflowExecution, NodeType, WorkflowStatus, EventType } from '../types/workflow.types';
import { EventEmitter } from 'events';
import { AIService } from '../services/ai.service';
import { WorkflowExecutionModel } from '../models/workflow-execution.model';
import { EventLogService } from '../services/event-log.service';
import { WorkflowModel } from '../models/workflow.model';
import { HttpService } from '../services/http.service';

export class WorkflowEngine {
  private eventEmitter: EventEmitter;
  private aiService: AIService;
  private eventLogService: EventLogService;
  private httpService: HttpService;

  constructor() {
    this.eventEmitter = new EventEmitter();
    this.aiService = new AIService();
    this.eventLogService = new EventLogService();
    this.httpService = new HttpService();
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
    const nextNodes = await this.getNextNodes(nodeId, execution.workflowId.toString(), execution.data as Record<string, any>);
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
    const workflow = await WorkflowModel.findById(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const startNode = workflow.nodes.find(node => node.type === NodeType.TRIGGER || node.type === NodeType.TIMER);
    if (!startNode) {
      const fallbackNode = workflow.nodes[0];
      if (!fallbackNode) {
        throw new Error(`Workflow ${workflowId} has no nodes`);
      }
      return fallbackNode;
    }
    return startNode as any;
  }

  private async getNextNodes(
    nodeId: string,
    workflowId: string,
    executionData: Record<string, any>
  ): Promise<INode[]> {
    const workflow = await WorkflowModel.findById(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const outgoingEdges = workflow.edges.filter(edge => edge.source === nodeId);
    if (outgoingEdges.length === 0) {
      return [];
    }

    const validEdges = outgoingEdges.filter(edge => {
      if (!edge.data?.condition && !edge.condition) return true;
      const condition = edge.data?.condition || edge.condition;
      return this.evaluateCondition(condition, executionData);
    });

    return workflow.nodes.filter(node =>
      validEdges.some(edge => edge.target === node.id)
    ) as any;
  }

  private async processDecisionNode(node: INode, data: Record<string, any>): Promise<string> {
    const config = node.data?.config || node.data || {};
    const expression = config.expression || config.condition;

    if (!expression) {
      return 'true';
    }

    const result = this.evaluateCondition(expression, data);
    return result ? 'true' : 'false';
  }

  private async executeAction(node: INode, data: Record<string, any>): Promise<any> {
    const config = node.data?.config || node.data || {};
    if (config.url) {
      const response = await this.httpService.request({
        url: config.url,
        method: config.method || 'GET',
        headers: config.headers,
        data: config.body || config.payload
      });
      return response;
    }

    return {
      message: 'No action configured',
      nodeId: node.id
    };
  }

  private async createHumanTask(node: INode, execution: IWorkflowExecution): Promise<void> {
    execution.status = WorkflowStatus.PAUSED;
    execution.currentNodeId = node.id;
    await (execution as any).save();

    await this.eventLogService.logEvent({
      type: EventType.HUMAN_TASK_CREATED,
      executionId: execution.id,
      nodeId: node.id,
      data: node.data
    });
  }

  private async handleWorkflowFailure(workflowId: string, error: Error): Promise<void> {
    const execution = await WorkflowExecutionModel.findOne({
      workflowId,
      status: WorkflowStatus.RUNNING
    }).sort({ startedAt: -1 });

    if (execution) {
      execution.status = WorkflowStatus.FAILED;
      execution.error = error.message;
      execution.completedAt = new Date();
      await execution.save();

      await this.eventLogService.logEvent({
        type: EventType.WORKFLOW_FAILED,
        executionId: execution.id,
        data: { error: error.message }
      });
    }
  }

  private evaluateCondition(condition: string, data: Record<string, any>): boolean {
    try {
      const [variable, operator, rawValue] = condition.split(' ');
      const actualValue = data[variable];
      const value = rawValue?.replace(/^"|"$/g, '');

      switch (operator) {
        case '>': return actualValue > Number(value);
        case '<': return actualValue < Number(value);
        case '>=': return actualValue >= Number(value);
        case '<=': return actualValue <= Number(value);
        case '==': return actualValue == value;
        case '!=': return actualValue != value;
        case 'contains': return String(actualValue).includes(String(value));
        default: return false;
      }
    } catch (error) {
      console.warn('Decision evaluation failed:', condition, error);
      return false;
    }
  }
}
