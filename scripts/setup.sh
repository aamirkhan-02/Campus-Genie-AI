#!/bin/bash

# ============================================
# INITIAL SETUP SCRIPT
# Smart Study Buddy Pro
# ============================================

set -e

echo "╔══════════════════════════════════════════╗"
echo "║  🎓 Smart Study Buddy Pro - Setup       ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() { echo -e "${BLUE}[STEP]${NC} $1"; }
print_success() { echo -e "${GREEN}[✓]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[!]${NC} $1"; }
print_error() { echo -e "${RED}[✗]${NC} $1"; }

# Check if Docker is installed
print_step "Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    echo "  Visit: https://docs.docker.com/get-docker/"
    exit 1
fi
print_success "Docker found: $(docker --version)"

if ! command -v docker compose &> /dev/null; then
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed."
        exit 1
    fi
fi
print_success "Docker Compose found"

# Check .env file
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Creating from template..."
    
    if [ -f ".env.example" ]; then
        cp .env.example .env
    else
        cat > .env << 'ENVEOF'
APP_NAME=smart-study-buddy-pro
NODE_ENV=development
DB_HOST=mysql
DB_PORT=3306
DB_USER=studybuddy
DB_PASSWORD=StudyBuddy@2024Dev
DB_ROOT_PASSWORD=RootPass@2024Dev
DB_NAME=smart_study_buddy
JWT_SECRET=change-this-to-a-random-string-minimum-32-characters
JWT_EXPIRES_IN=7d
OPENAI_API_KEY=sk-your-openai-api-key-here
BACKEND_PORT=5000
FRONTEND_URL=http://localhost:3000
VITE_API_URL=/api
REDIS_HOST=redis
REDIS_PORT=6379
ENVEOF
    fi
    print_success ".env file created"
    print_warning "Please edit .env and add your OPENAI_API_KEY before starting!"
fi

# Create data directories
print_step "Creating data directories..."
mkdir -p data/mysql data/uploads data/logs
mkdir -p nginx/ssl nginx/conf.d
mkdir -p backend/uploads backend/logs
chmod 755 data/mysql data/uploads data/logs
print_success "Directories created"

# Create SSL self-signed certificate for development
if [ ! -f "nginx/ssl/fullchain.pem" ]; then
    print_step "Generating self-signed SSL certificate for development..."
    openssl req -x509 -nodes -days 365 \
        -newkey rsa:2048 \
        -keyout nginx/ssl/privkey.pem \
        -out nginx/ssl/fullchain.pem \
        -subj "/C=US/ST=Dev/L=Dev/O=StudyBuddy/CN=localhost" \
        2>/dev/null
    print_success "SSL certificate generated"
fi

# Check if OpenAI key is set
source .env 2>/dev/null
if [ "$OPENAI_API_KEY" = "sk-your-openai-api-key-here" ] || [ -z "$OPENAI_API_KEY" ]; then
    print_warning "OpenAI API key not configured!"
    echo ""
    read -p "Enter your OpenAI API key (or press Enter to skip): " api_key
    if [ -n "$api_key" ]; then
        sed -i.bak "s/OPENAI_API_KEY=.*/OPENAI_API_KEY=$api_key/" .env
        rm -f .env.bak
        print_success "API key saved"
    else
        print_warning "Skipped. AI features won't work without an API key."
    fi
fi

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  ✅ Setup Complete!                      ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo ""
echo "  Development mode:"
echo "    docker compose -f docker-compose.yml -f docker-compose.dev.yml up"
echo ""
echo "  Production mode:"
echo "    docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d"
echo ""
echo "  Or use Makefile:"
echo "    make dev      # Start development"
echo "    make prod     # Start production"
echo "    make logs     # View logs"
echo "    make stop     # Stop everything"
echo ""