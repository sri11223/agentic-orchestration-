import { useWorkflowStore } from '@/store/workflowStore';
import { nodeTypes } from '@/data/nodeTypes';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AINodeConfig } from './AINodeConfig';
import { workflowService } from '@/services/workflow.service';
import { authService } from '@/services/auth.service';

const NodeConfigPanel = () => {
  const { selectedNode, setSelectedNode, updateNodeData } = useWorkflowStore();
  
  if (!selectedNode) {
    return (
      <div className="w-80 bg-card/50 backdrop-blur-lg border-l border-border h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground p-6">
          <p className="text-sm">Select a node to configure</p>
        </div>
      </div>
    );
  }
  
  const nodeConfig = nodeTypes.find(
    (nt) => nt.type === selectedNode.data.config?.nodeType
  );
  const Icon = nodeConfig?.icon;
  
  const updateConfig = (key: string, value: any) => {
    updateNodeData(selectedNode.id, {
      config: {
        ...selectedNode.data.config,
        [key]: value,
      },
    });
  };
  
  const updateLabel = (label: string) => {
    updateNodeData(selectedNode.id, { label });
  };
  
  const handleAITest = async (config: any) => {
    try {
      // Use the auth service to get a valid token
      const token = await authService.getValidToken();
      
      const result = await fetch('http://localhost:5000/api/ai/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt: config.prompt,
          taskType: config.taskType,
          aiProvider: config.aiProvider,
          model: config.model,
          temperature: config.temperature,
          maxTokens: config.maxTokens
        })
      });
      
      if (!result.ok) throw new Error('AI test failed');
      const data = await result.json();
      return {
        text: data.text || data.response,
        provider: data.provider,
        tokensUsed: data.tokensUsed,
        cost: data.cost,
        confidence: data.confidence
      };
    } catch (error) {
      throw new Error(error.message || 'AI test failed');
    }
  };
  
  const renderConfigForm = () => {
    const nodeType = selectedNode.data.config?.nodeType;
    
    // AI Node Types - Use our comprehensive AI configuration
    if (['ai-text-generator', 'ai-decision-maker', 'ai-data-extractor', 'ai-web-researcher'].includes(nodeType)) {
      return (
        <AINodeConfig
          nodeId={selectedNode.id}
          initialData={selectedNode.data.config}
          onSave={(aiConfig) => {
            updateNodeData(selectedNode.id, {
              config: {
                ...selectedNode.data.config,
                ...aiConfig
              }
            });
          }}
          onTest={handleAITest}
        />
      );
    }
    
    switch (nodeType) {
        
      case 'condition':
        return (
          <div className="space-y-4">
            <div>
              <Label>Left Value</Label>
              <Input
                value={selectedNode.data.config?.leftValue || ''}
                onChange={(e) => updateConfig('leftValue', e.target.value)}
                placeholder="{{variable}}"
              />
            </div>
            
            <div>
              <Label>Operator</Label>
              <Select
                value={selectedNode.data.config?.operator || 'equals'}
                onValueChange={(value) => updateConfig('operator', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equals">Equals</SelectItem>
                  <SelectItem value="not-equals">Not Equals</SelectItem>
                  <SelectItem value="greater-than">Greater Than</SelectItem>
                  <SelectItem value="less-than">Less Than</SelectItem>
                  <SelectItem value="contains">Contains</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Right Value</Label>
              <Input
                value={selectedNode.data.config?.rightValue || ''}
                onChange={(e) => updateConfig('rightValue', e.target.value)}
                placeholder="Value to compare"
              />
            </div>
          </div>
        );
        
      case 'http-request':
        return (
          <div className="space-y-4">
            <div>
              <Label>Method</Label>
              <Select
                value={selectedNode.data.config?.method || 'GET'}
                onValueChange={(value) => updateConfig('method', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>URL</Label>
              <Input
                value={selectedNode.data.config?.url || ''}
                onChange={(e) => updateConfig('url', e.target.value)}
                placeholder="https://api.example.com/{{endpoint}}"
              />
            </div>
            
            <div>
              <Label>Request Body (JSON)</Label>
              <Textarea
                value={selectedNode.data.config?.body || ''}
                onChange={(e) => updateConfig('body', e.target.value)}
                placeholder='{"key": "{{value}}"}'
                rows={4}
              />
            </div>
          </div>
        );
        
      case 'approval-request':
        return (
          <div className="space-y-4">
            <div>
              <Label>Approvers (comma-separated emails)</Label>
              <Input
                value={selectedNode.data.config?.approvers || ''}
                onChange={(e) => updateConfig('approvers', e.target.value)}
                placeholder="user@example.com, admin@example.com"
              />
            </div>
            
            <div>
              <Label>Timeout (seconds)</Label>
              <Input
                type="number"
                value={selectedNode.data.config?.timeout || 3600}
                onChange={(e) => updateConfig('timeout', parseInt(e.target.value))}
              />
            </div>
            
            <div>
              <Label>Approval Message</Label>
              <Textarea
                value={selectedNode.data.config?.message || ''}
                onChange={(e) => updateConfig('message', e.target.value)}
                placeholder="Please review and approve this request"
                rows={3}
              />
            </div>
            
            <div>
              <Label>Fallback Action</Label>
              <Select
                value={selectedNode.data.config?.fallback || 'escalate'}
                onValueChange={(value) => updateConfig('fallback', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="escalate">Escalate</SelectItem>
                  <SelectItem value="auto-approve">Auto-approve</SelectItem>
                  <SelectItem value="cancel">Cancel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
        
      default:
        return (
          <div className="text-sm text-muted-foreground">
            No configuration available for this node type.
          </div>
        );
    }
  };
  
  return (
    <div className="w-80 bg-card/50 backdrop-blur-lg border-l border-border h-full overflow-y-auto">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5" />}
          <h2 className="text-lg font-semibold">Configure Node</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSelectedNode(null)}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="p-4 space-y-6">
        <div>
          <Label>Node Name</Label>
          <Input
            value={selectedNode.data.label}
            onChange={(e) => updateLabel(e.target.value)}
            placeholder="Enter node name"
          />
        </div>
        
        <div>
          <Label className="text-xs text-muted-foreground">Node Type</Label>
          <div className="text-sm mt-1">{nodeConfig?.label}</div>
        </div>
        
        <div className="pt-4 border-t border-border">
          <h3 className="text-sm font-medium mb-4">Configuration</h3>
          {renderConfigForm()}
        </div>
      </div>
    </div>
  );
};

export default NodeConfigPanel;
