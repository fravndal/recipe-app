# Recipe Planner - Web Frontend

A mobile-first Progressive Web App (PWA) for managing recipes, ingredients, and shopping lists.

## Tech Stack

- **React 19** - UI framework
- **Vite 7** - Build tool with HMR
- **Tailwind CSS v4** - Utility-first styling
- **React Router v6** - Client-side routing
- **Supabase JS** - Backend client (auth + database)
- **React Hook Form + Zod** - Form handling and validation
- **Lucide React** - Icons
- **Vite PWA** - Service worker and offline support

## Prerequisites

- Node.js 18+
- npm or pnpm
- Running Supabase backend (see `supabase/` directory)

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create a `.env` file in this directory:

```bash
# Supabase connection
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

To generate the anon key:
1. Use your JWT secret from `supabase/.env`
2. Generate keys at https://supabase.com/docs/guides/self-hosting#api-keys
3. Or copy from Supabase Studio at http://localhost:54323/project/default/settings/api

### 3. Start development server

```bash
npm run dev
```

The app will be available at http://localhost:5173

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

## Project Structure

```
src/
├── components/
│   ├── ui/              # Base UI components (Button, Input, Card, etc.)
│   └── layout/          # Layout components (Shell, Header, BottomNav)
├── pages/
│   ├── auth/            # Login, Register
│   ├── recipes/         # Recipe list, detail, form
│   ├── ingredients/     # Ingredient list, form
│   ├── shopping/        # Shopping lists
│   └── pantry/          # Pantry management
├── hooks/
│   ├── useAuth.jsx      # Authentication hook
│   └── useOfflineSync.jsx # Offline data sync
├── lib/
│   ├── supabase.js      # Supabase client
│   ├── db.js            # IndexedDB for offline
│   └── utils.js         # Utility functions
├── App.jsx              # Router and providers
├── main.jsx             # Entry point
└── index.css            # Global styles and Tailwind
```

## Features

### Authentication
- Email/password sign up and sign in
- Protected routes with automatic redirect
- Persistent sessions

### Recipes
- Create, edit, delete recipes
- Add ingredients with quantities and units
- Tag recipes for organization
- Search and filter

### Ingredients
- Build your ingredient library
- Organize by category (Produce, Dairy, etc.)
- Set default units

### Shopping Lists
- Create multiple shopping lists
- Add recipes with servings multiplier (auto-scales quantities)
- Automatic duplicate merging
- Check off items while shopping
- Mark lists as complete

### Pantry
- Track what you have at home
- Helps avoid buying duplicates

### Offline Support
- Shopping list cached in IndexedDB
- Works offline in the store
- Syncs when back online
- Visual offline indicator

### PWA
- Installable on mobile devices
- Service worker for caching
- Standalone display mode

## Mobile-First Design

The app is designed for mobile use:
- Bottom navigation for thumb access
- Large touch targets (min 44px)
- Floating action buttons for primary actions
- Safe area support for notched phones
- Pull-to-refresh patterns

## Building for Production

```bash
npm run build
```

Output is in `dist/`. Deploy to any static host:
- Cloudflare Pages
- Vercel
- Netlify
- GitHub Pages

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Supabase API URL | `http://localhost:54321` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGciOiJI...` |

For production, use your Supabase Cloud project URL and keys.
