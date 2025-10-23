import { useState, useEffect, useCallback } from 'react';
import { authService } from '../services/auth.service';

export interface TriggerConfig {
  _id?: string;
  type: 'email-trigger' | 'webhook-trigger' | 'schedule-trigger' | 'manual-trigger';
  workflowId: string;
  nodeId: string;
  enabled: boolean;
  config: any;
  metadata?: {
    createdAt: Date;
    updatedAt: Date;
    lastTriggered?: Date;
    triggerCount?: number;
    errors?: Array<{
      timestamp: Date;
      error: string;
      details?: string;
    }>;
  };
}

export interface TriggerExecution {
  _id: string;
  triggerId: string;
  workflowId: string;
  executionId: string;
  triggerType: string;
  triggerData: any;
  status: 'success' | 'failed' | 'pending';
  error?: string;
  duration?: number;
  triggeredAt: Date;
  completedAt?: Date;
}

export interface TriggerStats {
  triggerCount: number;
  lastTriggered?: Date;
  successRate: number;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageDuration: number;
  errors: Array<{
    timestamp: Date;
    error: string;
    details?: string;
  }>;
}

class TriggerService {
  private baseURL = 'http://localhost:5000/api';

  private async request(endpoint: string, options: RequestInit = {}) {
    const token = authService.getToken();
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async createTrigger(triggerConfig: Omit<TriggerConfig, '_id'>): Promise<TriggerConfig> {
    const response = await this.request('/triggers', {
      method: 'POST',
      body: JSON.stringify(triggerConfig),
    });
    return response.trigger;
  }

  async getWorkflowTriggers(workflowId: string): Promise<TriggerConfig[]> {
    const response = await this.request(`/triggers/workflow/${workflowId}`);
    return response.triggers;
  }

  async updateTrigger(triggerId: string, updates: Partial<TriggerConfig>): Promise<TriggerConfig> {
    const response = await this.request(`/triggers/${triggerId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return response.trigger;
  }

  async deleteTrigger(triggerId: string): Promise<void> {
    await this.request(`/triggers/${triggerId}`, {
      method: 'DELETE',
    });
  }

  async executeManualTrigger(triggerId: string, triggerData: any = {}): Promise<string> {
    const response = await this.request(`/triggers/${triggerId}/execute`, {
      method: 'POST',
      body: JSON.stringify({ triggerData }),
    });
    return response.executionId;
  }

  async testTrigger(triggerId: string): Promise<{ success: boolean; message: string; data?: any }> {
    const response = await this.request(`/triggers/${triggerId}/test`, {
      method: 'POST',
    });
    return response.result;
  }

  async getTriggerHistory(triggerId: string, limit: number = 50): Promise<TriggerExecution[]> {
    const response = await this.request(`/triggers/${triggerId}/history?limit=${limit}`);
    return response.history;
  }

  async getTriggerStats(triggerId: string): Promise<TriggerStats> {
    const response = await this.request(`/triggers/${triggerId}/stats`);
    return response.stats;
  }

  async toggleTrigger(triggerId: string, enabled: boolean): Promise<TriggerConfig> {
    const response = await this.request(`/triggers/${triggerId}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled }),
    });
    return response.trigger;
  }
}

export const triggerService = new TriggerService();

// Hook for managing triggers for a specific workflow
export const useTriggers = (workflowId: string) => {
  const [triggers, setTriggers] = useState<TriggerConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTriggers = useCallback(async () => {
    if (!workflowId) return;
    
    setLoading(true);
    setError(null);
    try {
      const fetchedTriggers = await triggerService.getWorkflowTriggers(workflowId);
      setTriggers(fetchedTriggers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch triggers');
    } finally {
      setLoading(false);
    }
  }, [workflowId]);

  const createTrigger = useCallback(async (triggerConfig: Omit<TriggerConfig, '_id'>) => {
    setError(null);
    try {
      const newTrigger = await triggerService.createTrigger(triggerConfig);
      setTriggers(prev => [...prev, newTrigger]);
      return newTrigger;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create trigger');
      throw err;
    }
  }, []);

  const updateTrigger = useCallback(async (triggerId: string, updates: Partial<TriggerConfig>) => {
    setError(null);
    try {
      const updatedTrigger = await triggerService.updateTrigger(triggerId, updates);
      setTriggers(prev => prev.map(t => t._id === triggerId ? updatedTrigger : t));
      return updatedTrigger;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update trigger');
      throw err;
    }
  }, []);

  const deleteTrigger = useCallback(async (triggerId: string) => {
    setError(null);
    try {
      await triggerService.deleteTrigger(triggerId);
      setTriggers(prev => prev.filter(t => t._id !== triggerId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete trigger');
      throw err;
    }
  }, []);

  const toggleTrigger = useCallback(async (triggerId: string, enabled: boolean) => {
    setError(null);
    try {
      const updatedTrigger = await triggerService.toggleTrigger(triggerId, enabled);
      setTriggers(prev => prev.map(t => t._id === triggerId ? updatedTrigger : t));
      return updatedTrigger;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle trigger');
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchTriggers();
  }, [fetchTriggers]);

  return {
    triggers,
    loading,
    error,
    refetch: fetchTriggers,
    createTrigger,
    updateTrigger,
    deleteTrigger,
    toggleTrigger
  };
};

// Hook for managing a single trigger
export const useTrigger = (triggerId: string | null) => {
  const [trigger, setTrigger] = useState<TriggerConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeManualTrigger = useCallback(async (triggerData: any = {}) => {
    if (!triggerId) throw new Error('No trigger ID provided');
    
    setError(null);
    try {
      const executionId = await triggerService.executeManualTrigger(triggerId, triggerData);
      return executionId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute trigger');
      throw err;
    }
  }, [triggerId]);

  const testTrigger = useCallback(async () => {
    if (!triggerId) throw new Error('No trigger ID provided');
    
    setError(null);
    try {
      const result = await triggerService.testTrigger(triggerId);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to test trigger');
      throw err;
    }
  }, [triggerId]);

  const updateTrigger = useCallback(async (updates: Partial<TriggerConfig>) => {
    if (!triggerId) throw new Error('No trigger ID provided');
    
    setError(null);
    try {
      const updatedTrigger = await triggerService.updateTrigger(triggerId, updates);
      setTrigger(updatedTrigger);
      return updatedTrigger;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update trigger');
      throw err;
    }
  }, [triggerId]);

  return {
    trigger,
    loading,
    error,
    executeManualTrigger,
    testTrigger,
    updateTrigger
  };
};

// Hook for trigger execution history
export const useTriggerHistory = (triggerId: string | null, limit: number = 50) => {
  const [history, setHistory] = useState<TriggerExecution[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!triggerId) return;
    
    setLoading(true);
    setError(null);
    try {
      const fetchedHistory = await triggerService.getTriggerHistory(triggerId, limit);
      setHistory(fetchedHistory);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch trigger history');
    } finally {
      setLoading(false);
    }
  }, [triggerId, limit]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    history,
    loading,
    error,
    refetch: fetchHistory
  };
};

// Hook for trigger statistics
export const useTriggerStats = (triggerId: string | null) => {
  const [stats, setStats] = useState<TriggerStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!triggerId) return;
    
    setLoading(true);
    setError(null);
    try {
      const fetchedStats = await triggerService.getTriggerStats(triggerId);
      setStats(fetchedStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch trigger stats');
    } finally {
      setLoading(false);
    }
  }, [triggerId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  };
};

// Hook for real-time trigger status updates
export const useTriggerRealtime = (workflowId: string) => {
  const [executions, setExecutions] = useState<TriggerExecution[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!workflowId) return;

    // In a real implementation, you would connect to WebSocket or SSE
    // For now, we'll simulate with periodic polling
    const interval = setInterval(async () => {
      try {
        // This would be replaced with real-time updates
        console.log('Checking for trigger updates...');
        setConnected(true);
      } catch (error) {
        console.error('Real-time connection error:', error);
        setConnected(false);
      }
    }, 30000); // Check every 30 seconds

    return () => {
      clearInterval(interval);
      setConnected(false);
    };
  }, [workflowId]);

  return {
    executions,
    connected
  };
};