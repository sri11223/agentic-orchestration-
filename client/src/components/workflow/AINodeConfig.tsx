import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Brain, Zap, Globe, TestTube } from 'lucide-react';

interface AINodeConfigProps {
  nodeId: string;
  initialData?: any;
  onSave: (data: any) => void;
  onTest?: (data: any) => Promise<any>;
}

const AI_PROVIDERS = [
  { 
    value: 'gemini', 
    label: 'Google Gemini 2.5 Flash', 
    icon: '🧠', 
    speed: 'Fast', 
    cost: 'Free',
    models: ['gemini-2.5-flash']
  },
  { 
    value: 'groq', 
    label: 'Groq Llama 3.1', 
    icon: '⚡', 
    speed: 'Ultra Fast', 
    cost: 'Free',
    models: ['llama-3.1-8b-instant', 'llama-3.1-70b-instant']
  },
  { 
    value: 'huggingface', 
    label: 'HuggingFace Models', 
    icon: '🤗', 
    speed: 'Medium', 
    cost: 'Free',
    models: ['sentiment-analysis', 'summarization', 'question-answering']
  },
  { 
    value: 'qwen', 
    label: 'Qwen 2.5 72B (Multilingual)', 
    icon: '🌍', 
    speed: 'Fast', 
    cost: 'Free',
    models: ['qwen-2.5-72b-instruct']
  },
  { 
    value: 'glm4', 
    label: 'GLM-4.5-Air (Smart)', 
    icon: '🎯', 
    speed: 'Fast', 
    cost: 'Free',
    models: ['glm-4.5-air']
  },
  { 
    value: 'kimi', 
    label: 'Kimi Dev 72B (Long Context)', 
    icon: '📚', 
    speed: 'Medium', 
    cost: 'Free',
    models: ['kimi-dev-72b']
  }
];

const TASK_TYPES = [
  { value: 'auto', label: '🤖 Auto-Detect (Smart Routing)', description: 'Let AI choose the best provider' },
  { value: 'quick_decision', label: '⚡ Quick Decision', description: 'Fast yes/no, classification' },
  { value: 'real_time_chat', label: '💬 Real-time Chat', description: 'Interactive conversation' },
  { value: 'content_generation', label: '✍️ Content Generation', description: 'Articles, blogs, creative writing' },
  { value: 'text_analysis', label: '📊 Text Analysis', description: 'Sentiment, emotions, insights' },
  { value: 'data_extraction', label: '🔍 Data Extraction', description: 'Extract structured data' },
  { value: 'summarization', label: '📝 Summarization', description: 'Summarize long content' },
  { value: 'translation', label: '🌍 Translation', description: 'Multilingual translation' },
  { value: 'code_generation', label: '💻 Code Generation', description: 'Programming assistance' },
  { value: 'long_context', label: '📚 Long Context', description: 'Large document processing' }
];

export function AINodeConfig({ nodeId, initialData, onSave, onTest }: AINodeConfigProps) {
  const [config, setConfig] = useState({
    prompt: initialData?.prompt || '',
    taskType: initialData?.taskType || 'auto',
    aiProvider: initialData?.aiProvider || '', // Empty = smart routing
    model: initialData?.model || '',
    temperature: initialData?.temperature || 0.7,
    maxTokens: initialData?.maxTokens || 1000,
    parseJson: initialData?.parseJson || false,
    context: initialData?.context || '',
    ...initialData
  });

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const selectedProvider = AI_PROVIDERS.find(p => p.value === config.aiProvider);
  const isSmartRouting = !config.aiProvider;

  const handleSave = () => {
    const saveData = {
      ...config,
      temperature: config.temperature,
      maxTokens: config.maxTokens
    };
    
    console.log('🔧 AI Node Config - Saving configuration:', {
      nodeId,
      saveData
    });
    
    onSave(saveData);
    
    console.log('✅ AI Node Config - Save callback completed');
  };

  const handleTest = async () => {
    if (!onTest || !config.prompt.trim()) return;
    
    setTesting(true);
    try {
      const result = await onTest({
        ...config,
        temperature: config.temperature[0],
        maxTokens: config.maxTokens[0]
      });
      setTestResult(result);
    } catch (error) {
      setTestResult({ error: error.message });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Node Configuration
          </CardTitle>
          <CardDescription>
            Configure your AI processing node with smart provider routing
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Task Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Task Type</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={config.taskType} onValueChange={(value) => setConfig({...config, taskType: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Select task type" />
            </SelectTrigger>
            <SelectContent>
              {TASK_TYPES.map((task) => (
                <SelectItem key={task.value} value={task.value}>
                  <div>
                    <div className="font-medium">{task.label}</div>
                    <div className="text-sm text-muted-foreground">{task.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {config.taskType === 'auto' && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700 font-medium mb-1">
                <Brain className="h-4 w-4" />
                Smart AI Routing Enabled
              </div>
              <p className="text-sm text-blue-600">
                The system will automatically choose the best AI provider based on your prompt and task requirements.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Provider Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">AI Provider</CardTitle>
          <CardDescription>
            Leave empty for smart routing or select a specific provider
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <div 
              className={`p-3 border rounded-lg cursor-pointer transition-all ${
                isSmartRouting ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'
              }`}
              onClick={() => setConfig({...config, aiProvider: '', model: ''})}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-500" />
                  <span className="font-medium">Smart Routing</span>
                  <Badge variant="secondary">Recommended</Badge>
                </div>
                {isSmartRouting && <div className="text-purple-500">✓</div>}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Automatically selects the best AI provider for your task
              </p>
            </div>

            {AI_PROVIDERS.map((provider) => (
              <div 
                key={provider.value}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                  config.aiProvider === provider.value ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'
                }`}
                onClick={() => setConfig({...config, aiProvider: provider.value, model: provider.models[0]})}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{provider.icon}</span>
                    <span className="font-medium">{provider.label}</span>
                    <Badge variant="outline">{provider.speed}</Badge>
                    <Badge variant="secondary">{provider.cost}</Badge>
                  </div>
                  {config.aiProvider === provider.value && <div className="text-purple-500">✓</div>}
                </div>
              </div>
            ))}
          </div>

          {/* Model Selection for specific provider */}
          {selectedProvider && selectedProvider.models.length > 1 && (
            <div>
              <Label>Model</Label>
              <Select value={config.model} onValueChange={(value) => setConfig({...config, model: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {selectedProvider.models.map((model) => (
                    <SelectItem key={model} value={model}>{model}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Prompt Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Prompt Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Prompt Template</Label>
            <Textarea 
              placeholder="Enter your AI prompt here... Use {{variable}} for dynamic content"
              value={config.prompt}
              onChange={(e) => setConfig({...config, prompt: e.target.value})}
              rows={4}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Use variables like {`{{user_input}}, {{previous_output}}`} to make prompts dynamic
            </p>
          </div>

          <div>
            <Label>Additional Context (Optional)</Label>
            <Textarea 
              placeholder="Additional context or instructions for the AI..."
              value={config.context}
              onChange={(e) => setConfig({...config, context: e.target.value})}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Advanced Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Temperature: {config.temperature}</Label>
            <Input
              type="number"
              value={config.temperature}
              onChange={(e) => setConfig({...config, temperature: parseFloat(e.target.value) || 0.7})}
              min={0}
              max={2}
              step={0.1}
              className="mt-2"
            />
            <p className="text-sm text-muted-foreground">
              Lower = more focused, Higher = more creative
            </p>
          </div>

          <div>
            <Label>Max Tokens: {config.maxTokens}</Label>
            <Input
              type="number"
              value={config.maxTokens}
              onChange={(e) => setConfig({...config, maxTokens: parseInt(e.target.value) || 1000})}
              min={100}
              max={4000}
              step={100}
              className="mt-2"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={config.parseJson}
              onCheckedChange={(checked) => setConfig({...config, parseJson: checked})}
            />
            <Label>Parse response as JSON</Label>
          </div>
        </CardContent>
      </Card>

      {/* Test & Save Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Button onClick={handleSave} className="flex-1">
              <Sparkles className="h-4 w-4 mr-2" />
              Save Configuration
            </Button>
            {onTest && (
              <Button 
                variant="outline" 
                onClick={handleTest} 
                disabled={testing || !config.prompt.trim()}
              >
                <TestTube className="h-4 w-4 mr-2" />
                {testing ? 'Testing...' : 'Test AI'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Test Result</CardTitle>
          </CardHeader>
          <CardContent>
            {testResult.error ? (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700">
                <strong>Error:</strong> {testResult.error}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="p-3 bg-green-50 border border-green-200 rounded">
                  <div className="font-medium text-green-800">AI Response:</div>
                  <div className="text-green-700 mt-1">{testResult.response || testResult.text}</div>
                </div>
                {testResult.provider && (
                  <div className="flex gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline">Provider: {testResult.provider}</Badge>
                    {testResult.tokensUsed && <Badge variant="outline">Tokens: {testResult.tokensUsed}</Badge>}
                    {testResult.cost !== undefined && <Badge variant="outline">Cost: ${testResult.cost.toFixed(4)}</Badge>}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}