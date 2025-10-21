const API_BASE_URL = 'http://localhost:5000';

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

class WorkflowService {
  private getAuthHeaders() {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  async getWorkflows(params?: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    search?: string;
  }): Promise<WorkflowsResponse> {
    console.log('🔄 Fetching workflows from backend...');
    
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.search) queryParams.append('search', params.search);

    const url = `${API_BASE_URL}/api/workflows${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw error;
      }

      const result = await response.json();
      console.log('✅ Workflows fetched successfully:', result);
      
      // Map _id to id for all workflows
      const workflowsWithId = {
        ...result,
        workflows: result.workflows.map((workflow: any) => ({
          ...workflow,
          id: workflow._id
        }))
      };
      
      return workflowsWithId;
    } catch (error) {
      console.error('❌ Error fetching workflows:', error);
      throw error;
    }
  }

  async createWorkflow(workflowData: CreateWorkflowRequest): Promise<Workflow> {
    console.log('🚀 Creating new workflow:', workflowData);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/workflows`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(workflowData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw error;
      }

      const result = await response.json();
      console.log('✅ Workflow created successfully:', result);
      
      // Map _id to id for frontend compatibility
      const workflow = {
        ...result.workflow,
        id: result.workflow._id
      };
      
      return workflow;
    } catch (error) {
      console.error('❌ Error creating workflow:', error);
      throw error;
    }
  }

  async updateWorkflow(id: string, workflowData: Partial<CreateWorkflowRequest>): Promise<Workflow> {
    console.log('🔄 Updating workflow:', id, workflowData);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/workflows/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(workflowData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw error;
      }

      const result = await response.json();
      console.log('✅ Workflow updated successfully:', result);
      return result.workflow;
    } catch (error) {
      console.error('❌ Error updating workflow:', error);
      throw error;
    }
  }

  async deleteWorkflow(id: string): Promise<void> {
    console.log('🗑️ Deleting workflow:', id);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/workflows/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw error;
      }

      console.log('✅ Workflow deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting workflow:', error);
      throw error;
    }
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