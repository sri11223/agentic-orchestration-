import { useWorkflowStore } from '@/store/workflowStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, Play, StopCircle, Settings, User, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { SaveStatusIndicator } from './SaveStatusIndicator';
import { workflowService } from '@/services/workflow.service';
import { executionService } from '@/services/execution.service';

interface WorkflowNavbarProps {
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved?: Date | null;
  onSave?: () => void;
}

const WorkflowNavbar = ({ saveStatus = 'idle', lastSaved, onSave }: WorkflowNavbarProps) => {
  const { currentWorkflow, updateWorkflowName, saveWorkflow, executeWorkflow, executionStatus } = useWorkflowStore();
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentExecutionId, setCurrentExecutionId] = useState<string | null>(null);
  const navigate = useNavigate();
  const [isEditingName, setIsEditingName] = useState(false);
  
  const handleSave = () => {
    if (onSave) {
      onSave();
    } else {
      saveWorkflow();
      toast.success('Workflow saved successfully');
    }
  };
  
  const handleExecute = async () => {
    if (!currentWorkflow?.id) {
      toast.error('Save the workflow before executing');
      return;
    }
    try {
      setIsExecuting(true);
      toast.info('Workflow execution started');
      const result = await workflowService.executeWorkflow(currentWorkflow.id);
      setCurrentExecutionId(result.executionId);
      toast.success('Workflow execution initiated');
    } catch (error: any) {
      toast.error('Execution failed: ' + (error?.message || 'Unknown error'));
      setIsExecuting(false);
    }
  };
  
  const handleStop = async () => {
    if (!currentExecutionId) {
      toast.info('No active execution to stop');
      return;
    }
    try {
      await executionService.cancelExecution(currentExecutionId);
      setIsExecuting(false);
      setCurrentExecutionId(null);
      toast.info('Workflow execution cancelled');
    } catch {
      toast.error('Failed to cancel execution');
    }
  };
  
  if (!currentWorkflow) return null;
  
  return (
    <div className="h-16 bg-card/50 backdrop-blur-lg border-b border-border flex items-center justify-between px-6">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-xl font-bold bg-ai-gradient bg-clip-text text-transparent"
        >
          Workflow Builder
        </button>
        
        <div className="h-6 w-px bg-border" />
        
        {isEditingName ? (
          <Input
            value={currentWorkflow.name}
            onChange={(e) => updateWorkflowName(e.target.value)}
            onBlur={() => setIsEditingName(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setIsEditingName(false);
            }}
            className="w-64"
            autoFocus
          />
        ) : (
          <button
            onClick={() => setIsEditingName(true)}
            className="text-lg font-medium hover:text-primary transition-colors"
          >
            {currentWorkflow.name}
          </button>
        )}
        
        <SaveStatusIndicator status={saveStatus} lastSaved={lastSaved} />
      </div>
      
      {/* Center */}
      <div className="flex items-center gap-2">
        <Button onClick={handleSave} variant="outline" size="sm">
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>
        
        {executionStatus === 'running' || isExecuting ? (
          <Button onClick={handleStop} variant="destructive" size="sm">
            <StopCircle className="w-4 h-4 mr-2" />
            Stop
          </Button>
        ) : (
          <Button onClick={handleExecute} className="bg-status-success hover:bg-status-success/90" size="sm">
            <Play className="w-4 h-4 mr-2" />
            Execute
          </Button>
        )}
      </div>
      
      {/* Right side */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
          <Settings className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
          <User className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};

export default WorkflowNavbar;
