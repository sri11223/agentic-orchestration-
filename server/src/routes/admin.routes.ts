import express from 'express';
import { securityOptimizationService } from '../services/security-optimization.service';
import { performanceMonitor } from '../services/performance-monitor.service';

const router = express.Router();

/**
 * @route GET /api/admin/security-config
 * @desc Get current security configuration
 * @access Private (Admin only)
 */
router.get('/security-config', (req, res) => {
  try {
    // Return sanitized security config (without sensitive data)
    const config = {
      rateLimiting: {
        windowMs: 15 * 60 * 1000,
        max: 100,
        enabled: true
      },
      cors: {
        enabled: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        credentials: true
      },
      helmet: {
        enabled: true,
        contentSecurityPolicy: process.env.NODE_ENV === 'production',
        hsts: true
      },
      compression: {
        enabled: true,
        level: 6,
        threshold: 1024
      }
    };

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve security configuration',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/admin/optimization-config
 * @desc Get current optimization configuration
 * @access Private (Admin only)
 */
router.get('/optimization-config', (req, res) => {
  try {
    const mongoOptions = securityOptimizationService.getMongoDBOptions();
    const redisOptions = securityOptimizationService.getRedisOptions();
    
    const config = {
      mongodb: {
        maxPoolSize: mongoOptions.maxPoolSize,
        minPoolSize: mongoOptions.minPoolSize,
        readPreference: mongoOptions.readPreference,
        retryWrites: mongoOptions.retryWrites
      },
      redis: {
        maxRetriesPerRequest: redisOptions.maxRetriesPerRequest,
        connectTimeout: redisOptions.connectTimeout,
        commandTimeout: redisOptions.commandTimeout,
        lazyConnect: redisOptions.lazyConnect
      },
      caching: {
        strategies: ['writeThrough', 'writeBehind', 'cacheAside', 'multiLevel'],
        defaultTTL: 3600
      }
    };

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve optimization configuration',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/admin/database-indexes
 * @desc Get recommended database indexes for optimization
 * @access Private (Admin only)
 */
router.get('/database-indexes', (req, res) => {
  try {
    const indexes = securityOptimizationService.getDatabaseIndexes();
    
    res.json({
      success: true,
      data: indexes,
      message: 'Recommended database indexes for optimal performance'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve database indexes',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/admin/production-optimizations
 * @desc Get production deployment optimizations
 * @access Private (Admin only)
 */
router.get('/production-optimizations', (req, res) => {
  try {
    const optimizations = securityOptimizationService.getProductionOptimizations();
    
    res.json({
      success: true,
      data: optimizations,
      message: 'Production deployment optimizations and best practices'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve production optimizations',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/admin/security-scan
 * @desc Perform a security vulnerability scan
 * @access Private (Admin only)
 */
router.post('/security-scan', async (req, res) => {
  try {
    const scanResults = await performSecurityScan();
    
    res.json({
      success: true,
      data: scanResults,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Security scan failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/admin/performance-optimization-suggestions
 * @desc Get AI-powered performance optimization suggestions
 * @access Private (Admin only)
 */
router.get('/performance-optimization-suggestions', (req, res) => {
  try {
    const metrics = performanceMonitor.getMetrics();
    const suggestions = generateOptimizationSuggestions(metrics);
    
    res.json({
      success: true,
      data: {
        currentMetrics: metrics,
        suggestions,
        implementationPriority: categorizeSuggestions(suggestions)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate optimization suggestions',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/admin/apply-optimization
 * @desc Apply a specific optimization configuration
 * @access Private (Admin only)
 */
router.post('/apply-optimization', (req, res) => {
  try {
    const { optimizationType, config } = req.body;
    
    if (!optimizationType || !config) {
      return res.status(400).json({
        success: false,
        message: 'Missing optimization type or configuration'
      });
    }

    const result = applyOptimization(optimizationType, config);
    
    res.json({
      success: true,
      data: result,
      message: `Optimization '${optimizationType}' applied successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to apply optimization',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/admin/system-diagnostics
 * @desc Run comprehensive system diagnostics
 * @access Private (Admin only)
 */
router.get('/system-diagnostics', async (req, res) => {
  try {
    const diagnostics = await runSystemDiagnostics();
    
    res.json({
      success: true,
      data: diagnostics,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'System diagnostics failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Perform security vulnerability scan
 */
async function performSecurityScan() {
  const vulnerabilities: any[] = [];
  const recommendations: string[] = [];

  // Check environment variables
  const criticalEnvVars = ['JWT_SECRET', 'MONGODB_URI', 'REDIS_URL'];
  for (const envVar of criticalEnvVars) {
    if (!process.env[envVar]) {
      vulnerabilities.push({
        type: 'MISSING_ENV_VAR',
        severity: 'HIGH',
        description: `Missing critical environment variable: ${envVar}`,
        impact: 'Application security and functionality may be compromised'
      });
    }
  }

  // Check Node.js version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
  if (majorVersion < 18) {
    vulnerabilities.push({
      type: 'OUTDATED_RUNTIME',
      severity: 'MEDIUM',
      description: `Node.js version ${nodeVersion} is outdated`,
      impact: 'Missing security patches and performance improvements'
    });
  }

  // Security recommendations
  if (process.env.NODE_ENV !== 'production') {
    recommendations.push('Set NODE_ENV=production for production deployments');
  }

  recommendations.push('Regularly update dependencies to patch security vulnerabilities');
  recommendations.push('Implement API request signing for critical operations');
  recommendations.push('Use HTTPS in production with proper SSL/TLS configuration');
  recommendations.push('Implement proper session management and token rotation');
  
  return {
    vulnerabilities,
    recommendations,
    score: Math.max(0, 100 - (vulnerabilities.length * 15)),
    lastScanDate: new Date()
  };
}

/**
 * Generate performance optimization suggestions
 */
function generateOptimizationSuggestions(metrics: any) {
  const suggestions: any[] = [];

  // Response time optimizations
  if (metrics.averageResponseTime > 1000) {
    suggestions.push({
      type: 'RESPONSE_TIME',
      priority: 'HIGH',
      title: 'Implement Response Caching',
      description: 'Average response time is above 1 second. Implement Redis caching for frequently accessed data.',
      expectedImprovement: '40-60% reduction in response time',
      implementation: {
        effort: 'Medium',
        timeframe: '1-2 days',
        steps: [
          'Identify cacheable endpoints',
          'Implement Redis caching layer',
          'Add cache invalidation strategies',
          'Monitor cache hit rates'
        ]
      }
    });
  }

  // Memory optimization
  const memoryUsage = (metrics.memoryUsage.heapUsed / metrics.memoryUsage.heapTotal) * 100;
  if (memoryUsage > 70) {
    suggestions.push({
      type: 'MEMORY_OPTIMIZATION',
      priority: 'HIGH',
      title: 'Optimize Memory Usage',
      description: `Memory usage at ${memoryUsage.toFixed(1)}%. Implement memory optimization strategies.`,
      expectedImprovement: '20-30% reduction in memory usage',
      implementation: {
        effort: 'High',
        timeframe: '3-5 days',
        steps: [
          'Profile memory usage patterns',
          'Implement object pooling',
          'Optimize data structures',
          'Add garbage collection tuning'
        ]
      }
    });
  }

  // Database optimization
  if (metrics.averageResponseTime > 500) {
    suggestions.push({
      type: 'DATABASE_OPTIMIZATION',
      priority: 'MEDIUM',
      title: 'Database Query Optimization',
      description: 'Slow response times may indicate database bottlenecks.',
      expectedImprovement: '30-50% faster query execution',
      implementation: {
        effort: 'Medium',
        timeframe: '2-3 days',
        steps: [
          'Analyze slow queries',
          'Add database indexes',
          'Implement query optimization',
          'Consider read replicas'
        ]
      }
    });
  }

  // Throughput optimization
  if (metrics.throughput < 50) {
    suggestions.push({
      type: 'THROUGHPUT_OPTIMIZATION',
      priority: 'MEDIUM',
      title: 'Increase Request Throughput',
      description: 'Low throughput detected. Consider implementing clustering or load balancing.',
      expectedImprovement: '2-4x increase in throughput',
      implementation: {
        effort: 'High',
        timeframe: '5-7 days',
        steps: [
          'Implement Node.js clustering',
          'Add load balancing',
          'Optimize request processing',
          'Consider horizontal scaling'
        ]
      }
    });
  }

  return suggestions;
}

/**
 * Categorize suggestions by implementation priority
 */
function categorizeSuggestions(suggestions: any[]) {
  return {
    immediate: suggestions.filter(s => s.priority === 'HIGH'),
    shortTerm: suggestions.filter(s => s.priority === 'MEDIUM'),
    longTerm: suggestions.filter(s => s.priority === 'LOW'),
    implementationOrder: suggestions
      .sort((a, b) => {
        const priorityOrder: { [key: string]: number } = { HIGH: 3, MEDIUM: 2, LOW: 1 };
        return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      })
      .map(s => s.type)
  };
}

/**
 * Apply optimization configuration
 */
function applyOptimization(type: string, config: any) {
  switch (type) {
    case 'SECURITY_CONFIG':
      securityOptimizationService.updateSecurityConfig(config);
      return { applied: true, message: 'Security configuration updated' };
      
    case 'OPTIMIZATION_CONFIG':
      securityOptimizationService.updateOptimizationConfig(config);
      return { applied: true, message: 'Optimization configuration updated' };
      
    case 'PERFORMANCE_THRESHOLDS':
      performanceMonitor.updateThresholds(config);
      return { applied: true, message: 'Performance thresholds updated' };
      
    default:
      throw new Error(`Unknown optimization type: ${type}`);
  }
}

/**
 * Run comprehensive system diagnostics
 */
async function runSystemDiagnostics() {
  const metrics = performanceMonitor.getMetrics();
  const healthStatus = performanceMonitor.getHealthStatus();
  
  const diagnostics = {
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    },
    performance: metrics,
    health: healthStatus,
    networking: {
      activeConnections: metrics.activeConnections,
      averageResponseTime: metrics.averageResponseTime,
      throughput: metrics.throughput
    },
    security: {
      environment: process.env.NODE_ENV || 'development',
      httpsEnabled: process.env.HTTPS_ENABLED === 'true',
      securityHeadersEnabled: true
    },
    recommendations: generateSystemRecommendations(metrics, healthStatus)
  };

  return diagnostics;
}

/**
 * Generate system-wide recommendations
 */
function generateSystemRecommendations(metrics: any, healthStatus: any) {
  const recommendations: string[] = [];

  if (healthStatus.status === 'critical') {
    recommendations.push('URGENT: Address critical system issues immediately');
  }

  if (process.uptime() > 30 * 24 * 60 * 60) { // 30 days
    recommendations.push('Consider restarting the application to clear memory leaks');
  }

  if (metrics.errorRate > 1) {
    recommendations.push('Investigate and fix sources of errors');
  }

  recommendations.push('Regularly update Node.js and dependencies');
  recommendations.push('Monitor disk space and log rotation');
  recommendations.push('Implement automated health checks');

  return recommendations;
}

export default router;