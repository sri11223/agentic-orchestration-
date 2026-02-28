import { authService } from './auth.service';
import { API_URL } from '@/config/api';

export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: any;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface Workflow {
  id?: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  status: 'draft' | 'active' | 'archived';
  category?: string;
  version?: number;
  metadata?: {
    creator?: string;
    lastEditor?: string;
    createdAt?: string;
    updatedAt?: string;
  };
  permissions?: {
    owners: string[];
    editors: string[];
    viewers: string[];
  };
}

export interface WorkflowsResponse {
  workflows: Workflow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CreateWorkflowRequest {
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  status?: 'draft' | 'active';
  category?: string;
}

export interface UpdateWorkflowRequest {
  name?: string;
  description?: string;
  nodes?: WorkflowNode[];
  edges?: WorkflowEdge[];
  category?: string;
  status?: 'draft' | 'active' | 'archived';
}

export interface ExecutionRequest {
  triggerData?: Record<string, any>;
}

export interface ExecutionResponse {
  executionId: string;
  status: 'started' | 'running' | 'completed' | 'failed';
  message: string;
}

class WorkflowService {
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await authService.getValidToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  async getWorkflows(params?: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    search?: string;
  }): Promise<WorkflowsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.search) queryParams.append('search', params.search);

    const url = `${API_URL}/workflows${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    const headers = await this.getAuthHeaders();
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    const result = await response.json();
    
    // Map _id to id for all workflows
    const workflowsWithId = {
      ...result,
      workflows: result.workflows.map((workflow: any) => ({
        ...workflow,
        id: workflow._id
      }))
    };
    
    return workflowsWithId;
  }

  async createWorkflow(workflowData: CreateWorkflowRequest): Promise<Workflow> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_URL}/workflows`, {
      method: 'POST',
        headers,
        body: JSON.stringify(workflowData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw error;
      }

      const result = await response.json();
      
      // Map _id to id for frontend compatibility
      const workflow = {
        ...result.workflow,
        id: result.workflow._id
      };
      
      return workflow;
  }

  async updateWorkflow(id: string, workflowData: Partial<CreateWorkflowRequest>): Promise<Workflow> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_URL}/workflows/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(workflowData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    const result = await response.json();
    return result.workflow;
  }

  async getWorkflow(id: string): Promise<Workflow> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_URL}/workflows/${id}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    const result = await response.json();
    
    // Map _id to id for frontend compatibility
    const workflow = {
      ...result.workflow,
      id: result.workflow._id
    };
    
    return workflow;
  }

  async deleteWorkflow(id: string): Promise<void> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_URL}/workflows/${id}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }
  }

  async executeWorkflow(id: string, executionData?: ExecutionRequest): Promise<ExecutionResponse> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_URL}/workflows/${id}/execute`, {
      method: 'POST',
      headers,
      body: JSON.stringify(executionData || {}),
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    const result = await response.json();
    return result;
  }

  async testAINode(nodeConfig: any): Promise<any> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_URL}/ai/test`, {
      method: 'POST',
      headers,
      body: JSON.stringify(nodeConfig),
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    const result = await response.json();
    return result;
  }

  // Create a default empty workflow
  createEmptyWorkflow(): CreateWorkflowRequest {
    return {
      name: 'Untitled Workflow',
      description: 'A new workflow',
      nodes: [],
      edges: [],
      status: 'draft',
      category: 'general'
    };
  }
}

export const workflowService = new WorkflowService();
