#!/bin/bash
# PeopleHub Health Check Script
# Usage: ./health-check.sh [base_url]
# Exit codes: 0 = healthy, 1 = unhealthy

set -e

BASE_URL="${1:-http://localhost:3000}"
TIMEOUT=10
VERBOSE="${VERBOSE:-false}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    if [ "$VERBOSE" = "true" ]; then
        echo -e "$1"
    fi
}

check_endpoint() {
    local name=$1
    local endpoint=$2
    local expected_status=${3:-200}
    
    log "Checking $name..."
    
    response=$(curl -s -w "\n%{http_code}" --max-time $TIMEOUT "$BASE_URL$endpoint" 2>/dev/null || echo -e "\n000")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ $name: OK (HTTP $http_code)${NC}"
        return 0
    else
        echo -e "${RED}❌ $name: FAILED (HTTP $http_code)${NC}"
        if [ "$VERBOSE" = "true" ]; then
            echo "   Response: $body"
        fi
        return 1
    fi
}

check_json_status() {
    local name=$1
    local endpoint=$2
    
    log "Checking $name (JSON status)..."
    
    response=$(curl -s --max-time $TIMEOUT "$BASE_URL$endpoint" 2>/dev/null || echo '{"success":false}')
    success=$(echo "$response" | grep -o '"success":\s*true' || true)
    
    if [ -n "$success" ]; then
        echo -e "${GREEN}✅ $name: Healthy${NC}"
        return 0
    else
        echo -e "${RED}❌ $name: Unhealthy${NC}"
        if [ "$VERBOSE" = "true" ]; then
            echo "   Response: $response"
        fi
        return 1
    fi
}

main() {
    echo "=================================="
    echo "PeopleHub Health Check"
    echo "Base URL: $BASE_URL"
    echo "Time: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "=================================="
    echo ""
    
    failed=0
    
    # Quick health check
    check_json_status "Application" "/api/health" || ((failed++))
    
    # Database health check
    check_json_status "Database" "/api/health/db" || ((failed++))
    
    # Redis health check (optional)
    check_json_status "Redis" "/api/health/redis" || ((failed++))
    
    # Detailed health check
    check_json_status "System (Detailed)" "/api/health/detailed" || ((failed++))
    
    # Metrics endpoint (just check availability)
    check_endpoint "Metrics" "/api/metrics" "200" || ((failed++))
    
    echo ""
    echo "=================================="
    
    if [ $failed -eq 0 ]; then
        echo -e "${GREEN}All checks passed!${NC}"
        exit 0
    else
        echo -e "${RED}$failed check(s) failed${NC}"
        exit 1
    fi
}

# Run with verbose mode if -v flag is passed
if [ "$1" = "-v" ] || [ "$2" = "-v" ]; then
    VERBOSE="true"
    if [ "$1" = "-v" ]; then
        shift
    fi
fi

main
