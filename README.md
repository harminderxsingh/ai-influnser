# ai-influnser

AI influencer / avatar platform with Node.js backend, React frontend, payments, credits, referrals, and admin panel.

## Local development

1. Copy `.env.example` → `.env` and `client/.env.example` → `client/.env`
2. Configure `config.json` or run `/setup`
3. `npm install` and `npm --prefix client install`
4. `npm start` (backend) and `npm --prefix client start` (frontend dev)

## Production build (local only, then git push)

```bash
npm run build:site
```

This builds React to `client/build`, then copies output into `client/public` (keeps `media/` and `assets/`). Commit `client/public` and push. Server does not build on deploy.

## cPanel deploy

Server only runs `npm install --production` and restarts Node.

## Live domain

https://myavatarlab.com
