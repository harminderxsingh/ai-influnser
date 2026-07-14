# ai-influnser

AI influencer / avatar platform with Node.js backend, React frontend, payments, credits, referrals, and admin panel.

## Local development (development branch)

Uses a **separate DB + ports** so production `config.json` / live DB stay untouched.

| | Development | Production |
|--|--|--|
| Config | `config.development.json` | `config.json` |
| Database | `ai_influncer_dev` | `ai_influncer` |
| API | http://localhost:8002 | http://localhost:8001 |
| Frontend (CRA) | http://localhost:3000 | built into `client/public` |

1. Create the dev database (once):

```bash
mysql -u root -e "CREATE DATABASE IF NOT EXISTS ai_influncer_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

2. Install deps: `npm install` and `npm --prefix client install`

3. Run both servers:

```bash
npm run dev
```

- Backend loads `.env.development` + `config.development.json`
- CRA loads `client/.env.development` → API at `:8002`
- Open **http://localhost:3000** (hot reload, no build)

Or separately: `npm run start:dev` and `npm run client:dev`.

## Production build (local only, then git push)

```bash
npm run build:site
```

This builds React to `client/build`, then copies output into `client/public` (keeps `media/` and `assets/`). Commit `client/public` and push. Server does not build on deploy.

## cPanel deploy

Server only runs `npm install --production` and restarts Node.

## Live domain

https://myavatarlab.com
