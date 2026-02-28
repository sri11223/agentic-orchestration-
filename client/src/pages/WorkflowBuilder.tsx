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
import CustomEdge from '@/components/workflow/CustomEdge';
import NodePalette from '@/components/workflow/NodePalette';
import NodeConfigPanel from '@/components/workflow/NodeConfigPanel';
import WorkflowNavbar from '@/components/workflow/WorkflowNavbar';
import { ExecutionPanel } from '@/components/workflow/ExecutionPanel';
import { useNavigate, useParams } from 'react-router-dom';
import { demoWorkflow } from '@/data/demoWorkflow';
import { workflowService } from '@/services/workflow.service';
import { useAutoSave } from '@/hooks/useAutoSave';
import { executionService } from '@/services/execution.service';
import { useToast } from '@/hooks/use-toast';

// Map backend node types to frontend node types
const mapBackendToFrontendNodeType = (backendType: string): string => {
  const mapping: Record<string, string> = {
    // Triggers
    'trigger': 'manual-trigger',
    'timer': 'schedule-trigger',
    'schedule': 'schedule-trigger',
    'email': 'email-trigger',
    'webhook': 'webhook-trigger',
    
    // AI Agents  
    'ai_processor': 'ai-text-generator',
    'ai_text': 'ai-text-generator',
    'ai_decision': 'ai-decision-maker',
    'ai_extractor': 'ai-data-extractor',
    'ai_researcher': 'ai-web-researcher',
    
    // Actions
    'action': 'http-request',
    'http': 'http-request',
    'email_automation': 'send-email',
    'email_send': 'send-email',
    'database': 'database-query',
    'slack': 'slack-message',
    
    // Logic
    'decision': 'condition',
    'condition': 'condition',
    'switch': 'switch',
    'loop': 'loop',
    'merge': 'merge',
    
    // Human
    'human_task': 'approval-request',
    'approval': 'approval-request',
    'form_builder': 'form-input',
    'form': 'form-input',
    'manual': 'manual-task',
    
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

const edgeTypes = {
  default: CustomEdge,
};

const WorkflowBuilderContent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
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
    deleteEdge,
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

        // Always try to load from backend first for latest data
        try {
          setLoading(true);
          console.log('🌐 Loading workflow from backend:', id);
          const workflow = await workflowService.getWorkflow(id);
          
          if (!workflow) {
            throw new Error('Workflow not found in backend');
          }
          
          let executionCount = 0;
          try {
            const executionHistory = await executionService.getExecutionHistory(workflow.id || id, 1, 1);
            executionCount = executionHistory.pagination?.total ?? 0;
          } catch (historyError) {
            console.warn('⚠️ Unable to load execution history:', historyError);
          }

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
              
              // Ensure we have proper category mapping
              const category = nodeTypeConfig?.category || 'trigger';
              
              console.log('🎨 Node styling info:', {
                nodeId: node.id,
                frontendType: frontendNodeType,
                category: category,
                nodeTypeConfig: nodeTypeConfig?.label
              });
              
              return {
                id: node.id,
                type: 'custom', // All nodes use 'custom' type in ReactFlow
                position: node.position || { x: 100, y: 100 },
                data: {
                  label: node.data?.title || nodeTypeConfig?.label || 'Untitled Node',
                  category: category, // Critical for node styling
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
            executionCount
          };
          
          setCurrentWorkflow(storeWorkflow);
          console.log('✅ Workflow loaded from backend successfully');
          console.log('🎨 Final workflow nodes with categories:', storeWorkflow.nodes.map(n => ({
            id: n.id,
            type: n.type,
            category: n.data.category,
            label: n.data.label
          })));
          
          // Update the store with the latest backend data
          const allWorkflows = useWorkflowStore.getState().workflows;
          const workflowExists = allWorkflows.some(w => w.id === storeWorkflow.id);
          if (!workflowExists) {
            useWorkflowStore.setState({ 
              workflows: [...allWorkflows, storeWorkflow] 
            });
          } else {
            // Update existing workflow in store with latest backend data
            const updatedWorkflows = allWorkflows.map(w => 
              w.id === storeWorkflow.id ? storeWorkflow : w
            );
            useWorkflowStore.setState({ workflows: updatedWorkflows });
          }
          
          // Force ReactFlow to re-render by updating the instance
          setTimeout(() => {
            console.log('🔄 Forcing ReactFlow refresh...');
            reactFlowInstance.fitView();
          }, 100);
          
        } catch (error) {
          console.error('❌ Failed to load workflow from backend:', error);
          
          // Fallback to local store only if backend fails
          console.log('🔄 Falling back to local store...');
          const workflows = useWorkflowStore.getState().workflows;
          const localWorkflow = workflows.find(w => w.id === id);
          if (localWorkflow) {
            console.log('📁 Loading workflow from local store as fallback:', id);
            
            // Ensure local workflow nodes have proper types and categories
            const normalizedWorkflow = {
              ...localWorkflow,
              nodes: localWorkflow.nodes.map(node => {
                // Check if node already has proper format
                if (node.type === 'custom' && node.data.category) {
                  return node;
                }
                
                // Normalize node if needed
                const frontendNodeType = node.data.config?.nodeType || mapBackendToFrontendNodeType(node.type);
                const nodeTypeConfig = nodeTypesList.find(nt => nt.type === frontendNodeType);
                const category = node.data.category || nodeTypeConfig?.category || 'trigger';
                
                console.log('🔧 Normalizing local node (fallback):', {
                  nodeId: node.id,
                  originalType: node.type,
                  frontendType: frontendNodeType,
                  category: category
                });
                
                return {
                  ...node,
                  type: 'custom', // Ensure React Flow type is 'custom'
                  data: {
                    ...node.data,
                    category: category, // Ensure category is set
                    config: {
                      nodeType: frontendNodeType,
                      ...node.data.config
                    }
                  }
                };
              })
            };
            
            setCurrentWorkflow(normalizedWorkflow);
            
            // Update the workflow in the store to maintain consistency
            const allWorkflows = useWorkflowStore.getState().workflows;
            const updatedWorkflows = allWorkflows.map(w => 
              w.id === normalizedWorkflow.id ? normalizedWorkflow : w
            );
            useWorkflowStore.setState({ workflows: updatedWorkflows });
          } else {
            console.error('❌ Workflow not found in local store either');
            toast({
              title: 'Workflow not found',
              description: 'We could not find that workflow. Redirecting to your workflows list.',
              variant: 'destructive',
            });
            navigate('/workflows');
          }
        } finally {
          setLoading(false);
        }
      }
    };

    loadWorkflow();
  }, [id, navigate, reactFlowInstance, setCurrentWorkflow, toast]);

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

  const handleDeleteEdge = useCallback((edgeId: string) => {
    console.log('🗑️ Deleting edge:', edgeId);
    deleteEdge(edgeId);
    debouncedSave(); // Auto-save after deleting edge
  }, [deleteEdge, debouncedSave]);

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
            edges={currentWorkflow.edges.map(edge => ({
              ...edge,
              data: { ...edge.data, onDelete: handleDeleteEdge }
            }))}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={handleConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            className="bg-background"
            elementsSelectable={true}
            nodesDraggable={true}
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
