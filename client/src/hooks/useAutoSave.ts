import { useCallback, useRef, useEffect, useState } from 'react';
import { workflowService } from '@/services/workflow.service';
import { useWorkflowStore } from '@/store/workflowStore';
import { toast } from '@/hooks/use-toast';

// Map frontend node types to backend enum values
const mapFrontendToBackendNodeType = (frontendType: string): string => {
  const mapping: Record<string, string> = {
    // Triggers
    'manual-trigger': 'trigger',
    'webhook-trigger': 'trigger', 
    'schedule-trigger': 'trigger',
    'email-trigger': 'trigger',
    
    // AI Agents
    'ai-text-generator': 'ai_processor',
    'ai-decision-maker': 'ai_processor',
    'ai-data-extractor': 'ai_processor',
    'ai-web-researcher': 'ai_processor',
    
    // Actions
    'http-request': 'action',
    'database-query': 'action',
    'send-email': 'email_automation',
    'slack-message': 'action',
    
    // Logic
    'condition': 'decision',
    'switch': 'decision',
    'loop': 'action',
    'merge': 'action',
    
    // Human
    'approval-request': 'human_task',
    'form-input': 'form_builder',
    'manual-task': 'human_task'
  };
  
  return mapping[frontendType] || 'trigger';
};

export const useAutoSave = (workflowId?: string) => {
  // Don't destructure currentWorkflow here to avoid stale closure
  const store = useWorkflowStore();
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const isSavingRef = useRef(false);
  const hasChangesRef = useRef(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const saveWorkflow = useCallback(async () => {
    if (!workflowId || workflowId === 'new' || isSavingRef.current) {
      return;
    }

    // Get fresh state from store to avoid stale closure
    const freshStore = useWorkflowStore.getState();
    const currentWorkflow = freshStore.currentWorkflow;
    
    if (!currentWorkflow) {
      return;
    }

    try {
      isSavingRef.current = true;
      hasChangesRef.current = false;
      setSaveStatus('saving');

      console.log('💾 Auto-saving workflow:', workflowId);
      console.log('💾 Fresh state:', {
        nodeCount: currentWorkflow.nodes.length,
        edgeCount: currentWorkflow.edges.length,
        edges: currentWorkflow.edges
      });

      // Convert store format to backend format
      const workflowData = {
        name: currentWorkflow.name,
        description: currentWorkflow.description,
        nodes: currentWorkflow.nodes.map(node => {
          console.log('💾 Saving node:', {
            id: node.id,
            label: node.data?.label,
            frontendType: node.data?.config?.nodeType,
            backendType: mapFrontendToBackendNodeType(node.data?.config?.nodeType || 'trigger'),
            position: node.position
          });
          
          return {
            id: node.id,
            type: mapFrontendToBackendNodeType(node.data?.config?.nodeType || 'trigger'),
            data: {
              title: node.data?.label || 'Untitled Node',
              description: node.data?.config?.description || '',
              config: node.data?.config || {},
              ...node.data
            },
            position: node.position
          };
        }),
        edges: (() => {
          console.log('🔗 Saving edges:', currentWorkflow.edges);
          return currentWorkflow.edges.map(edge => ({
            ...edge,
            type: edge.type || 'default' // Ensure all edges have a type
          }));
        })(),
        status: (currentWorkflow.status === 'archived' ? 'draft' : currentWorkflow.status) || 'draft'
      };

      await workflowService.updateWorkflow(workflowId, workflowData);
      
      // Update save status
      setSaveStatus('saved');
      setLastSaved(new Date());
      console.log('✅ Workflow auto-saved successfully');

      // Reset to idle after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000);
      
      // Optional: Show toast only on manual save or first auto-save
      // toast({
      //   title: "Workflow saved",
      //   description: "Your changes have been saved automatically",
      //   duration: 2000,
      // });

    } catch (error) {
      console.error('❌ Auto-save failed:', error);
      hasChangesRef.current = true; // Retain changes flag for retry
      setSaveStatus('error');
      
      toast({
        title: "Auto-save failed",
        description: "Your changes couldn't be saved. Please check your connection.",
        variant: "destructive",
        duration: 5000,
      });

      // Reset error status after 5 seconds
      setTimeout(() => setSaveStatus('idle'), 5000);
    } finally {
      isSavingRef.current = false;
    }
  }, [workflowId]);

  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    hasChangesRef.current = true;

    // Debounce save by 2 seconds (like n8n)
    saveTimeoutRef.current = setTimeout(() => {
      if (hasChangesRef.current) {
        saveWorkflow();
      }
    }, 2000);
  }, [saveWorkflow]);

  // Manual save function (for explicit save actions)
  const saveNow = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    await saveWorkflow();
  }, [saveWorkflow]);

  // Force save on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      // Save immediately on unmount if there are changes
      if (hasChangesRef.current && !isSavingRef.current) {
        saveWorkflow();
      }
    };
  }, [saveWorkflow]);

  return {
    debouncedSave,
    saveNow,
    isSaving: isSavingRef.current,
    hasUnsavedChanges: hasChangesRef.current,
    saveStatus,
    lastSaved
  };
};