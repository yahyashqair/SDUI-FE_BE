#!/bin/bash
# ============================================================
# Deploy Fission Functions
# Creates functions from the backend/functions directory
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
FUNCTIONS_DIR="$BACKEND_DIR/functions"

echo "🚀 Deploying Fission Functions..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if fission CLI is available
if ! command -v fission &> /dev/null; then
    echo "Error: fission CLI not found. Run setup.sh first."
    exit 1
fi

# Check if nodejs environment exists
if ! fission env get --name nodejs &> /dev/null; then
    echo -e "${YELLOW}Creating nodejs environment...${NC}"
    fission env create --name nodejs --image ghcr.io/fission/node-env
fi

# Deploy hello function (test)
echo -e "${YELLOW}Deploying hello function...${NC}"
fission function create --name hello --env nodejs --code "$FUNCTIONS_DIR/api/hello.js" 2>/dev/null || \
fission function update --name hello --code "$FUNCTIONS_DIR/api/hello.js"
fission route create --name hello-route --method GET --url /api/hello --function hello 2>/dev/null || true
echo -e "${GREEN}✓ hello function deployed${NC}"

# Deploy sdui-config function
echo -e "${YELLOW}Deploying sdui-config function...${NC}"
fission function create --name sdui-config --env nodejs --code "$FUNCTIONS_DIR/api/sdui-config.js" \
    --secret postgres-secret 2>/dev/null || \
fission function update --name sdui-config --code "$FUNCTIONS_DIR/api/sdui-config.js"
fission route create --name sdui-config-route --method GET --url /api/sdui/config --function sdui-config 2>/dev/null || true
echo -e "${GREEN}✓ sdui-config function deployed${NC}"

# Deploy mfe-registry function
echo -e "${YELLOW}Deploying mfe-registry function...${NC}"
fission function create --name mfe-registry --env nodejs --code "$FUNCTIONS_DIR/api/mfe-registry.js" \
    --secret postgres-secret 2>/dev/null || \
fission function update --name mfe-registry --code "$FUNCTIONS_DIR/api/mfe-registry.js"
fission route create --name mfe-registry-route --method GET --url /api/mfe/registry --function mfe-registry 2>/dev/null || true
echo -e "${GREEN}✓ mfe-registry function deployed${NC}"

# Deploy auth function
echo -e "${YELLOW}Deploying auth function...${NC}"
fission function create --name auth --env nodejs --code "$FUNCTIONS_DIR/gateway/auth.js" 2>/dev/null || \
fission function update --name auth --code "$FUNCTIONS_DIR/gateway/auth.js"
fission route create --name auth-login-route --method POST --url "/api/auth/login" --function auth 2>/dev/null || true
fission route create --name auth-verify-route --method GET --url "/api/auth/verify" --function auth 2>/dev/null || true
echo -e "${GREEN}✓ auth function deployed${NC}"

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}✓ All functions deployed!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "Test the functions:"
echo "  fission function test --name hello"
echo "  curl \$(minikube service fission-router -n fission --url)/api/hello"
echo ""
fission function list
