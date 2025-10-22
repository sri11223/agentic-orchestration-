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
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  input?: any;
  output?: any;
  error?: string;
  aiProvider?: string;
  tokensUsed?: number;
  cost?: number;
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(execution.status)}
                {getNodeTypeIcon(execution.nodeType)}
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{execution.nodeName}</span>
                  <span className="text-xs text-muted-foreground">{execution.nodeType}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {execution.duration && (
                  <Badge variant="outline" className="text-xs">
                    {formatDuration(execution.duration)}
                  </Badge>
                )}
                {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </div>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="border-t">
          <CardContent className="p-3 space-y-3">
            {/* Execution Details */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="font-medium">Status:</span>
                <Badge variant="outline" className="ml-1">
                  {execution.status}
                </Badge>
              </div>
              {execution.startTime && (
                <div>
                  <span className="font-medium">Started:</span>
                  <span className="ml-1">{execution.startTime.toLocaleTimeString()}</span>
                </div>
              )}
            </div>

            {/* AI-specific details */}
            {execution.aiProvider && (
              <div className="space-y-1 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-medium">AI Provider:</span>
                  <Badge variant="secondary">{execution.aiProvider}</Badge>
                </div>
                {execution.tokensUsed && (
                  <div className="flex justify-between">
                    <span>Tokens Used:</span>
                    <span>{execution.tokensUsed}</span>
                  </div>
                )}
                {execution.cost !== undefined && (
                  <div className="flex justify-between">
                    <span>Cost:</span>
                    <span>${execution.cost.toFixed(4)}</span>
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

            {/* Input/Output */}
            {(execution.input || execution.output) && (
              <div className="flex gap-2">
                {execution.input && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => onViewOutput(execution.nodeId, execution.input)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Input
                  </Button>
                )}
                {execution.output && (
                  <Button
                    size="sm"
                    variant="outline" 
                    className="h-7 text-xs"
                    onClick={() => onViewOutput(execution.nodeId, execution.output)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Output
                  </Button>
                )}
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
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

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