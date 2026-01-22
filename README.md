# Recipe Planner

En mobiloptimalisert PWA for oppskrifter, ingredienser og handlelister. Bygget med React og Supabase.

## Funksjoner

- **Oppskrifter** - Lag og organiser oppskrifter med ingredienser og tagger
- **Ingredienser** - Bygg ditt eget ingrediensbibliotek med kategorier
- **Handlelister** - Legg til oppskrifter og se hva du har på lager
- **Offline** - Handlelisten fungerer uten nett

## Oppsett fra scratch

### Forutsetninger

- Node.js 18+
- Docker og Docker Compose

### Steg 1: Klon og installer

```bash
git clone <repo-url>
cd recipe-app

# Installer dependencies
npm install
cd apps/web && npm install && cd ../..
```

### Steg 2: Konfigurer backend

```bash
cd supabase

# Kopier eksempel-config
cp .env.example .env
```

Rediger `supabase/.env` med disse verdiene:

```env
POSTGRES_PASSWORD=your-secure-password
POSTGRES_DB=postgres
POSTGRES_USER=postgres

JWT_SECRET=min-hemmelige-jwt-nøkkel-som-er-minst-32-tegn

SITE_URL=http://localhost:5173
API_EXTERNAL_URL=http://localhost:54321
STUDIO_PORT=54323
PG_META_CRYPTO_KEY=tilfeldig-krypto-nøkkel
```

### Steg 3: Generer API-nøkler

```bash
# Fra prosjektets rot-mappe
node scripts/generate-keys.js "min-hemmelige-jwt-nøkkel-som-er-minst-32-tegn"
```

Dette gir deg `ANON_KEY` og `SERVICE_ROLE_KEY`. Legg disse til i `supabase/.env`:

```env
ANON_KEY=<kopier fra output>
SERVICE_ROLE_KEY=<kopier fra output>
```

### Steg 4: Start backend

```bash
make up
# eller: cd supabase && docker compose up -d
```

Vent til alle containere kjører:

```bash
cd supabase && docker compose ps
```

### Steg 5: Kjør database-migrasjoner

```bash
cd supabase

# Kjør alle migrasjoner
for f in migrations/*.sql; do
  docker exec -i supabase-db psql -U postgres -d postgres < "$f"
done
```

### Steg 6: Sett opp database-roller

```bash
docker exec supabase-db psql -U postgres -d postgres -c "
CREATE SCHEMA IF NOT EXISTS auth;
CREATE ROLE service_role NOINHERIT NOLOGIN BYPASSRLS;
CREATE ROLE authenticator NOINHERIT LOGIN PASSWORD 'postgres';
GRANT anon TO authenticator;
GRANT authenticated TO authenticator;
GRANT service_role TO authenticator;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
"
```

### Steg 7: Konfigurer frontend

Lag `apps/web/.env`:

```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<samme ANON_KEY fra steg 3>
```

### Steg 8: Start frontend

```bash
make dev
# eller: cd apps/web && npm run dev
```

Åpne http://localhost:5173 i nettleseren.

### Steg 9: Registrer bruker

1. Gå til http://localhost:5173/register
2. Opprett en bruker med e-post og passord
3. Logg inn og begynn å bruke appen!

## Kommandoer

| Kommando | Beskrivelse |
|----------|-------------|
| `make up` | Start Supabase backend |
| `make down` | Stopp backend |
| `make dev` | Start frontend dev server |
| `make logs` | Se backend-logger |

## Prosjektstruktur

```
recipe-app/
├── apps/web/          # React frontend
│   ├── src/
│   │   ├── components/  # UI-komponenter
│   │   ├── pages/       # Sider (routes)
│   │   ├── hooks/       # React hooks
│   │   └── lib/         # Utilities
│   └── .env             # Frontend-config
├── supabase/          # Backend
│   ├── migrations/      # SQL-migrasjoner
│   ├── docker-compose.yml
│   └── .env             # Backend-config
├── scripts/           # Hjelpeskript
└── .cursor/rules/     # AI-dokumentasjon
```

## Tjenester (etter `make up`)

| Tjeneste | URL | Beskrivelse |
|----------|-----|-------------|
| API Gateway | http://localhost:54321 | Hoved-API (Kong) |
| Studio | http://localhost:54323 | Database admin UI |
| Database | localhost:54322 | PostgreSQL |

## Feilsøking

### "Connection refused" på port 54321

Backend kjører ikke. Kjør `make up` og vent til alle containere er oppe.

### "JWSInvalidSignature"

JWT-nøklene matcher ikke. Sørg for at:
1. `JWT_SECRET` i `supabase/.env` er lik
2. `ANON_KEY` ble generert med samme secret
3. `VITE_SUPABASE_ANON_KEY` er lik `ANON_KEY`

Regenerer nøkler med `node scripts/generate-keys.js "din-jwt-secret"`.

### "role does not exist"

Kjør database-rollene fra Steg 6 på nytt.

### RLS policy violation (42501)

Brukeren er ikke logget inn, eller `auth.users.role` er tom. Fiks med:

```bash
docker exec supabase-db psql -U postgres -d postgres -c \
  "UPDATE auth.users SET role = 'authenticated' WHERE role IS NULL OR role = '';"
```

Logg ut og inn igjen for å få ny token.

## Dokumentasjon

- `docs/ARCHITECTURE.md` - Systemarkitektur med diagrammer
- `.cursor/rules/` - Detaljert dokumentasjon for AI/utviklere:
  - `project.md` - Prosjektoversikt og konvensjoner
  - `components.md` - Komponent-referanse
  - `database.md` - Database-skjema

## Lisens

MIT
