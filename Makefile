.PHONY: dev dev-down seed test lint

dev:
	docker compose up -d

dev-down:
	docker compose down

seed:
	docker compose exec api python scripts/seed.py

test:
	cd backend && pytest tests/ -v

lint:
	cd backend && ruff check app/ tests/ && ruff format --check app/ tests/
