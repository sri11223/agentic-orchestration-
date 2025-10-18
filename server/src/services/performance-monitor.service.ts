import { EventEmitter } from 'events';

export interface PerformanceMetrics {
  requestCount: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorRate: number;
  throughput: number; // requests per second
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  cpuUsage: {
    user: number;
    system: number;
  };
  activeConnections: number;
  timestamp: Date;
}

export interface PerformanceAlert {
  type: 'HIGH_RESPONSE_TIME' | 'HIGH_ERROR_RATE' | 'HIGH_MEMORY_USAGE' | 'HIGH_CPU_USAGE';
  severity: 'warning' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: Date;
}

export interface PerformanceThresholds {
  responseTime: {
    warning: number;
    critical: number;
  };
  errorRate: {
    warning: number;
    critical: number;
  };
  memoryUsage: {
    warning: number;
    critical: number;
  };
  cpuUsage: {
    warning: number;
    critical: number;
  };
}

export class PerformanceMonitor extends EventEmitter {
  private metrics: {
    requestCount: number;
    responseTimes: number[];
    errorCount: number;
    startTime: number;
    activeRequests: number;
  } = {
    requestCount: 0,
    responseTimes: [],
    errorCount: 0,
    startTime: Date.now(),
    activeRequests: 0
  };

  private thresholds: PerformanceThresholds = {
    responseTime: {
      warning: 1000,
      critical: 5000
    },
    errorRate: {
      warning: 5,
      critical: 15
    },
    memoryUsage: {
      warning: 80,
      critical: 95
    },
    cpuUsage: {
      warning: 70,
      critical: 90
    }
  };

  private alertHistory: PerformanceAlert[] = [];
  private monitoringInterval?: NodeJS.Timeout;

  constructor(private intervalMs: number = 60000) {
    super();
    this.startMonitoring();
  }

  /**
   * Record a request start
   */
  recordRequestStart(): string {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.metrics.activeRequests++;
    return requestId;
  }

  /**
   * Record a request completion
   */
  recordRequestComplete(requestId: string, responseTime: number, isError = false): void {
    this.metrics.requestCount++;
    this.metrics.responseTimes.push(responseTime);
    this.metrics.activeRequests = Math.max(0, this.metrics.activeRequests - 1);

    if (isError) {
      this.metrics.errorCount++;
    }

    // Keep only recent response times (last 1000 requests)
    if (this.metrics.responseTimes.length > 1000) {
      this.metrics.responseTimes = this.metrics.responseTimes.slice(-500);
    }

    // Check for immediate alerts
    this.checkResponseTimeAlert(responseTime);
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    const now = Date.now();
    const uptime = (now - this.metrics.startTime) / 1000;
    const throughput = this.metrics.requestCount / uptime;
    const errorRate = this.metrics.requestCount > 0 
      ? (this.metrics.errorCount / this.metrics.requestCount) * 100 
      : 0;

    const sortedResponseTimes = [...this.metrics.responseTimes].sort((a, b) => a - b);
    const averageResponseTime = sortedResponseTimes.length > 0
      ? sortedResponseTimes.reduce((sum, time) => sum + time, 0) / sortedResponseTimes.length
      : 0;

    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      requestCount: this.metrics.requestCount,
      averageResponseTime,
      minResponseTime: sortedResponseTimes[0] || 0,
      maxResponseTime: sortedResponseTimes[sortedResponseTimes.length - 1] || 0,
      p95ResponseTime: this.calculatePercentile(sortedResponseTimes, 95),
      p99ResponseTime: this.calculatePercentile(sortedResponseTimes, 99),
      errorRate,
      throughput,
      memoryUsage: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024),
        rss: Math.round(memoryUsage.rss / 1024 / 1024)
      },
      cpuUsage: {
        user: Math.round(cpuUsage.user / 1000),
        system: Math.round(cpuUsage.system / 1000)
      },
      activeConnections: this.metrics.activeRequests,
      timestamp: new Date()
    };
  }

  /**
   * Get performance alerts history
   */
  getAlerts(limit = 50): PerformanceAlert[] {
    return this.alertHistory.slice(-limit);
  }

  /**
   * Update performance thresholds
   */
  updateThresholds(newThresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      requestCount: 0,
      responseTimes: [],
      errorCount: 0,
      startTime: Date.now(),
      activeRequests: 0
    };
    this.alertHistory = [];
  }

  /**
   * Start continuous monitoring
   */
  private startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      const metrics = this.getMetrics();
      
      // Check all thresholds
      this.checkAllThresholds(metrics);
      
      // Emit metrics event
      this.emit('metrics', metrics);
      
      // Clean up old response times periodically
      if (this.metrics.responseTimes.length > 2000) {
        this.metrics.responseTimes = this.metrics.responseTimes.slice(-1000);
      }
    }, this.intervalMs);
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
  }

  /**
   * Calculate percentile value
   */
  private calculatePercentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0;
    
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, index)] || 0;
  }

  /**
   * Check response time alerts
   */
  private checkResponseTimeAlert(responseTime: number): void {
    if (responseTime >= this.thresholds.responseTime.critical) {
      this.createAlert('HIGH_RESPONSE_TIME', 'critical', 
        `Critical response time detected: ${responseTime}ms`, 
        responseTime, this.thresholds.responseTime.critical);
    } else if (responseTime >= this.thresholds.responseTime.warning) {
      this.createAlert('HIGH_RESPONSE_TIME', 'warning', 
        `High response time detected: ${responseTime}ms`, 
        responseTime, this.thresholds.responseTime.warning);
    }
  }

  /**
   * Check all performance thresholds
   */
  private checkAllThresholds(metrics: PerformanceMetrics): void {
    // Error rate check
    if (metrics.errorRate >= this.thresholds.errorRate.critical) {
      this.createAlert('HIGH_ERROR_RATE', 'critical', 
        `Critical error rate: ${metrics.errorRate.toFixed(2)}%`, 
        metrics.errorRate, this.thresholds.errorRate.critical);
    } else if (metrics.errorRate >= this.thresholds.errorRate.warning) {
      this.createAlert('HIGH_ERROR_RATE', 'warning', 
        `High error rate: ${metrics.errorRate.toFixed(2)}%`, 
        metrics.errorRate, this.thresholds.errorRate.warning);
    }

    // Memory usage check
    const memoryUsagePercent = (metrics.memoryUsage.heapUsed / metrics.memoryUsage.heapTotal) * 100;
    if (memoryUsagePercent >= this.thresholds.memoryUsage.critical) {
      this.createAlert('HIGH_MEMORY_USAGE', 'critical', 
        `Critical memory usage: ${memoryUsagePercent.toFixed(2)}%`, 
        memoryUsagePercent, this.thresholds.memoryUsage.critical);
    } else if (memoryUsagePercent >= this.thresholds.memoryUsage.warning) {
      this.createAlert('HIGH_MEMORY_USAGE', 'warning', 
        `High memory usage: ${memoryUsagePercent.toFixed(2)}%`, 
        memoryUsagePercent, this.thresholds.memoryUsage.warning);
    }
  }

  /**
   * Create and emit performance alert
   */
  private createAlert(
    type: PerformanceAlert['type'], 
    severity: PerformanceAlert['severity'],
    message: string,
    value: number,
    threshold: number
  ): void {
    const alert: PerformanceAlert = {
      type,
      severity,
      message,
      value,
      threshold,
      timestamp: new Date()
    };

    this.alertHistory.push(alert);
    
    // Keep only recent alerts (last 100)
    if (this.alertHistory.length > 100) {
      this.alertHistory = this.alertHistory.slice(-50);
    }

    this.emit('alert', alert);
    
    // Log critical alerts
    if (severity === 'critical') {
      console.error(`🚨 CRITICAL PERFORMANCE ALERT: ${message}`);
    } else {
      console.warn(`⚠️ PERFORMANCE WARNING: ${message}`);
    }
  }

  /**
   * Get system health status
   */
  getHealthStatus(): { status: 'healthy' | 'warning' | 'critical', issues: string[] } {
    const metrics = this.getMetrics();
    const issues: string[] = [];
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    // Check response time
    if (metrics.averageResponseTime >= this.thresholds.responseTime.critical) {
      issues.push(`Critical response time: ${metrics.averageResponseTime.toFixed(2)}ms`);
      status = 'critical';
    } else if (metrics.averageResponseTime >= this.thresholds.responseTime.warning) {
      issues.push(`High response time: ${metrics.averageResponseTime.toFixed(2)}ms`);
      status = 'warning';
    }

    // Check error rate
    if (metrics.errorRate >= this.thresholds.errorRate.critical) {
      issues.push(`Critical error rate: ${metrics.errorRate.toFixed(2)}%`);
      status = 'critical';
    } else if (metrics.errorRate >= this.thresholds.errorRate.warning) {
      issues.push(`High error rate: ${metrics.errorRate.toFixed(2)}%`);
      status = status === 'critical' ? 'critical' : 'warning';
    }

    // Check memory usage
    const memoryUsagePercent = (metrics.memoryUsage.heapUsed / metrics.memoryUsage.heapTotal) * 100;
    if (memoryUsagePercent >= this.thresholds.memoryUsage.critical) {
      issues.push(`Critical memory usage: ${memoryUsagePercent.toFixed(2)}%`);
      status = 'critical';
    } else if (memoryUsagePercent >= this.thresholds.memoryUsage.warning) {
      issues.push(`High memory usage: ${memoryUsagePercent.toFixed(2)}%`);
      status = status === 'critical' ? 'critical' : 'warning';
    }

    return { status, issues };
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Express middleware for automatic performance tracking
export function performanceMiddleware() {
  return (req: any, res: any, next: any) => {
    const startTime = Date.now();
    const requestId = performanceMonitor.recordRequestStart();

    // Override res.end to capture response time
    const originalEnd = res.end;
    res.end = function(...args: any[]) {
      const responseTime = Date.now() - startTime;
      const isError = res.statusCode >= 400;
      
      performanceMonitor.recordRequestComplete(requestId, responseTime, isError);
      
      originalEnd.apply(res, args);
    };

    next();
  };
}