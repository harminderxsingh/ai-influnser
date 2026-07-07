# ai-influnser

AI influencer / avatar platform with Node.js backend, React frontend, payments, credits, referrals, and admin panel.

## Setup

1. Copy `.env.example` → `.env` and `client/.env.example` → `client/.env`
2. Configure `config.json` (database, JWT, URLs) or run `/setup` wizard
3. `npm install` and `npm --prefix client install`
4. `npm run build:site` (creates `client/build`)
5. `npm start`

Server serves the React app from `client/build`. Uploaded files stay in `client/public/media`.

## Live domain

Configured for: https://myavatarlab.com
