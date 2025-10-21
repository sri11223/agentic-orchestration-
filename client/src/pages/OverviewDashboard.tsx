import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { workflowService, WorkflowsResponse } from '@/services/workflow.service';
import { useWorkflowCreation } from '@/hooks/useWorkflowCreation';
import { 
  Plus, 
  Play, 
  Users, 
  Zap, 
  Clock, 
  TrendingUp, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  FileText,
  Database,
  Key,
  Loader2
} from 'lucide-react';

const OverviewDashboard = () => {
  const [workflowsData, setWorkflowsData] = useState<WorkflowsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('workflows');
  
  // Get user info for welcome message
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : { username: 'User' };

  // Fetch workflows data
  const fetchWorkflows = useCallback(async () => {
    try {
      setLoading(true);
      const data = await workflowService.getWorkflows({ limit: 100 });
      setWorkflowsData(data);
      console.log('📊 Dashboard metrics updated:', data);
    } catch (error) {
      console.error('Failed to fetch workflows:', error);
      // Set default data if backend fails
      setWorkflowsData({
        workflows: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
          pages: 0
        }
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const { createWorkflow, creating } = useWorkflowCreation(() => {
    // Refresh dashboard data after workflow creation
    fetchWorkflows();
  });

  useEffect(() => {
    fetchWorkflows();
  }, []);



  // Calculate metrics from real data
  const totalWorkflows = workflowsData?.pagination?.total || 0;
  const activeWorkflows = workflowsData?.workflows?.filter(w => w.status === 'active').length || 0;
  const draftWorkflows = workflowsData?.workflows?.filter(w => w.status === 'draft').length || 0;
  
  console.log('📊 Metrics calculation:', {
    totalWorkflows,
    activeWorkflows,
    draftWorkflows,
    workflowsData: workflowsData?.pagination
  });
  const metrics = [
    {
      title: 'Total workflows',
      subtitle: `${activeWorkflows} active, ${draftWorkflows} drafts`,
      value: loading ? '-' : totalWorkflows.toString(),
      icon: Zap,
      color: 'text-blue-600'
    },
    {
      title: 'Prod. executions',
      subtitle: 'Last 7 days',
      value: '0',
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      title: 'Failed prod. executions', 
      subtitle: 'Last 7 days',
      value: '0',
      icon: XCircle,
      color: 'text-red-600'
    },
    {
      title: 'Failure rate',
      subtitle: 'Last 7 days', 
      value: '0%',
      icon: AlertCircle,
      color: 'text-yellow-600'
    },
    {
      title: 'Run time (avg.)',
      subtitle: 'Last 7 days',
      value: '0s',
      icon: TrendingUp,
      color: 'text-purple-600'
    }
  ];

  const tabs = [
    { id: 'workflows', name: 'Workflows', icon: Zap },
    { id: 'credentials', name: 'Credentials', icon: Key },
    { id: 'executions', name: 'Executions', icon: Play },
    { id: 'data-tables', name: 'Data tables', icon: Database, badge: 'Beta' }
  ];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Overview</h1>
            <p className="text-muted-foreground">
              All the workflows, credentials and data tables you have access to
            </p>
          </div>
          <Button 
            onClick={createWorkflow}
            disabled={creating}
            className="bg-[#ff6b6b] hover:bg-[#ff5252] text-white"
          >
            {creating ? (
              <Loader2 className="w-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 w-4 mr-2" />
            )}
            {creating ? 'Creating...' : 'Create Workflow'}
          </Button>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {metrics.map((metric, index) => (
            <Card key={index} className="bg-card border border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-medium text-foreground">
                      {metric.title}
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      {metric.subtitle}
                    </CardDescription>
                  </div>
                  <metric.icon className={`h-4 w-4 ${metric.color}`} />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-foreground">
                  {metric.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <div className="border-b border-border">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? 'border-[#ff6b6b] text-[#ff6b6b]'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  }`}
                >
                  <tab.icon className="w-4 h-4 mr-2" />
                  {tab.name}
                  {tab.badge && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {tab.badge}
                    </Badge>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'workflows' && (
          <div className="p-6">
            {(!workflowsData?.workflows || workflowsData.workflows.length === 0) ? (
              // Show create workflow section when no workflows exist
              <div className="text-center py-12">
                <div className="text-4xl mb-4">👋</div>
                <h2 className="text-xl font-semibold mb-2 text-foreground">
                  Welcome {user.username}!
                </h2>
                <p className="text-muted-foreground mb-8">
                  Create your first workflow
                </p>

                {/* Action Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
                  <Card 
                    className="p-6 cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={createWorkflow}
                  >
                    <div className="text-center space-y-3">
                      <FileText className="w-12 h-12 mx-auto text-muted-foreground" />
                      <h3 className="font-medium text-foreground">Start from scratch</h3>
                    </div>
                  </Card>
                  
                  <Card 
                    className="p-6 cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={createWorkflow}
                  >
                    <div className="text-center space-y-3">
                      <Users className="w-12 h-12 mx-auto text-muted-foreground" />
                      <h3 className="font-medium text-foreground">Try a pre-built agent</h3>
                    </div>
                  </Card>
                </div>
              </div>
            ) : (
              // Show workflows grid when workflows exist
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-foreground">
                    Your Workflows ({workflowsData.workflows.length})
                  </h3>
                  <Button onClick={createWorkflow} disabled={creating}>
                    <Plus className="w-4 h-4 mr-2" />
                    {creating ? 'Creating...' : 'New Workflow'}
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {workflowsData.workflows.map((workflow) => (
                    <Card
                      key={workflow.id}
                      className="group hover:border-primary/50 transition-all cursor-pointer"
                      onClick={() => {
                        // Navigate to workflow builder
                        window.location.href = `/workflow/${workflow.id}`;
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
                          <Badge variant={workflow.status === 'active' ? 'default' : 'secondary'}>
                            {workflow.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {/* Workflow preview */}
                          <div className="h-32 bg-background rounded-lg border border-border flex items-center justify-center">
                            <div className="text-muted-foreground text-sm">
                              {workflow.nodes?.length || 0} nodes, {workflow.edges?.length || 0} connections
                            </div>
                          </div>
                          
                          {/* Metadata */}
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>
                              Modified {new Date(workflow.metadata?.updatedAt || '').toLocaleDateString()}
                            </span>
                            <span>v{workflow.version || 1}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'credentials' && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🔑</div>
            <h2 className="text-xl font-semibold mb-2 text-foreground">
              Credentials Management
            </h2>
            <p className="text-muted-foreground mb-8">
              Add your AI provider credentials to enable workflow automation
            </p>
            <Button className="bg-[#ff6b6b] hover:bg-[#ff5252] text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Credential
            </Button>
          </div>
        )}

        {activeTab === 'executions' && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">⚡</div>
            <h2 className="text-xl font-semibold mb-2 text-foreground">
              Execution History
            </h2>
            <p className="text-muted-foreground mb-8">
              Monitor and review your workflow executions
            </p>
            <Button variant="outline">
              <Play className="w-4 h-4 mr-2" />
              Run Test Workflow
            </Button>
          </div>
        )}

        {activeTab === 'data-tables' && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📊</div>
            <h2 className="text-xl font-semibold mb-2 text-foreground">
              Data Tables
              <Badge variant="secondary" className="ml-2">Beta</Badge>
            </h2>
            <p className="text-muted-foreground mb-8">
              Store and manage data for your workflows
            </p>
            <Button variant="outline">
              <Database className="w-4 h-4 mr-2" />
              Create Table
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default OverviewDashboard;