import { Workflow } from '@/store/workflowStore';

export const demoWorkflow: Workflow = {
  id: 'demo-workflow-1',
  name: 'Customer Support Automation',
  description: 'Automatically handle customer support emails with AI',
  status: 'active',
  lastModified: new Date(),
  executionCount: 42,
  nodes: [
    {
      id: 'node-1',
      type: 'custom',
      position: { x: 100, y: 200 },
      data: {
        label: 'Email Received',
        category: 'trigger',
        config: {
          nodeType: 'email-trigger',
        },
      },
    },
    {
      id: 'node-2',
      type: 'custom',
      position: { x: 350, y: 200 },
      data: {
        label: 'Extract Email Data',
        category: 'ai',
        config: {
          nodeType: 'ai-data-extractor',
          model: 'gemini-2.5-flash',
          prompt: 'Extract customer name, issue urgency (high/low), and problem description',
        },
      },
    },
    {
      id: 'node-3',
      type: 'custom',
      position: { x: 650, y: 200 },
      data: {
        label: 'Check Urgency',
        category: 'logic',
        config: {
          nodeType: 'condition',
          condition: '{{urgency}} = high',
        },
      },
    },
    {
      id: 'node-4',
      type: 'custom',
      position: { x: 900, y: 100 },
      data: {
        label: 'Request Human Approval',
        category: 'human',
        config: {
          nodeType: 'approval-request',
          approvers: ['support@company.com'],
          channels: ['email', 'slack'],
          timeout: 3600,
        },
      },
    },
    {
      id: 'node-5',
      type: 'custom',
      position: { x: 900, y: 300 },
      data: {
        label: 'Generate AI Response',
        category: 'ai',
        config: {
          nodeType: 'ai-text-generator',
          model: 'gemini-2.5-flash',
          systemPrompt: 'You are a helpful customer support agent',
          userPrompt: 'Generate response for: {{problem}}',
        },
      },
    },
    {
      id: 'node-6',
      type: 'custom',
      position: { x: 1200, y: 200 },
      data: {
        label: 'Send Email Reply',
        category: 'action',
        config: {
          nodeType: 'send-email',
          to: '{{customer_email}}',
          subject: 'Re: {{original_subject}}',
        },
      },
    },
  ],
  edges: [
    { id: 'e1-2', source: 'node-1', target: 'node-2', animated: true },
    { id: 'e2-3', source: 'node-2', target: 'node-3', animated: true },
    { id: 'e3-4', source: 'node-3', target: 'node-4', label: 'High', animated: true },
    { id: 'e3-5', source: 'node-3', target: 'node-5', label: 'Low', animated: true },
    { id: 'e4-6', source: 'node-4', target: 'node-6', animated: true },
    { id: 'e5-6', source: 'node-5', target: 'node-6', animated: true },
  ],
};
