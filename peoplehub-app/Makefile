.PHONY: help install sync-deps logs restart shell

help: ## Show this help message
	@echo "PeopleHub Development Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies (host + container)
	@echo "📦 Installing dependencies..."
	npm install
	docker exec peoplehub-app-dev npm install
	@echo "✅ Done!"

sync-deps: install ## Alias for install

logs: ## Show container logs
	docker logs -f --tail 100 peoplehub-app-dev

restart: ## Restart container
	docker restart peoplehub-app-dev
	@echo "✅ Container restarted"

shell: ## Open shell in container
	docker exec -it peoplehub-app-dev sh

dev: ## Start development mode
	docker-compose up -d
	@echo "✅ Development server started"
	make logs

stop: ## Stop all containers
	docker-compose down
	@echo "✅ Containers stopped"
