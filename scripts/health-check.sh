#!/bin/bash

# ============================================
# HEALTH CHECK SCRIPT
# ============================================

echo "🏥 Health Check - Smart Study Buddy Pro"
echo "========================================"

check_service() {
    local name=$1
    local url=$2
    local expected=$3

    printf "  %-20s" "$name:"
    
    response=$(curl -sf -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
    
    if [ "$response" = "$expected" ]; then
        echo "✅ Healthy (HTTP $response)"
    else
        echo "❌ Unhealthy (HTTP ${response:-timeout})"
    fi
}

echo ""
echo "Services:"
check_service "Backend API" "http://localhost:5000/api/health" "200"
check_service "Frontend" "http://localhost:3000/health" "200"

echo ""
echo "Docker Containers:"
docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || \
docker-compose ps 2>/dev/null

echo ""
echo "Resources:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" 2>/dev/null | head -10

echo ""
echo "Disk Usage:"
docker system df 2>/dev/null