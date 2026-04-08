# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Contains the المؤسسة الوطنية (Al-Mossah Al-Wataniyah) website — a complete Arabic RTL institutional website with a full admin dashboard.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS v4 + Framer Motion (Arabic RTL)
- **API framework**: Express 5 + express-session
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Arabic Font**: Tajawal (Google Fonts)

## Project Structure

- `artifacts/almossah` — Frontend React + Vite app (Arabic RTL website)
- `artifacts/api-server` — Express 5 API server
- `lib/db` — Drizzle ORM schemas and database client
- `lib/api-spec` — OpenAPI spec
- `lib/api-client-react` — Generated React Query hooks
- `lib/api-zod` — Generated Zod validation schemas

## Admin Dashboard Credentials

- **Username**: `admin`
- **Password**: `admin123`
- **URL**: `/admin/dashboard` (login via `/admin/login`)

## Color Scheme (from logo)

- Deep Red: `#8B0000`
- Bright Red: `#CC0000`
- Forest Green: `#2D5A27`
- White: `#FFFFFF`

## Pages

### Public Pages
- `/` — Homepage (hero slider, stats, services, news, partners)
- `/about` — About the institution + team members
- `/services` — Services page
- `/programs` — Programs page (scholarships, discounts, insurance, training)
- `/media/news` — News listing
- `/media/events` — Events listing
- `/partners-success` — Partners page with video showcase + university/institute logos
- `/register` — Registration form
- `/contact` — Contact page
- `/find-us` — Find us page

### Admin Pages (protected)
- `/admin/login` — Admin login
- `/admin/dashboard` — Dashboard with statistics
- `/admin/registrations` — Manage registration requests
- `/admin/news` — Manage news and events
- `/admin/partners` — Manage partners/universities
- `/admin/team` — Manage team members
- `/admin/stats` — Update site statistics

## Database Tables

- `registrations` — Registration form submissions
- `news` — News and events
- `partners` — Success partners (universities, institutes, etc.)
- `team` — Team members
- `stats` — Site-wide statistics (single row)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/almossah run dev` — run frontend locally

## Environment Variables Required

- `DATABASE_URL` — PostgreSQL connection string
- `SESSION_SECRET` — Express session secret
- `ADMIN_USERNAME` (optional, defaults to `admin`)
- `ADMIN_PASSWORD` (optional, defaults to `admin123`)
