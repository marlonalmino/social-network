# Social Network (Monorepo)

## English

**Project Stack**
- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Backend: Laravel 12, Vite, Eloquent ORM, Queues, Socialite (GitHub/Google)
- Realtime: Laravel Echo + Reverb (WebSockets, Pusher protocol)
- Database: PostgreSQL

References:
- Frontend scripts in [package.json](file:///c:/repo/portfolio/03-socialnetwork/frontend/package.json)
- Backend scripts in [composer.json](file:///c:/repo/portfolio/03-socialnetwork/backend/composer.json) and [package.json](file:///c:/repo/portfolio/03-socialnetwork/backend/package.json)
- Database configuration in [database.php](file:///c:/repo/portfolio/03-socialnetwork/backend/config/database.php)
- Echo client in [echo.js](file:///c:/repo/portfolio/03-socialnetwork/backend/resources/js/echo.js) and Next client in [realtime.ts](file:///c:/repo/portfolio/03-socialnetwork/frontend/lib/realtime.ts)

**Prerequisites**
- Node.js 18+ and npm
- PHP 8.2+
- Composer
- PostgreSQL 14+ and psql CLI

**Project Structure**
- `frontend/` — Next.js app
- `backend/` — Laravel API + Vite assets and realtime broadcasting

**Environment Setup**
1) Frontend
- Copy `frontend/.env.example` to `frontend/.env.local`
- Set values:
  - `NEXT_PUBLIC_BACKEND_URL` (e.g. http://localhost:8000)
  - `NEXT_PUBLIC_REVERB_KEY`, `NEXT_PUBLIC_REVERB_HOST`, `NEXT_PUBLIC_REVERB_PORT`, `NEXT_PUBLIC_REVERB_SCHEME`

2) Backend
- Copy `backend/.env.example` to `backend/.env`
- Generate app key: `php artisan key:generate`
- Configure Postgres:
  - `DB_CONNECTION=pgsql`
  - `DB_HOST=127.0.0.1`
  - `DB_PORT=5432`
  - `DB_DATABASE=backend`
  - `DB_USERNAME` and `DB_PASSWORD` to match your local user
- Set `FRONTEND_URL=http://localhost:3000`
- For OAuth (optional): set `GITHUB_*` and `GOOGLE_*`
- For realtime (WebSockets): set `REVERB_*` and `VITE_REVERB_*`
- To enable broadcasting via Reverb: `BROADCAST_CONNECTION=reverb`

**Create the Database (psql)**
Use psql to create a dedicated user and database:

```sql
-- Connect as a superuser (default is 'postgres')
-- In terminal: psql -U postgres

CREATE USER backend_user WITH PASSWORD 'backend_password';
ALTER ROLE backend_user CREATEDB;

CREATE DATABASE backend OWNER backend_user;
GRANT ALL PRIVILEGES ON DATABASE backend TO backend_user;
```

Update `backend/.env`:
```
DB_DATABASE=backend
DB_USERNAME=backend_user
DB_PASSWORD=backend_password
```

Run migrations:
```
php artisan migrate
```

**Install Dependencies**
Frontend:
```
cd frontend
npm install
```

Backend:
```
cd backend
composer install
npm install
```

**Run in Development**
Option A (one command, recommended):
```
cd backend
composer run dev
```
- Starts PHP server, queue worker, and Vite dev server
- In another terminal, start Reverb (WebSockets):
```
php artisan reverb:start
```

Then start the Next.js app:
```
cd frontend
npm run dev
```
Visit http://localhost:3000

Option B (manual processes):
```
cd backend
php artisan serve
php artisan queue:listen --tries=1
npm run dev
php artisan reverb:start
```
And in `frontend/`:
```
npm run dev
```

**Troubleshooting**
- If Echo cannot connect, verify `REVERB_*` and `NEXT_PUBLIC_REVERB_*` values match and the Reverb server is running.
- For OAuth, ensure redirect URIs match values in `backend/.env` (`/auth/{provider}/callback`) and app settings at the providers.
- If migrations fail, confirm Postgres credentials and permissions in `psql`.

---

## Português

**Stack do Projeto**
- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Backend: Laravel 12, Vite, Eloquent ORM, Filas, Socialite (GitHub/Google)
- Realtime: Laravel Echo + Reverb (WebSockets, protocolo Pusher)
- Banco de dados: PostgreSQL

Referências:
- Scripts do frontend em [package.json](file:///c:/repo/portfolio/03-socialnetwork/frontend/package.json)
- Scripts do backend em [composer.json](file:///c:/repo/portfolio/03-socialnetwork/backend/composer.json) e [package.json](file:///c:/repo/portfolio/03-socialnetwork/backend/package.json)
- Configuração do banco em [database.php](file:///c:/repo/portfolio/03-socialnetwork/backend/config/database.php)
- Cliente Echo em [echo.js](file:///c:/repo/portfolio/03-socialnetwork/backend/resources/js/echo.js) e cliente Next em [realtime.ts](file:///c:/repo/portfolio/03-socialnetwork/frontend/lib/realtime.ts)

**Pré-requisitos**
- Node.js 18+ e npm
- PHP 8.2+
- Composer
- PostgreSQL 14+ e psql

**Estrutura**
- `frontend/` — app Next.js
- `backend/` — API Laravel + assets Vite e broadcasting

**Configuração de Ambiente**
1) Frontend
- Copie `frontend/.env.example` para `frontend/.env.local`
- Defina:
  - `NEXT_PUBLIC_BACKEND_URL` (ex: http://localhost:8000)
  - `NEXT_PUBLIC_REVERB_KEY`, `NEXT_PUBLIC_REVERB_HOST`, `NEXT_PUBLIC_REVERB_PORT`, `NEXT_PUBLIC_REVERB_SCHEME`

2) Backend
- Copie `backend/.env.example` para `backend/.env`
- Gere a chave: `php artisan key:generate`
- Configure Postgres:
  - `DB_CONNECTION=pgsql`
  - `DB_HOST=127.0.0.1`
  - `DB_PORT=5432`
  - `DB_DATABASE=backend`
  - `DB_USERNAME` e `DB_PASSWORD` conforme seu usuário local
- Ajuste `FRONTEND_URL=http://localhost:3000`
- Para OAuth (opcional): preencha `GITHUB_*` e `GOOGLE_*`
- Para realtime (WebSockets): preencha `REVERB_*` e `VITE_REVERB_*`
- Para habilitar broadcasting via Reverb: `BROADCAST_CONNECTION=reverb`

**Criar o Banco com psql**
No psql:
```sql
-- Conecte como superusuário (padrão 'postgres')
-- No terminal: psql -U postgres

CREATE USER backend_user WITH PASSWORD 'backend_password';
ALTER ROLE backend_user CREATEDB;

CREATE DATABASE backend OWNER backend_user;
GRANT ALL PRIVILEGES ON DATABASE backend TO backend_user;
```

Atualize `backend/.env`:
```
DB_DATABASE=backend
DB_USERNAME=backend_user
DB_PASSWORD=backend_password
```

Execute migrações:
```
php artisan migrate
```

**Rodar em Desenvolvimento**
Opção A (um comando, recomendado):
```
cd backend
composer run dev
```
- Inicie o Reverb em outro terminal:
```
php artisan reverb:start
```

Depois o Next.js:
```
cd frontend
npm run dev
```
Acesse http://localhost:3000

Opção B (processos manuais):
```
cd backend
php artisan serve
php artisan queue:listen --tries=1
npm run dev
php artisan reverb:start
```
E em `frontend/`:
```
npm run dev
```

**Resolução de Problemas**
- Se o Echo não conectar, verifique variáveis `REVERB_*` e `NEXT_PUBLIC_REVERB_*` e se o servidor Reverb está ativo.
- Para OAuth, confirme URIs de retorno no `.env` e nas configurações dos provedores.
- Em falhas de migração, confira credenciais e permissões no Postgres.

