import { useCallback, useRef, useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  useReactFlow,
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
import { useAutoSave } from '@/hooks/useAutoSave';

// Map backend node types to frontend node types
const mapBackendToFrontendNodeType = (backendType: string): string => {
  const mapping: Record<string, string> = {
    // Triggers
    'trigger': 'manual-trigger',
    'timer': 'schedule-trigger',
    
    // AI Agents  
    'ai_processor': 'ai-text-generator',
    
    // Actions
    'action': 'http-request',
    'email_automation': 'send-email',
    
    // Logic
    'decision': 'condition',
    
    // Human
    'human_task': 'approval-request',
    'form_builder': 'form-input',
    
    // Others
    'file_operations': 'http-request',
    'data_transform': 'http-request',
    'push_notification': 'slack-message'
  };
  
  return mapping[backendType] || 'manual-trigger';
};
import { Badge } from '@/components/ui/badge';

const nodeTypes = {
  custom: CustomNode,
};

const WorkflowBuilderContent = () => {
  const { id } = useParams();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const reactFlowInstance = useReactFlow();
  
  const {
    currentWorkflow,
    setCurrentWorkflow,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    setSelectedNode,
    deleteNode,
    deleteSelectedNodes,
  } = useWorkflowStore();

  // Auto-save functionality
  const { debouncedSave, saveNow, isSaving, hasUnsavedChanges, saveStatus, lastSaved } = useAutoSave(id);
  
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
          console.log('🔄 Converting backend workflow to frontend format:', workflow);
          
          const storeWorkflow = {
            ...workflow,
            id: workflow.id || id!, // Ensure ID is present
            // Convert backend nodes to frontend format
            nodes: workflow.nodes?.map(node => {
              console.log('📍 Loading node:', {
                id: node.id,
                backendType: node.type,
                frontendType: mapBackendToFrontendNodeType(node.type),
                position: node.position,
                title: node.data?.title
              });
              
              const frontendNodeType = mapBackendToFrontendNodeType(node.type);
              const nodeTypeConfig = nodeTypesList.find(nt => nt.type === frontendNodeType);
              
              return {
                id: node.id,
                type: 'custom', // All nodes use 'custom' type in ReactFlow
                position: node.position || { x: 100, y: 100 },
                data: {
                  label: node.data?.title || nodeTypeConfig?.label || 'Untitled Node',
                  category: nodeTypeConfig?.category || 'trigger', // THIS WAS MISSING!
                  config: {
                    nodeType: frontendNodeType,
                    description: node.data?.description || '',
                    ...node.data?.config
                  },
                  ...node.data
                }
              };
            }) || [],
            edges: (() => {
              console.log('🔗 Loading edges:', workflow.edges);
              return workflow.edges || [];
            })(),
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

  // Keyboard event handler for node deletion
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Delete or Backspace key
      if (event.key === 'Delete' || event.key === 'Backspace') {
        // Only delete if we're not in an input field
        const target = event.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.contentEditable) {
          event.preventDefault();
          deleteSelectedNodes();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [deleteSelectedNodes]);
  
  // Enhanced handlers with auto-save
  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    onNodesChange(changes as any);
    debouncedSave(); // Auto-save after node changes
  }, [onNodesChange, debouncedSave]);

  const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
    onEdgesChange(changes);
    debouncedSave(); // Auto-save after edge changes  
  }, [onEdgesChange, debouncedSave]);

  const handleConnect = useCallback((connection: Connection) => {
    console.log('🔗 Creating connection:', connection);
    onConnect(connection);
    debouncedSave(); // Auto-save after connecting nodes
  }, [onConnect, debouncedSave]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);
  
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      
      if (!reactFlowWrapper.current) return;
      
      const nodeTypeData = JSON.parse(
        event.dataTransfer.getData('application/reactflow')
      );
      
      // Use ReactFlow's screenToFlowPosition for accurate coordinate conversion
      // This handles zoom, pan, and coordinate transformation automatically
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      
      console.log('🎯 Dropping node:', {
        type: nodeTypeData.type,
        clientPosition: { x: event.clientX, y: event.clientY },
        flowPosition: position
      });
      
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
      debouncedSave(); // Auto-save after adding node
    },
    [addNode, debouncedSave, reactFlowInstance]
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
      <WorkflowNavbar 
        saveStatus={saveStatus}
        lastSaved={lastSaved}
        onSave={saveNow}
      />
      
      <div className="flex-1 flex overflow-hidden">
        <NodePalette />
        
        <div className="flex-1 relative" ref={reactFlowWrapper}>
          {/* Auto-save status indicator */}
          <div className="absolute top-4 right-4 z-10">
            {isSaving ? (
              <Badge variant="secondary" className="animate-pulse">
                💾 Saving...
              </Badge>
            ) : hasUnsavedChanges ? (
              <Badge variant="outline" className="border-orange-500 text-orange-700">
                ⏳ Unsaved changes
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-300">
                ✅ Saved
              </Badge>
            )}
          </div>

          <ReactFlow
            nodes={currentWorkflow.nodes}
            edges={currentWorkflow.edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={handleConnect}
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
