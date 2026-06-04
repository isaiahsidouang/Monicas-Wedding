# Setup Guide

## 1. Google Cloud — OAuth + Gmail API

1. Go to https://console.cloud.google.com → New Project → name it "Monica Wedding"
2. Enable APIs: search "Gmail API" → Enable
3. OAuth consent screen → External → fill in app name, your email
4. Credentials → Create Credentials → OAuth 2.0 Client ID → Web application
5. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (dev)
   - `https://YOUR-VERCEL-URL.vercel.app/api/auth/callback/google` (prod)
6. Copy Client ID and Client Secret

## 2. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
AUTH_SECRET=<run: openssl rand -base64 32>
ANTHROPIC_API_KEY=...
NEXTAUTH_URL=http://localhost:3000
```

## 3. Run locally

```bash
npm run dev
```

Open http://localhost:3000 — Monica signs in with her Google account.

## 4. Deploy to Vercel

```bash
npx vercel
```

Add all env vars in Vercel dashboard → Settings → Environment Variables.
Update `NEXTAUTH_URL` to your Vercel URL.
Add the Vercel URL to Google Cloud authorized redirect URIs.

## Gmail permissions granted on sign-in

- `gmail.readonly` — read emails to scan for venues
- `gmail.compose` — create drafts (does NOT send without Monica's action)
