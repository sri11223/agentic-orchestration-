import { authService } from './auth.service';
import { API_URL } from '@/config/api';

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
  private baseUrl = API_URL;

  private async request(endpoint: string, options: RequestInit = {}) {
    try {
      const token = await authService.getValidToken();
      
      // Add cache-busting parameter for GET requests to prevent 304 responses
      let url = `${this.baseUrl}${endpoint}`;
      if (!options.method || options.method === 'GET') {
        const separator = endpoint.includes('?') ? '&' : '?';
        url += `${separator}_t=${Date.now()}`;
      }
      
      const response = await fetch(url, {
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

    // Server returns { execution, events, progress }
    const exec = result.execution;
    const progress = result.progress || {
      totalNodes: exec?.executionHistory?.length || 0,
      completedNodes: exec?.executionHistory?.filter((h: any) => !h.error).length || 0,
      failedNodes: exec?.executionHistory?.filter((h: any) => !!h.error).length || 0,
    };

    // Map to the client's ExecutionStatus shape
    const mapped: ExecutionStatus = {
      executionId: exec.executionId || exec._id || executionId,
      status: exec.status,
      progress: {
        currentStep: progress.completedNodes || 0,
        totalSteps: progress.totalNodes || 0,
        currentNode: exec.currentNodeId || ''
      },
      startTime: exec.startTime,
      endTime: exec.endTime,
      error: exec.status === 'failed' ? (exec.executionHistory?.find((h: any) => h.error)?.error || 'Execution failed') : undefined,
      result: exec.outputs || exec.variables || null
    };

    return mapped;
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
    let retryCount = 0;
    const maxRetries = 3;
    
    const pollInterval = setInterval(async () => {
      try {
        const status = await this.getExecutionStatus(executionId);
        
        // Reset retry count on successful request
        retryCount = 0;
        
        if (!status) {
          console.warn('No status received, continuing to poll...');
          return;
        }

        callbacks.onProgress?.(status);

        if (status.status === 'completed') {
          // Provide the full execution status to the onComplete handler
          callbacks.onComplete?.(status);
          clearInterval(pollInterval);
        } else if (status.status === 'failed') {
          callbacks.onError?.(status.error || 'Execution failed');
          clearInterval(pollInterval);
        }

        // Get new events
        try {
          const events = await this.getExecutionEvents(executionId);
          events.forEach(event => callbacks.onEvent?.(event));
        } catch (eventError) {
          console.warn('Error fetching events:', eventError);
        }

      } catch (error) {
        console.error('Error polling execution status:', error);
        retryCount++;
        
        // If too many failures, stop polling
        if (retryCount >= maxRetries) {
          console.error(`Polling failed ${maxRetries} times, stopping...`);
          callbacks.onError?.('Failed to get execution status after multiple retries');
          clearInterval(pollInterval);
        }
      }
    }, 2000);

    // Return unsubscribe function
    return () => clearInterval(pollInterval);
  }
}

export const executionService = new WorkflowExecutionService();
