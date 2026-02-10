#!/bin/bash
set -e

echo "🚀 Deploying PeopleHub to Production..."
echo ""

# Build production image
echo "📦 Building production image..."
docker-compose build app

echo ""
echo "🔄 Stopping old container..."
docker stop peoplehub-app-dev || true

echo ""
echo "🚀 Starting production container..."
docker-compose up -d app

echo ""
echo "⏳ Waiting for app to be healthy..."
sleep 10

# Check health
echo ""
echo "🏥 Health check..."
curl -f http://localhost:3000/api/health || {
    echo "❌ Health check failed!"
    echo "📋 Checking logs..."
    docker logs --tail 50 peoplehub-app-dev
    exit 1
}

echo ""
echo "✅ Production deployment complete!"
echo "🌐 App running at: http://localhost:3000"
echo ""
echo "📊 To view logs: docker logs -f peoplehub-app-dev"
