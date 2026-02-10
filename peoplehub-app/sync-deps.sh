#!/bin/bash
# Auto-sync dependencies to Docker container

echo "🔄 Syncing dependencies..."

# Install di host
npm install

# Install di container
docker exec peoplehub-app-dev npm install

echo "✅ Dependencies synced!"
echo "🔥 Hot reload will pick up changes automatically"
