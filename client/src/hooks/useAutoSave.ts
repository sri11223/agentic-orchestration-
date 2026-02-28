import { useCallback, useRef, useEffect, useState } from 'react';
import { workflowService } from '@/services/workflow.service';
import { useWorkflowStore } from '@/store/workflowStore';
import { toast } from '@/hooks/use-toast';
import { mapFrontendToBackendNodeType } from '@/lib/nodeTypeMapping';

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

      // Convert store format to backend format
      const workflowData = {
        name: currentWorkflow.name,
        description: currentWorkflow.description,
        nodes: currentWorkflow.nodes.map(node => {
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
        edges: currentWorkflow.edges.map(edge => ({
          ...edge,
          type: edge.type || 'default'
        })),
        status: (currentWorkflow.status === 'archived' ? 'draft' : currentWorkflow.status) || 'draft'
      };

      await workflowService.updateWorkflow(workflowId, workflowData);
      
      // Update save status
      setSaveStatus('saved');
      setLastSaved(new Date());

      // Reset to idle after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000);
      
      // Optional: Show toast only on manual save or first auto-save
      // toast({
      //   title: "Workflow saved",
      //   description: "Your changes have been saved automatically",
      //   duration: 2000,
      // });

    } catch (error) {
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
    isSaving: saveStatus === 'saving',
    hasUnsavedChanges: saveStatus !== 'saved' && saveStatus !== 'idle',
    saveStatus,
    lastSaved
  };
};