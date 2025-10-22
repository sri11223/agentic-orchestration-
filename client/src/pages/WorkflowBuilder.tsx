import { useCallback, useRef, useEffect, useState } from 'react';
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
import { ExecutionPanel } from '@/components/workflow/ExecutionPanel';
import { useParams } from 'react-router-dom';
import { demoWorkflow } from '@/data/demoWorkflow';
import { workflowService } from '@/services/workflow.service';

const nodeTypes = {
  custom: CustomNode,
};

const WorkflowBuilderContent = () => {
  const { id } = useParams();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  
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
    const loadWorkflow = async () => {
      if (id === 'new') {
        // For new workflows, check if we already have a current workflow
        if (!currentWorkflow) {
          useWorkflowStore.getState().createNewWorkflow();
        }
      } else if (id) {
        // First check if it's the demo workflow
        if (id === demoWorkflow.id) {
          setCurrentWorkflow(demoWorkflow);
          return;
        }

        // Try to load from local store first
        const workflows = useWorkflowStore.getState().workflows;
        const localWorkflow = workflows.find(w => w.id === id);
        if (localWorkflow) {
          console.log('📁 Loading workflow from local store:', id);
          setCurrentWorkflow(localWorkflow);
          return;
        }

        // If not found locally, try to load from backend
        try {
          setLoading(true);
          console.log('🌐 Loading workflow from backend:', id);
          const workflow = await workflowService.getWorkflow(id);
          
          // Convert backend workflow to store format
          const storeWorkflow = {
            ...workflow,
            id: workflow.id || id!, // Ensure ID is present
            lastModified: new Date(workflow.metadata?.updatedAt || Date.now()),
            executionCount: 0 // TODO: Get from execution history
          };
          
          setCurrentWorkflow(storeWorkflow);
          console.log('✅ Workflow loaded from backend successfully');
        } catch (error) {
          console.error('❌ Failed to load workflow from backend:', error);
          // TODO: Show error message to user
        } finally {
          setLoading(false);
        }
      }
    };

    loadWorkflow();
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
  
  if (!currentWorkflow || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">
          {loading ? 'Loading workflow from backend...' : 'Loading workflow...'}
        </div>
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

        {/* Right Panel - Execution + Configuration */}
        <div className="w-80 flex flex-col border-l border-border bg-card/50 backdrop-blur-lg">
          <ExecutionPanel 
            workflowId={currentWorkflow.id} 
            className="border-0 rounded-none border-b" 
          />
          <div className="flex-1 overflow-auto">
            <NodeConfigPanel />
          </div>
        </div>
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
