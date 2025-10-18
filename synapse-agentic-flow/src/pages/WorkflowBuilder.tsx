import { useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useWorkflowStore, NodeData } from '@/store/workflowStore';
import { nodeTypes as nodeTypesList } from '@/data/nodeTypes';
import CustomNode from '@/components/workflow/CustomNode';
import NodePalette from '@/components/workflow/NodePalette';
import NodeConfigPanel from '@/components/workflow/NodeConfigPanel';
import WorkflowNavbar from '@/components/workflow/WorkflowNavbar';
import { useParams } from 'react-router-dom';
import { demoWorkflow } from '@/data/demoWorkflow';

const nodeTypes = {
  custom: CustomNode,
};

const WorkflowBuilderContent = () => {
  const { id } = useParams();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  
  const {
    currentWorkflow,
    setCurrentWorkflow,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    setSelectedNode,
  } = useWorkflowStore();
  
  useEffect(() => {
    // Load workflow
    if (id === 'new') {
      // For new workflows, check if we already have a current workflow
      if (!currentWorkflow) {
        useWorkflowStore.getState().createNewWorkflow();
      }
    } else if (id) {
      // Load existing workflow or demo
      const workflows = useWorkflowStore.getState().workflows;
      const workflow = workflows.find(w => w.id === id);
      if (workflow) {
        setCurrentWorkflow(workflow);
      } else if (id === demoWorkflow.id) {
        setCurrentWorkflow(demoWorkflow);
      }
    }
  }, [id]);
  
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);
  
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      
      if (!reactFlowWrapper.current) return;
      
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const nodeTypeData = JSON.parse(
        event.dataTransfer.getData('application/reactflow')
      );
      
      const position = {
        x: event.clientX - reactFlowBounds.left - 80,
        y: event.clientY - reactFlowBounds.top - 40,
      };
      
      const newNode: Node<NodeData> = {
        id: `node-${Date.now()}`,
        type: 'custom',
        position,
        data: {
          label: nodeTypeData.label,
          category: nodeTypeData.category,
          config: {
            nodeType: nodeTypeData.type,
          },
        },
      };
      
      addNode(newNode);
    },
    [addNode]
  );
  
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setSelectedNode(node as Node<NodeData>);
    },
    [setSelectedNode]
  );
  
  if (!currentWorkflow) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Loading workflow...</div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-screen bg-background">
      <WorkflowNavbar />
      
      <div className="flex-1 flex overflow-hidden">
        <NodePalette />
        
        <div className="flex-1 relative" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={currentWorkflow.nodes}
            edges={currentWorkflow.edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            className="bg-background"
          >
            <Background className="bg-background" />
            <Controls className="bg-card border-border" />
            <MiniMap
              className="bg-card border border-border"
              nodeColor={(node) => {
                const nodeData = node.data as NodeData;
                switch (nodeData.category) {
                  case 'trigger':
                    return 'hsl(var(--trigger))';
                  case 'ai':
                    return 'hsl(var(--ai-start))';
                  case 'action':
                    return 'hsl(var(--action))';
                  case 'logic':
                    return 'hsl(var(--logic))';
                  case 'human':
                    return 'hsl(var(--human))';
                  default:
                    return 'hsl(var(--primary))';
                }
              }}
            />
          </ReactFlow>
          
          {currentWorkflow.nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="text-6xl mb-4">🎯</div>
                <h2 className="text-2xl font-semibold mb-2">Drag a trigger to start</h2>
                <p className="text-muted-foreground">
                  Build your workflow by dragging nodes from the left palette
                </p>
              </div>
            </div>
          )}
        </div>
        
        <NodeConfigPanel />
      </div>
    </div>
  );
};

const WorkflowBuilder = () => {
  return (
    <ReactFlowProvider>
      <WorkflowBuilderContent />
    </ReactFlowProvider>
  );
};

export default WorkflowBuilder;
