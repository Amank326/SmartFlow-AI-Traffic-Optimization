.PHONY: help build up down logs restart clean test

# ============================================================
# SmartFlow Docker Makefile
# Convenient commands for Docker operations
# ============================================================

help:
	@echo "╔════════════════════════════════════════════════════════════╗"
	@echo "║  🚦 SmartFlow AI Traffic Optimization - Docker Commands   ║"
	@echo "╚════════════════════════════════════════════════════════════╝"
	@echo ""
	@echo "🚀 Quick Start Commands:"
	@echo "   make up              - Start all services"
	@echo "   make down            - Stop all services"
	@echo "   make restart         - Restart all services"
	@echo "   make logs            - View all logs"
	@echo ""
	@echo "🔨 Build Commands:"
	@echo "   make build           - Build Docker images"
	@echo "   make build-backend   - Build backend only"
	@echo "   make build-frontend  - Build frontend only"
	@echo ""
	@echo "📊 Management Commands:"
	@echo "   make ps              - List running containers"
	@echo "   make clean           - Remove containers & volumes"
	@echo "   make status          - Check service status"
	@echo ""
	@echo "🧪 Testing Commands:"
	@echo "   make test-api        - Test all API endpoints"
	@echo "   make test-backend    - Test backend health"
	@echo "   make test-frontend   - Test frontend availability"
	@echo ""
	@echo "📜 Shell Commands:"
	@echo "   make shell-backend   - Access backend container"
	@echo "   make shell-frontend  - Access frontend container"
	@echo ""

# ============================================================
# Main Commands
# ============================================================

up:
	@echo "🚀 Starting SmartFlow services..."
	docker-compose up -d
	@echo "✅ Services started!"
	@echo "   Frontend: http://localhost:8000"
	@echo "   Backend: http://localhost:3000"
	@sleep 3
	@make status

down:
	@echo "🛑 Stopping SmartFlow services..."
	docker-compose down
	@echo "✅ Services stopped!"

restart:
	@echo "🔄 Restarting SmartFlow services..."
	docker-compose restart
	@echo "✅ Services restarted!"

# ============================================================
# Build Commands
# ============================================================

build:
	@echo "🔨 Building Docker images..."
	docker-compose build
	@echo "✅ Build complete!"

build-backend:
	@echo "🔨 Building backend image..."
	docker-compose build backend
	@echo "✅ Backend built!"

build-frontend:
	@echo "🔨 Building frontend image..."
	docker-compose build frontend
	@echo "✅ Frontend built!"

rebuild: clean build up

# ============================================================
# Status & Logs
# ============================================================

ps:
	@echo "📦 Running containers:"
	@docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"

logs:
	@echo "📜 Live logs (Ctrl+C to exit)..."
	docker-compose logs -f --tail=50

logs-backend:
	@echo "📜 Backend logs..."
	docker-compose logs -f backend

logs-frontend:
	@echo "📜 Frontend logs..."
	docker-compose logs -f frontend

status:
	@echo "📊 Service Status:"
	@echo "   Backend:  $$(curl -s http://localhost:3000/health | jq -r '.status' 2>/dev/null || echo 'Checking...')"
	@echo "   Frontend: $$(curl -s http://localhost:8000 > /dev/null && echo 'Running' || echo 'Checking...')"
	@docker ps --format "{{.Names}}: {{.Status}}" 2>/dev/null || echo "   (Run 'make up' first)"

# ============================================================
# Cleanup
# ============================================================

clean:
	@echo "🧹 Cleaning up Docker resources..."
	docker-compose down -v
	@echo "✅ Cleanup complete!"

prune:
	@echo "🧹 Pruning unused Docker resources..."
	docker system prune -af --volumes
	@echo "✅ Prune complete!"

# ============================================================
# Testing
# ============================================================

test: test-backend test-api test-frontend
	@echo "✅ All tests passed!"

test-backend:
	@echo "🧪 Testing backend..."
	@curl -s http://localhost:3000/health | jq . || echo "❌ Backend not responding"

test-api:
	@echo "🧪 Testing API endpoints..."
	@echo "   Testing /traffic..."
	@curl -s http://localhost:3000/traffic | jq '.totalCars' > /dev/null && echo "   ✅ /traffic OK" || echo "   ❌ /traffic failed"
	@echo "   Testing /status..."
	@curl -s http://localhost:3000/status | jq '.system' > /dev/null && echo "   ✅ /status OK" || echo "   ❌ /status failed"
	@echo "   Testing /health..."
	@curl -s http://localhost:3000/health | jq '.status' > /dev/null && echo "   ✅ /health OK" || echo "   ❌ /health failed"

test-frontend:
	@echo "🧪 Testing frontend..."
	@curl -s http://localhost:8000 | grep -q "SmartFlow" && echo "   ✅ Frontend OK" || echo "   ❌ Frontend not responding"

# ============================================================
# Shell Access
# ============================================================

shell-backend:
	@echo "🚀 Accessing backend container..."
	docker exec -it smartflow-backend sh

shell-frontend:
	@echo "🚀 Accessing frontend container..."
	docker exec -it smartflow-frontend sh

# ============================================================
# Utility
# ============================================================

info:
	@echo "📊 Docker System Information:"
	@docker system df

stats:
	@echo "📈 Container Resource Usage:"
	@docker stats --no-stream

version:
	@echo "🔍 Version Information:"
	@echo "   Docker: $$(docker --version)"
	@echo "   Compose: $$(docker-compose --version)"

# ============================================================
# Development
# ============================================================

dev-backend:
	@echo "🔧 Running backend in development..."
	cd backend && npm install && node server.js

dev-frontend:
	@echo "🔧 Running frontend in development..."
	cd frontend && npx http-server . -p 8000 -c-1

.DEFAULT_GOAL := help
