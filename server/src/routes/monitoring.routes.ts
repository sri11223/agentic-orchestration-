import express from 'express';
import { performanceMonitor, performanceMiddleware } from '../services/performance-monitor.service';
import { securityOptimizationService } from '../services/security-optimization.service';

const router = express.Router();

/**
 * @route GET /api/monitoring/metrics
 * @desc Get current performance metrics
 * @access Private (Admin only)
 */
router.get('/metrics', (req, res) => {
  try {
    const metrics = performanceMonitor.getMetrics();
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve metrics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/monitoring/health
 * @desc Get system health status
 * @access Public
 */
router.get('/health', (req, res) => {
  try {
    const healthStatus = performanceMonitor.getHealthStatus();
    const statusCode = healthStatus.status === 'critical' ? 503 : 
                      healthStatus.status === 'warning' ? 200 : 200;

    res.status(statusCode).json({
      success: true,
      data: {
        status: healthStatus.status,
        issues: healthStatus.issues,
        timestamp: new Date(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/monitoring/alerts
 * @desc Get performance alerts history
 * @access Private (Admin only)
 */
router.get('/alerts', (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const alerts = performanceMonitor.getAlerts(limit);
    
    res.json({
      success: true,
      data: alerts,
      count: alerts.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve alerts',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/monitoring/thresholds
 * @desc Update performance monitoring thresholds
 * @access Private (Admin only)
 */
router.post('/thresholds', (req, res) => {
  try {
    const { thresholds } = req.body;
    
    if (!thresholds || typeof thresholds !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid thresholds data'
      });
    }

    performanceMonitor.updateThresholds(thresholds);
    
    res.json({
      success: true,
      message: 'Thresholds updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update thresholds',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/monitoring/reset
 * @desc Reset performance metrics
 * @access Private (Admin only)
 */
router.post('/reset', (req, res) => {
  try {
    performanceMonitor.resetMetrics();
    
    res.json({
      success: true,
      message: 'Performance metrics reset successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to reset metrics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/monitoring/system
 * @desc Get detailed system information
 * @access Private (Admin only)
 */
router.get('/system', (req, res) => {
  try {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    const systemInfo = {
      node: {
        version: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: process.uptime(),
        pid: process.pid
      },
      memory: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024),
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
        arrayBuffers: Math.round(memoryUsage.arrayBuffers / 1024 / 1024)
      },
      cpu: {
        user: Math.round(cpuUsage.user / 1000),
        system: Math.round(cpuUsage.system / 1000)
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || 'development',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        locale: Intl.DateTimeFormat().resolvedOptions().locale
      }
    };

    res.json({
      success: true,
      data: systemInfo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve system information',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/monitoring/performance-report
 * @desc Generate comprehensive performance report
 * @access Private (Admin only)
 */
router.get('/performance-report', (req, res) => {
  try {
    const metrics = performanceMonitor.getMetrics();
    const alerts = performanceMonitor.getAlerts(20);
    const healthStatus = performanceMonitor.getHealthStatus();
    
    const report = {
      generatedAt: new Date(),
      summary: {
        status: healthStatus.status,
        uptime: process.uptime(),
        totalRequests: metrics.requestCount,
        averageResponseTime: metrics.averageResponseTime,
        errorRate: metrics.errorRate,
        throughput: metrics.throughput
      },
      performance: {
        responseTime: {
          average: metrics.averageResponseTime,
          min: metrics.minResponseTime,
          max: metrics.maxResponseTime,
          p95: metrics.p95ResponseTime,
          p99: metrics.p99ResponseTime
        },
        system: {
          memoryUsage: metrics.memoryUsage,
          cpuUsage: metrics.cpuUsage,
          activeConnections: metrics.activeConnections
        }
      },
      issues: healthStatus.issues,
      recentAlerts: alerts.slice(-10),
      recommendations: generateRecommendations(metrics, healthStatus)
    };

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate performance report',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Generate performance recommendations based on metrics
 */
function generateRecommendations(metrics: any, healthStatus: any): string[] {
  const recommendations: string[] = [];

  if (metrics.averageResponseTime > 2000) {
    recommendations.push('Consider implementing caching strategies to reduce response times');
    recommendations.push('Review database queries for optimization opportunities');
  }

  if (metrics.errorRate > 5) {
    recommendations.push('Investigate error patterns and implement better error handling');
    recommendations.push('Consider implementing circuit breaker patterns for external services');
  }

  const memoryUsagePercent = (metrics.memoryUsage.heapUsed / metrics.memoryUsage.heapTotal) * 100;
  if (memoryUsagePercent > 80) {
    recommendations.push('Monitor memory usage closely - consider increasing memory allocation');
    recommendations.push('Review for potential memory leaks in the application');
  }

  if (metrics.throughput < 10) {
    recommendations.push('Consider horizontal scaling to handle more concurrent requests');
    recommendations.push('Optimize application bottlenecks to improve throughput');
  }

  if (recommendations.length === 0) {
    recommendations.push('System is performing well - continue monitoring');
  }

  return recommendations;
}

export default router;