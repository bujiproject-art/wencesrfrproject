# RFR Network Platform

> Referral networking platform — where **connection is currency**.
> Built for RFR Network by the Agent Midas engineering team.

**Staging:** [https://rfr-network.agentmidas.xyz](https://rfr-network.agentmidas.xyz)
**Repository:** [bujiproject-art/wencesrfrproject](https://github.com/bujiproject-art/wencesrfrproject)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Scope](#2-product-scope)
3. [Architecture](#3-architecture)
4. [Database Schema](#4-database-schema)
5. [Application Structure](#5-application-structure)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [Email System](#7-email-system)
8. [Deployment Infrastructure](#8-deployment-infrastructure)
9. [Local Development](#9-local-development)
10. [Environment Variables](#10-environment-variables)
11. [Post-Launch Handoff Plan](#11-post-launch-handoff-plan)
12. [Security Considerations](#12-security-considerations)
13. [What's Built vs. What's Next](#13-whats-built-vs-whats-next)

---

## 1. Executive Summary

RFR Network Platform is a **multi-tier referral networking application** that competes with BNI (Business Network International) — but with a digital-first chapter management layer, geographic chapter finder, and streamlined referral tracking.

The platform is a **Next.js 15 App Router** application backed by **Supabase (PostgreSQL 15 + Auth + RLS)**, deployed on a DigitalOcean droplet in New York with Caddy handling SSL via Let's Encrypt.

### Core Value Proposition
- Members generate, track, and close referrals
- Chapter admins manage local meetings and attendance
- Geographic chapter finder for prospective members
- Transparent referral lifecycle (submitted → contacted → meeting_set → in_progress → closed_won / closed_lost / declined)

### Why This Stack
- **Next.js 15 App Router** — React Server Components by default, Server Actions for all writes, minimal client-side JS. Production-grade SSR and streaming.
- **Supabase** — managed PostgreSQL with built-in auth, row-level security, and realtime. Portable to self-hosted Postgres or Azure Database for PostgreSQL with a `pg_dump` export.
- **Tailwind CSS** — design-system-level consistency without CSS bloat.
- **Resend + React Email** — branded transactional email with a reusable layout.
- **Caddy** — zero-config HTTPS with automatic cert renewal.

---

## 2. Product Scope

### User Roles (global)
| Role | Capabilities |
|------|-------------|
| **super_admin** | Create/manage all chapters, assign chapter admins, access import tool, view all data |
| **chapter_admin** | Manage their chapter(s): add meetings, record attendance, approve new members, send invites |
| **member** | Submit referrals, update status on referrals they received, RSVP meetings, view chapter leaderboard |
| **visitor** | Public-only access: view active chapters, read mission/vision |

### Implemented Features

**Public (unauthenticated)**
- Landing page with "Connection is currency" hero
- Chapter finder — search by city/state, view active chapters
- Chapter detail pages (public — serves as prospective-member lead capture)
- About page — mission, vision, BNI comparison, founder bio
- Public leaderboard (optional — see `/leaderboard`)
- Signup with optional `?invite=<token>` auto-redemption

**Member Dashboard** (authenticated)
- Referrals overview (given and received)
- Submit new referral (routes to selected chapter member)
- Referral detail page with **status updates by recipient** (critical BNI parity feature)
- Profile edit (name, company, bio, avatar upload)
- Chapter activity feed
- Notifications center with unread badge
- Leaderboard (by referrals given, closed_won count, total closed value)

**Chapter Admin Console**
- Member roster with suspend/remove/reassign controls
- Create meetings (date, time, location, virtual link)
- Record attendance (present / absent / excused / substitute)
- Approve/deny pending membership requests
- Issue chapter invitations (email)

**Super Admin**
- Create new chapters (name, city/state, meeting cadence)
- Reassign chapter admins
- Bulk member import via CSV

### Route Map

```
/                          Landing
/about                     Mission, vision, founder bio
/chapters                  Chapter finder
/chapters/[slug]           Chapter detail (public)
/login                     Email/password login
/signup                    Signup (supports ?invite=<token>)
/invite/[token]            Invitation redemption
/auth/callback             OAuth callback (future)
/auth/signout              Session termination
/dashboard                 Member home
/dashboard/profile         Profile editor
/dashboard/referrals       Referrals given/received list
/dashboard/referrals/new   Submit new referral
/dashboard/referrals/[id]  Referral detail + status update (recipient)
/dashboard/notifications   In-app notification feed
/dashboard/leaderboard     Chapter leaderboard
/dashboard/admin           Chapter admin console
/dashboard/admin/chapters  Super admin chapter management
/dashboard/admin/invites   Invitation manager
/dashboard/admin/import    CSV bulk import
/api/health                JSON health endpoint
```

---

## 3. Architecture

### High-Level Request Flow

```
┌────────────────────┐    HTTPS (Caddy + Let's Encrypt)
│  rfr-network       │───────────────────────────────┐
│  .agentmidas.xyz   │                                │
└────────────────────┘                                ▼
                                         ┌──────────────────────┐
                                         │   NY DigitalOcean    │
                                         │   (138.197.91.96)    │
                                         │                      │
                                         │   ┌──────────────┐   │
                                         │   │    Caddy     │   │
                                         │   │  :443 → :3101│   │
                                         │   └──────┬───────┘   │
                                         │          │           │
                                         │   ┌──────▼───────┐   │
                                         │   │  Next.js 15  │   │
                                         │   │  (PM2 proc)  │   │
                                         │   │    :3101     │   │
                                         │   └──────┬───────┘   │
                                         └──────────┼───────────┘
                                                    │
                                    ┌───────────────┴───────────────┐
                                    │                               │
                                    ▼                               ▼
                           ┌──────────────┐            ┌───────────────────┐
                           │   Supabase   │            │     Resend        │
                           │  PostgreSQL  │            │  (transactional   │
                           │  + Auth + RLS│            │      email)       │
                           └──────────────┘            └───────────────────┘
```

### Runtime Stack
- **Node.js 20+** via PM2 process manager
- **Next.js 15.1.x** (App Router, Server Components)
- **React 19**
- **TypeScript 5.x** (strict mode)
- **Tailwind CSS 3**
- **Supabase JS v2** (@supabase/ssr for cookie-based sessions)

### Process / Port Layout on NY server
| Process | Port | Purpose |
|---------|------|---------|
| Caddy | 80 / 443 | TLS termination, reverse proxy |
| rfr-network (PM2) | 3101 | Next.js app |

---

## 4. Database Schema

**Target:** PostgreSQL 15+ (Supabase today, fully portable to Azure Database for PostgreSQL, AWS RDS, or self-hosted Postgres).

### Tables (9)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `chapters` | Geographic chapter units | `id, name, slug, city, state, chapter_admin_id, member_count, status` |
| `profiles` | Member profiles | `id, user_id (→ auth.users), email, first_name, last_name, global_role` |
| `chapter_memberships` | Many-to-many (profile × chapter) | `chapter_id, profile_id, chapter_role, status` |
| `referrals` | Core value exchange | `from_profile_id, to_profile_id, chapter_id, status, estimated_value_cents, actual_value_cents` |
| `meetings` | Chapter meetings | `chapter_id, meeting_date, meeting_time, status, attendance_count` |
| `attendance` | Meeting attendance records | `meeting_id, profile_id, status, substitute_name` |
| `invitations` | Invite tokens | `chapter_id, invited_by_profile_id, invitee_email, invitation_token, status, expires_at` |
| `testimonials` | Member-to-member endorsements | `from_profile_id, to_profile_id, chapter_id, content, is_public` |
| `notifications` | In-app notification feed | `profile_id, type, title, body, link_url, is_read` |

### Referral Status Lifecycle

```
submitted → contacted → meeting_set → in_progress → closed_won
                                                  → closed_lost
         → declined
```

### Triggers & Automation
- `touch_updated_at()` — auto-updates `updated_at` on every row change
- `update_chapter_member_count()` — maintains `chapters.member_count`
- `update_meeting_attendance_count()` — maintains `meetings.attendance_count`

### Row Level Security (RLS)
All 9 tables have RLS **enabled**. Key policies:
- **Public readable:** active chapters (for chapter finder)
- **Chapter members** can read other members in their same chapter (no cross-chapter data leakage)
- **Referrals** visible only to the giver, recipient, or other members in the same chapter
- **Meetings** visible to chapter members; modifiable only by chapter admins or super admins
- **Service role** bypasses RLS (used for admin operations via trusted server code)

Migration file: **[`schema.sql`](./schema.sql)** — single-file, idempotent. Safe to re-run.

---

## 5. Application Structure

```
src/
├── app/                          Next.js App Router (all routes)
│   ├── layout.tsx                Root layout
│   ├── page.tsx                  Landing
│   ├── globals.css               Global styles
│   ├── about/                    About / mission
│   ├── chapters/                 Public chapter finder + detail
│   ├── login/                    Auth: login flow
│   ├── signup/                   Auth: signup flow (supports ?invite=)
│   ├── invite/[token]/           Invitation redemption
│   ├── auth/                     Supabase callback / signout
│   ├── dashboard/                Authenticated routes (session-gated in middleware)
│   │   ├── layout.tsx            Dashboard shell + navbar
│   │   ├── page.tsx              Member home
│   │   ├── profile/              Profile editor + avatar upload
│   │   ├── referrals/            List + submit + detail pages
│   │   ├── notifications/        Notification feed
│   │   ├── leaderboard/          Chapter stats
│   │   └── admin/                Chapter admin + super admin panels
│   │       ├── chapters/         Super admin chapter CRUD
│   │       ├── invites/          Generate/track invitations
│   │       └── import/           CSV bulk member import
│   └── api/
│       └── health/               GET /api/health → { ok, db, timestamp }
│
├── components/                   Shared components
│   ├── Navbar.tsx
│   ├── NavbarBell.tsx            Notifications badge
│   ├── Logo.tsx                  Gold RFR SVG mark
│   ├── ChapterCard.tsx
│   ├── ReferralForm.tsx
│   ├── ReferralList.tsx          Responsive grid-list (mobile-first)
│   └── MeetingList.tsx
│
└── lib/
    ├── types.ts                  TypeScript interfaces mirroring schema
    ├── auth.ts                   requireUser() — loads profile + memberships
    ├── supabase/
    │   ├── client.ts             Browser client (anon)
    │   ├── server.ts             SSR client (cookie-aware) + service role client
    │   └── middleware.ts         Session refresh helper
    └── email/
        ├── client.ts             Resend client initialization
        ├── send.ts               sendEmail() wrapper (non-blocking, error-swallowing)
        └── templates/
            ├── Layout.tsx        Shared branded email layout (gold/black)
            ├── ReferralReceived.tsx
            ├── MeetingReminder.tsx
            ├── MembershipApproved.tsx
            └── ChapterInvite.tsx
```

### Patterns Used
- **Server Components by default.** Client Components only where interactivity requires it.
- **Server Actions** for every write operation. No `/api/*` endpoints for CRUD.
- **Cookie-based auth** via `@supabase/ssr`. Middleware refreshes the session on every request.
- **Service role client** used only in trusted server code after explicit authorization checks.
- **Form validation** at the Server Action boundary — inputs coerced, trimmed, allowlisted.
- **Email sends are non-blocking** — `sendEmail()` swallows errors so a failing Resend call never blocks a user-facing transaction.

---

## 6. Authentication & Authorization

### Authentication
Supabase Auth with **email + password**. OAuth-ready but not wired in MVP.

Signup flow:
1. User submits email + password + name
2. Supabase creates `auth.users` row
3. Server Action creates `profiles` row with default `global_role = 'member'`
4. If `?invite=<token>` present, auto-redeems the invitation (creates `chapter_memberships` row)

### Authorization
Centralized in `src/lib/auth.ts`:
```typescript
requireUser()           // → { user, profile, memberships, isSuperAdmin, isChapterAdmin }
requireSuperAdmin()     // throws if user is not super_admin
```

Server Actions call these before any data mutation. The service-role Supabase client is used only after the auth gate passes.

### Middleware
`middleware.ts` refreshes the Supabase session cookie on every request and redirects unauthenticated users away from `/dashboard/*`.

---

## 7. Email System

### Provider: Resend + React Email

### Templates
| Template | Trigger |
|----------|---------|
| `ReferralReceived` | When a new referral is submitted to a member |
| `MeetingReminder` | When a chapter meeting is created |
| `MembershipApproved` | When a chapter admin approves a pending member |
| `ChapterInvite` | When an invitation token is generated |

### Error Handling
`sendEmail()` wraps Resend in try/catch and **never throws**. A failing email logs to server console but does not block the calling Server Action.

### Env Vars
```
RFR_RESEND_API_KEY=re_xxxxxxxxxxxxx
RFR_EMAIL_FROM="RFR Network <no-reply@rfr.network>"
RFR_APP_URL=https://rfr-network.agentmidas.xyz
```

> **Note:** In staging, `RFR_RESEND_API_KEY` is empty — emails are logged but not sent. Once RFR Network registers its domain in Resend and provides an API key, emails will start flowing.

---

## 8. Deployment Infrastructure

### Target: DigitalOcean New York (138.197.91.96)
- **Hostname:** `midas-hosting`
- **OS:** Ubuntu LTS
- **Role:** Multi-tenant app hosting

### Deploy Script: [`deploy.sh`](./deploy.sh)
Zero-dependency bash script that:
1. Allocates next available PM2 port
2. Tars the app directory
3. SCPs to `/var/www/sites/rfr-network.agentmidas.xyz/`
4. Installs `.env.local` with `chmod 600`
5. Runs `npm ci && npm run build`
6. Starts/restarts the `rfr-network` PM2 process
7. Writes Caddy reverse-proxy config
8. Reloads Caddy
9. Smoke tests `GET /` and `GET /api/health`

```bash
./deploy.sh /path/to/.env.local
```

### Caddy Reverse Proxy
Auto-generated config at `/etc/caddy/sites/rfr-network.agentmidas.xyz.caddy`:
```
rfr-network.agentmidas.xyz {
  reverse_proxy localhost:3101
  encode gzip
  log {
    output file /var/log/caddy/rfr-network.log
    format json
  }
}
```

### DNS
A-record: `rfr-network.agentmidas.xyz` → `138.197.91.96` (proxy disabled so Caddy can issue Let's Encrypt certs directly).

### PM2
```bash
pm2 list
pm2 logs rfr-network --lines 50
pm2 restart rfr-network
pm2 save
```

---

## 9. Local Development

### Prerequisites
- Node.js 20+
- npm 10+
- A Supabase project

### Setup
```bash
git clone https://github.com/bujiproject-art/wencesrfrproject.git
cd wencesrfrproject
npm install
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

### Scripts
```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run start    # Run production build locally
npm run lint     # ESLint
```

### Database Setup
```bash
# Run schema migration on your Supabase project (SQL editor or psql):
psql $DATABASE_URL -f schema.sql

# Seed 10 initial chapters:
psql $DATABASE_URL -f seed.sql
```

---

## 10. Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key (server-side only) |
| `RFR_APP_URL` | ✅ | Public URL of the app |
| `RFR_RESEND_API_KEY` | Optional | Resend API key. If empty, emails are silently skipped. |
| `RFR_EMAIL_FROM` | Optional | Default from-address for emails |

---

## 11. Post-Launch Handoff Plan

This platform is designed for full handoff to RFR Network's own infrastructure.

### Option A — Stay on the Current Supabase
No action required. RFR Network continues using the shared Agent Midas-managed Supabase instance.

### Option B — Migrate to RFR's Own Supabase
```bash
# 1. Create a new Supabase project
# 2. Export from current DB:
pg_dump "$CURRENT_DATABASE_URL" --schema-only -f rfr-schema.sql
pg_dump "$CURRENT_DATABASE_URL" --data-only --disable-triggers -f rfr-data.sql

# 3. Restore to new DB:
psql "$NEW_DATABASE_URL" -f rfr-schema.sql
psql "$NEW_DATABASE_URL" -f rfr-data.sql

# 4. Update .env.local with new Supabase URL + keys
# 5. Redeploy: ./deploy.sh .env.local
```

### Option C — Migrate to Azure Database for PostgreSQL
The schema uses **only standard PostgreSQL features** — no Supabase-specific extensions are required for data. Supabase-specific bits:
- **RLS policies** — standard Postgres RLS, fully portable
- **`auth.uid()`** in RLS — replace with your auth provider's user ID function
- **Supabase Storage** (for avatar uploads) — replace with Azure Blob Storage

### Option D — Self-Hosted
`pg_dump` / `pg_restore` to any PostgreSQL 15+ instance. Update env vars to point at the new connection.

---

## 12. Security Considerations

### Data Protection
- All credentials in env vars, never committed to git
- Service role key never sent to the browser
- RLS enforced on every table

### Authentication Safeguards
- Supabase Auth handles password hashing (bcrypt) + session JWTs
- Sessions refresh on every request via middleware
- Cookie flags: `HttpOnly`, `Secure`, `SameSite=Lax`

### Input Validation
- Server Actions parse `FormData` with explicit type coercion
- Status values checked against allowlists
- UUIDs validated before DB queries

### SQL Injection
- Zero raw SQL in application code — all DB ops via parameterized Supabase client
- Schema file is the only SQL, and it's static

### OWASP Top 10 Coverage
- **Injection** — parameterized queries only
- **Broken Access Control** — RLS + `requireUser()` on every server action
- **Cryptographic Failures** — TLS everywhere (Let's Encrypt), no secrets in client code
- **Insecure Design** — auth & authz at the boundary
- **Security Misconfiguration** — no default creds, no debug endpoints in production

---

## 13. What's Built vs. What's Next

### ✅ Shipped (MVP)
- All 9 database tables with RLS, triggers, and indexes
- Public landing / chapter finder / about / login / signup
- Signup with invitation redemption
- Member dashboard: profile, referrals (give + receive + status update), notifications, leaderboard
- Chapter admin console: member roster, meetings, attendance
- Super admin: chapter creation, admin reassignment, CSV bulk import, invitation manager
- Email templates (4) wired to Resend with non-blocking error handling
- Responsive design (mobile-first) across all pages
- Deploy automation (`deploy.sh`)
- Health endpoint
- Caddy SSL / auto-renewal

### 🔜 Post-MVP
- 24h meeting reminder CRON
- Testimonials UI (schema ready, surfacing list view + creation flow pending)
- Chapter application / approval workflow (currently invite-only)
- Referral analytics dashboard (charts, conversion rates, median time-to-close)
- OAuth providers (Google, LinkedIn)
- Super-admin analytics (network-wide metrics)
- Billing / dues collection (Stripe Connect)
- Mobile app (React Native shell)
- Two-factor auth (TOTP via Supabase Auth MFA)

---

## Acknowledgments

Built by the **Agent Midas** engineering team as the first custom application in the Agent Midas ODSS (On-Demand Software System) pipeline.

## License

Proprietary — © 2026 RFR Network. All rights reserved.
