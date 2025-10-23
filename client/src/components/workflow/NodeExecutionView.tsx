import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Loader2, 
  ChevronDown, 
  ChevronRight,
  Eye,
  Zap,
  Brain
} from 'lucide-react';

interface NodeExecutionData {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  status: 'waiting' | 'running' | 'completed' | 'error' | 'skipped';
  startTime?: Date | string;
  endTime?: Date | string;
  duration?: number;
  executionTime?: number;
  input?: any;
  output?: any;
  error?: string;
  aiProvider?: string;
  tokensUsed?: number;
  cost?: number;
  confidence?: number;
}

interface NodeExecutionViewProps {
  executions: NodeExecutionData[];
  onViewNodeOutput: (nodeId: string, output: any) => void;
}

const getStatusIcon = (status: NodeExecutionData['status']) => {
  switch (status) {
    case 'running':
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    case 'completed':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'error':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'waiting':
      return <Clock className="h-4 w-4 text-gray-400" />;
    case 'skipped':
      return <Clock className="h-4 w-4 text-yellow-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-400" />;
  }
};

const getStatusColor = (status: NodeExecutionData['status']) => {
  switch (status) {
    case 'running':
      return 'border-blue-500 bg-blue-50';
    case 'completed':
      return 'border-green-500 bg-green-50';
    case 'error':
      return 'border-red-500 bg-red-50';
    case 'waiting':
      return 'border-gray-300 bg-gray-50';
    case 'skipped':
      return 'border-yellow-500 bg-yellow-50';
    default:
      return 'border-gray-300 bg-gray-50';
  }
};

const NodeExecutionItem: React.FC<{ 
  execution: NodeExecutionData; 
  onViewOutput: (nodeId: string, output: any) => void;
}> = ({ execution, onViewOutput }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getNodeTypeIcon = (type: string) => {
    if (type.includes('ai')) {
      return <Brain className="h-4 w-4 text-purple-500" />;
    }
    return <Zap className="h-4 w-4 text-blue-500" />;
  };

  return (
    <Card className={`mb-3 border ${getStatusColor(execution.status)} transition-all duration-300`}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className="p-3 cursor-pointer hover:bg-white/50 transition-colors">
            <div className="flex items-center justify-between w-full overflow-hidden">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {getStatusIcon(execution.status)}
                {getNodeTypeIcon(execution.nodeType)}
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-semibold text-sm text-gray-900 dark:text-white truncate">{execution.nodeName}</span>
                  <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">{execution.nodeType}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge variant={execution.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                  {execution.status}
                </Badge>
                {execution.duration && (
                  <Badge variant="outline" className="text-xs">
                    {formatDuration(execution.duration)}
                  </Badge>
                )}
                {execution.output && execution.status === 'completed' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewOutput(execution.nodeId, execution.output);
                    }}
                    className="h-6 px-2 text-xs"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Output
                  </Button>
                )}
                {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </div>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="border-t">
          <CardContent className="p-3 space-y-3">
            {/* Execution Details */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">Status:</span>
                <Badge variant="outline" className="ml-1">
                  {execution.status}
                </Badge>
              </div>
              {execution.startTime && (
                  <div>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Started:</span>
                    <span className="ml-1 text-gray-900 dark:text-white font-mono">{typeof execution.startTime === 'string' ? new Date(execution.startTime).toLocaleTimeString() : execution.startTime?.toLocaleTimeString?.()}</span>
                  </div>
              )}
              {execution.endTime && (
                  <div>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Ended:</span>
                    <span className="ml-1 text-gray-900 dark:text-white font-mono">{typeof execution.endTime === 'string' ? new Date(execution.endTime).toLocaleTimeString() : execution.endTime?.toLocaleTimeString?.()}</span>
                  </div>
              )}
              {execution.executionTime && (
                  <div>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Duration:</span>
                    <span className="ml-1 text-gray-900 dark:text-white font-mono">{formatDuration(execution.executionTime)}</span>
                  </div>
              )}
            </div>

            {/* AI-specific details */}
            {execution.aiProvider && (
              <div className="space-y-2 text-xs border border-gray-200 dark:border-gray-700 rounded p-2 bg-gray-50 dark:bg-gray-800">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">AI Provider:</span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">{execution.aiProvider}</Badge>
                </div>
                {execution.tokensUsed && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Tokens Used:</span>
                    <span className="text-gray-900 dark:text-white font-mono">{execution.tokensUsed}</span>
                  </div>
                )}
                {execution.cost !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Cost:</span>
                    <span className="text-green-600 dark:text-green-400 font-mono">${execution.cost.toFixed(4)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Error details */}
            {execution.error && (
              <div className="p-2 bg-red-100 border border-red-200 rounded text-xs">
                <span className="font-medium text-red-800">Error:</span>
                <div className="text-red-700 mt-1">{execution.error}</div>
              </div>
            )}

            {/* Output Preview and Button */}
            {execution.output && (
              <div className="space-y-2">
                <Button
                  size="sm"
                  variant="outline" 
                  className="h-7 text-xs w-full"
                  onClick={() => onViewOutput(execution.nodeId, execution.output)}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View Full Output
                </Button>
                {/* Inline snippet for quick preview */}
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs border">
                  <div className="text-gray-600 dark:text-gray-400 font-medium mb-1">Preview:</div>
                  <div className="text-gray-900 dark:text-white break-words max-h-20 overflow-hidden">
                    {typeof execution.output === 'string' 
                      ? execution.output.slice(0, 150) + (execution.output.length > 150 ? '...' : '')
                      : JSON.stringify(execution.output, null, 1).slice(0, 150) + '...'
                    }
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export const NodeExecutionView: React.FC<NodeExecutionViewProps> = ({ 
  executions, 
  onViewNodeOutput 
}) => {
  const completedCount = executions.filter(e => e.status === 'completed').length;
  const totalCount = executions.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const getOverallStatus = () => {
    if (executions.some(e => e.status === 'error')) return 'error';
    if (executions.some(e => e.status === 'running')) return 'running';
    if (executions.every(e => e.status === 'completed')) return 'completed';
    return 'waiting';
  };

  const overallStatus = getOverallStatus();

  return (
    <div className="space-y-4">
      {/* Overall Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Execution Progress</span>
              <Badge 
                  variant={overallStatus === 'error' ? 'destructive' : 
                          overallStatus === 'completed' ? 'default' : 'secondary'}
              >
                {overallStatus === 'running' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                {completedCount}/{totalCount} nodes
              </Badge>
            </div>
              <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Individual Node Executions */}
      <div className="space-y-2">
        {executions.length === 0 ? (
          <Card>
            <CardContent className="p-4 text-center text-muted-foreground">
              <Clock className="h-6 w-6 mx-auto mb-2" />
              <p className="text-sm">No executions yet</p>
            </CardContent>
          </Card>
        ) : (
          executions.map((execution) => (
            <NodeExecutionItem 
              key={execution.nodeId} 
              execution={execution} 
              onViewOutput={onViewNodeOutput}
            />
          ))
        )}
      </div>
    </div>
  );
};