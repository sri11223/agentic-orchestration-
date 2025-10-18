import { EventEmitter } from 'events';

export interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeout: number;
  resetTimeout: number;
  monitorWindow: number;
}

export enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

export interface CircuitBreakerMetrics {
  totalRequests: number;
  failedRequests: number;
  successfulRequests: number;
  failureRate: number;
  averageResponseTime: number;
  state: CircuitBreakerState;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
}

export class CircuitBreaker extends EventEmitter {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private totalRequests = 0;
  private lastFailureTime?: Date;
  private lastSuccessTime?: Date;
  private nextAttempt = 0;
  private responseTimes: number[] = [];
  
  constructor(
    private config: CircuitBreakerConfig,
    private name: string = 'default'
  ) {
    super();
    this.setupMonitoring();
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitBreakerState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        throw new Error(`Circuit breaker ${this.name} is OPEN. Next attempt at ${new Date(this.nextAttempt)}`);
      }
      this.state = CircuitBreakerState.HALF_OPEN;
      this.emit('stateChange', { name: this.name, state: this.state });
    }

    const startTime = Date.now();
    this.totalRequests++;

    try {
      const result = await Promise.race([
        operation(),
        this.createTimeoutPromise()
      ]);

      this.onSuccess(Date.now() - startTime);
      return result as T;
    } catch (error) {
      this.onFailure(Date.now() - startTime);
      throw error;
    }
  }

  private createTimeoutPromise<T>(): Promise<T> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Operation timeout after ${this.config.timeout}ms`));
      }, this.config.timeout);
    });
  }

  private onSuccess(responseTime: number): void {
    this.successCount++;
    this.lastSuccessTime = new Date();
    this.addResponseTime(responseTime);

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      if (this.successCount >= this.config.successThreshold) {
        this.state = CircuitBreakerState.CLOSED;
        this.failureCount = 0;
        this.emit('stateChange', { name: this.name, state: this.state });
        this.emit('circuitClosed', { name: this.name });
      }
    }
  }

  private onFailure(responseTime: number): void {
    this.failureCount++;
    this.lastFailureTime = new Date();
    this.addResponseTime(responseTime);

    if (this.state === CircuitBreakerState.CLOSED || this.state === CircuitBreakerState.HALF_OPEN) {
      if (this.failureCount >= this.config.failureThreshold) {
        this.state = CircuitBreakerState.OPEN;
        this.nextAttempt = Date.now() + this.config.resetTimeout;
        this.emit('stateChange', { name: this.name, state: this.state });
        this.emit('circuitOpened', { name: this.name, failureCount: this.failureCount });
      }
    }
  }

  private addResponseTime(time: number): void {
    this.responseTimes.push(time);
    // Keep only recent response times for average calculation
    if (this.responseTimes.length > 100) {
      this.responseTimes = this.responseTimes.slice(-50);
    }
  }

  private setupMonitoring(): void {
    setInterval(() => {
      const metrics = this.getMetrics();
      this.emit('metrics', { name: this.name, metrics });
      
      // Reset counters for the next window
      if (Date.now() % this.config.monitorWindow === 0) {
        this.resetWindowCounters();
      }
    }, 1000);
  }

  private resetWindowCounters(): void {
    this.totalRequests = 0;
    this.failureCount = 0;
    this.successCount = 0;
    this.responseTimes = [];
  }

  getMetrics(): CircuitBreakerMetrics {
    const failureRate = this.totalRequests > 0 ? (this.failureCount / this.totalRequests) * 100 : 0;
    const averageResponseTime = this.responseTimes.length > 0 
      ? this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length 
      : 0;

    return {
      totalRequests: this.totalRequests,
      failedRequests: this.failureCount,
      successfulRequests: this.successCount,
      failureRate,
      averageResponseTime,
      state: this.state,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime
    };
  }

  reset(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.totalRequests = 0;
    this.responseTimes = [];
    this.nextAttempt = 0;
    this.emit('stateChange', { name: this.name, state: this.state });
    this.emit('circuitReset', { name: this.name });
  }

  isOpen(): boolean {
    return this.state === CircuitBreakerState.OPEN;
  }

  isClosed(): boolean {
    return this.state === CircuitBreakerState.CLOSED;
  }

  isHalfOpen(): boolean {
    return this.state === CircuitBreakerState.HALF_OPEN;
  }
}

export class CircuitBreakerManager {
  private circuitBreakers = new Map<string, CircuitBreaker>();

  createCircuitBreaker(name: string, config: CircuitBreakerConfig): CircuitBreaker {
    const circuitBreaker = new CircuitBreaker(config, name);
    this.circuitBreakers.set(name, circuitBreaker);
    
    // Log important events
    circuitBreaker.on('circuitOpened', (data) => {
      console.warn(`🔴 Circuit breaker ${data.name} OPENED after ${data.failureCount} failures`);
    });

    circuitBreaker.on('circuitClosed', (data) => {
      console.log(`🟢 Circuit breaker ${data.name} CLOSED - service recovered`);
    });

    circuitBreaker.on('stateChange', (data) => {
      console.log(`🔄 Circuit breaker ${data.name} state changed to ${data.state}`);
    });

    return circuitBreaker;
  }

  getCircuitBreaker(name: string): CircuitBreaker | undefined {
    return this.circuitBreakers.get(name);
  }

  getAllMetrics(): Record<string, CircuitBreakerMetrics> {
    const metrics: Record<string, CircuitBreakerMetrics> = {};
    for (const [name, cb] of this.circuitBreakers) {
      metrics[name] = cb.getMetrics();
    }
    return metrics;
  }

  resetAll(): void {
    for (const cb of this.circuitBreakers.values()) {
      cb.reset();
    }
  }
}

// Global circuit breaker manager instance
export const circuitBreakerManager = new CircuitBreakerManager();

// Pre-configured circuit breakers for common services
export const createAIProviderCircuitBreaker = (provider: string) => {
  return circuitBreakerManager.createCircuitBreaker(`ai-${provider}`, {
    failureThreshold: 3,
    successThreshold: 2,
    timeout: 10000,
    resetTimeout: 30000,
    monitorWindow: 60000
  });
};

export const createDatabaseCircuitBreaker = () => {
  return circuitBreakerManager.createCircuitBreaker('database', {
    failureThreshold: 5,
    successThreshold: 3,
    timeout: 5000,
    resetTimeout: 60000,
    monitorWindow: 30000
  });
};

export const createExternalAPICircuitBreaker = (serviceName: string) => {
  return circuitBreakerManager.createCircuitBreaker(`external-${serviceName}`, {
    failureThreshold: 3,
    successThreshold: 2,
    timeout: 15000,
    resetTimeout: 45000,
    monitorWindow: 60000
  });
};