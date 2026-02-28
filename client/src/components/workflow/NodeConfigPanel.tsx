import { useWorkflowStore } from '@/store/workflowStore';
import { nodeTypes } from '@/data/nodeTypes';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { X, TestTube, Save, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AINodeConfig } from './AINodeConfig';
import { authService } from '@/services/auth.service';
import { useTriggers, useTrigger } from '@/hooks/useTriggers';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { API_URL } from '@/config/api';

const NodeConfigPanel = () => {
  const { selectedNode, setSelectedNode, updateNodeData, workflowId } = useWorkflowStore();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  
  // Local state for form fields to prevent re-render issues
  const [localButtonText, setLocalButtonText] = useState('');
  const [localDescription, setLocalDescription] = useState('');
  const [localNodeName, setLocalNodeName] = useState('');
  const [localConfirmBeforeRun, setLocalConfirmBeforeRun] = useState(false);
  const [localMarkAsRead, setLocalMarkAsRead] = useState(false);
  const [localScheduleEnabled, setLocalScheduleEnabled] = useState(true);
  
  // Email trigger local state
  const [localEmailAddress, setLocalEmailAddress] = useState('');
  const [localSubjectFilter, setLocalSubjectFilter] = useState('');
  const [localSenderFilter, setLocalSenderFilter] = useState('');
  const [localFrequency, setLocalFrequency] = useState('5');
  
  // Sync local state with selected node changes
  useEffect(() => {
    if (selectedNode) {
      setLocalButtonText(selectedNode.data.config?.buttonText || '');
      setLocalDescription(selectedNode.data.config?.description || '');
      setLocalNodeName(selectedNode.data.label || '');
      setLocalConfirmBeforeRun(selectedNode.data.config?.confirmBeforeRun || false);
      setLocalMarkAsRead(selectedNode.data.config?.markAsRead || false);
      setLocalScheduleEnabled(selectedNode.data.config?.enabled !== false);
      setLocalEmailAddress(selectedNode.data.config?.emailAddress || '');
      setLocalSubjectFilter(selectedNode.data.config?.subjectFilter || '');
      setLocalSenderFilter(selectedNode.data.config?.senderFilter || '');
      setLocalFrequency(selectedNode.data.config?.frequency || '5');
    }
  }, [selectedNode?.id]); // Only re-sync when node ID changes, not on every update
  
  // Debounced update function to prevent too many rapid updates
  const debouncedUpdateConfig = (key: string, value: any) => {
    // Clear any existing timeout for this key
    const timeoutKey = `timeout_${key}`;
    if ((window as any)[timeoutKey]) {
      clearTimeout((window as any)[timeoutKey]);
    }
    
    // Set a new timeout to update after 150ms
    (window as any)[timeoutKey] = setTimeout(() => {
      updateConfig(key, value);
    }, 150);
  };
  
  // Get current workflow ID from the workflow store or URL
  const currentWorkflowId = workflowId || 'current-workflow'; // You might need to adjust this based on your workflow store
  
  // Trigger hooks for managing trigger configurations
  const { createTrigger, updateTrigger } = useTriggers(currentWorkflowId);
  const { executeManualTrigger, testTrigger } = useTrigger(
    (selectedNode?.data.triggerId as string) || ''
  );
  
  // Check if the selected node is a trigger type
  const isTriggerNode = selectedNode && [
    'email-trigger', 
    'webhook-trigger', 
    'schedule-trigger', 
    'manual-trigger'
  ].includes(selectedNode.data.config?.nodeType);
  
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
    if (!selectedNode) return;
    
    console.log('🔧 UpdateConfig called:', { 
      nodeId: selectedNode.id,
      key, 
      value, 
      currentConfig: selectedNode.data.config
    });
    
    // Ensure we have a config object
    const currentConfig = selectedNode.data.config || {};
    const newConfig = {
      ...currentConfig,
      [key]: value,
    };
    
    updateNodeData(selectedNode.id, {
      config: newConfig,
    });
    
    console.log('✅ UpdateConfig completed for', key, 'new value:', value);
  };
  
  const updateLabel = (label: string) => {
    updateNodeData(selectedNode.id, { label });
  };

  // Save trigger configuration to backend
  const saveTriggerConfig = async () => {
    if (!isTriggerNode) return;
    
    setSaving(true);
    
    // Ensure all local state is saved to node config before saving to backend
    console.log('💾 Pre-save local state check:', {
      nodeType: selectedNode.data.config?.nodeType,
      localEmailAddress,
      localSubjectFilter,
      localSenderFilter,
      localFrequency,
      localMarkAsRead,
      currentNodeConfig: selectedNode.data.config
    });
    
    if (selectedNode.data.config?.nodeType === 'manual-trigger') {
      updateConfig('buttonText', localButtonText);
      updateConfig('description', localDescription);
      updateConfig('confirmBeforeRun', localConfirmBeforeRun);
    }
    
    if (selectedNode.data.config?.nodeType === 'email-trigger') {
      updateConfig('emailAddress', localEmailAddress);
      updateConfig('subjectFilter', localSubjectFilter);
      updateConfig('senderFilter', localSenderFilter);
      updateConfig('frequency', localFrequency);
      updateConfig('markAsRead', localMarkAsRead);
    }
    
    if (selectedNode.data.config?.nodeType === 'schedule-trigger') {
      updateConfig('enabled', localScheduleEnabled);
    }
    
    // Wait a moment for the state updates to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      // Build config directly from local state instead of relying on node config
      let finalConfig: any = {
        nodeType: selectedNode.data.config?.nodeType,
        ...selectedNode.data.config
      };
      
      // Override with current local state for each trigger type
      if (selectedNode.data.config?.nodeType === 'email-trigger') {
        finalConfig = {
          ...finalConfig,
          emailAddress: localEmailAddress,
          subjectFilter: localSubjectFilter,
          senderFilter: localSenderFilter,
          frequency: localFrequency,
          markAsRead: localMarkAsRead
        };
      }
      
      if (selectedNode.data.config?.nodeType === 'manual-trigger') {
        finalConfig = {
          ...finalConfig,
          buttonText: localButtonText,
          description: localDescription,
          confirmBeforeRun: localConfirmBeforeRun
        };
      }
      
      if (selectedNode.data.config?.nodeType === 'schedule-trigger') {
        finalConfig = {
          ...finalConfig,
          enabled: localScheduleEnabled
        };
      }
      
      console.log('💾 Built config from local state:', finalConfig);
      
      const triggerConfig = {
        type: selectedNode.data.config?.nodeType as any,
        workflowId: currentWorkflowId,
        nodeId: selectedNode.id,
        enabled: true,
        config: finalConfig
      };
      
      console.log('💾 Complete trigger config:', triggerConfig);

      if (selectedNode.data.triggerId) {
        // Update existing trigger
        await updateTrigger(selectedNode.data.triggerId as string, { config: selectedNode.data.config });
        toast({
          title: "Trigger Updated",
          description: "Trigger configuration saved successfully",
        });
      } else {
        // Create new trigger
        const newTrigger = await createTrigger(triggerConfig);
        // Store trigger ID in node data
        updateNodeData(selectedNode.id, {
          triggerId: newTrigger._id
        });
        toast({
          title: "Trigger Created",
          description: "Trigger configuration saved successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save trigger configuration",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Test trigger configuration
  const handleTestTrigger = async () => {
    if (!selectedNode?.data.triggerId) {
      toast({
        title: "No Trigger",
        description: "Please save the trigger configuration first",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    try {
      const result = await testTrigger();
      toast({
        title: result.success ? "Test Successful" : "Test Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Test Error",
        description: error instanceof Error ? error.message : "Failed to test trigger",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  // Execute manual trigger
  const handleExecuteManualTrigger = async () => {
    if (!selectedNode?.data.triggerId) {
      toast({
        title: "No Trigger",
        description: "Please save the trigger configuration first",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    try {
      const executionId = await executeManualTrigger();
      toast({
        title: "Trigger Executed",
        description: `Manual trigger executed successfully. Execution ID: ${executionId}`,
      });
    } catch (error) {
      toast({
        title: "Execution Error",
        description: error instanceof Error ? error.message : "Failed to execute trigger",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleAITest = async (config: any) => {
    try {
      // Use the auth service to get a valid token
      const token = await authService.getValidToken();
      
      const result = await fetch(`${API_URL}/ai/test`, {
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
            console.log('💾 NodeConfigPanel - Received AI config to save:', {
              nodeId: selectedNode.id,
              aiConfig,
              currentConfig: selectedNode.data.config
            });
            
            updateNodeData(selectedNode.id, {
              config: {
                ...selectedNode.data.config,
                ...aiConfig
              }
            });
            
            console.log('✅ NodeConfigPanel - updateNodeData called');
          }}
          onTest={handleAITest}
        />
      );
    }
    
    switch (nodeType) {
      case 'email-trigger':
        return (
          <div className="space-y-4">
            <div>
              <Label>Email Address</Label>
              <Input
                value={localEmailAddress}
                onChange={(e) => {
                  console.log('📧 Email address input changed:', e.target.value);
                  setLocalEmailAddress(e.target.value);
                  debouncedUpdateConfig('emailAddress', e.target.value);
                }}
                placeholder="trigger@yourdomain.com"
                type="email"
              />
            </div>
            
            <div>
              <Label>Subject Filter (optional)</Label>
              <Input
                value={localSubjectFilter}
                onChange={(e) => {
                  console.log('📧 Subject filter input changed:', e.target.value);
                  setLocalSubjectFilter(e.target.value);
                  debouncedUpdateConfig('subjectFilter', e.target.value);
                }}
                placeholder="Contains this text"
              />
            </div>
            
            <div>
              <Label>Sender Filter (optional)</Label>
              <Input
                value={localSenderFilter}
                onChange={(e) => {
                  console.log('📧 Sender filter input changed:', e.target.value);
                  setLocalSenderFilter(e.target.value);
                  debouncedUpdateConfig('senderFilter', e.target.value);
                }}
                placeholder="sender@domain.com"
                type="email"
              />
            </div>
            
            <div>
              <Label>Check Frequency</Label>
              <Select
                value={localFrequency}
                onValueChange={(value) => {
                  console.log('📧 Frequency select changed:', value);
                  setLocalFrequency(value);
                  updateConfig('frequency', value);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Every minute</SelectItem>
                  <SelectItem value="5">Every 5 minutes</SelectItem>
                  <SelectItem value="15">Every 15 minutes</SelectItem>
                  <SelectItem value="30">Every 30 minutes</SelectItem>
                  <SelectItem value="60">Every hour</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="markAsRead"
                checked={localMarkAsRead}
                onCheckedChange={(checked) => {
                  console.log('Email markAsRead checkbox changed:', checked);
                  setLocalMarkAsRead(!!checked);
                  updateConfig('markAsRead', !!checked);
                }}
              />
              <Label htmlFor="markAsRead" className="text-sm cursor-pointer">
                Mark emails as read after processing
              </Label>
            </div>
          </div>
        );
        
      case 'webhook-trigger':
        return (
          <div className="space-y-4">
            <div>
              <Label>Webhook URL</Label>
              <div className="text-xs text-muted-foreground mb-2">
                This is your unique webhook endpoint
              </div>
              <Input
                value={`https://api.yourplatform.com/webhook/${selectedNode.id}`}
                readOnly
                className="bg-muted"
              />
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => navigator.clipboard.writeText(`https://api.yourplatform.com/webhook/${selectedNode.id}`)}
              >
                Copy URL
              </Button>
            </div>
            
            <div>
              <Label>HTTP Method</Label>
              <Select
                value={selectedNode.data.config?.method || 'POST'}
                onValueChange={(value) => updateConfig('method', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Authentication</Label>
              <Select
                value={selectedNode.data.config?.auth || 'none'}
                onValueChange={(value) => updateConfig('auth', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="api-key">API Key</SelectItem>
                  <SelectItem value="bearer">Bearer Token</SelectItem>
                  <SelectItem value="basic">Basic Auth</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {selectedNode.data.config?.auth === 'api-key' && (
              <div>
                <Label>API Key Header</Label>
                <Input
                  value={selectedNode.data.config?.apiKeyHeader || 'X-API-Key'}
                  onChange={(e) => updateConfig('apiKeyHeader', e.target.value)}
                  placeholder="X-API-Key"
                />
              </div>
            )}
            
            {selectedNode.data.config?.auth === 'bearer' && (
              <div>
                <Label>Expected Token Prefix</Label>
                <Input
                  value={selectedNode.data.config?.tokenPrefix || 'Bearer'}
                  onChange={(e) => updateConfig('tokenPrefix', e.target.value)}
                  placeholder="Bearer"
                />
              </div>
            )}
            
            <div>
              <Label>Response Status Code</Label>
              <Input
                type="number"
                value={selectedNode.data.config?.responseCode || 200}
                onChange={(e) => updateConfig('responseCode', parseInt(e.target.value))}
                placeholder="200"
              />
            </div>
          </div>
        );
        
      case 'schedule-trigger':
        return (
          <div className="space-y-4">
            <div>
              <Label>Schedule Type</Label>
              <Select
                value={selectedNode.data.config?.scheduleType || 'interval'}
                onValueChange={(value) => updateConfig('scheduleType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="interval">Interval</SelectItem>
                  <SelectItem value="cron">Cron Expression</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {selectedNode.data.config?.scheduleType === 'interval' && (
              <>
                <div>
                  <Label>Interval Value</Label>
                  <Input
                    type="number"
                    value={selectedNode.data.config?.intervalValue || 30}
                    onChange={(e) => updateConfig('intervalValue', parseInt(e.target.value))}
                    placeholder="30"
                  />
                </div>
                
                <div>
                  <Label>Interval Unit</Label>
                  <Select
                    value={selectedNode.data.config?.intervalUnit || 'minutes'}
                    onValueChange={(value) => updateConfig('intervalUnit', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="seconds">Seconds</SelectItem>
                      <SelectItem value="minutes">Minutes</SelectItem>
                      <SelectItem value="hours">Hours</SelectItem>
                      <SelectItem value="days">Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            
            {selectedNode.data.config?.scheduleType === 'cron' && (
              <div>
                <Label>Cron Expression</Label>
                <Input
                  value={selectedNode.data.config?.cronExpression || '0 */30 * * * *'}
                  onChange={(e) => updateConfig('cronExpression', e.target.value)}
                  placeholder="0 */30 * * * * (every 30 minutes)"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  Format: second minute hour day month dayOfWeek
                </div>
              </div>
            )}
            
            {selectedNode.data.config?.scheduleType === 'daily' && (
              <div>
                <Label>Time (24-hour format)</Label>
                <Input
                  type="time"
                  value={selectedNode.data.config?.dailyTime || '09:00'}
                  onChange={(e) => updateConfig('dailyTime', e.target.value)}
                />
              </div>
            )}
            
            {selectedNode.data.config?.scheduleType === 'weekly' && (
              <>
                <div>
                  <Label>Day of Week</Label>
                  <Select
                    value={selectedNode.data.config?.weekDay || 'monday'}
                    onValueChange={(value) => updateConfig('weekDay', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monday">Monday</SelectItem>
                      <SelectItem value="tuesday">Tuesday</SelectItem>
                      <SelectItem value="wednesday">Wednesday</SelectItem>
                      <SelectItem value="thursday">Thursday</SelectItem>
                      <SelectItem value="friday">Friday</SelectItem>
                      <SelectItem value="saturday">Saturday</SelectItem>
                      <SelectItem value="sunday">Sunday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Time (24-hour format)</Label>
                  <Input
                    type="time"
                    value={selectedNode.data.config?.weeklyTime || '09:00'}
                    onChange={(e) => updateConfig('weeklyTime', e.target.value)}
                  />
                </div>
              </>
            )}
            
            {selectedNode.data.config?.scheduleType === 'monthly' && (
              <>
                <div>
                  <Label>Day of Month</Label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={selectedNode.data.config?.monthDay || 1}
                    onChange={(e) => updateConfig('monthDay', parseInt(e.target.value))}
                    placeholder="1"
                  />
                </div>
                
                <div>
                  <Label>Time (24-hour format)</Label>
                  <Input
                    type="time"
                    value={selectedNode.data.config?.monthlyTime || '09:00'}
                    onChange={(e) => updateConfig('monthlyTime', e.target.value)}
                  />
                </div>
              </>
            )}
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="enabled"
                checked={localScheduleEnabled}
                onCheckedChange={(checked) => {
                  console.log('Schedule enabled checkbox changed:', checked);
                  setLocalScheduleEnabled(!!checked);
                  updateConfig('enabled', !!checked);
                }}
              />
              <Label htmlFor="enabled" className="text-sm cursor-pointer">
                Schedule enabled
              </Label>
            </div>
            
            {selectedNode.data.config?.scheduleType === 'interval' && (
              <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
                Next execution: Every {selectedNode.data.config?.intervalValue || 30} {selectedNode.data.config?.intervalUnit || 'minutes'}
              </div>
            )}
          </div>
        );
        
      case 'manual-trigger':
        return (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground p-3 bg-muted rounded">
              This workflow will be triggered manually. No additional configuration required.
            </div>
            
            <div>
              <Label>Trigger Button Text</Label>
              <Input
                value={localButtonText}
                onChange={(e) => {
                  console.log('🔧 Button text input changed:', e.target.value);
                  setLocalButtonText(e.target.value);
                  debouncedUpdateConfig('buttonText', e.target.value);
                }}
                placeholder="Start Workflow"
              />
            </div>
            
            <div>
              <Label>Description</Label>
              <Textarea
                value={localDescription}
                onChange={(e) => {
                  console.log('📝 Description textarea changed:', {
                    newValue: e.target.value,
                    currentValue: localDescription,
                    nodeId: selectedNode.id
                  });
                  setLocalDescription(e.target.value);
                  debouncedUpdateConfig('description', e.target.value);
                }}
                placeholder="Describe when this workflow should be triggered manually"
                rows={3}
                className="min-h-[80px] resize-none"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="confirmBeforeRun"
                checked={localConfirmBeforeRun}
                onCheckedChange={(checked) => {
                  console.log('Confirm before run checkbox changed:', checked);
                  setLocalConfirmBeforeRun(!!checked);
                  updateConfig('confirmBeforeRun', !!checked);
                }}
              />
              <Label htmlFor="confirmBeforeRun" className="text-sm cursor-pointer">
                Ask for confirmation before running
              </Label>
            </div>
            
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleExecuteManualTrigger}
              >
                Test Trigger
              </Button>
            </div>
          </div>
        );
        
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
            value={localNodeName}
            onChange={(e) => {
              console.log('🏷️ Node name changed:', e.target.value);
              setLocalNodeName(e.target.value);
              // Update label immediately since it's not in config
              updateLabel(e.target.value);
            }}
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
        
        {/* Trigger-specific action buttons */}
        {isTriggerNode && (
          <div className="pt-4 border-t border-border space-y-3">
            <h3 className="text-sm font-medium">Trigger Actions</h3>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={saveTriggerConfig}
                disabled={saving}
                className="flex-1"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Config'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={
                  selectedNode.data.config.nodeType === 'manual-trigger'
                    ? handleExecuteManualTrigger
                    : handleTestTrigger
                }
                disabled={testing || !selectedNode.data.triggerId}
                className="flex-1"
              >
                {selectedNode.data.config.nodeType === 'manual-trigger' ? (
                  <Play className="w-4 h-4 mr-2" />
                ) : (
                  <TestTube className="w-4 h-4 mr-2" />
                )}
                {testing ? 'Testing...' : (
                  selectedNode.data.config.nodeType === 'manual-trigger' ? 'Execute' : 'Test'
                )}
              </Button>
            </div>
            
            {selectedNode.data.config.nodeType === 'webhook-trigger' && selectedNode.data.config.webhookUrl && (
              <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
                <div className="font-medium mb-1">Webhook URL:</div>
                <div className="break-all">{selectedNode.data.config.webhookUrl}</div>
              </div>
            )}
            
            {!selectedNode.data.triggerId && (
              <div className="text-xs text-yellow-600 p-2 bg-yellow-50 rounded">
                Save configuration to activate trigger functionality
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NodeConfigPanel;
