# 🔴 Redis Setup Guide for Agentic Orchestration Platform

## Why We Need Redis

Our platform uses Redis for:
- **Caching** - User sessions and frequently accessed data
- **Distributed Locking** - Preventing concurrent workflow execution conflicts  
- **Rate Limiting** - API protection and throttling
- **Queue Management** - Background job processing
- **Real-time Updates** - Workflow state synchronization

## Option 1: Render Redis (Recommended)

### Step 1: Create Render Account
1. Go to [Render.com](https://render.com)
2. Sign up with GitHub (free account)
3. Connect your GitHub repository

### Step 2: Create Redis Instance
1. Click "New +" → "Redis"
2. **Name**: `agentic-redis`
3. **Plan**: Start with **Free** (25MB storage, perfect for development)
4. **Region**: Same as your main app (for low latency)
5. Click "Create Redis"

### Step 3: Get Connection Details
After creation, you'll get:
```
Internal Redis URL: redis://red-xxxxx:6379
External Redis URL: rediss://red-xxxxx:password@oregon-redis.render.com:6380
```

### Step 4: Update Environment
Use the **External Redis URL** in your `.env`:
```env
REDIS_URL=rediss://red-xxxxx:password@oregon-redis.render.com:6380
```

## Option 2: Redis Cloud (Official)

### Step 1: Create Account
1. Go to [Redis Cloud](https://redis.com/try-free/)
2. Sign up for free account
3. Create new subscription

### Step 2: Create Database
1. Click "New Database"
2. **Provider**: AWS/GCP/Azure
3. **Region**: Same as your MongoDB Atlas region
4. **Plan**: **Free** (30MB)
5. **Name**: `agentic-orchestration-cache`

### Step 3: Get Connection String
```
redis-xxxxx.redislabs.com:xxxxx
```

## Option 3: Upstash (Serverless Redis)

### Benefits
- **Serverless** - Pay per request
- **Global** - Edge locations worldwide
- **Free tier** - 10K requests/day

### Setup
1. Go to [Upstash](https://upstash.com)
2. Create Redis database
3. Copy connection URL

## Using Existing Redis Instance

### Step 1: Get Your Redis URL
From your Render dashboard, you have:

**Internal URL** (for apps on Render):
```
redis://red-d3ltqtemcj7s73a8hl40:6379
```

**External URL** (for local development - check your Render dashboard):
```
REDIS_URL=rediss://red-d3ltqtemcj7s73a8hl40:password@oregon-redis.render.com:6380
```

Use the **External URL** for local development and external connections.

### Step 2: Configure Database Separation
We'll use database 1 for this project (your other project uses database 0):

```env
# In your .env file
REDIS_URL=rediss://red-xxxxx:password@oregon-redis.render.com:6380
REDIS_DB=1
REDIS_KEY_PREFIX=agentic:
```

### Step 3: Update Environment Variables
Add these to your `.env` file:

## Current Configuration

Let me update our configuration to handle Redis properly: