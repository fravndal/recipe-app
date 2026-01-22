up:
	cd supabase && docker compose up -d

down:
	cd supabase && docker compose down

dev:
	cd apps/web && npm run dev

build:
	cd apps/web && npm run build

lint:
	cd apps/web && npm run lint

logs:
	cd supabase && docker compose logs -f

restart:
	cd supabase && docker compose restart

.PHONY: up down dev build lint logs restart