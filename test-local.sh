#!/bin/bash

echo "🧪 Testing BPFS Agent locally..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if node_modules exist
if [ ! -d "srv/node_modules" ]; then
    echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
    cd srv && npm install && cd ..
fi

# Test 1: AI Core connectivity
echo -e "${YELLOW}Test 1: AI Core Connectivity${NC}"
cd srv && node ../test-aicore.js
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ AI Core connectivity test passed${NC}"
else
    echo -e "${RED}❌ AI Core connectivity test failed${NC}"
fi
cd ..
echo ""

# Test 2: Document comparison
echo -e "${YELLOW}Test 2: Document Comparison${NC}"
cd srv && node ../test-comparison.js
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Document comparison test passed${NC}"
else
    echo -e "${RED}❌ Document comparison test failed${NC}"
fi
cd ..
echo ""

# Test 3: Start backend server
echo -e "${YELLOW}Test 3: Backend Server${NC}"
echo "Starting backend server on port 3000..."
echo "Press Ctrl+C to stop"
cd srv && node server.js
