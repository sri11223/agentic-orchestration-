import { authService } from './auth.service';

export interface ExecutionRequest {
  workflowId: string;
  triggerData?: any;
}

export interface ExecutionStatus {
  executionId: string;
  status: 'running' | 'completed' | 'failed' | 'paused' | 'cancelled';
  progress?: {
    currentStep: number;
    totalSteps: number;
    currentNode: string;
  };
  startTime: string;
  endTime?: string;
  error?: string;
  result?: any;
}

export interface ExecutionEvent {
  timestamp: string;
  type: string;
  nodeId?: string;
  message: string;
  data?: any;
}

class WorkflowExecutionService {
  private baseUrl = 'http://localhost:5000/api';

  private async request(endpoint: string, options: RequestInit = {}) {
    try {
      const token = await authService.getValidToken();
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || error.message || 'Request failed');
      }

      return response.json();
    } catch (error) {
      console.error('❌ Execution service request failed:', error);
      throw error;
    }
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(request: ExecutionRequest): Promise<{ executionId: string; status: string }> {
    console.log('🚀 Starting workflow execution:', request.workflowId);
    
    const result = await this.request(`/workflows/${request.workflowId}/execute`, {
      method: 'POST',
      body: JSON.stringify({
        triggerData: request.triggerData || {}
      })
    });

    console.log('✅ Workflow execution started:', result);
    return result;
  }

  /**
   * Get execution status and progress
   */
  async getExecutionStatus(executionId: string): Promise<ExecutionStatus> {
    const result = await this.request(`/executions/${executionId}`);
    return result.execution;
  }

  /**
   * Get execution events (real-time logs)
   */
  async getExecutionEvents(executionId: string): Promise<ExecutionEvent[]> {
    const result = await this.request(`/executions/${executionId}`);
    return result.events || [];
  }

  /**
   * Cancel a running execution
   */
  async cancelExecution(executionId: string): Promise<void> {
    await this.request(`/executions/${executionId}/cancel`, {
      method: 'POST'
    });
  }

  /**
   * Pause a running execution
   */
  async pauseExecution(executionId: string): Promise<void> {
    await this.request(`/executions/${executionId}/pause`, {
      method: 'POST'
    });
  }

  /**
   * Resume a paused execution
   */
  async resumeExecution(executionId: string, resumeData?: any): Promise<void> {
    await this.request(`/executions/${executionId}/resume`, {
      method: 'POST',
      body: JSON.stringify({ resumeData })
    });
  }

  /**
   * Get execution history for a workflow
   */
  async getExecutionHistory(workflowId: string, page = 1, limit = 20): Promise<{
    executions: ExecutionStatus[];
    pagination: {
      total: number;
      page: number;
      pages: number;
      limit: number;
    };
  }> {
    const result = await this.request(
      `/executions?workflowId=${workflowId}&page=${page}&limit=${limit}`
    );
    return result;
  }

  /**
   * Test AI node configuration
   */
  async testAINode(config: {
    prompt: string;
    taskType?: string;
    aiProvider?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }): Promise<{
    text: string;
    provider: string;
    tokensUsed?: number;
    cost?: number;
    confidence?: number;
  }> {
    console.log('🧪 Testing AI node configuration:', config);
    
    const result = await this.request('/ai/test', {
      method: 'POST',
      body: JSON.stringify(config)
    });

    console.log('✅ AI test result:', result);
    return result;
  }

  /**
   * Save workflow to backend (auto-save)
   */
  async saveWorkflow(workflowData: any): Promise<void> {
    if (workflowData.id && workflowData.id !== 'new') {
      // Update existing workflow
      await this.request(`/workflows/${workflowData.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: workflowData.name,
          description: workflowData.description,
          nodes: workflowData.nodes,
          edges: workflowData.edges,
          status: 'draft' // Save as draft until published
        })
      });
    }
  }

  /**
   * Subscribe to real-time execution updates via WebSocket
   */
  subscribeToExecution(executionId: string, callbacks: {
    onProgress?: (status: ExecutionStatus) => void;
    onEvent?: (event: ExecutionEvent) => void;
    onComplete?: (result: any) => void;
    onError?: (error: string) => void;
  }): () => void {
    // For now, use polling. In a real app, you'd use WebSocket
    const pollInterval = setInterval(async () => {
      try {
        const status = await this.getExecutionStatus(executionId);
        callbacks.onProgress?.(status);

        if (status.status === 'completed') {
          callbacks.onComplete?.(status.result);
          clearInterval(pollInterval);
        } else if (status.status === 'failed') {
          callbacks.onError?.(status.error || 'Execution failed');
          clearInterval(pollInterval);
        }

        // Get new events
        const events = await this.getExecutionEvents(executionId);
        events.forEach(event => callbacks.onEvent?.(event));

      } catch (error) {
        console.error('Error polling execution status:', error);
      }
    }, 2000);

    // Return unsubscribe function
    return () => clearInterval(pollInterval);
  }
}

export const executionService = new WorkflowExecutionService();