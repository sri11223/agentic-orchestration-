import http from 'http';
import app from './app';
import { connectDatabase } from './database/connection';
import { initializeWebSocket } from './services/websocket.service';
import { performanceMonitor } from './services/performance-monitor.service';

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Connect to database
    console.log('🔌 Connecting to database...');
    await connectDatabase();
    
    // Create HTTP server
    const httpServer = http.createServer(app);
    
    // Initialize WebSocket service
    console.log('🔌 Initializing WebSocket service...');
    initializeWebSocket(httpServer);
    
    // Setup performance monitoring alerts
    performanceMonitor.on('alert', (alert) => {
      console.warn(`🚨 Performance Alert: ${alert.message}`);
    });
    
    // Start server
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`📈 Monitoring: http://localhost:${PORT}/api/monitoring/metrics`);
      console.log(`🔧 Admin panel: http://localhost:${PORT}/api/admin`);
      console.log(`🔗 WebSocket: ws://localhost:${PORT}/api/ws`);
      console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
    
    // Graceful shutdown handling
    process.on('SIGTERM', () => {
      console.log('🛑 SIGTERM received, shutting down gracefully...');
      performanceMonitor.stop();
      httpServer.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });
    
    process.on('SIGINT', () => {
      console.log('🛑 SIGINT received, shutting down gracefully...');
      performanceMonitor.stop();
      httpServer.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();