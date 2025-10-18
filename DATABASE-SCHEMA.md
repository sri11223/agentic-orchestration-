# 🗄️ Agentic Orchestration Platform - Database Schema

## Overview

Your platform uses **MongoDB Atlas** with **5 core collections** designed for high-performance workflow orchestration. Each collection serves specific purposes in the agentic workflow ecosystem.

---

## 📋 **1. Users Collection (`users`)**

### Purpose:
- **Authentication & Authorization** - User accounts, roles, permissions
- **API Key Management** - Multiple API keys per user for integrations
- **User Preferences** - Themes, notifications, timezone settings

### Schema Structure:
```typescript
{
  _id: ObjectId,
  username: String (unique),           // ⚠️ WARNING: Duplicate index here
  email: String (unique),              // ⚠️ WARNING: Duplicate index here
  password: String (hashed),
  firstName: String,
  lastName: String,
  role: 'admin' | 'user' | 'viewer',
  isActive: Boolean,
  lastLogin: Date,
  refreshTokens: [String],             // JWT refresh tokens
  preferences: {
    theme: 'light' | 'dark',
    notifications: {
      email: Boolean,
      push: Boolean,
      workflowUpdates: Boolean,
      executionAlerts: Boolean
    },
    timezone: String
  },
  apiKeys: [{                          // ⚠️ WARNING: Duplicate index on key
    name: String,
    key: String (unique),
    isActive: Boolean,
    createdAt: Date,
    lastUsed: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### Optimizations:
- **Compound Indexes** for fast user lookups
- **Hashed Passwords** with bcrypt for security
- **API Key Management** for integrations
- **Role-based Access Control** for enterprise security

---

## 🔄 **2. Workflows Collection (`workflows`)**

### Purpose:
- **Workflow Definitions** - Store workflow templates and configurations
- **Version Control** - Track workflow versions and changes
- **Performance Analytics** - Success rates, execution times, optimization data

### Schema Structure:
```typescript
{
  _id: ObjectId,
  name: String,                        // ⚠️ WARNING: Duplicate index here
  description: String,
  version: Number,
  nodes: [{                            // Workflow nodes (AI, Human, Decision, etc.)
    id: String,
    type: 'ai' | 'human' | 'decision' | 'action' | 'timer',
    position: { x: Number, y: Number },
    data: {
      title: String,
      prompt: String,                  // For AI nodes
      provider: String,                // gemini, groq, perplexity
      approvers: [String],             // For human approval nodes
      conditions: [Object],            // For decision nodes
      // ... node-specific configuration
    }
  }],
  edges: [{                            // Workflow connections
    id: String,
    source: String,                    // Source node ID
    target: String,                    // Target node ID
    condition: String                  // Conditional routing
  }],
  status: 'draft' | 'active' | 'archived',
  metadata: {
    creator: String,
    lastEditor: String,
    tags: [String],                    // ⚠️ WARNING: Duplicate index here
    category: String,
    aiProviders: [String],
    estimatedDuration: Number,         // In minutes
    avgExecutionTime: Number,          // Performance tracking
    successRate: Number                // Success rate percentage
  },
  settings: {
    timeout: Number,                   // Execution timeout
    maxRetries: Number,                // Retry attempts
    concurrency: Number,               // Parallel execution limit
    notifyOnFailure: Boolean,
    notifyOnSuccess: Boolean,
    notificationChannels: [String]
  },
  permissions: {
    owners: [String],                  // User IDs with full access
    editors: [String],                 // User IDs with edit access
    viewers: [String],                 // User IDs with view access
    isPublic: Boolean
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Optimizations:
- **Embedded Node Data** for fast retrieval
- **Performance Tracking** for optimization
- **Permission System** for enterprise collaboration
- **Version Control** for workflow management

---

## ⚡ **3. Workflow Executions Collection (`workflow_executions`)**

### Purpose:
- **Runtime State Management** - Track running workflow instances
- **Execution History** - Complete audit trail of all executions
- **Performance Monitoring** - Real-time execution metrics

### Schema Structure:
```typescript
{
  _id: ObjectId,
  workflowId: ObjectId,                // Reference to workflow
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed',
  currentNodeId: String,               // Currently executing node
  data: {                              // Runtime variables and context
    input: Object,                     // Initial input data
    variables: Object,                 // Dynamic variables
    aiResponses: [Object],             // AI provider responses
    humanApprovals: [Object],          // Human approval records
    // ... execution context
  },
  executionHistory: [{                 // Step-by-step execution log
    nodeId: String,
    timestamp: Date,
    input: Object,
    output: Object,
    duration: Number,                  // Execution time in ms
    status: 'success' | 'error' | 'skipped',
    error: String                      // Error message if failed
  }],
  startedAt: Date,
  completedAt: Date,
  startedBy: String,                   // User ID who triggered
  error: {
    message: String,
    stack: String,
    nodeId: String,                    // Node where error occurred
    timestamp: Date
  },
  metrics: {
    totalDuration: Number,             // Total execution time
    nodeCount: Number,                 // Nodes executed
    aiCalls: Number,                   // AI API calls made
    humanInterventions: Number,        // Human approvals required
    cost: Number                       // Estimated execution cost
  }
}
```

### Optimizations:
- **Real-time Updates** for live monitoring
- **Detailed Metrics** for cost analysis
- **Error Tracking** for debugging
- **Audit Trail** for compliance

---

## 📊 **4. Event Logs Collection (`event_logs`)**

### Purpose:
- **Comprehensive Logging** - Every system event recorded
- **Debugging Support** - Detailed troubleshooting information
- **Replay Capability** - Reconstruct execution states

### Schema Structure:
```typescript
{
  _id: ObjectId,
  type: 'workflow_start' | 'node_execution' | 'ai_call' | 'human_approval' | 'error',
  timestamp: Date,
  executionId: ObjectId,               // Reference to workflow execution
  nodeId: String,                      // Node involved (if applicable)
  data: {                              // Event-specific data
    input: Object,
    output: Object,
    duration: Number,
    cost: Number,                      // For AI calls
    provider: String,                  // AI provider used
    approver: String,                  // For human approvals
    error: String                      // Error details
  },
  metadata: {
    userId: String,                    // User who triggered
    sessionId: String,                 // Session identifier
    ipAddress: String,                 // Security tracking
    userAgent: String                  // Client information
  }
}
```

### Optimizations:
- **Time-series Data** for analytics
- **Efficient Queries** with compound indexes
- **Security Tracking** for audit compliance

---

## 📈 **5. Execution History Collection (`execution_histories`)**

### Purpose:
- **Performance Analytics** - Long-term trend analysis
- **Cost Optimization** - Track and optimize AI API usage
- **Success Metrics** - Workflow performance over time

### Schema Structure:
```typescript
{
  _id: ObjectId,
  executionId: ObjectId,
  workflowId: ObjectId,
  userId: String,
  startTime: Date,
  endTime: Date,
  duration: Number,                    // Total execution time
  status: 'success' | 'failure' | 'timeout',
  nodeMetrics: [{                      // Per-node performance
    nodeId: String,
    nodeType: String,
    duration: Number,
    cost: Number,
    success: Boolean
  }],
  aiUsage: {                          // AI provider usage tracking
    gemini: { calls: Number, tokens: Number, cost: Number },
    groq: { calls: Number, tokens: Number, cost: Number },
    perplexity: { calls: Number, tokens: Number, cost: Number }
  },
  humanInteractions: [{               // Human approval tracking
    nodeId: String,
    approver: String,
    requestTime: Date,
    responseTime: Date,
    approved: Boolean,
    duration: Number                   // Time to approve
  }]
}
```

---

## ⚠️ **Index Warnings Explanation**

The warnings you're seeing indicate **duplicate indexes** in your MongoDB collections:

```bash
Warning: Duplicate schema index on {"email":1} found
Warning: Duplicate schema index on {"username":1} found
Warning: Duplicate schema index on {"apiKeys.key":1} found
Warning: Duplicate schema index on {"name":1} found
Warning: Duplicate schema index on {"tags":1} found
```

### Why This Happens:
1. **Schema Definition** declares `index: true`
2. **Manual Index Creation** also creates the same index
3. **Mongoose** detects both and warns about duplication

### Impact:
- ⚠️ **Performance**: No negative impact, just redundant indexes
- ✅ **Functionality**: Everything works perfectly
- 🔧 **Solution**: Remove duplicate index definitions

---

## 🚀 **Database Optimizations Implemented**

### **1. Strategic Indexing**
```typescript
// User lookups
{ email: 1 }                    // Fast login
{ username: 1 }                 // Unique usernames
{ "apiKeys.key": 1 }           // API authentication

// Workflow queries
{ name: 1, status: 1 }         // Active workflow lookup
{ "metadata.creator": 1 }      // User's workflows
{ "metadata.tags": 1 }         // Tag-based search

// Execution tracking
{ workflowId: 1, status: 1 }   // Running executions
{ startedBy: 1, startedAt: -1 } // User execution history
```

### **2. Performance Features**
- **Connection Pooling** - Reuse database connections
- **Aggregation Pipelines** - Complex analytics queries
- **TTL Indexes** - Automatic log cleanup
- **Compound Indexes** - Multi-field query optimization

### **3. Scalability Design**
- **Sharding Ready** - Horizontal scaling support
- **Read Replicas** - Distribute read operations
- **Caching Layer** - Redis for frequently accessed data
- **Batch Operations** - Efficient bulk updates

### **4. Security Measures**
- **Field Encryption** - Sensitive data protection
- **Access Control** - Role-based permissions
- **Audit Logging** - Complete activity tracking
- **Data Validation** - Input sanitization

---

## 💡 **How It All Works Together**

### **Workflow Execution Flow:**
1. **User** creates/triggers workflow → `workflows` collection
2. **System** creates execution instance → `workflow_executions` collection
3. **Engine** processes nodes step-by-step → `event_logs` collection
4. **AI Services** make API calls → logged and tracked
5. **Human Approvals** pause execution → email notifications
6. **Completion** updates metrics → `execution_histories` collection

### **Real-time Features:**
- **Live Monitoring** - WebSocket updates from database
- **Progress Tracking** - Real-time execution status
- **Cost Monitoring** - Live AI usage and costs
- **Performance Metrics** - Execution time analytics

This database design supports **enterprise-scale** agentic workflows with full observability, cost optimization, and human governance! 🎯