import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { NodeData } from '@/store/workflowStore';
import { nodeTypes } from '@/data/nodeTypes';
import { cn } from '@/lib/utils';

const CustomNode = ({ data, selected }: NodeProps) => {
  const typedData = data as NodeData;
  const nodeConfig = nodeTypes.find(
    (nt) => nt.type === typedData.config?.nodeType
  );
  
  const Icon = nodeConfig?.icon;
  const category = typedData.category;
  
  const getCategoryClass = () => {
    switch (category) {
      case 'trigger':
        return 'bg-trigger/20 border-trigger text-trigger';
      case 'ai':
        return 'bg-ai-gradient/20 border-primary text-primary';
      case 'action':
        return 'bg-action/20 border-action text-action';
      case 'logic':
        return 'bg-logic/20 border-logic text-logic';
      case 'human':
        return 'bg-human/20 border-human text-human';
      default:
        return 'bg-card border-border text-foreground';
    }
  };
  
  const getStatusClass = () => {
    switch (typedData.status) {
      case 'running':
        return 'animate-pulse ring-2 ring-status-running';
      case 'success':
        return 'ring-2 ring-status-success';
      case 'failed':
        return 'ring-2 ring-status-failed';
      default:
        return '';
    }
  };
  
  return (
    <div
      className={cn(
        'relative px-4 py-3 rounded-lg border-2 backdrop-blur-sm transition-all',
        'min-w-[160px] cursor-pointer',
        getCategoryClass(),
        getStatusClass(),
        selected && 'ring-4 ring-primary/50 shadow-lg shadow-primary/20'
      )}
    >
      {/* Input handle - hide for trigger nodes */}
      {category !== 'trigger' && (
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !bg-primary !border-2 !border-background"
        />
      )}
      
      {/* Status indicator */}
      {typedData.status && (
        <div
          className={cn(
            'absolute -top-1 -right-1 w-3 h-3 rounded-full',
            typedData.status === 'pending' && 'bg-status-pending',
            typedData.status === 'running' && 'bg-status-running animate-pulse',
            typedData.status === 'success' && 'bg-status-success',
            typedData.status === 'failed' && 'bg-status-failed'
          )}
        />
      )}
      
      {/* Node content */}
      <div className="flex flex-col items-center gap-2">
        {Icon && <Icon className="w-6 h-6" />}
        <div className="text-sm font-medium text-center">{typedData.label}</div>
      </div>
      
      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-primary !border-2 !border-background"
      />
    </div>
  );
};

export default memo(CustomNode);
