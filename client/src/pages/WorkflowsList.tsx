import { useEffect, useState, useCallback } from 'react';
import { useWorkflowStore } from '@/store/workflowStore';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Plus, Play, Copy, Trash2, Edit, Loader2 } from 'lucide-react';
import { demoWorkflow } from '@/data/demoWorkflow';
import { WorkflowPreview } from '@/components/workflow/WorkflowPreview';
import { workflowService, WorkflowsResponse } from '@/services/workflow.service';

const WorkflowsList = () => {
  const { workflows, setCurrentWorkflow, createNewWorkflow, deleteWorkflow } = useWorkflowStore();
  const navigate = useNavigate();
  const [workflowsData, setWorkflowsData] = useState<WorkflowsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch workflows from backend
  const fetchWorkflows = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching workflows from backend...');
      const data = await workflowService.getWorkflows({ limit: 100 });
      setWorkflowsData(data);
      console.log('✅ Workflows fetched from backend:', data);
      
      // Also update the store with backend data
      if (data.workflows.length > 0) {
        const storeWorkflows = data.workflows.map(w => ({
          id: w.id || `workflow-${Date.now()}`,
          name: w.name,
          description: w.description,
          nodes: w.nodes.map(node => ({
            ...node,
            type: node.type ?? 'custom',
            data: {
              label: node.data?.title || 'Untitled Node',
              category: node.data?.category || 'trigger',
              config: node.data?.config || {},
              ...node.data
            }
          })),
          edges: w.edges || [],
          status: w.status as 'draft' | 'active' | 'archived',
          lastModified: new Date(w.metadata?.updatedAt || Date.now()),
          executionCount: 0
        }));
        useWorkflowStore.setState({ workflows: storeWorkflows });
      }
    } catch (error) {
      console.error('❌ Failed to fetch workflows from backend:', error);
      // Use store workflows as fallback
      console.log('🔄 Using store workflows as fallback:', workflows);
      if (workflows.length === 0) {
        useWorkflowStore.setState({ workflows: [demoWorkflow] });
      }
      setWorkflowsData({
        workflows: workflows.map(w => ({
          id: w.id,
          name: w.name,
          description: w.description,
          nodes: w.nodes.map(node => ({ ...node, type: node.type ?? 'custom' })),
          edges: w.edges,
          status: w.status,
          metadata: { updatedAt: w.lastModified.toISOString() }
        })),
        pagination: { total: workflows.length, page: 1, limit: 100, pages: 1 }
      });
    } finally {
      setLoading(false);
    }
  }, [workflows]);

  useEffect(() => {
    fetchWorkflows();
  }, []);
  
  const handleCreateNew = () => {
    createNewWorkflow();
    navigate('/workflow/new');
  };
  
  const handleEditWorkflow = (workflow: typeof workflows[0]) => {
    setCurrentWorkflow(workflow);
    navigate(`/workflow/${workflow.id}`);
  };
  
  const handleDeleteWorkflow = (id: string) => {
    if (confirm('Are you sure you want to delete this workflow?')) {
      deleteWorkflow(id);
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-status-success';
      case 'draft':
        return 'bg-status-pending';
      case 'archived':
        return 'bg-muted';
      default:
        return 'bg-muted';
    }
  };
  
  // Get user info for welcome message
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : { username: 'User' };

  return (
    <DashboardLayout
      title={`👋 Welcome ${user.username}!`}
      subtitle="Create your first workflow"
    >
      <div className="p-6">
        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Loading workflows...</h2>
            <p className="text-muted-foreground">Fetching your workflows from backend</p>
          </div>
        ) : (!workflowsData?.workflows || workflowsData.workflows.length === 0) ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🚀</div>
            <h2 className="text-2xl font-semibold mb-2">Create your first workflow</h2>
            <p className="text-muted-foreground mb-6">
              Start building intelligent automation with AI agents
            </p>
            <Button onClick={handleCreateNew} size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Create Workflow
            </Button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">
                Your Workflows ({workflowsData.workflows.length})
              </h2>
              <Button onClick={handleCreateNew}>
                <Plus className="w-4 h-4 mr-2" />
                New Workflow
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workflowsData.workflows.map((workflow) => (
              <Card
                key={workflow.id}
                className="group hover:border-primary/50 transition-all cursor-pointer"
                onClick={() => {
                  console.log('🔗 Navigating to workflow:', workflow.id);
                  navigate(`/workflow/${workflow.id}`);
                }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{workflow.name}</CardTitle>
                      {workflow.description && (
                        <CardDescription className="mt-1">
                          {workflow.description}
                        </CardDescription>
                      )}
                    </div>
                    <Badge className={getStatusColor(workflow.status)}>
                      {workflow.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Visual Workflow preview */}
                    <WorkflowPreview 
                      nodes={workflow.nodes} 
                      edges={workflow.edges}
                      className="h-32"
                    />
                    
                    {/* Metadata */}
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>
                        Modified {new Date(workflow.metadata?.updatedAt || '').toLocaleDateString()}
                      </span>
                      <span>v{workflow.version || 1}</span>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/workflow/${workflow.id}`);
                        }}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Duplicate logic
                        }}
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Duplicate
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteWorkflow(workflow.id || '');
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default WorkflowsList;
