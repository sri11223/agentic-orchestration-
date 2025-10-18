import { nodeTypes, getCategoryLabel } from '@/data/nodeTypes';
import { cn } from '@/lib/utils';
import { Node } from '@xyflow/react';
import { NodeData } from '@/store/workflowStore';

const NodePalette = () => {
  const categories = ['trigger', 'ai', 'action', 'logic', 'human'] as const;
  
  const onDragStart = (event: React.DragEvent, nodeType: typeof nodeTypes[0]) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeType));
    event.dataTransfer.effectAllowed = 'move';
  };
  
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'trigger':
        return 'border-trigger/50 hover:border-trigger hover:bg-trigger/10';
      case 'ai':
        return 'border-primary/50 hover:border-primary hover:bg-ai-gradient/10';
      case 'action':
        return 'border-action/50 hover:border-action hover:bg-action/10';
      case 'logic':
        return 'border-logic/50 hover:border-logic hover:bg-logic/10';
      case 'human':
        return 'border-human/50 hover:border-human hover:bg-human/10';
      default:
        return 'border-border';
    }
  };
  
  return (
    <div className="w-64 bg-card/50 backdrop-blur-lg border-r border-border h-full overflow-y-auto">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold">Node Palette</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Drag nodes to canvas
        </p>
      </div>
      
      <div className="p-4 space-y-6">
        {categories.map((category) => (
          <div key={category}>
            <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
              {getCategoryLabel(category)}
            </h3>
            <div className="space-y-2">
              {nodeTypes
                .filter((node) => node.category === category)
                .map((nodeType) => {
                  const Icon = nodeType.icon;
                  return (
                    <div
                      key={nodeType.type}
                      draggable
                      onDragStart={(e) => onDragStart(e, nodeType)}
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-lg border-2 cursor-move',
                        'transition-all duration-200 backdrop-blur-sm',
                        getCategoryColor(category)
                      )}
                      title={nodeType.description}
                    >
                      <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{nodeType.label}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {nodeType.description}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NodePalette;
