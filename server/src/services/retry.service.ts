export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
  retryCondition?: (error: any) => boolean;
}

export interface RetryAttempt {
  attempt: number;
  delay: number;
  error?: any;
  timestamp: Date;
}

export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: any;
  attempts: RetryAttempt[];
  totalDuration: number;
}

export class RetryService {
  private static readonly DEFAULT_CONFIG: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    jitter: true,
    retryCondition: (error: any) => {
      // Retry on network errors, timeouts, and 5xx status codes
      return error.code === 'ECONNRESET' ||
             error.code === 'ETIMEDOUT' ||
             error.code === 'ENOTFOUND' ||
             (error.response && error.response.status >= 500);
    }
  };

  /**
   * Execute operation with exponential backoff retry
   */
  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<RetryResult<T>> {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    const attempts: RetryAttempt[] = [];
    const startTime = Date.now();

    for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
      const attemptStart = Date.now();
      
      try {
        const result = await operation();
        
        attempts.push({
          attempt,
          delay: 0,
          timestamp: new Date()
        });

        return {
          success: true,
          result,
          attempts,
          totalDuration: Date.now() - startTime
        };
      } catch (error) {
        const attemptDelay = this.calculateDelay(attempt, finalConfig);
        
        attempts.push({
          attempt,
          delay: attemptDelay,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date()
        });

        // Check if we should retry this error
        if (!finalConfig.retryCondition || !finalConfig.retryCondition(error)) {
          return {
            success: false,
            error,
            attempts,
            totalDuration: Date.now() - startTime
          };
        }

        // If this was the last attempt, don't wait
        if (attempt === finalConfig.maxAttempts) {
          return {
            success: false,
            error,
            attempts,
            totalDuration: Date.now() - startTime
          };
        }

        // Wait before next attempt
        await this.delay(attemptDelay);
      }
    }

    // This should never be reached, but just in case
    return {
      success: false,
      error: new Error('Max retry attempts exceeded'),
      attempts,
      totalDuration: Date.now() - startTime
    };
  }

  /**
   * Calculate delay for exponential backoff with jitter
   */
  private static calculateDelay(attempt: number, config: RetryConfig): number {
    const exponentialDelay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
    const cappedDelay = Math.min(exponentialDelay, config.maxDelay);
    
    if (!config.jitter) {
      return cappedDelay;
    }
    
    // Add jitter (random variation ±25%)
    const jitterRange = cappedDelay * 0.25;
    const jitter = (Math.random() - 0.5) * 2 * jitterRange;
    
    return Math.max(0, cappedDelay + jitter);
  }

  /**
   * Simple delay utility
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retry with specific conditions for different error types
   */
  static createRetryCondition(options: {
    networkErrors?: boolean;
    timeoutErrors?: boolean;
    serverErrors?: boolean;
    customCodes?: string[];
    customStatuses?: number[];
  }) {
    return (error: any) => {
      if (options.networkErrors && (
        error.code === 'ECONNRESET' ||
        error.code === 'ENOTFOUND' ||
        error.code === 'ECONNREFUSED'
      )) {
        return true;
      }

      if (options.timeoutErrors && (
        error.code === 'ETIMEDOUT' ||
        error.message?.includes('timeout')
      )) {
        return true;
      }

      if (options.serverErrors && error.response?.status >= 500) {
        return true;
      }

      if (options.customCodes && options.customCodes.includes(error.code)) {
        return true;
      }

      if (options.customStatuses && options.customStatuses.includes(error.response?.status)) {
        return true;
      }

      return false;
    };
  }

  /**
   * Predefined retry configurations for common scenarios
   */
  static readonly CONFIGS = {
    AI_PROVIDER: {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      jitter: true,
      retryCondition: this.createRetryCondition({
        networkErrors: true,
        timeoutErrors: true,
        serverErrors: true,
        customStatuses: [429, 502, 503, 504]
      })
    },

    DATABASE: {
      maxAttempts: 3,
      baseDelay: 500,
      maxDelay: 5000,
      backoffMultiplier: 1.5,
      jitter: true,
      retryCondition: this.createRetryCondition({
        networkErrors: true,
        timeoutErrors: true
      })
    },

    EXTERNAL_API: {
      maxAttempts: 4,
      baseDelay: 2000,
      maxDelay: 15000,
      backoffMultiplier: 2,
      jitter: true,
      retryCondition: this.createRetryCondition({
        networkErrors: true,
        timeoutErrors: true,
        serverErrors: true,
        customStatuses: [429, 408]
      })
    },

    FILE_OPERATIONS: {
      maxAttempts: 2,
      baseDelay: 1500,
      maxDelay: 8000,
      backoffMultiplier: 2,
      jitter: false,
      retryCondition: this.createRetryCondition({
        networkErrors: true,
        timeoutErrors: true,
        customStatuses: [429, 502, 503]
      })
    },

    QUICK_RETRY: {
      maxAttempts: 2,
      baseDelay: 500,
      maxDelay: 2000,
      backoffMultiplier: 2,
      jitter: true,
      retryCondition: this.createRetryCondition({
        networkErrors: true,
        serverErrors: true
      })
    }
  };
}

/**
 * Decorator for automatic retry functionality
 */
export function Retry(config?: Partial<RetryConfig>) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = await RetryService.executeWithRetry(
        () => method.apply(this, args),
        config
      );

      if (result.success) {
        return result.result;
      } else {
        throw result.error;
      }
    };

    return descriptor;
  };
}

/**
 * Utility function for quick retry operations
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxAttempts = 3,
  baseDelay = 1000
): Promise<T> {
  const result = await RetryService.executeWithRetry(operation, {
    maxAttempts,
    baseDelay
  });

  if (result.success) {
    return result.result!;
  } else {
    throw result.error;
  }
}

/**
 * Create a retry wrapper function
 */
export function createRetryWrapper<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  config?: Partial<RetryConfig>
): T {
  return (async (...args: any[]) => {
    const result = await RetryService.executeWithRetry(
      () => fn(...args),
      config
    );

    if (result.success) {
      return result.result;
    } else {
      throw result.error;
    }
  }) as T;
}