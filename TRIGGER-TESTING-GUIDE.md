# 🧪 COMPLETE TRIGGER SYSTEM TESTING GUIDE

## ✅ Server Status Verification
- ✅ Server running on port 5000
- ✅ Trigger service initialized
- ✅ MongoDB connected with pool
- ✅ Redis connected
- ✅ All trigger types ready (email, webhook, schedule, manual)

## 📋 Testing Checklist

### 1. 🔗 API Endpoints Testing

#### Test Trigger Routes
```bash
# Test trigger endpoint availability
curl -X GET http://localhost:5000/api/triggers/health
curl -X GET http://localhost:5000/api/webhooks/health
```

### 2. 🎯 Manual Trigger Testing

#### Steps to Test:
1. **Create Manual Trigger**
   - Open workflow builder
   - Add manual trigger node
   - Configure with:
     - Button Text: "Start Test Workflow"
     - Description: "Test manual trigger execution"
     - Confirm Before Run: true
   - Click "Save Config"
   - Click "Execute" to test

#### Expected Results:
- ✅ Trigger configuration saved to database
- ✅ "Execute" button becomes enabled
- ✅ Manual execution returns execution ID
- ✅ Workflow starts when triggered

### 3. 🔗 Webhook Trigger Testing

#### Steps to Test:
1. **Create Webhook Trigger**
   - Add webhook trigger node
   - Configure with:
     - Method: POST
     - Authentication: API Key
     - Response Code: 200
   - Click "Save Config"
   - Copy generated webhook URL

2. **Test Webhook Endpoint**
```bash
# Test webhook with curl
curl -X POST http://localhost:5000/api/triggers/webhook/[TRIGGER_ID] \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test-key" \
  -d '{"test": "data", "source": "external"}'
```

#### Expected Results:
- ✅ Webhook URL generated and displayed
- ✅ Webhook receives HTTP requests
- ✅ Authentication validated if configured
- ✅ Workflow execution triggered
- ✅ Execution ID returned

### 4. ⏰ Schedule Trigger Testing

#### Steps to Test:
1. **Create Schedule Trigger**
   - Add schedule trigger node
   - Configure with:
     - Schedule Type: Interval
     - Interval Value: 2
     - Interval Unit: minutes
     - Enabled: true
   - Click "Save Config"
   - Click "Test" to validate

2. **Test Different Schedule Types**
   - **Daily**: 09:00
   - **Weekly**: Monday at 10:00
   - **Monthly**: Day 1 at 11:00
   - **Cron**: `0 */5 * * * *` (every 5 minutes)

#### Expected Results:
- ✅ Schedule configuration validated
- ✅ Cron expression generated correctly
- ✅ Next execution time calculated
- ✅ Automatic execution at scheduled times
- ✅ Schedule manager running in background

### 5. 📧 Email Trigger Testing

#### Steps to Test:
1. **Create Email Trigger**
   - Add email trigger node
   - Configure with:
     - Email Address: test@yourdomain.com
     - Subject Filter: "Workflow Trigger"
     - Check Frequency: 5 minutes
     - Mark as Read: true
   - Click "Save Config"
   - Click "Test" to validate

#### Expected Results:
- ✅ Email configuration validated
- ✅ IMAP connection test (simulated)
- ✅ Email polling started
- ✅ Frequency timer active
- ✅ Email checking logs in console

### 6. 🔄 End-to-End Workflow Testing

#### Complete Workflow Test:
1. **Create Test Workflow**
   - Manual Trigger → AI Text Generator → Send Email
   - Configure each node
   - Save workflow
   - Test complete flow

2. **Multi-Trigger Workflow**
   - Multiple trigger types in same workflow
   - Webhook + Schedule triggers
   - Test both trigger paths

#### Expected Results:
- ✅ All triggers save successfully
- ✅ Triggers execute workflows
- ✅ Workflow nodes process correctly
- ✅ Execution history recorded
- ✅ Error handling works

## 🐛 Common Issues to Check

### Database Issues
- [ ] Trigger models save correctly
- [ ] Trigger execution history records
- [ ] Trigger statistics update
- [ ] Error logs captured

### Memory & Performance
- [ ] Memory usage acceptable (<95%)
- [ ] Trigger service doesn't leak memory
- [ ] Schedule manager performs well
- [ ] Email polling efficient

### Error Handling
- [ ] Invalid configurations rejected
- [ ] Network errors handled gracefully
- [ ] Database errors logged
- [ ] User feedback provided

## 📊 Testing Commands

### 1. Create Test Trigger (Manual)
```bash
curl -X POST http://localhost:5000/api/triggers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "type": "manual-trigger",
    "workflowId": "test-workflow-id",
    "nodeId": "test-node-id",
    "enabled": true,
    "config": {
      "buttonText": "Test Manual Trigger",
      "description": "Testing manual trigger functionality",
      "confirmBeforeRun": false
    }
  }'
```

### 2. Execute Manual Trigger
```bash
curl -X POST http://localhost:5000/api/triggers/[TRIGGER_ID]/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"triggerData": {"test": true}}'
```

### 3. Test Trigger Configuration
```bash
curl -X POST http://localhost:5000/api/triggers/[TRIGGER_ID]/test \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Get Trigger Statistics
```bash
curl -X GET http://localhost:5000/api/triggers/[TRIGGER_ID]/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. Get Trigger History
```bash
curl -X GET http://localhost:5000/api/triggers/[TRIGGER_ID]/history \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## ✅ Success Criteria

### Each Trigger Type Must:
1. **Save Configuration** - Store settings in database
2. **Validate Settings** - Check configuration validity
3. **Execute Successfully** - Trigger workflow execution
4. **Handle Errors** - Graceful error handling and logging
5. **Provide Feedback** - User notifications and status updates
6. **Record History** - Execution history and statistics
7. **Performance** - Efficient resource usage

### Integration Must:
1. **Frontend ↔ Backend** - Seamless data flow
2. **Workflow Engine** - Proper workflow execution
3. **Database** - Persistent storage and retrieval
4. **Real-time Updates** - Live status updates
5. **Error Recovery** - Robust error handling

## 🎯 Next Steps for Testing

1. **Start Client Application**
2. **Test Each Trigger Type in UI**
3. **Verify Backend API Responses**
4. **Check Database Records**
5. **Monitor System Performance**
6. **Test Error Scenarios**
7. **Validate Complete Workflows**

## 🚨 Critical Tests

1. **High Load**: Multiple triggers executing simultaneously
2. **Error Recovery**: Network failures, database issues
3. **Memory Usage**: Long-running schedule and email triggers
4. **Data Integrity**: Trigger configurations and execution history
5. **Security**: Authentication and authorization for webhooks