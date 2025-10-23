import React from 'react';
import { Node, Edge } from '@xyflow/react';
import { nodeTypes } from '@/data/nodeTypes';

interface WorkflowPreviewProps {
  nodes: Node[];
  edges: Edge[];
  className?: string;
}

export const WorkflowPreview: React.FC<WorkflowPreviewProps> = ({ 
  nodes, 
  edges, 
  className = "h-32" 
}) => {
  console.log('🖼️ WorkflowPreview rendering:', { nodes: nodes?.length, edges: edges?.length });
  
  if (!nodes || !nodes.length) {
    return (
      <div className={`${className} bg-background rounded-lg border border-border flex items-center justify-center`}>
        <div className="text-muted-foreground text-sm">Empty workflow</div>
      </div>
    );
  }

  // Calculate bounds to fit all nodes in the preview
  const bounds = nodes.reduce((acc, node) => {
    const x = node.position?.x || 0;
    const y = node.position?.y || 0;
    return {
      minX: Math.min(acc.minX, x),
      maxX: Math.max(acc.maxX, x + 150), // Node width ~150px
      minY: Math.min(acc.minY, y),
      maxY: Math.max(acc.maxY, y + 80),  // Node height ~80px
    };
  }, { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });

  // Ensure valid bounds (handle case where all nodes are at same position or invalid positions)
  const validMinX = isFinite(bounds.minX) ? bounds.minX : 0;
  const validMaxX = isFinite(bounds.maxX) ? bounds.maxX : 300;
  const validMinY = isFinite(bounds.minY) ? bounds.minY : 0;
  const validMaxY = isFinite(bounds.maxY) ? bounds.maxY : 200;
  
  const rawWidth = validMaxX - validMinX;
  const rawHeight = validMaxY - validMinY;
  const width = rawWidth > 0 ? rawWidth : 300;
  const height = rawHeight > 0 ? rawHeight : 200;
  const scale = Math.min(280 / width, 120 / height, 0.8);
  
  console.log('🔍 Preview bounds:', { bounds, width, height, scale });

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      trigger: '#10b981', // green
      ai: '#8b5cf6',      // purple  
      action: '#3b82f6',  // blue
      logic: '#f59e0b',   // amber
      human: '#ef4444',   // red
    };
    return colors[category] || '#6b7280';
  };

  const getNodeIcon = (nodeType: string, category: string): string => {
    const icons: Record<string, string> = {
      // Triggers
      'manual-trigger': '▶',
      'webhook-trigger': '🔗',
      'schedule-trigger': '⏰',
      'email-trigger': '📧',
      
      // AI Nodes
      'ai-text-generator': '✨',
      'ai-decision-maker': '🎯',
      'ai-data-extractor': '🔍',
      'ai-web-researcher': '🌐',
      
      // Actions
      'http-request': '🌍',
      'database-query': '💾',
      'send-email': '📤',
      'slack-message': '💬',
      
      // Logic
      'condition': '🔀',
      'switch': '🎛️',
      'loop': '🔄',
      'merge': '🔗',
      
      // Human
      'approval-request': '✅',
      'form-input': '📝',
      'manual-task': '📋'
    };
    
    return icons[nodeType] || (category === 'ai' ? '🤖' : '●');
  };

  // Fallback to simple layout if calculations fail
  if (!isFinite(scale) || scale <= 0) {
    return (
      <div className={`${className} bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-lg border border-border relative overflow-hidden flex items-center justify-center`}>
        <div className="text-center">
          <div className="text-2xl mb-2">
            {nodes.map((node, i) => (
              <span key={i} className="inline-block mx-1">
                {getNodeIcon(
                  ((node.data as { config?: { nodeType?: string }; category?: string })?.config?.nodeType) || 'manual-trigger',
                  ((node.data as { config?: { nodeType?: string }; category?: string })?.category) || 'trigger'
                )}
              </span>
            ))}
          </div>
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">{nodes.length}</span> nodes • <span className="font-medium">{edges.length}</span> connections
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-lg border border-border relative overflow-hidden group hover:shadow-md transition-all duration-200`}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 280 120"
        className="absolute inset-0 group-hover:scale-105 transition-transform duration-200"
      >
        {/* Render edges/connections */}
        {edges.map((edge) => {
          const sourceNode = nodes.find(n => n.id === edge.source);
          const targetNode = nodes.find(n => n.id === edge.target);
          
          if (!sourceNode || !targetNode) return null;

          const sourceX = ((sourceNode.position?.x || 0) - validMinX) * scale + 30; // Right edge of source node
          const sourceY = ((sourceNode.position?.y || 0) - validMinY) * scale + 10; // Center Y
          const targetX = ((targetNode.position?.x || 0) - validMinX) * scale;      // Left edge of target node  
          const targetY = ((targetNode.position?.y || 0) - validMinY) * scale + 10; // Center Y

          return (
            <g key={edge.id}>
              <line
                x1={sourceX}
                y1={sourceY}
                x2={targetX}
                y2={targetY}
                stroke="#6366f1"
                strokeWidth="1.5"
                className="opacity-60"
              />
              {/* Arrow head */}
              <polygon
                points={`${targetX-3},${targetY-2} ${targetX},${targetY} ${targetX-3},${targetY+2}`}
                fill="#6366f1"
                className="opacity-60"
              />
            </g>
          );
        })}

        {/* Render nodes */}
        {nodes.map((node) => {
          const nodeData = node.data as any;
          const category = nodeData?.category || 'trigger';
          const nodeType = nodeData?.config?.nodeType || 'manual-trigger';
          
          const x = ((node.position?.x || 0) - validMinX) * scale;
          const y = ((node.position?.y || 0) - validMinY) * scale;
          
          return (
            <g key={node.id}>
              {/* Node shadow */}
              <rect
                x={x + 1}
                y={y + 1}
                width="30"
                height="20"
                rx="6"
                fill="rgba(0,0,0,0.1)"
              />
              
              {/* Node background */}
              <rect
                x={x}
                y={y}
                width="30"
                height="20"
                rx="6"
                fill={getCategoryColor(category)}
                className="opacity-90"
              />
              
              {/* Node border */}
              <rect
                x={x}
                y={y}
                width="30"
                height="20"
                rx="6"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="0.5"
              />
              
              {/* Node icon */}
              <text
                x={x + 15}
                y={y + 14}
                textAnchor="middle"
                fontSize="8"
                fill="white"
                fontWeight="bold"
              >
                {getNodeIcon(nodeType, category)}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Stats overlay */}
      <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background/90 backdrop-blur-sm px-2 py-1 rounded-md border border-border/50 shadow-sm">
        <span className="font-medium">{nodes.length}</span> nodes • <span className="font-medium">{edges.length}</span> connections
      </div>
    </div>
  );
};