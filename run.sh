#!/bin/bash

# Auto Code Platform - Start/Stop Script
# Run API on port 7200, Web UI on port 7201

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

API_PORT=7200
WEB_PORT=7201

# Get script directory (resolve symlinks)
SCRIPT_SOURCE="${BASH_SOURCE[0]}"
while [ -h "$SCRIPT_SOURCE" ]; do
    SCRIPT_DIR="$(cd -P "$(dirname "$SCRIPT_SOURCE")" && pwd)"
    SCRIPT_SOURCE="$(readlink "$SCRIPT_SOURCE")"
    [[ $SCRIPT_SOURCE != /* ]] && SCRIPT_SOURCE="$SCRIPT_DIR/$SCRIPT_SOURCE"
done
SCRIPT_DIR="$(cd -P "$(dirname "$SCRIPT_SOURCE")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"

echo -e "${GREEN}=== Auto Code Platform ===${NC}"

start_services() {
    echo -e "${YELLOW}Starting API on port $API_PORT...${NC}"
    cd "$PROJECT_ROOT/apps/api"
    PORT=7200 npm run start > /tmp/auto-api.log 2>&1 &
    API_PID=$!
    echo $API_PID > /tmp/auto-api.pid
    
    sleep 5
    
    echo -e "${YELLOW}Starting Web UI on port $WEB_PORT...${NC}"
    cd "$PROJECT_ROOT/apps/web"
    npm run dev > /tmp/auto-web.log 2>&1 &
    WEB_PID=$!
    echo $WEB_PID > /tmp/auto-web.pid
    
    sleep 8
    
    echo -e "${GREEN}Services started!${NC}"
    echo "API PID: $API_PID"
    echo "Web PID: $WEB_PID"
}

stop_services() {
    echo -e "${YELLOW}Stopping services...${NC}"
    
    if [ -f /tmp/auto-api.pid ]; then
        API_PID=$(cat /tmp/auto-api.pid)
        if kill -0 $API_PID 2>/dev/null; then
            kill $API_PID 2>/dev/null || true
            sleep 1
            kill -9 $API_PID 2>/dev/null || true
        fi
        rm /tmp/auto-api.pid
    fi
    
    if [ -f /tmp/auto-web.pid ]; then
        WEB_PID=$(cat /tmp/auto-web.pid)
        if kill -0 $WEB_PID 2>/dev/null; then
            kill $WEB_PID 2>/dev/null || true
            sleep 1
            kill -9 $WEB_PID 2>/dev/null || true
        fi
        rm /tmp/auto-web.pid
    fi
    
    pkill -f "node dist/main" 2>/dev/null || true
    pkill -f "next dev" 2>/dev/null || true
    
    echo -e "${GREEN}Services stopped!${NC}"
}

verify_services() {
    echo -e "${YELLOW}=== Verifying Services ===${NC}"
    
    # Test API
    echo -n "Testing API (port $API_PORT)... "
    if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$API_PORT/api/health" | grep -q "200"; then
        echo -e "${GREEN}OK${NC}"
        curl -s "http://localhost:$API_PORT/api/health" | head -c 200
        echo ""
    else
        echo -e "${RED}FAILED${NC}"
    fi
    
    # Test API machines endpoint
    echo -n "Testing /api/machines... "
    if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$API_PORT/api/machines" | grep -q "200"; then
        echo -e "${GREEN}OK${NC}"
    else
        echo -e "${RED}FAILED${NC}"
    fi
    
    # Test API runs endpoint
    echo -n "Testing /api/runs... "
    if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$API_PORT/api/runs" | grep -q "200"; then
        echo -e "${GREEN}OK${NC}"
    else
        echo -e "${RED}FAILED${NC}"
    fi
    
    # Test Web UI
    echo -n "Testing Web UI (port $WEB_PORT)... "
    if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$WEB_PORT" | grep -q "200"; then
        echo -e "${GREEN}OK${NC}"
    else
        echo -e "${RED}FAILED${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}=== All Tests Complete ===${NC}"
    echo "API: http://localhost:$API_PORT"
    echo "Web: http://localhost:$WEB_PORT"
}

status_services() {
    echo -e "${YELLOW}=== Service Status ===${NC}"
    
    if [ -f /tmp/auto-api.pid ]; then
        API_PID=$(cat /tmp/auto-api.pid)
        if kill -0 $API_PID 2>/dev/null; then
            echo -e "API: ${GREEN}Running (PID: $API_PID)${NC}"
        else
            echo -e "API: ${RED}Not running (stale PID)${NC}"
        fi
    else
        echo -e "API: ${RED}Not running${NC}"
    fi
    
    if [ -f /tmp/auto-web.pid ]; then
        WEB_PID=$(cat /tmp/auto-web.pid)
        if kill -0 $WEB_PID 2>/dev/null; then
            echo -e "Web: ${GREEN}Running (PID: $WEB_PID)${NC}"
        else
            echo -e "Web: ${RED}Not running (stale PID)${NC}"
        fi
    else
        echo -e "Web: ${RED}Not running${NC}"
    fi
}

case "$1" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        stop_services
        sleep 2
        start_services
        ;;
    verify)
        verify_services
        ;;
    status)
        status_services
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|verify|status}"
        exit 1
        ;;
esac
