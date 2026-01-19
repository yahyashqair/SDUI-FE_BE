#!/bin/bash
# ============================================================
# Fission Backend Setup Script
# Installs minikube, kubectl, helm, and Fission for local dev
# ============================================================

set -e

echo "🚀 Setting up Fission Backend Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running on Linux
check_os() {
    if [[ "$OSTYPE" != "linux-gnu"* ]]; then
        echo -e "${RED}This script is designed for Linux. Please adapt for your OS.${NC}"
        exit 1
    fi
}

# Install minikube if not present
install_minikube() {
    if command -v minikube &> /dev/null; then
        echo -e "${GREEN}✓ minikube already installed${NC}"
        return
    fi
    
    echo -e "${YELLOW}Installing minikube...${NC}"
    curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
    sudo install minikube-linux-amd64 /usr/local/bin/minikube
    rm minikube-linux-amd64
    echo -e "${GREEN}✓ minikube installed${NC}"
}

# Install kubectl if not present
install_kubectl() {
    if command -v kubectl &> /dev/null; then
        echo -e "${GREEN}✓ kubectl already installed${NC}"
        return
    fi
    
    echo -e "${YELLOW}Installing kubectl...${NC}"
    curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
    sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
    rm kubectl
    echo -e "${GREEN}✓ kubectl installed${NC}"
}

# Install helm if not present
install_helm() {
    if command -v helm &> /dev/null; then
        echo -e "${GREEN}✓ helm already installed${NC}"
        return
    fi
    
    echo -e "${YELLOW}Installing helm...${NC}"
    curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
    echo -e "${GREEN}✓ helm installed${NC}"
}

# Install Fission CLI
install_fission_cli() {
    if command -v fission &> /dev/null; then
        echo -e "${GREEN}✓ fission CLI already installed${NC}"
        return
    fi
    
    echo -e "${YELLOW}Installing Fission CLI...${NC}"
    curl -Lo fission https://github.com/fission/fission/releases/download/v1.22.0/fission-v1.22.0-linux-amd64
    chmod +x fission
    sudo mv fission /usr/local/bin/
    echo -e "${GREEN}✓ fission CLI installed${NC}"
}

# Start minikube cluster
start_minikube() {
    echo -e "${YELLOW}Starting minikube cluster...${NC}"
    
    # Check if minikube is already running
    if minikube status | grep -q "Running"; then
        echo -e "${GREEN}✓ minikube already running${NC}"
        return
    fi
    
    minikube start --cpus=4 --memory=8192 --driver=docker
    echo -e "${GREEN}✓ minikube started${NC}"
}

# Install Fission on Kubernetes
install_fission() {
    echo -e "${YELLOW}Installing Fission on Kubernetes...${NC}"
    
    export FISSION_NAMESPACE="fission"
    
    # Create namespace if it doesn't exist
    kubectl create namespace $FISSION_NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
    
    # Install Fission CRDs
    kubectl apply -k "github.com/fission/fission/crds/v1?ref=v1.22.0"
    
    # Add Fission Helm repo
    helm repo add fission-charts https://fission.github.io/fission-charts/
    helm repo update
    
    # Install Fission
    helm upgrade --install fission fission-charts/fission-all \
        --version 1.22.1 \
        --namespace $FISSION_NAMESPACE \
        --set serviceType=NodePort \
        --set routerServiceType=NodePort
    
    echo -e "${GREEN}✓ Fission installed${NC}"
    
    # Wait for Fission to be ready
    echo -e "${YELLOW}Waiting for Fission pods to be ready...${NC}"
    kubectl wait --for=condition=ready pod -l app=fission -n $FISSION_NAMESPACE --timeout=300s || true
}

# Create Node.js environment
create_nodejs_env() {
    echo -e "${YELLOW}Creating Node.js environment...${NC}"
    
    # Check if environment exists
    if fission env get --name nodejs &> /dev/null; then
        echo -e "${GREEN}✓ nodejs environment already exists${NC}"
        return
    fi
    
    fission env create --name nodejs --image ghcr.io/fission/node-env --builder ghcr.io/fission/node-builder
    echo -e "${GREEN}✓ nodejs environment created${NC}"
}

# Main execution
main() {
    check_os
    install_minikube
    install_kubectl
    install_helm
    install_fission_cli
    start_minikube
    install_fission
    create_nodejs_env
    
    echo ""
    echo -e "${GREEN}============================================${NC}"
    echo -e "${GREEN}✓ Fission Backend Setup Complete!${NC}"
    echo -e "${GREEN}============================================${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Deploy PostgreSQL: kubectl apply -f k8s/"
    echo "  2. Deploy functions: ./scripts/deploy-functions.sh"
    echo "  3. Test: fission function test --name hello"
    echo ""
    echo "Useful commands:"
    echo "  - fission env list           # List environments"
    echo "  - fission function list      # List functions"
    echo "  - fission route list         # List HTTP routes"
    echo "  - minikube service fission-router -n fission  # Open Fission router"
}

main "$@"
