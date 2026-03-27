#!/bin/bash

# ============================================================
# SmartFlow AI Traffic Optimization
# Docker Quick Start Script
# ============================================================

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  🚦 SmartFlow AI Traffic Optimization - Docker Setup      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check Docker installation
if ! command -v docker &> /dev/null
then
    echo "❌ Docker is not installed!"
    echo "   Download: https://docker.com"
    exit 1
fi

if ! command -v docker-compose &> /dev/null
then
    echo "❌ Docker Compose is not installed!"
    echo "   Download: https://docker.com"
    exit 1
fi

echo "✅ Docker is installed"
echo "   Version: $(docker --version)"
echo ""

# Ask user what to do
echo "What would you like to do?"
echo ""
echo "  1️⃣  Start all services (recommended)"
echo "  2️⃣  Build Docker images"
echo "  3️⃣  View logs"
echo "  4️⃣  Stop all services"
echo "  5️⃣  Clean up everything"
echo "  6️⃣  Run tests"
echo "  0️⃣  Exit"
echo ""

read -p "Enter your choice (0-6): " choice

case $choice in
    1)
        echo ""
        echo "🚀 Starting SmartFlow services with Docker Compose..."
        echo ""
        docker-compose up -d
        
        echo ""
        echo "⏳ Waiting for services to start... (30 seconds)"
        sleep 30
        
        echo ""
        echo "✅ Services started successfully!"
        echo ""
        echo "📍 Access the system:"
        echo "   🌐 Frontend: http://localhost:8000"
        echo "   🔧 Backend API: http://localhost:3000"
        echo "   📊 Status: http://localhost:3000/status"
        echo "   🏥 Health: http://localhost:3000/health"
        echo ""
        echo "💡 Next steps:"
        echo "   1. Open http://localhost:8000 in your browser"
        echo "   2. Click '▶ Start System'"
        echo "   3. Toggle 'Smart AI Mode: ON'"
        echo "   4. Watch efficiency increase!"
        echo ""
        echo "📜 View logs: docker-compose logs -f"
        echo "⏹️  Stop services: docker-compose down"
        echo ""
        ;;
    2)
        echo ""
        echo "🔨 Building Docker images (this may take 2-3 minutes)..."
        echo ""
        docker-compose build
        echo ""
        echo "✅ Build complete!"
        echo "   Next: Run 'docker-compose up -d' to start"
        echo ""
        ;;
    3)
        echo ""
        echo "📜 Displaying live logs (Ctrl+C to exit)..."
        echo ""
        docker-compose logs -f --tail=50
        ;;
    4)
        echo ""
        echo "🛑 Stopping SmartFlow services..."
        docker-compose down
        echo "✅ Services stopped!"
        echo ""
        ;;
    5)
        echo ""
        echo "🧹 Cleaning up all Docker resources..."
        echo "   This will remove containers, volumes, and images."
        read -p "Are you sure? (y/n): " confirm
        
        if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
            docker-compose down -v
            echo "✅ Cleanup complete!"
        else
            echo "❌ Cleanup cancelled"
        fi
        echo ""
        ;;
    6)
        echo ""
        echo "🧪 Running tests..."
        echo ""
        
        # Wait for services if not running
        if ! docker ps | grep -q smartflow-backend; then
            echo "⏳ Starting services first..."
            docker-compose up -d
            sleep 10
        fi
        
        echo "   Testing Backend Health..."
        HEALTH=$(curl -s http://localhost:3000/health | jq -r '.status' 2>/dev/null)
        if [ "$HEALTH" = "OK" ]; then
            echo "       ✅ /health endpoint: OK"
        else
            echo "       ❌ /health endpoint: FAILED"
        fi
        
        echo "   Testing Traffic API..."
        TRAFFIC=$(curl -s http://localhost:3000/traffic | jq -r '.totalCars' 2>/dev/null)
        if [[ "$TRAFFIC" =~ ^[0-9]+$ ]]; then
            echo "       ✅ /traffic endpoint: OK (Total: $TRAFFIC cars)"
        else
            echo "       ❌ /traffic endpoint: FAILED"
        fi
        
        echo "   Testing Status API..."
        STATUS=$(curl -s http://localhost:3000/status | jq -r '.system' 2>/dev/null)
        if [ "$STATUS" = "running" ]; then
            echo "       ✅ /status endpoint: OK"
        else
            echo "       ❌ /status endpoint: FAILED"
        fi
        
        echo "   Testing Frontend..."
        FRONTEND=$(curl -s http://localhost:8000 | grep -c "SmartFlow" 2>/dev/null)
        if [ "$FRONTEND" -gt 0 ]; then
            echo "       ✅ Frontend: OK"
        else
            echo "       ❌ Frontend: FAILED"
        fi
        
        echo ""
        echo "✅ Tests complete!"
        echo ""
        ;;
    0)
        echo ""
        echo "👋 Goodbye!"
        echo ""
        exit 0
        ;;
    *)
        echo ""
        echo "❌ Invalid choice. Please enter 0-6"
        echo ""
        ;;
esac

echo ""
echo "ℹ️  For more information:"
echo "   📖 Read: DOCKER_SETUP.md"
echo "   📖 Read: INTEGRATION_COMPLETE.md"
echo "   🎯 Run: make help"
echo ""
