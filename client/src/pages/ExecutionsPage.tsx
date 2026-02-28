import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, CheckCircle2, XCircle, Clock, Loader2, Play, FileText } from 'lucide-react';
import { executionService, ExecutionStatus } from '@/services/execution.service';
import { workflowService } from '@/services/workflow.service';
import { safeJsonParse } from '@/lib/logger';

interface ExecutionRecord {
  id: string;
  workflowId: string;
  workflowName: string;
  status: string;
  startTime: string;
  endTime?: string;
  duration?: number;
}

const ExecutionsPage = () => {
  const [executions, setExecutions] = useState<ExecutionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const fetchExecutions = useCallback(async () => {
    setLoading(true);
    try {
      const wfRes = await workflowService.getWorkflows({ limit: 100 });
      const allExecutions: ExecutionRecord[] = [];

      for (const wf of wfRes.workflows.slice(0, 10)) {
        try {
          const history = await executionService.getExecutionHistory(wf.id || '', 1, 20);
          if (history.executions) {
            allExecutions.push(
              ...history.executions.map((ex: ExecutionStatus) => ({
                id: ex.executionId,
                workflowId: wf.id || '',
                workflowName: wf.name,
                status: ex.status,
                startTime: ex.startTime,
                endTime: ex.endTime,
                duration: ex.endTime
                  ? new Date(ex.endTime).getTime() - new Date(ex.startTime).getTime()
                  : undefined,
              }))
            );
          }
        } catch {
          // Workflow may have no executions
        }
      }

      allExecutions.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
      setExecutions(allExecutions);
    } catch {
      // Failed to fetch - show empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExecutions();
  }, [fetchExecutions]);

  const filtered = filter === 'all'
    ? executions
    : executions.filter(e => e.status === filter);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'running': return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      default: return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/10 text-green-600';
      case 'failed': return 'bg-red-500/10 text-red-600';
      case 'running': return 'bg-blue-500/10 text-blue-600';
      default: return 'bg-yellow-500/10 text-yellow-600';
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Executions</h1>
            <p className="text-muted-foreground mt-1">Monitor and review workflow execution history.</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="running">Running</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchExecutions} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No executions found</h3>
              <p className="text-muted-foreground mt-1">
                {filter !== 'all' ? 'No executions match this filter.' : 'Run a workflow to see execution history here.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <div className="grid grid-cols-5 gap-4 p-3 bg-muted/50 text-sm font-medium text-muted-foreground border-b">
              <div>Status</div>
              <div>Workflow</div>
              <div>Execution ID</div>
              <div>Started</div>
              <div>Duration</div>
            </div>
            <ScrollArea className="max-h-[600px]">
              {filtered.map(exec => (
                <div key={exec.id} className="grid grid-cols-5 gap-4 p-3 border-b last:border-0 items-center hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(exec.status)}
                    <Badge className={getStatusColor(exec.status)}>{exec.status}</Badge>
                  </div>
                  <div className="font-medium truncate">{exec.workflowName}</div>
                  <div className="text-sm text-muted-foreground font-mono truncate">{exec.id}</div>
                  <div className="text-sm">{new Date(exec.startTime).toLocaleString()}</div>
                  <div className="text-sm">{formatDuration(exec.duration)}</div>
                </div>
              ))}
            </ScrollArea>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{executions.length}</div>
              <div className="text-sm text-muted-foreground">Total Executions</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {executions.filter(e => e.status === 'completed').length}
              </div>
              <div className="text-sm text-muted-foreground">Successful</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                {executions.filter(e => e.status === 'failed').length}
              </div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">
                {executions.length > 0
                  ? `${((executions.filter(e => e.status === 'completed').length / executions.length) * 100).toFixed(0)}%`
                  : '0%'}
              </div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ExecutionsPage;
