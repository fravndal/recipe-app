# Architecture

Recipe Planner - a mobile-first PWA for managing recipes, ingredients, and shopping lists.

> **Note**: For detailed component reference and coding conventions, see `.cursor/rules/`.

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (PWA)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐│
│  │  React   │  │ Tailwind │  │  Vite    │  │  Service Worker  ││
│  │  Router  │  │   CSS    │  │   PWA    │  │   + IndexedDB    ││
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS / localhost:54321
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase Backend (Docker)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐│
│  │   Kong   │  │ PostgREST│  │  GoTrue  │  │    PostgreSQL    ││
│  │ Gateway  │──│   REST   │──│   Auth   │──│    Database      ││
│  │  :54321  │  │  :54324  │  │  :54325  │  │     :54322       ││
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## Database Schema

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│  ingredients │     │ recipe_ingredients│     │   recipes    │
├──────────────┤     ├──────────────────┤     ├──────────────┤
│ id (PK)      │◄────│ ingredient_id    │     │ id (PK)      │
│ user_id (FK) │     │ recipe_id        │────►│ user_id (FK) │
│ name         │     │ quantity         │     │ title        │
│ category     │     │ unit             │     │ description  │
│ default_unit │     │ note             │     │ instructions │
└──────────────┘     └──────────────────┘     │ servings     │
                                              └──────────────┘
                                                     │
                     ┌──────────────┐               │
                     │ recipe_tags  │               │
                     ├──────────────┤               │
                     │ recipe_id    │───────────────┘
                     │ tag_id       │───────┐
                     └──────────────┘       │
                                            ▼
                                      ┌──────────────┐
                                      │    tags      │
                                      ├──────────────┤
                                      │ id (PK)      │
                                      │ user_id (FK) │
                                      │ name         │
                                      │ color        │
                                      └──────────────┘

┌──────────────────┐     ┌───────────────────────┐
│  shopping_lists  │     │  shopping_list_items  │
├──────────────────┤     ├───────────────────────┤
│ id (PK)          │◄────│ shopping_list_id      │
│ user_id (FK)     │     │ ingredient_id         │────► ingredients
│ name             │     │ quantity              │
│ status           │     │ unit                  │
└──────────────────┘     │ checked               │
                         │ recipe_source_id      │────► recipes
                         └───────────────────────┘

┌──────────────────┐
│   pantry_items   │
├──────────────────┤
│ id (PK)          │
│ user_id (FK)     │
│ ingredient_id    │────► ingredients
│ quantity         │
│ unit             │
└──────────────────┘
```

All tables use Row Level Security: `auth.uid() = user_id`

## Offline Sync Flow

```
User Action (offline)
        │
        ▼
┌───────────────────┐
│ Update IndexedDB  │
│ (optimistic)      │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ Queue pending op  │
└───────────────────┘
        │
        ▼
┌───────────────────┐     ┌───────────────────┐
│ Online?           │────►│ Sync to Supabase  │
└───────────────────┘ yes └───────────────────┘
        │ no                       │
        ▼                          ▼
┌───────────────────┐     ┌───────────────────┐
│ Wait for online   │────►│ Clear pending ops │
└───────────────────┘     └───────────────────┘
```

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Self-hosted Supabase | Full control, no vendor lock-in, cost-effective |
| No state management library | App is simple enough for React Context + local state |
| IndexedDB for offline | Shopping lists work in stores without network |
| Norwegian UI | Target audience is Norwegian users |
| Mobile-first | Primary use case is shopping in stores |
| shadcn-style components | Light, customizable, no heavy UI library |

## Services

| Service | Port | Purpose |
|---------|------|---------|
| Kong | 54321 | API Gateway (main entry point) |
| PostgREST | 54324 | Auto-generated REST API |
| GoTrue | 54325 | Authentication (JWT) |
| PostgreSQL | 54322 | Database |
| Studio | 54323 | Admin dashboard |
| Storage | 54326 | File storage |
| Meta | 54327 | Database metadata |
