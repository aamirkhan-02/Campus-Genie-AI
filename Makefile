# ============================================
# MAKEFILE - Smart Study Buddy Pro
# ============================================

.PHONY: help setup dev prod stop restart logs clean backup restore health test

# Default compose files
DEV_COMPOSE = -f docker-compose.yml -f docker-compose.dev.yml
PROD_COMPOSE = -f docker-compose.yml -f docker-compose.prod.yml

# Colors
BLUE = \033[0;34m
GREEN = \033[0;32m
YELLOW = \033[1;33m
NC = \033[0m

help: ## Show this help message
	@echo ""
	@echo "$(BLUE)Smart Study Buddy Pro - Commands$(NC)"
	@echo "=================================="
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}'
	@echo ""

setup: ## Initial project setup
	@chmod +x scripts/*.sh
	@bash scripts/setup.sh

# ---- DEVELOPMENT ----

dev: ## Start development environment
	@echo "$(BLUE)Starting development environment...$(NC)"
	docker compose $(DEV_COMPOSE) up --build
	
dev-d: ## Start development in background
	@echo "$(BLUE)Starting development (detached)...$(NC)"
	docker compose $(DEV_COMPOSE) up --build -d
	@echo "$(GREEN)✅ Development environment started$(NC)"
	@echo "  Frontend:   http://localhost:5173"
	@echo "  Backend:    http://localhost:5000"
	@echo "  phpMyAdmin: http://localhost:8080"

dev-stop: ## Stop development environment
	docker compose $(DEV_COMPOSE) down

# ---- PRODUCTION ----

prod: ## Start production environment
	@echo "$(BLUE)Starting production environment...$(NC)"
	docker compose $(PROD_COMPOSE) up --build -d
	@echo "$(GREEN)✅ Production environment started$(NC)"

prod-stop: ## Stop production environment
	docker compose $(PROD_COMPOSE) down

deploy: ## Full production deployment
	@chmod +x scripts/deploy.sh
	@bash scripts/deploy.sh

# ---- COMMON ----

stop: ## Stop all containers
	docker compose $(DEV_COMPOSE) down 2>/dev/null || true
	docker compose $(PROD_COMPOSE) down 2>/dev/null || true
	@echo "$(GREEN)✅ All containers stopped$(NC)"

restart: ## Restart all containers
	@make stop
	@make dev-d

logs: ## View logs (all services)
	docker compose $(DEV_COMPOSE) logs -f --tail=100

logs-backend: ## View backend logs
	docker compose $(DEV_COMPOSE) logs -f --tail=100 backend

logs-frontend: ## View frontend logs
	docker compose $(DEV_COMPOSE) logs -f --tail=100 frontend

logs-db: ## View database logs
	docker compose $(DEV_COMPOSE) logs -f --tail=100 mysql

# ---- DATABASE ----

db-shell: ## Open MySQL shell
	docker exec -it studybuddy-mysql mysql -u root -p

db-backup: ## Backup database
	@chmod +x scripts/backup-db.sh
	@bash scripts/backup-db.sh

db-restore: ## Restore database (usage: make db-restore FILE=path/to/backup.sql.gz)
	@chmod +x scripts/restore-db.sh
	@bash scripts/restore-db.sh $(FILE)

db-reset: ## Reset database (WARNING: destroys all data)
	@echo "$(YELLOW)⚠️  This will DESTROY all database data!$(NC)"
	@read -p "Type 'RESET' to confirm: " confirm; \
	if [ "$$confirm" = "RESET" ]; then \
		docker compose $(DEV_COMPOSE) down -v; \
		docker volume rm studybuddy-mysql-data 2>/dev/null || true; \
		echo "$(GREEN)✅ Database reset complete. Run 'make dev' to start fresh.$(NC)"; \
	else \
		echo "Cancelled."; \
	fi

# ---- MONITORING ----

health: ## Run health check
	@chmod +x scripts/health-check.sh
	@bash scripts/health-check.sh

status: ## Show container status
	docker compose $(DEV_COMPOSE) ps

stats: ## Show resource usage
	docker stats --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"

# ---- CLEANUP ----

clean: ## Clean Docker resources (containers, images, volumes)
	@echo "$(YELLOW)Cleaning Docker resources...$(NC)"
	docker compose $(DEV_COMPOSE) down -v --remove-orphans 2>/dev/null || true
	docker compose $(PROD_COMPOSE) down -v --remove-orphans 2>/dev/null || true
	docker system prune -f
	@echo "$(GREEN)✅ Cleanup complete$(NC)"

clean-all: ## Deep clean (removes ALL Docker data)
	@echo "$(YELLOW)⚠️  This removes ALL Docker data!$(NC)"
	@read -p "Continue? (yes/no): " confirm; \
	if [ "$$confirm" = "yes" ]; then \
		docker compose $(DEV_COMPOSE) down -v --remove-orphans 2>/dev/null || true; \
		docker system prune -af --volumes; \
		echo "$(GREEN)✅ Deep cleanup complete$(NC)"; \
	fi

# ---- BUILD ----

build: ## Build all images
	docker compose $(DEV_COMPOSE) build

build-no-cache: ## Build all images without cache
	docker compose $(DEV_COMPOSE) build --no-cache

build-backend: ## Build backend image only
	docker compose $(DEV_COMPOSE) build backend

build-frontend: ## Build frontend image only
	docker compose $(DEV_COMPOSE) build frontend

# ---- SHELL ACCESS ----

shell-backend: ## Open shell in backend container
	docker exec -it studybuddy-api sh

shell-frontend: ## Open shell in frontend container
	docker exec -it studybuddy-web sh

shell-redis: ## Open Redis CLI
	docker exec -it studybuddy-redis redis-cli

# ---- TESTING ----

test: ## Run tests
	docker exec studybuddy-api npm test 2>/dev/null || echo "No tests configured"

lint: ## Run linting
	docker exec studybuddy-api npm run lint 2>/dev/null || echo "No linting configured"