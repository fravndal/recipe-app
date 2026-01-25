# Recipe App - Project Rules

## Overview

Norwegian recipe planning PWA with offline support. Built with React + Vite frontend and self-hosted Supabase backend.

## Tech Stack

- **Frontend**: React 19, Vite 7, TailwindCSS 4, React Router v7
- **Backend**: Self-hosted Supabase (PostgreSQL, PostgREST, GoTrue, Kong)
- **Styling**: Tailwind CSS v4 with custom shadcn-style components
- **State**: React Context for auth, local state for components
- **Offline**: IndexedDB via custom hooks for shopping lists

## Quick Reference

| Topic | Rule File |
|-------|-----------|
| System Architecture | [architecture.md](architecture.md) |
| Docker Setup | [docker.md](docker.md) |
| Database Schema | [database.md](database.md) |
| UI Components | [components.md](components.md) |
| Theme & Styling | [theme.md](theme.md) |

## Language Conventions

- **User-facing text**: Norwegian (Bokmål)
- **Code & comments**: English
- **Documentation**: English

## Project Structure

```
recipe-app/
├── apps/web/                 # React PWA frontend
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   │   ├── layout/       # Shell, Header, BottomNav, EmptyState
│   │   │   └── ui/           # Button, Input, Dialog, Card, etc.
│   │   ├── hooks/            # useAuth, useOfflineSync
│   │   ├── lib/              # supabase.js, db.js, utils.js
│   │   └── pages/            # Route components
│   │       ├── auth/         # Login, Register
│   │       ├── recipes/      # RecipesList, RecipeDetail, RecipeForm
│   │       ├── ingredients/  # IngredientsList, IngredientForm
│   │       ├── shopping/     # ShoppingLists, ShoppingListDetail
│   │       └── pantry/       # PantryList
│   └── .env                  # Frontend environment variables
├── supabase/                 # Backend configuration
│   ├── docker-compose.yml    # 7 Supabase services
│   ├── kong.yml              # API Gateway routes
│   ├── config.toml           # Supabase CLI config
│   └── migrations/           # SQL migrations (001-011)
├── scripts/                  # Utility scripts (generate-keys.js)
├── docs/                     # Additional documentation
└── Makefile                  # Development commands
```

## Commands

```bash
make up        # Start Supabase services (Docker)
make down      # Stop Supabase services
make dev       # Start frontend dev server (port 5173)
make build     # Build frontend for production
make logs      # View Supabase container logs
make restart   # Restart Supabase services
```

## Environment Variables

### Frontend (`apps/web/.env`)
```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<jwt-token>
```

### Backend (`supabase/.env`)
```env
POSTGRES_PASSWORD=<password>
POSTGRES_DB=postgres
POSTGRES_USER=postgres
JWT_SECRET=<secret>
ANON_KEY=<jwt>
SERVICE_ROLE_KEY=<jwt>
SITE_URL=http://localhost:5173
API_EXTERNAL_URL=http://localhost:54321
STUDIO_PORT=54323
PG_META_CRYPTO_KEY=<key>
```

## Coding Conventions

1. **Imports**: Group by external → internal → relative
2. **State**: `useState` for local, Context for shared (auth)
3. **API calls**: Always handle errors, show loading states via `<Spinner />`
4. **Forms**: Use controlled components with validation
5. **Styling**: Tailwind utilities, use `cn()` for class merging

## Common Patterns

### Data Fetching
```jsx
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  loadData();
}, []);

const loadData = async () => {
  const { data, error } = await supabase
    .from("table")
    .select("*");
  if (!error) setData(data);
  setLoading(false);
};
```

### Protected Routes
All authenticated routes check `useAuth()` for user session. Unauthenticated users redirect to `/login`.

### Error Handling
```jsx
if (error.code === "23503") {
  // Foreign key violation
} else if (error.code === "23505") {
  // Unique constraint violation  
} else if (error.code === "42501") {
  // RLS policy violation
}
```

## Key Files

| File | Purpose |
|------|---------|
| `App.jsx` | Routing setup with protected/public routes |
| `useAuth.jsx` | Authentication context and session management |
| `useOfflineSync.jsx` | Offline sync for shopping lists |
| `supabase.js` | Supabase client configuration |
| `db.js` | IndexedDB operations for offline support |
