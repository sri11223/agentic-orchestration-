/**
 * Centralized node type mapping between frontend and backend.
 * Single source of truth — used by WorkflowBuilder, useAutoSave, and any other place that converts.
 */

const frontendToBackendMap: Record<string, string> = {
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
  'manual-task': 'human_task',
};

const backendToFrontendMap: Record<string, string> = {};
for (const [fe, be] of Object.entries(frontendToBackendMap)) {
  if (!backendToFrontendMap[be]) {
    backendToFrontendMap[be] = fe;
  }
}

// More specific reverse map
const backendToFrontendDetailedMap: Record<string, string> = {
  'trigger': 'manual-trigger',
  'ai_processor': 'ai-text-generator',
  'action': 'http-request',
  'decision': 'condition',
  'human_task': 'approval-request',
  'form_builder': 'form-input',
  'email_automation': 'send-email',
  'timer': 'schedule-trigger',
  'file_operations': 'http-request',
  'data_transform': 'http-request',
  'push_notification': 'send-email',
};

/**
 * Convert a frontend node type (e.g. 'ai-text-generator') to a backend type (e.g. 'ai_processor')
 */
export function mapFrontendToBackendNodeType(frontendType: string): string {
  return frontendToBackendMap[frontendType] || 'trigger';
}

/**
 * Convert a backend node type (e.g. 'ai_processor') to the best frontend match
 */
export function mapBackendToFrontendNodeType(backendType: string): string {
  return backendToFrontendDetailedMap[backendType] || 'manual-trigger';
}

/**
 * Get the category for a given frontend node type
 */
export function getCategoryForNodeType(nodeType: string): string {
  if (nodeType.includes('trigger')) return 'trigger';
  if (nodeType.startsWith('ai-')) return 'ai';
  if (['http-request', 'database-query', 'send-email', 'slack-message'].includes(nodeType)) return 'action';
  if (['condition', 'switch', 'loop', 'merge'].includes(nodeType)) return 'logic';
  if (['approval-request', 'form-input', 'manual-task'].includes(nodeType)) return 'human';
  return 'trigger';
}
