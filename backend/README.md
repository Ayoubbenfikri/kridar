# Kridar — Backend

Laravel 12 JSON API for Kridar (see `/kridar-architecture.md` at the project root for the full architecture, database schema and roadmap).

**Phase 2 status:** project initialized — Laravel skeleton, Sanctum wired for SPA (cookie) auth, CORS configured for the React dev server, and the folder structure (`Repositories`, `Services`, `Enums`, `Policies`, ...) is in place. No business logic yet — that starts in Phase 3 (migrations, models, factories, seeders).

## Requirements

- PHP 8.2+
- Composer 2.x
- (Nothing else for local dev — this project uses **SQLite**, so no separate database server to install/configure.)

## First-time setup (run once)

Open a terminal **in this `backend/` folder** and run:

```bash
composer install
copy .env.example .env        # Windows (PowerShell/CMD)
# cp .env.example .env        # if you're using Git Bash/WSL instead

php artisan key:generate
type nul > database\database.sqlite   # Windows — creates the empty SQLite file
# touch database/database.sqlite      # Git Bash/WSL equivalent

php artisan migrate
```

`composer install` downloads Laravel itself and every package into a `vendor/` folder — that folder is intentionally not included in what was delivered to you (it's regenerated from `composer.json`, same as `node_modules` for a JS project, and is already in `.gitignore`).

## Running the API

```bash
php artisan serve
```

This starts the API at **http://localhost:8000**. Visiting it in a browser should show:

```json
{"app":"Kridar","status":"Kridar API is running."}
```

And to confirm the `/api/v1` routing works, visit **http://localhost:8000/api/v1/ping** — you should see:

```json
{"status":"ok","app":"Kridar"}
```

## What's already configured

- **Sanctum (SPA/cookie auth)** — `bootstrap/app.php` calls `$middleware->statefulApi()`, and `config/sanctum.php` / `.env` list the frontend's dev origin (`localhost:5173`) as a stateful domain. Real login/register endpoints come in Phase 4.
- **CORS** — `config/cors.php` allows the origin(s) listed in `CORS_ALLOWED_ORIGINS` (`.env`) to call the API with credentials (cookies) included. Update this when the frontend's URL changes (e.g. in production).
- **Folder structure** — `app/Repositories`, `app/Services`, `app/Enums`, `app/Policies`, `app/Http/Controllers/Api/V1/{Auth,Owner,Admin}` all exist but are still empty (`.gitkeep` placeholders) — Phase 3 onward fills them in as each feature is built.
- **Routing** — `routes/api.php` is grouped under `/v1` from day one, so a future `/v2` won't break the frontend.

## Project structure reference

See the "Backend Folder Structure" and "Complete Architecture" sections of `/kridar-architecture.md` (project root) for why the code is organized this way (Controller → Service → Repository pattern).
