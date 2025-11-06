# TeamUp

TeamUp is a Next.js application that helps people discover collaborators, form teams, and manage hackathon-style events. It bundles user profiles, team management, event creation, and chat features in a single experience backed by MongoDB.

## Tech stack

- Next.js 15 (App Router) with React 19 and TypeScript
- Tailwind CSS for styling
- MongoDB + Mongoose for data storage
- Custom credential-based auth with signed cookies

## Requirements

- Node.js 20.x (minimum 18.17, 20.x recommended)
- npm 10+
- A running MongoDB instance (local or Atlas)

## Getting started

```bash
npm install
cp .env .env.local   # adjust values as needed
# ensure MongoDB is running locally or point to Atlas
npm run dev
```

Visit http://localhost:3000 to use the app. The dev server hot-reloads on changes.

### MongoDB

The default configuration points to a local instance at `mongodb://127.0.0.1:27017/teamup`. Start MongoDB before launching `npm run dev`. For a detailed setup (including seeding users and profiles) refer to `MONGODB_SETUP.md`.

Optional seed scripts:

```bash
npm run db:seed-mongodb   # populate MongoDB with sample data
npm run db:seed           # legacy seed script (Prisma-based)
```

## Environment configuration

| Key | Purpose | Notes |
| --- | --- | --- |
| `MONGODB_URI` | Connection string for MongoDB | Use SRV URL for Atlas; keep credentials in secrets |
| `NEXTAUTH_URL` | Absolute URL of the app | `http://localhost:3000` in dev |
| `NEXTAUTH_SECRET` | Secret for signing auth cookies/tokens | Generate a strong random string |
| `NEXT_PUBLIC_APP_URL` | Public base URL exposed to the client | Mirrors `NEXTAUTH_URL` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Reserved for Google login integration | Only required once OAuth is enabled |

- **Development**: use `.env.local` (never commit secrets).
- **Production**: inject values through your hosting provider’s secret manager. The committed `.env.production` file documents required keys but must not contain real credentials.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js dev server |
| `npm run dev:turbo` | Start dev server with Turbopack |
| `npm run lint` | Lint the codebase with ESLint |
| `npm run test` | Run Node.js test files in `tests/` |
| `npm run build` | Create an optimized production build |
| `npm run start` | Serve the production build |
| `npm run db:seed-mongodb` | Seed MongoDB with demo data |
| `npm run db:seed` | Seed via Prisma scripts (legacy) |

Recommended quality checks before committing:

```bash
npm run lint
npm run test
npm run build
```

## Deployment checklist

- [ ] Configure `MONGODB_URI`, `NEXTAUTH_SECRET`, and other secrets in your platform’s secret manager.
- [ ] Ensure the MongoDB cluster (Atlas or self-hosted) allows connections from your runtime environment.
- [ ] Run `npm run build` and resolve any warnings/errors.
- [ ] Clear remaining `@ts-nocheck` directives and verify `npm run lint` passes.
- [ ] Add automated coverage for critical flows (signup/login, teams, chat) to reduce regression risk.
- [ ] Review logs for sensitive payloads before enabling production logging.

Once these items are complete you can deploy the app with `npm run build` followed by `npm run start` (or the equivalent command provided by your hosting platform). For additional hardening guidelines, track the outstanding tasks listed in your internal backlog (auth improvements, Google login, validation cleanup, etc.).
