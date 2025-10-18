import { useEffect } from 'react';
import { useWorkflowStore } from '@/store/workflowStore';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Play, Copy, Trash2, Edit } from 'lucide-react';
import { demoWorkflow } from '@/data/demoWorkflow';

const WorkflowsList = () => {
  const { workflows, setCurrentWorkflow, createNewWorkflow, deleteWorkflow } = useWorkflowStore();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Initialize with demo workflow if no workflows exist
    if (workflows.length === 0) {
      useWorkflowStore.setState({ workflows: [demoWorkflow] });
    }
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
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-ai-gradient bg-clip-text text-transparent">
                Workflow Builder
              </h1>
              <p className="text-muted-foreground mt-1">
                Build intelligent workflow automations
              </p>
            </div>
            <Button onClick={handleCreateNew} size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Create Workflow
            </Button>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {workflows.length === 0 ? (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workflows.map((workflow) => (
              <Card
                key={workflow.id}
                className="group hover:border-primary/50 transition-all cursor-pointer"
                onClick={() => handleEditWorkflow(workflow)}
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
                    {/* Workflow preview */}
                    <div className="h-32 bg-background rounded-lg border border-border flex items-center justify-center">
                      <div className="text-muted-foreground text-sm">
                        {workflow.nodes.length} nodes, {workflow.edges.length} connections
                      </div>
                    </div>
                    
                    {/* Metadata */}
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>
                        Modified {workflow.lastModified.toLocaleDateString()}
                      </span>
                      <span>{workflow.executionCount} runs</span>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditWorkflow(workflow);
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
                          handleDeleteWorkflow(workflow.id);
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
        )}
      </div>
    </div>
  );
};

export default WorkflowsList;
