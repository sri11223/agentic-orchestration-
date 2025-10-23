import { memo, useCallback, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { NodeData, useWorkflowStore } from '@/store/workflowStore';
import { nodeTypes } from '@/data/nodeTypes';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CustomNode = ({ data, selected, id }: NodeProps) => {
  const typedData = data as NodeData;
  const { deleteNode, setSelectedNode } = useWorkflowStore();
  const [isHovered, setIsHovered] = useState(false);
  const nodeConfig = nodeTypes.find(
    (nt) => nt.type === typedData.config?.nodeType
  );
  
  const Icon = nodeConfig?.icon;
  const category = typedData.category;

  const handleClick = useCallback(() => {
    if (id) {
      setSelectedNode({ id, data: typedData } as any);
    }
  }, [id, typedData, setSelectedNode]);
  
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
        'min-w-[160px] cursor-pointer group',
        getCategoryClass(),
        getStatusClass(),
        selected && 'ring-4 ring-primary/50 shadow-lg shadow-primary/20'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Input handle - now available for all nodes including triggers */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-primary !border-2 !border-background"
      />
      
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
      
      {/* Delete button - appears on hover */}
      {isHovered && (
        <Button
          size="sm"
          variant="destructive"
          className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full opacity-90 hover:opacity-100 transition-opacity z-10"
          onClick={(e) => {
            e.stopPropagation();
            deleteNode(id);
          }}
        >
          <X className="w-3 h-3" />
        </Button>
      )}
      
      {/* Input handle - now available for all nodes including triggers */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-primary !border-2 !border-background"
      />

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
