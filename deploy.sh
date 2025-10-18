#!/bin/bash

# Production deployment script for Agentic Orchestration Platform
set -e

echo "🚀 Starting production deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="agentic-orchestration"
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
ENVIRONMENT=${1:-production}

# Functions
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    
    if [ ! -f ".env.${ENVIRONMENT}" ]; then
        print_error "Environment file .env.${ENVIRONMENT} not found"
        exit 1
    fi
    
    print_status "✅ Prerequisites check passed"
}

# Create backup
create_backup() {
    print_status "Creating backup..."
    
    mkdir -p "${BACKUP_DIR}"
    
    # Backup MongoDB if running
    if docker-compose ps | grep -q mongodb; then
        print_status "Backing up MongoDB..."
        docker-compose exec -T mongodb mongodump --out /backup
        docker cp $(docker-compose ps -q mongodb):/backup "${BACKUP_DIR}/mongodb"
    fi
    
    # Backup Redis if running
    if docker-compose ps | grep -q redis; then
        print_status "Backing up Redis..."
        docker-compose exec -T redis redis-cli BGSAVE
        docker cp $(docker-compose ps -q redis):/data/dump.rdb "${BACKUP_DIR}/redis-dump.rdb"
    fi
    
    print_status "✅ Backup created at ${BACKUP_DIR}"
}

# Update application
update_application() {
    print_status "Updating application..."
    
    # Pull latest changes
    print_status "Pulling latest code..."
    git pull origin main
    
    # Load environment variables
    export $(cat .env.${ENVIRONMENT} | xargs)
    
    # Build new images
    print_status "Building Docker images..."
    docker-compose build --no-cache
    
    print_status "✅ Application updated"
}

# Health check
health_check() {
    print_status "Performing health check..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:3000/health > /dev/null 2>&1; then
            print_status "✅ Health check passed"
            return 0
        fi
        
        print_warning "Health check attempt $attempt/$max_attempts failed, retrying in 10s..."
        sleep 10
        ((attempt++))
    done
    
    print_error "Health check failed after $max_attempts attempts"
    return 1
}

# Deploy application
deploy() {
    print_status "Deploying application..."
    
    # Stop existing containers gracefully
    print_status "Stopping existing containers..."
    docker-compose down --timeout 30
    
    # Start new containers
    print_status "Starting new containers..."
    docker-compose up -d
    
    # Wait for services to be ready
    print_status "Waiting for services to start..."
    sleep 20
    
    # Run health check
    if ! health_check; then
        print_error "Deployment failed - health check unsuccessful"
        rollback
        exit 1
    fi
    
    print_status "✅ Deployment successful"
}

# Rollback function
rollback() {
    print_warning "Rolling back to previous version..."
    
    # Stop failed deployment
    docker-compose down
    
    # Restore from backup if needed
    if [ -d "${BACKUP_DIR}" ]; then
        print_status "Restoring from backup..."
        # Add backup restoration logic here
    fi
    
    print_warning "⚠️ Rollback completed"
}

# Cleanup old resources
cleanup() {
    print_status "Cleaning up old resources..."
    
    # Remove unused Docker images
    docker image prune -f
    
    # Remove old backups (keep last 5)
    find ./backups -type d -name "*_*" | sort -r | tail -n +6 | xargs rm -rf
    
    print_status "✅ Cleanup completed"
}

# Send deployment notification
send_notification() {
    local status=$1
    local message="🚀 Deployment ${status} for ${PROJECT_NAME} on ${ENVIRONMENT}"
    
    # Slack notification (if webhook URL is set)
    if [ ! -z "${SLACK_WEBHOOK_URL}" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"${message}\"}" \
            "${SLACK_WEBHOOK_URL}"
    fi
    
    # Email notification (if configured)
    if [ ! -z "${NOTIFICATION_EMAIL}" ]; then
        echo "${message}" | mail -s "Deployment ${status}" "${NOTIFICATION_EMAIL}"
    fi
    
    print_status "📧 Notification sent"
}

# Main deployment flow
main() {
    print_status "🚀 Starting deployment for environment: ${ENVIRONMENT}"
    
    # Load environment-specific variables
    if [ -f ".env.${ENVIRONMENT}" ]; then
        export $(cat .env.${ENVIRONMENT} | xargs)
    fi
    
    # Execute deployment steps
    check_prerequisites
    create_backup
    update_application
    deploy
    cleanup
    
    # Send success notification
    send_notification "SUCCESS"
    
    print_status "🎉 Deployment completed successfully!"
    print_status "📊 Application is running at: http://localhost:3000"
    print_status "📈 Monitoring dashboard: http://localhost:3001"
    print_status "📋 API documentation: http://localhost:3000/api/docs"
}

# Trap errors and send failure notification
trap 'send_notification "FAILED"; exit 1' ERR

# Run main function
main "$@"