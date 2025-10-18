import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { EventBus } from '../engine/event-bus';
import { workflowEngine } from '../engine/workflow-engine';
import { URL } from 'url';

export interface SocketUser {
  id: string;
  email: string;
  role: string;
  socket: WebSocket;
}

export interface WebSocketMessage {
  type: string;
  data?: any;
  timestamp: Date;
}

export class WebSocketService {
  private wss: WebSocketServer;
  private eventBus: EventBus;
  private connectedUsers: Map<string, SocketUser> = new Map();
  private subscriptions: Map<string, Set<string>> = new Map(); // subscription -> userIds

  constructor(httpServer: HttpServer) {
    this.wss = new WebSocketServer({ 
      server: httpServer,
      path: '/api/ws'
    });

    this.eventBus = EventBus.getInstance();
    this.setupWebSocketHandlers();
    this.setupEventListeners();
  }

  /**
   * Setup WebSocket connection handlers
   */
  private setupWebSocketHandlers(): void {
    this.wss.on('connection', (ws: WebSocket, request) => {
      console.log('🔌 New WebSocket connection attempt');
      
      // Authenticate connection
      this.authenticateConnection(ws, request)
        .then((user) => {
          if (user) {
            this.handleConnection(ws, user);
          } else {
            ws.close(1008, 'Authentication failed');
          }
        })
        .catch((error) => {
          console.error('WebSocket authentication error:', error);
          ws.close(1008, 'Authentication error');
        });
    });
  }

  /**
   * Handle authenticated WebSocket connection
   */
  private handleConnection(ws: WebSocket, user: SocketUser): void {
    const userId = user.id;
    user.socket = ws;
    this.connectedUsers.set(userId, user);
    
    console.log(`🔌 User connected: ${user.email} (${userId})`);

    // Send connection confirmation
    this.sendMessage(ws, {
      type: 'connected',
      data: {
        message: 'Connected to workflow engine',
        userId,
        timestamp: new Date()
      },
      timestamp: new Date()
    });

    // Handle incoming messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString()) as WebSocketMessage;
        this.handleMessage(userId, message);
      } catch (error) {
        console.error('WebSocket message parse error:', error);
        this.sendMessage(ws, {
          type: 'error',
          data: { message: 'Invalid message format' },
          timestamp: new Date()
        });
      }
    });

    // Handle disconnection
    ws.on('close', () => {
      console.log(`🔌 User disconnected: ${user.email} (${userId})`);
      this.connectedUsers.delete(userId);
      this.removeUserFromAllSubscriptions(userId);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error(`WebSocket error for user ${user.email}:`, error);
    });
  }

  /**
   * Authenticate WebSocket connection
   */
  private async authenticateConnection(ws: WebSocket, request: any): Promise<SocketUser | null> {
    try {
      const url = new URL(request.url!, `http://${request.headers.host}`);
      const token = url.searchParams.get('token') || request.headers.authorization?.split(' ')[1];
      
      if (!token) {
        throw new Error('Authentication token required');
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      return {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role || 'user',
        socket: ws
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(userId: string, message: WebSocketMessage): void {
    const user = this.connectedUsers.get(userId);
    if (!user) return;

    switch (message.type) {
      case 'subscribe:workflow':
        this.handleWorkflowSubscription(userId, message.data);
        break;
        
      case 'subscribe:execution':
        this.handleExecutionSubscription(userId, message.data);
        break;
        
      case 'workflow:pause':
        this.handleWorkflowPause(userId, message.data);
        break;
        
      case 'workflow:resume':
        this.handleWorkflowResume(userId, message.data);
        break;
        
      case 'workflow:stop':
        this.handleWorkflowStop(userId, message.data);
        break;
        
      case 'workflow:edit':
        this.handleWorkflowEdit(userId, message.data);
        break;
        
      case 'human:approve':
        this.handleHumanApproval(userId, message.data);
        break;
        
      case 'human:reject':
        this.handleHumanRejection(userId, message.data);
        break;
        
      default:
        this.sendMessage(user.socket, {
          type: 'error',
          data: { message: `Unknown message type: ${message.type}` },
          timestamp: new Date()
        });
    }
  }

  /**
   * Setup event listeners for workflow engine events
   */
  private setupEventListeners(): void {
    // Execution events
    this.eventBus.on('execution:started', (data) => {
      this.broadcastToSubscribers(`workflow:${data.workflowId}`, 'execution:started', data);
    });

    this.eventBus.on('execution:completed', (data) => {
      this.broadcastToSubscribers(`workflow:${data.workflowId}`, 'execution:completed', data);
    });

    this.eventBus.on('execution:failed', (data) => {
      this.broadcastToSubscribers(`workflow:${data.workflowId}`, 'execution:failed', data);
    });

    // Node events
    this.eventBus.on('node:started', (data) => {
      this.broadcastToSubscribers(`execution:${data.executionId}`, 'node:started', data);
    });

    this.eventBus.on('node:completed', (data) => {
      this.broadcastToSubscribers(`execution:${data.executionId}`, 'node:completed', data);
    });

    this.eventBus.on('node:failed', (data) => {
      this.broadcastToSubscribers(`execution:${data.executionId}`, 'node:failed', data);
    });

    // Human approval events
    this.eventBus.on('human:approval_requested', (data) => {
      this.notifyUser(data.assignedTo, 'human:approval_requested', data);
    });

    // AI events
    this.eventBus.on('ai:request', (data) => {
      this.broadcastToSubscribers(`execution:${data.executionId}`, 'ai:request', data);
    });

    this.eventBus.on('ai:response', (data) => {
      this.broadcastToSubscribers(`execution:${data.executionId}`, 'ai:response', data);
    });
  }

  /**
   * Handle workflow subscription
   */
  private handleWorkflowSubscription(userId: string, data: { workflowId: string }): void {
    const { workflowId } = data;
    const subscriptionKey = `workflow:${workflowId}`;
    
    if (!this.subscriptions.has(subscriptionKey)) {
      this.subscriptions.set(subscriptionKey, new Set());
    }
    
    this.subscriptions.get(subscriptionKey)!.add(userId);
    
    const user = this.connectedUsers.get(userId);
    if (user) {
      this.sendMessage(user.socket, {
        type: 'subscribed',
        data: {
          type: 'workflow',
          workflowId,
          message: `Subscribed to workflow ${workflowId}`
        },
        timestamp: new Date()
      });
    }
  }

  /**
   * Handle execution subscription
   */
  private handleExecutionSubscription(userId: string, data: { executionId: string }): void {
    const { executionId } = data;
    const subscriptionKey = `execution:${executionId}`;
    
    if (!this.subscriptions.has(subscriptionKey)) {
      this.subscriptions.set(subscriptionKey, new Set());
    }
    
    this.subscriptions.get(subscriptionKey)!.add(userId);
    
    const user = this.connectedUsers.get(userId);
    if (user) {
      this.sendMessage(user.socket, {
        type: 'subscribed',
        data: {
          type: 'execution',
          executionId,
          message: `Subscribed to execution ${executionId}`
        },
        timestamp: new Date()
      });
    }
  }

  /**
   * Handle workflow pause request
   */
  private async handleWorkflowPause(userId: string, data: { executionId: string }): Promise<void> {
    const user = this.connectedUsers.get(userId);
    if (!user) return;

    try {
      const { executionId } = data;
      console.log(`⏸️ Pause request for execution ${executionId} from ${user.email}`);
      
      this.sendMessage(user.socket, {
        type: 'workflow:pause:response',
        data: {
          success: true,
          executionId,
          message: 'Workflow pause requested'
        },
        timestamp: new Date()
      });
    } catch (error) {
      this.sendMessage(user.socket, {
        type: 'workflow:pause:response',
        data: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        timestamp: new Date()
      });
    }
  }

  /**
   * Handle workflow resume request
   */
  private async handleWorkflowResume(userId: string, data: { executionId: string }): Promise<void> {
    const user = this.connectedUsers.get(userId);
    if (!user) return;

    try {
      const { executionId } = data;
      await workflowEngine.resumeWorkflow(executionId);
      
      this.sendMessage(user.socket, {
        type: 'workflow:resume:response',
        data: {
          success: true,
          executionId,
          message: 'Workflow resumed successfully'
        },
        timestamp: new Date()
      });
    } catch (error) {
      this.sendMessage(user.socket, {
        type: 'workflow:resume:response',
        data: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        timestamp: new Date()
      });
    }
  }

  /**
   * Handle workflow stop request
   */
  private async handleWorkflowStop(userId: string, data: { executionId: string }): Promise<void> {
    const user = this.connectedUsers.get(userId);
    if (!user) return;

    try {
      const { executionId } = data;
      console.log(`⏹️ Stop request for execution ${executionId} from ${user.email}`);
      
      this.sendMessage(user.socket, {
        type: 'workflow:stop:response',
        data: {
          success: true,
          executionId,
          message: 'Workflow stop requested'
        },
        timestamp: new Date()
      });
    } catch (error) {
      this.sendMessage(user.socket, {
        type: 'workflow:stop:response',
        data: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        timestamp: new Date()
      });
    }
  }

  /**
   * Handle real-time workflow editing
   */
  private handleWorkflowEdit(userId: string, data: any): void {
    const { workflowId, changes, version } = data;
    const user = this.connectedUsers.get(userId);
    
    if (user) {
      // Broadcast changes to other users subscribed to the same workflow
      this.broadcastToSubscribers(`workflow:${workflowId}`, 'workflow:changed', {
        workflowId,
        changes,
        version,
        changedBy: user.email,
        excludeUser: userId
      });
    }
  }

  /**
   * Handle human approval
   */
  private handleHumanApproval(userId: string, data: { taskId: string; decision: any }): void {
    const { taskId, decision } = data;
    const user = this.connectedUsers.get(userId);
    
    if (user) {
      this.eventBus.emit('human:approved', {
        taskId,
        decision,
        approvedBy: userId,
        timestamp: new Date()
      });

      this.sendMessage(user.socket, {
        type: 'human:approve:response',
        data: {
          success: true,
          taskId,
          message: 'Approval submitted successfully'
        },
        timestamp: new Date()
      });
    }
  }

  /**
   * Handle human rejection
   */
  private handleHumanRejection(userId: string, data: { taskId: string; reason?: string }): void {
    const { taskId, reason } = data;
    const user = this.connectedUsers.get(userId);
    
    if (user) {
      this.eventBus.emit('human:rejected', {
        taskId,
        reason,
        rejectedBy: userId,
        timestamp: new Date()
      });

      this.sendMessage(user.socket, {
        type: 'human:reject:response',
        data: {
          success: true,
          taskId,
          message: 'Rejection submitted successfully'
        },
        timestamp: new Date()
      });
    }
  }

  /**
   * Send message to a specific WebSocket
   */
  private sendMessage(ws: WebSocket, message: WebSocketMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Broadcast message to subscribers
   */
  private broadcastToSubscribers(subscriptionKey: string, type: string, data: any): void {
    const subscribers = this.subscriptions.get(subscriptionKey);
    if (!subscribers) return;

    const message: WebSocketMessage = {
      type,
      data,
      timestamp: new Date()
    };

    subscribers.forEach((userId) => {
      // Skip excluded user if specified
      if (data.excludeUser && data.excludeUser === userId) return;
      
      const user = this.connectedUsers.get(userId);
      if (user) {
        this.sendMessage(user.socket, message);
      }
    });
  }

  /**
   * Send notification to specific user
   */
  private notifyUser(userId: string, type: string, data: any): void {
    const user = this.connectedUsers.get(userId);
    if (user) {
      this.sendMessage(user.socket, {
        type,
        data,
        timestamp: new Date()
      });
    }
  }

  /**
   * Remove user from all subscriptions
   */
  private removeUserFromAllSubscriptions(userId: string): void {
    this.subscriptions.forEach((subscribers) => {
      subscribers.delete(userId);
    });
  }

  /**
   * Broadcast system-wide notification
   */
  public broadcastSystemNotification(message: string, type: 'info' | 'warning' | 'error' = 'info'): void {
    const broadcastMessage: WebSocketMessage = {
      type: 'system:notification',
      data: { message, type },
      timestamp: new Date()
    };

    this.connectedUsers.forEach((user) => {
      this.sendMessage(user.socket, broadcastMessage);
    });
  }

  /**
   * Get connected users count
   */
  public getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * Get connected users
   */
  public getConnectedUsers(): Omit<SocketUser, 'socket'>[] {
    return Array.from(this.connectedUsers.values()).map(({ socket, ...user }) => user);
  }
}

export let webSocketService: WebSocketService;

export function initializeWebSocket(httpServer: HttpServer): WebSocketService {
  webSocketService = new WebSocketService(httpServer);
  return webSocketService;
}