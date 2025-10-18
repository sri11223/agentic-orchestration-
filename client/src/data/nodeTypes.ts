import {
  Play,
  Link,
  Clock,
  Mail,
  Sparkles,
  Brain,
  FileSearch,
  Search,
  Globe,
  Database,
  Send,
  MessageSquare,
  GitBranch,
  Repeat,
  GitMerge,
  UserCheck,
  FileText,
  Clipboard,
  LucideIcon,
} from 'lucide-react';

export interface NodeType {
  type: string;
  label: string;
  category: 'trigger' | 'ai' | 'action' | 'logic' | 'human';
  icon: LucideIcon;
  description: string;
  color: string;
}

export const nodeTypes: NodeType[] = [
  // Triggers
  {
    type: 'manual-trigger',
    label: 'Manual Trigger',
    category: 'trigger',
    icon: Play,
    description: 'Start workflow manually',
    color: 'trigger',
  },
  {
    type: 'webhook-trigger',
    label: 'Webhook Trigger',
    category: 'trigger',
    icon: Link,
    description: 'Trigger via HTTP webhook',
    color: 'trigger',
  },
  {
    type: 'schedule-trigger',
    label: 'Schedule Trigger',
    category: 'trigger',
    icon: Clock,
    description: 'Run on a schedule',
    color: 'trigger',
  },
  {
    type: 'email-trigger',
    label: 'Email Trigger',
    category: 'trigger',
    icon: Mail,
    description: 'Trigger on email received',
    color: 'trigger',
  },
  
  // AI Agents
  {
    type: 'ai-text-generator',
    label: 'AI Text Generator',
    category: 'ai',
    icon: Sparkles,
    description: 'Generate text using AI',
    color: 'ai',
  },
  {
    type: 'ai-decision-maker',
    label: 'AI Decision Maker',
    category: 'ai',
    icon: Brain,
    description: 'Make decisions with AI',
    color: 'ai',
  },
  {
    type: 'ai-data-extractor',
    label: 'AI Data Extractor',
    category: 'ai',
    icon: FileSearch,
    description: 'Extract data using AI',
    color: 'ai',
  },
  {
    type: 'ai-web-researcher',
    label: 'AI Web Researcher',
    category: 'ai',
    icon: Search,
    description: 'Research web with AI',
    color: 'ai',
  },
  
  // Actions
  {
    type: 'http-request',
    label: 'HTTP Request',
    category: 'action',
    icon: Globe,
    description: 'Make HTTP API calls',
    color: 'action',
  },
  {
    type: 'database-query',
    label: 'Database Query',
    category: 'action',
    icon: Database,
    description: 'Query database',
    color: 'action',
  },
  {
    type: 'send-email',
    label: 'Send Email',
    category: 'action',
    icon: Send,
    description: 'Send email message',
    color: 'action',
  },
  {
    type: 'slack-message',
    label: 'Slack Message',
    category: 'action',
    icon: MessageSquare,
    description: 'Send Slack message',
    color: 'action',
  },
  
  // Logic
  {
    type: 'condition',
    label: 'Condition (IF/ELSE)',
    category: 'logic',
    icon: GitBranch,
    description: 'Branch based on condition',
    color: 'logic',
  },
  {
    type: 'switch',
    label: 'Switch',
    category: 'logic',
    icon: GitBranch,
    description: 'Multiple branches',
    color: 'logic',
  },
  {
    type: 'loop',
    label: 'Loop',
    category: 'logic',
    icon: Repeat,
    description: 'Repeat actions',
    color: 'logic',
  },
  {
    type: 'merge',
    label: 'Merge',
    category: 'logic',
    icon: GitMerge,
    description: 'Combine branches',
    color: 'logic',
  },
  
  // Human
  {
    type: 'approval-request',
    label: 'Approval Request',
    category: 'human',
    icon: UserCheck,
    description: 'Request human approval',
    color: 'human',
  },
  {
    type: 'form-input',
    label: 'Form Input',
    category: 'human',
    icon: FileText,
    description: 'Collect form data',
    color: 'human',
  },
  {
    type: 'manual-task',
    label: 'Manual Task',
    category: 'human',
    icon: Clipboard,
    description: 'Assign manual task',
    color: 'human',
  },
];

export const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    trigger: 'trigger',
    ai: 'ai',
    action: 'action',
    logic: 'logic',
    human: 'human',
  };
  return colors[category] || 'primary';
};

export const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    trigger: 'Triggers',
    ai: 'AI Agents',
    action: 'Actions',
    logic: 'Logic',
    human: 'Human',
  };
  return labels[category] || category;
};
