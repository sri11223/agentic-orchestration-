import React from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import './CustomEdge.css';

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
  data,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const handleDelete = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (typeof data?.onDelete === 'function') {
      data.onDelete(id);
    }
  };

  return (
    <>
      {/* Invisible wider path for easier clicking */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        className="react-flow__edge-interaction"
        style={{ cursor: 'pointer' }}
      />
      
      {/* Visible edge path */}
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: selected ? 'hsl(var(--primary))' : 'hsl(var(--border))',
          strokeWidth: selected ? 3 : 2,
          cursor: 'pointer',
        }}
      />
      
      {/* Show delete button when edge is selected */}
      {selected && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 12,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <Button
              size="sm"
              variant="destructive"
              className="w-8 h-8 p-0 rounded-full opacity-90 hover:opacity-100 transition-opacity shadow-lg"
              onClick={handleDelete}
              title="Delete connection"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}