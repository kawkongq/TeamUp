# Secret & Environment Configuration

## Overview

All production secrets should be stored in your deploy platform’s secret manager (Vercel Environment Variables, AWS Secrets Manager, Fly.io Secrets, etc.). The repository now ships with placeholder values only – deploy pipelines must inject the real values at runtime.

The application expects the following keys:

| Key | Description | Notes |
| --- | --- | --- |
| `MONGODB_URI` | MongoDB Atlas connection string | Use an SRV string with credentials scoped to the app. |
| `NEXTAUTH_SECRET` | HMAC/crypto secret for session signing | Minimum 32 random bytes (use `openssl rand -base64 32`). |
| `NEXTAUTH_URL` | Absolute URL of the Next.js app | e.g. `https://app.example.com`. |
| `NEXT_PUBLIC_APP_URL` | Public URL exposed to the browser | Usually the same as `NEXTAUTH_URL`. |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Required once Google Sign-In is enabled. |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Store alongside the client ID. |

## Recommended Workflow

1. **Generate secrets locally**  
   ```bash
   openssl rand -base64 32    # for NEXTAUTH_SECRET
   ```

2. **Store them in your secret manager** (examples shown for Vercel):
   ```bash
   vercel env add MONGODB_URI
   vercel env add NEXTAUTH_SECRET
   vercel env add NEXTAUTH_URL
   vercel env add NEXT_PUBLIC_APP_URL
   vercel env add GOOGLE_CLIENT_ID
   vercel env add GOOGLE_CLIENT_SECRET
   ```

3. **Inject on build/deploy**  
   Ensure your CI / deploy pipeline exports these variables before running `npm run build` or starting the Next.js server.

4. **Local development**  
   - `.env.local` now defaults to a local MongoDB instance.  
   - Override with your own Atlas URI locally if needed (do **not** commit private credentials).
   - Regenerate `NEXTAUTH_SECRET` for local testing when required.

## Rotating Secrets

- Rotate `NEXTAUTH_SECRET` whenever credentials leak or on a regular schedule. All sessions will be invalidated when the secret changes.
- Rotate MongoDB users/passwords as part of incident response or compliance routines.
- Google OAuth secrets should be rotated through Google Cloud Console; update the secret manager and redeploy immediately afterwards.

## Auditing

- Periodically scan the repository for accidental secrets (e.g. `git secrets --scan` or GitHub secret scanning).
- Lock down write permissions to the secret manager and log access via your platform’s audit tooling.
