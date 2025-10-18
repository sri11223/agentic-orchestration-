import { EventEmitter } from 'events';
import { WorkflowModel } from '../models/workflow.model';
import { ExecutionHistoryModel } from '../models/execution-history.model';
import { INode, IEdge, NodeType, WorkflowStatus } from '../types/workflow.types';
import { NodeExecutor } from './node-executor';
import { EventBus } from './event-bus';
import { lockService } from '../services/lock.service';
import { cacheService } from '../services/cache.service';

export interface ExecutionContext {
  executionId: string;
  workflowId: string;
  currentNodeId: string;
  variables: Record<string, any>;
  executionHistory: Array<{
    nodeId: string;
    timestamp: Date;
    input: any;
    output: any;
    error?: string;
    duration: number;
  }>;
  status: WorkflowStatus;
  startTime: Date;
  endTime?: Date;
}

export class WorkflowEngine extends EventEmitter {
  private nodeExecutor: NodeExecutor;
  private eventBus: EventBus;
  private runningExecutions: Map<string, ExecutionContext> = new Map();

  constructor() {
    super();
    this.nodeExecutor = new NodeExecutor();
    this.eventBus = EventBus.getInstance();
    this.setupEventHandlers();
  }

  /**
   * Start workflow execution
   */
  async executeWorkflow(workflowId: string, triggerData?: any): Promise<string> {
    const workflow = await WorkflowModel.findById(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    if (workflow.status !== 'active') {
      throw new Error(`Workflow ${workflowId} is not active`);
    }

    // Create execution context
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const context: ExecutionContext = {
      executionId,
      workflowId,
      currentNodeId: this.findStartNode(workflow.nodes),
      variables: { ...triggerData },
      executionHistory: [],
      status: WorkflowStatus.RUNNING,
      startTime: new Date()
    };

    // Store in memory and database
    this.runningExecutions.set(executionId, context);
    await this.persistExecution(context);

    // Start execution
    this.executeNextNode(context);

    return executionId;
  }

  /**
   * Resume paused workflow execution
   */
  async resumeWorkflow(executionId: string, resumeData?: any): Promise<void> {
    let context = this.runningExecutions.get(executionId);
    
    if (!context) {
      // Load from database if not in memory
      const loadedContext = await this.loadExecution(executionId);
      if (!loadedContext) throw new Error(`Execution ${executionId} not found`);
      context = loadedContext;
      if (!context) {
        throw new Error(`Execution ${executionId} not found`);
      }
      this.runningExecutions.set(executionId, context);
    }

    if (context.status !== 'paused') {
      throw new Error(`Execution ${executionId} is not paused`);
    }

    // Merge resume data into context
    if (resumeData) {
      context.variables = { ...context.variables, ...resumeData };
    }

    context.status = WorkflowStatus.RUNNING;
    await this.persistExecution(context);

    // Continue execution
    this.executeNextNode(context);
  }

  /**
   * Execute the next node in the workflow
   */
  private async executeNextNode(context: ExecutionContext): Promise<void> {
    const lockKey = `execution:${context.executionId}`;
    
    try {
      await lockService.withLock(lockKey, async () => {
        const workflow = await WorkflowModel.findById(context.workflowId);
        if (!workflow) throw new Error(`Workflow ${context.workflowId} not found`);

        const currentNode = workflow.nodes.find(n => n.id === context.currentNodeId);
        if (!currentNode) {
          await this.completeExecution(context, WorkflowStatus.COMPLETED);
          return;
        }

        this.emit('node:start', {
          executionId: context.executionId,
          nodeId: currentNode.id,
          nodeType: currentNode.type
        });

        const startTime = Date.now();

        try {
          // Execute the node
          const result = await this.nodeExecutor.executeNode(currentNode, context);

          const duration = Date.now() - startTime;

          // Record execution history
          context.executionHistory.push({
            nodeId: currentNode.id,
            timestamp: new Date(),
            input: context.variables,
            output: result.output,
            duration
          });

          // Handle different result types
          if (result.type === 'success') {
            // Update variables with node output
            if (result.output) {
              context.variables = { ...context.variables, ...result.output };
            }

            // Find next node(s)
            const nextNodes = this.getNextNodes(workflow.nodes, workflow.edges, currentNode.id, result.output);
            
            if (nextNodes.length === 0) {
              // No more nodes, complete execution
              await this.completeExecution(context, WorkflowStatus.COMPLETED);
            } else if (nextNodes.length === 1) {
              // Single path, continue
              context.currentNodeId = nextNodes[0];
              await this.persistExecution(context);
              
              // Schedule next execution
              setImmediate(() => this.executeNextNode(context));
            } else {
              // Multiple paths (parallel execution)
              await this.handleParallelExecution(context, nextNodes);
            }

          } else if (result.type === 'pause') {
            // Pause execution for human intervention
            context.status = WorkflowStatus.PAUSED;
            await this.persistExecution(context);

            this.emit('execution:paused', {
              executionId: context.executionId,
              nodeId: currentNode.id,
              reason: result.reason,
              data: result.data
            });

          } else if (result.type === 'error') {
            // Handle node execution error
            context.executionHistory.push({
              nodeId: currentNode.id,
              timestamp: new Date(),
              input: context.variables,
              output: null,
              error: result.error,
              duration: Date.now() - startTime
            });

            await this.handleExecutionError(context, result.error || 'Unknown error');
          }

          this.emit('node:complete', {
            executionId: context.executionId,
            nodeId: currentNode.id,
            result: result.type,
            duration
          });

        } catch (error) {
          const duration = Date.now() - startTime;
          
          context.executionHistory.push({
            nodeId: currentNode.id,
            timestamp: new Date(),
            input: context.variables,
            output: null,
            error: error instanceof Error ? error.message : String(error),
            duration
          });

          await this.handleExecutionError(context, error instanceof Error ? error.message : String(error));
        }
      });

    } catch (error) {
      console.error(`Failed to execute node in ${context.executionId}:`, error);
      await this.handleExecutionError(context, error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Handle parallel execution of multiple nodes
   */
  private async handleParallelExecution(context: ExecutionContext, nodeIds: string[]): Promise<void> {
    // For now, execute sequentially (can be enhanced to true parallel later)
    for (const nodeId of nodeIds) {
      context.currentNodeId = nodeId;
      await this.persistExecution(context);
      await this.executeNextNode(context);
    }
  }

  /**
   * Complete workflow execution
   */
  private async completeExecution(context: ExecutionContext, status: WorkflowStatus): Promise<void> {
    context.status = status;
    context.endTime = new Date();
    
    await this.persistExecution(context);
    this.runningExecutions.delete(context.executionId);

    this.emit('execution:complete', {
      executionId: context.executionId,
      status,
      duration: context.endTime.getTime() - context.startTime.getTime()
    });
  }

  /**
   * Handle execution errors
   */
  private async handleExecutionError(context: ExecutionContext, error: string): Promise<void> {
    context.status = WorkflowStatus.FAILED;
    context.endTime = new Date();
    
    await this.persistExecution(context);
    this.runningExecutions.delete(context.executionId);

    this.emit('execution:failed', {
      executionId: context.executionId,
      error,
      nodeId: context.currentNodeId
    });
  }

  /**
   * Find the start node (trigger node) in the workflow
   */
  private findStartNode(nodes: INode[]): string {
    const startNode = nodes.find(node => node.type === NodeType.TRIGGER);
    if (!startNode) {
      throw new Error('No trigger node found in workflow');
    }
    return startNode.id;
  }

  /**
   * Get next nodes based on current node and edges
   */
  private getNextNodes(nodes: INode[], edges: IEdge[], currentNodeId: string, nodeOutput?: any): string[] {
    const outgoingEdges = edges.filter(edge => edge.source === currentNodeId);
    
    if (outgoingEdges.length === 0) {
      return [];
    }

    // Handle conditional edges (decision nodes)
    const currentNode = nodes.find(n => n.id === currentNodeId);
    if (currentNode?.type === NodeType.DECISION) {
      // Filter edges based on condition evaluation
      const validEdges = outgoingEdges.filter(edge => {
        if (!edge.condition) return true; // Default path
        return this.evaluateCondition(edge.condition, nodeOutput);
      });
      return validEdges.map(edge => edge.target);
    }

    // Default: return all target nodes
    return outgoingEdges.map(edge => edge.target);
  }

  /**
   * Evaluate condition for decision nodes
   */
  private evaluateCondition(condition: string, data: any): boolean {
    try {
      // Simple condition evaluation (can be enhanced with proper expression parser)
      // Format: "variable operator value" e.g., "score > 7"
      const [variable, operator, value] = condition.split(' ');
      const actualValue = data[variable];
      
      switch (operator) {
        case '>': return actualValue > parseFloat(value);
        case '<': return actualValue < parseFloat(value);
        case '>=': return actualValue >= parseFloat(value);
        case '<=': return actualValue <= parseFloat(value);
        case '==': return actualValue == value;
        case '!=': return actualValue != value;
        case 'contains': return String(actualValue).includes(value);
        default: return true;
      }
    } catch (error) {
      console.warn('Failed to evaluate condition:', condition, error);
      return false;
    }
  }

  /**
   * Persist execution context to database
   */
  private async persistExecution(context: ExecutionContext): Promise<void> {
    const executionData = {
      _id: context.executionId,
      workflowId: context.workflowId,
      status: context.status,
      startTime: context.startTime,
      endTime: context.endTime,
      nodeExecutions: context.executionHistory.map(h => ({
        nodeId: h.nodeId,
        startTime: h.timestamp,
        endTime: new Date(h.timestamp.getTime() + h.duration),
        status: h.error ? 'failed' : 'success',
        error: h.error,
        output: h.output,
        metrics: {
          duration: h.duration,
          memoryUsage: process.memoryUsage().heapUsed
        }
      })),
      inputs: context.variables,
      outputs: context.variables,
      metrics: {
        totalDuration: context.endTime ? 
          context.endTime.getTime() - context.startTime.getTime() : 
          Date.now() - context.startTime.getTime(),
        totalCost: 0, // Will be calculated based on AI usage
        aiTokensUsed: 0,
        peakMemoryUsage: process.memoryUsage().heapUsed,
        nodeCount: context.executionHistory.length,
        successfulNodes: context.executionHistory.filter(h => !h.error).length,
        failedNodes: context.executionHistory.filter(h => h.error).length
      }
    };

    await ExecutionHistoryModel.findByIdAndUpdate(
      context.executionId,
      executionData,
      { upsert: true, new: true }
    );

    // Cache current context
    await cacheService.set(`execution:${context.executionId}`, context, 3600);
  }

  /**
   * Load execution context from database
   */
  private async loadExecution(executionId: string): Promise<ExecutionContext | null> {
    // Try cache first
    const cached = await cacheService.get<ExecutionContext>(`execution:${executionId}`);
    if (cached) {
      return cached;
    }

    // Load from database
    const execution = await ExecutionHistoryModel.findById(executionId);
    if (!execution) {
      return null;
    }

    // Reconstruct context
    const context: ExecutionContext = {
      executionId,
      workflowId: execution.workflowId.toString(),
      currentNodeId: execution.nodeExecutions[execution.nodeExecutions.length - 1]?.nodeId || '',
      variables: execution.outputs,
      executionHistory: execution.nodeExecutions.map(ne => ({
        nodeId: ne.nodeId,
        timestamp: new Date(ne.startTime),
        input: execution.inputs,
        output: ne.output,
        error: ne.error,
        duration: ne.metrics?.duration || 0
      })),
      status: execution.status,
      startTime: execution.startTime,
      endTime: execution.endTime
    };

    return context;
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.eventBus.on('human:approved', async (data: any) => {
      await this.resumeWorkflow(data.executionId, data.approvalData);
    });

    this.eventBus.on('human:rejected', async (data: any) => {
      const context = this.runningExecutions.get(data.executionId);
      if (context) {
        await this.handleExecutionError(context, 'Human approval rejected');
      }
    });
  }

  /**
   * Get execution status
   */
  async getExecutionStatus(executionId: string): Promise<ExecutionContext | null> {
    return this.runningExecutions.get(executionId) || await this.loadExecution(executionId);
  }

  /**
   * Cancel running execution
   */
  async cancelExecution(executionId: string): Promise<void> {
    const context = this.runningExecutions.get(executionId);
    if (context) {
      await this.completeExecution(context, WorkflowStatus.CANCELLED);
    }
  }
}

export const workflowEngine = new WorkflowEngine();