import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  Pause, 
  Square, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Zap,
  Brain,
  AlertCircle
} from 'lucide-react';
import { executionService, ExecutionStatus, ExecutionEvent } from '@/services/execution.service';
import { useWorkflowStore } from '@/store/workflowStore';

interface ExecutionPanelProps {
  workflowId: string;
  className?: string;
}

export function ExecutionPanel({ workflowId, className }: ExecutionPanelProps) {
  const { currentWorkflow } = useWorkflowStore();
  const [execution, setExecution] = useState<ExecutionStatus | null>(null);
  const [events, setEvents] = useState<ExecutionEvent[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [loading, setLoading] = useState(false);

  const canExecute = currentWorkflow && currentWorkflow.nodes.length > 0;

  const handleExecute = async () => {
    if (!canExecute) return;
    
    setLoading(true);
    try {
      const result = await executionService.executeWorkflow({
        workflowId,
        triggerData: {
          timestamp: new Date().toISOString(),
          triggeredBy: 'manual'
        }
      });

      setExecution({
        executionId: result.executionId,
        status: result.status as any,
        startTime: new Date().toISOString()
      });
      
      setIsExecuting(true);
      setEvents([]);

      // Subscribe to execution updates
      const unsubscribe = executionService.subscribeToExecution(result.executionId, {
        onProgress: (status) => {
          setExecution(status);
        },
        onEvent: (event) => {
          setEvents(prev => [...prev, event]);
        },
        onComplete: (result) => {
          setIsExecuting(false);
          console.log('✅ Execution completed:', result);
        },
        onError: (error) => {
          setIsExecuting(false);
          console.error('❌ Execution failed:', error);
        }
      });

      // Cleanup subscription after component unmount or execution end
      return unsubscribe;
      
    } catch (error) {
      console.error('Failed to start execution:', error);
      alert('Failed to start workflow execution: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async () => {
    if (!execution) return;
    
    try {
      await executionService.pauseExecution(execution.executionId);
    } catch (error) {
      console.error('Failed to pause execution:', error);
    }
  };

  const handleCancel = async () => {
    if (!execution) return;
    
    try {
      await executionService.cancelExecution(execution.executionId);
      setIsExecuting(false);
    } catch (error) {
      console.error('Failed to cancel execution:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'cancelled':
        return <Square className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'paused':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-gray-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'ai:request':
      case 'ai:response':
        return <Brain className="h-4 w-4 text-purple-500" />;
      case 'node:start':
      case 'node:complete':
        return <Zap className="h-4 w-4 text-blue-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className={`bg-card border rounded-lg ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Play className="h-5 w-5 text-green-500" />
            Workflow Execution
          </span>
          {execution && (
            <Badge 
              variant="secondary" 
              className={`${getStatusColor(execution.status)} text-white`}
            >
              {execution.status.toUpperCase()}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Execution Controls */}
        <div className="flex gap-2">
          <Button 
            onClick={handleExecute}
            disabled={!canExecute || isExecuting || loading}
            className="flex-1"
          >
            <Play className="h-4 w-4 mr-2" />
            {loading ? 'Starting...' : 'Run Workflow'}
          </Button>
          
          {isExecuting && (
            <>
              <Button variant="outline" onClick={handlePause} size="sm">
                <Pause className="h-4 w-4" />
              </Button>
              <Button variant="destructive" onClick={handleCancel} size="sm">
                <Square className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        {!canExecute && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
            <AlertCircle className="h-4 w-4 inline mr-2" />
            Add some nodes to your workflow before running it
          </div>
        )}

        {/* Execution Status */}
        {execution && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Current Execution</span>
                {getStatusIcon(execution.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID:</span>
                  <span className="font-mono text-xs">{execution.executionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Started:</span>
                  <span>{new Date(execution.startTime).toLocaleTimeString()}</span>
                </div>
                {execution.endTime && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ended:</span>
                    <span>{new Date(execution.endTime).toLocaleTimeString()}</span>
                  </div>
                )}
                {execution.progress && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Progress:</span>
                    <span>{execution.progress.currentStep}/{execution.progress.totalSteps}</span>
                  </div>
                )}
              </div>
              
              {execution.progress && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Progress</span>
                    <span>{Math.round((execution.progress.currentStep / execution.progress.totalSteps) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${(execution.progress.currentStep / execution.progress.totalSteps) * 100}%`
                      }}
                    />
                  </div>
                </div>
              )}
              
              {execution.error && (
                <div className="p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                  <strong>Error:</strong> {execution.error}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Execution Events */}
        {events.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Execution Log</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {events.map((event, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <div className="mt-0.5">
                        {getEventIcon(event.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-xs text-muted-foreground">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </span>
                          {event.nodeId && (
                            <Badge variant="outline" className="text-xs">
                              {event.nodeId}
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1">{event.message}</p>
                        {event.data && (
                          <pre className="mt-1 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                            {JSON.stringify(event.data, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </div>
  );
}