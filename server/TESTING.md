# Agentic Orchestration Platform - Test Suite

## Quick Start Testing

### 1. Start the Server
```powershell
cd D:\agentic-orchestration-builder\server
npm run dev
```

### 2. Run Automated Tests
```powershell
# In a new terminal window
cd D:\agentic-orchestration-builder\server
node test-api.js
```

## Test Coverage

### ✅ What's Working (Phase 1)
1. **Core Infrastructure**
   - Express.js server with TypeScript
   - MongoDB Atlas connection
   - Redis cloud caching
   - JWT authentication system
   - Event-driven workflow engine

2. **Integration Services**
   - ✅ HTTP Service - Makes external API calls
   - ✅ Database Service - MongoDB operations  
   - ✅ Gmail Service - Email sending (OAuth ready)
   - ✅ Telegram Service - Bot messaging (API ready)

3. **Node Types (6/29)**
   - ✅ TRIGGER nodes (manual, webhook, timer)
   - ✅ AI_PROCESSOR nodes (OpenAI, Gemini, Claude)
   - ✅ ACTION nodes (HTTP, email, database, log, Telegram)
   - ✅ DECISION nodes (basic conditional logic)
   - ✅ HUMAN_TASK nodes (approval workflows)
   - ✅ TIMER nodes (delays, scheduling)

4. **API Endpoints**
   - ✅ Authentication (register, login)
   - ✅ Workflow CRUD operations
   - ✅ Execution management
   - ✅ Status monitoring and history

### 🔄 What's in Testing Mode
- **Email Integration**: Simulated (needs Gmail OAuth setup)
- **Telegram Integration**: Simulated (needs bot token)
- **Database Operations**: Working with test collections

### ⏳ Pending Implementation (Phase 2+)
- **Node Types (23 remaining)**:
  - File operations (upload, download, transform)
  - Calendar integration (Google, Outlook)
  - Social media (Twitter, LinkedIn, Facebook)
  - Payment processing (Stripe, PayPal)
  - CRM integration (Salesforce, HubSpot)
  - Notification systems (Slack, Discord, SMS)
  - Data transformation and validation
  - Code execution environments

- **Frontend**:
  - Visual workflow builder
  - Drag-and-drop interface
  - Real-time execution monitoring
  - User dashboard

## Test Scenarios

### 1. Simple Workflow Test
**Trigger → Log Action**
- Tests basic node execution
- Validates data flow between nodes
- Confirms logging functionality

### 2. Integration Test  
**Trigger → HTTP Request → Email → Database**
- Tests external API calls
- Validates service integrations
- Confirms data persistence

### 3. AI Processing Test
**Trigger → AI Processor → Log**
- Tests AI service integration
- Validates prompt processing
- Confirms response handling

## Using the Test Tools

### Automated Testing (Recommended)
```powershell
# Runs all tests automatically
node test-api.js
```

### Manual Testing with Postman
1. Import `postman-collection.json`
2. Set base_url to `http://localhost:5000`
3. Run requests in order:
   - Register User
   - Login User (copy token to auth_token variable)
   - Create Workflow (copy workflow ID)
   - Start Execution (copy execution ID)
   - Monitor status and history

### Individual Test Scripts
```powershell
# Test specific functionality
node -e "require('./test-api.js').healthCheck()"
node -e "require('./test-api.js').registerUser()"
```

## Configuration Setup

### Required Environment Variables
```
# MongoDB
MONGODB_URI=mongodb+srv://...

# Redis  
REDIS_URL=redis://...

# JWT
JWT_SECRET=your-secret-key

# AI Services (optional for testing)
OPENAI_API_KEY=sk-...
GOOGLE_AI_API_KEY=...
ANTHROPIC_API_KEY=...

# Email (optional - will simulate)
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...

# Telegram (optional - will simulate) 
TELEGRAM_BOT_TOKEN=...
```

### Test Without External Services
The platform gracefully handles missing credentials by:
- Simulating email sends
- Simulating Telegram messages
- Using test data for HTTP calls
- Working with local database operations

## Troubleshooting

### Server Won't Start
```powershell
# Check dependencies
npm install

# Check environment
cp .env.example .env
# Edit .env with your values

# Check TypeScript compilation
npm run build
```

### Test Failures
- **Health Check Fails**: Server not running on port 5000
- **Authentication Fails**: Check JWT_SECRET in .env
- **Database Errors**: Verify MongoDB connection string
- **Integration Errors**: Expected behavior (services simulate when not configured)

## Next Steps

1. **Complete Testing**: Run the automated test suite
2. **Configure Integrations**: Add real API keys for email/Telegram
3. **Expand Nodes**: Implement remaining 23 node types
4. **Build Frontend**: Create visual workflow builder
5. **Production Ready**: Add monitoring, scaling, security

## Support

The test suite provides comprehensive validation of:
- ✅ Core workflow engine functionality
- ✅ Node execution and data flow
- ✅ Service integrations (HTTP, DB, AI)
- ✅ Authentication and security
- ✅ Error handling and recovery
- ✅ Status monitoring and history

Run the tests to validate your Phase 1 implementation is working correctly!