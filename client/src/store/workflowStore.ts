import { create } from 'zustand';
import { Node, Edge, Connection, addEdge, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange } from '@xyflow/react';

export type NodeCategory = 'trigger' | 'ai' | 'action' | 'logic' | 'human';

export type ExecutionStatus = 'idle' | 'running' | 'success' | 'failed';

export interface NodeData extends Record<string, unknown> {
  label: string;
  category: NodeCategory;
  config?: Record<string, any>;
  status?: 'pending' | 'running' | 'success' | 'failed';
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: Node<NodeData>[];
  edges: Edge[];
  status: 'draft' | 'active' | 'archived';
  lastModified: Date;
  executionCount: number;
}

interface WorkflowStore {
  workflows: Workflow[];
  currentWorkflow: Workflow | null;
  selectedNode: Node<NodeData> | null;
  executionStatus: ExecutionStatus;
  
  // Actions
  setCurrentWorkflow: (workflow: Workflow) => void;
  updateWorkflowName: (name: string) => void;
  setSelectedNode: (node: Node<NodeData> | null) => void;
  updateNodeData: (nodeId: string, data: Partial<NodeData>) => void;
  
  // React Flow actions
  onNodesChange: (changes: NodeChange<Node<NodeData>>[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (node: Node<NodeData>) => void;
  deleteNode: (nodeId: string) => void;
  deleteSelectedNodes: () => void;
  
  // Workflow actions
  saveWorkflow: () => void;
  executeWorkflow: () => void;
  createNewWorkflow: () => void;
  deleteWorkflow: (id: string) => void;
}

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  workflows: [],
  currentWorkflow: null,
  selectedNode: null,
  executionStatus: 'idle',
  
  setCurrentWorkflow: (workflow) => set({ currentWorkflow: workflow }),
  
  updateWorkflowName: (name) => {
    const current = get().currentWorkflow;
    if (current) {
      set({
        currentWorkflow: { ...current, name, lastModified: new Date() }
      });
    }
  },
  
  setSelectedNode: (node) => set({ selectedNode: node }),
  
  updateNodeData: (nodeId, data) => {
    const current = get().currentWorkflow;
    if (!current) return;
    
    const updatedNodes = current.nodes.map(node =>
      node.id === nodeId
        ? { ...node, data: { ...node.data, ...data } }
        : node
    );
    
    set({
      currentWorkflow: { ...current, nodes: updatedNodes, lastModified: new Date() }
    });
  },
  
  onNodesChange: (changes) => {
    const current = get().currentWorkflow;
    if (!current) return;
    
    const updatedNodes = applyNodeChanges(changes, current.nodes);
    set({
      currentWorkflow: { ...current, nodes: updatedNodes, lastModified: new Date() }
    });
  },
  
  onEdgesChange: (changes) => {
    const current = get().currentWorkflow;
    if (!current) return;
    
    const updatedEdges = applyEdgeChanges(changes, current.edges);
    set({
      currentWorkflow: { ...current, edges: updatedEdges, lastModified: new Date() }
    });
  },
  
  onConnect: (connection) => {
    const current = get().currentWorkflow;
    if (!current) return;
    
    console.log('🏪 Store: Adding connection to edges:', connection);
    console.log('🏪 Store: Current edges before:', current.edges.length);
    
    const updatedEdges = addEdge(connection, current.edges);
    
    console.log('🏪 Store: Updated edges after:', updatedEdges.length);
    
    set({
      currentWorkflow: { ...current, edges: updatedEdges, lastModified: new Date() }
    });
  },
  
  addNode: (node) => {
    const current = get().currentWorkflow;
    if (!current) return;
    
    set({
      currentWorkflow: {
        ...current,
        nodes: [...current.nodes, node],
        lastModified: new Date()
      }
    });
  },

  deleteNode: (nodeId) => {
    const current = get().currentWorkflow;
    if (!current) return;

    // Remove the node
    const updatedNodes = current.nodes.filter(node => node.id !== nodeId);
    
    // Remove all edges connected to this node
    const updatedEdges = current.edges.filter(edge => 
      edge.source !== nodeId && edge.target !== nodeId
    );

    // Clear selection if the deleted node was selected
    const selectedNode = get().selectedNode;
    const newSelectedNode = selectedNode?.id === nodeId ? null : selectedNode;

    set({
      currentWorkflow: {
        ...current,
        nodes: updatedNodes,
        edges: updatedEdges,
        lastModified: new Date()
      },
      selectedNode: newSelectedNode
    });
  },

  deleteSelectedNodes: () => {
    const current = get().currentWorkflow;
    const selectedNode = get().selectedNode;
    
    if (!current || !selectedNode) return;

    get().deleteNode(selectedNode.id);
  },
  
  saveWorkflow: () => {
    const current = get().currentWorkflow;
    if (!current) return;
    
    const workflows = get().workflows;
    const existingIndex = workflows.findIndex(w => w.id === current.id);
    
    if (existingIndex >= 0) {
      workflows[existingIndex] = current;
    } else {
      workflows.push(current);
    }
    
    set({ workflows: [...workflows] });
    console.log('Workflow saved:', current.name);
  },
  
  executeWorkflow: () => {
    const current = get().currentWorkflow;
    if (!current) return;
    
    set({ executionStatus: 'running' });
    
    // Simulate execution
    setTimeout(() => {
      set({
        executionStatus: 'success',
        currentWorkflow: current ? {
          ...current,
          executionCount: current.executionCount + 1
        } : null
      });
      
      setTimeout(() => {
        set({ executionStatus: 'idle' });
      }, 2000);
    }, 3000);
  },
  
  createNewWorkflow: () => {
    const newWorkflow: Workflow = {
      id: `workflow-${Date.now()}`,
      name: 'Untitled Workflow',
      nodes: [],
      edges: [],
      status: 'draft',
      lastModified: new Date(),
      executionCount: 0,
    };
    
    set({ currentWorkflow: newWorkflow });
  },
  
  deleteWorkflow: (id) => {
    const workflows = get().workflows.filter(w => w.id !== id);
    set({ workflows });
  },
}));
