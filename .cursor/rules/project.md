# Recipe App - Project Rules

## Overview

This is a Norwegian recipe planning PWA with offline support. Built with React + Vite frontend and self-hosted Supabase backend.

## Tech Stack

- **Frontend**: React 18, Vite, TailwindCSS, React Router v6
- **Backend**: Self-hosted Supabase (PostgreSQL, PostgREST, GoTrue, Kong)
- **Styling**: Tailwind CSS with custom shadcn-style components
- **State**: React Context for auth, local state for components
- **Offline**: IndexedDB via custom hooks

## Language

All user-facing text should be in **Norwegian (Bokmål)**. Code, comments, and documentation remain in English.

## Project Structure

```
recipe-app/
├── apps/web/                 # React frontend
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   │   ├── layout/       # Page structure (Shell, Header, etc.)
│   │   │   └── ui/           # UI primitives (Button, Input, etc.)
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utilities and clients
│   │   └── pages/            # Route components
│   └── .env                  # Frontend environment variables
├── supabase/                 # Backend configuration
│   ├── docker-compose.yml    # All Supabase services
│   ├── kong.yml              # API Gateway config
│   └── migrations/           # SQL migrations
├── scripts/                  # Utility scripts
└── docs/                     # Documentation
```

## Commands

```bash
make up        # Start Supabase services
make down      # Stop Supabase services
make dev       # Start frontend dev server
make logs      # View Supabase logs
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

## Database Schema

### Core Tables
- `ingredients` - User's ingredient library
- `recipes` - Recipe definitions
- `recipe_ingredients` - Junction table with quantities
- `tags` - Recipe tags
- `recipe_tags` - Recipe-tag associations

### Shopping & Pantry
- `shopping_lists` - Shopping list metadata
- `shopping_list_items` - Items in lists (links to ingredients, optionally to source recipe)
- `pantry_items` - What user has at home

### Security
All tables use Row Level Security (RLS) with `auth.uid() = user_id` policies.

## Component Guidelines

### UI Components (`components/ui/`)
- Stateless, reusable primitives
- Accept className for styling overrides
- Use `cn()` utility for class merging
- Follow shadcn/ui patterns

### Layout Components (`components/layout/`)
- `Shell` - Main page wrapper with header and navigation
- `Header` - Top app bar
- `BottomNav` - Mobile bottom navigation
- `EmptyState` - Placeholder for empty lists

### Page Components (`pages/`)
- One component per route
- Handle data fetching internally
- Use `useAuth()` for user context
- Use `supabase` client for API calls

## Coding Conventions

1. **Imports**: Group by external, internal, relative
2. **State**: useState for local, Context for shared
3. **API calls**: Always handle errors, show loading states
4. **Forms**: Use react-hook-form + zod for validation
5. **Styling**: Tailwind utilities, no inline styles

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
All authenticated routes check `useAuth()` for user session.

### Error Handling
```jsx
if (error.code === "23503") {
  // Foreign key violation
} else if (error.code === "42501") {
  // RLS policy violation
}
```
