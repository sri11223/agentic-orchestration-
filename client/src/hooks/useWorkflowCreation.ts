import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { workflowService } from '@/services/workflow.service';
import { useWorkflowStore } from '@/store/workflowStore';

export const useWorkflowCreation = (onSuccess?: () => void) => {
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();
  const { createNewWorkflow } = useWorkflowStore();

  const createWorkflow = async () => {
    try {
      setCreating(true);
      console.log('🚀 Starting workflow creation...');
      
      // Create empty workflow template
      const emptyWorkflow = workflowService.createEmptyWorkflow();
      
      // Try to create on backend first
      const createdWorkflow = await workflowService.createWorkflow(emptyWorkflow);
      
      // Add to local store
      createNewWorkflow();
      
      // Navigate to the workflow builder with the real ID
      navigate(`/workflow/${createdWorkflow.id}`);
      console.log('✅ Workflow created and navigating to:', createdWorkflow.id);
      
      // Call success callback to refresh dashboard
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error) {
      console.error('❌ Failed to create workflow on backend:', error);
      
      // Fallback: create locally and navigate
      console.log('🔄 Falling back to local workflow creation...');
      createNewWorkflow();
      navigate('/workflow/new');
    } finally {
      setCreating(false);
    }
  };

  return {
    createWorkflow,
    creating
  };
};