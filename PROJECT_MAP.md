# MTX SHIELD — PROJECT MAP

> AntiCheat System for FiveM (GTA V Roleplay) Servers
> Generated: 2026-05-10 | Architecture Plan

---

## [TECH_STACK]

| Layer | Technology | Version | Status |
|---|---|---|---|
| Runtime | Node.js (Active LTS Krypton) | v24.15.0 | ✅ LTS till 2028-04 |
| Framework | Next.js (App Router) | v16.2.6 | ✅ Latest stable |
| Language | TypeScript | v6.0.3 | ✅ Latest stable |
| Styling | Tailwind CSS | v4.3.0 | ✅ Latest stable |
| Database | PostgreSQL | 18.3 | ✅ Latest minor |
| ORM | Prisma | v7.8.0 | ✅ Latest stable |
| Auth | Better Auth (Prisma adapter) | v1.6.9 | ✅ 2.5M/wk, active |
| Payments | Stripe SDK | v22.1.1 | ✅ Latest |
| Charts | Recharts | v3.8.1 | ✅ Stable |
| Logger | Pino (async) | v10.3.1 | ✅ 12.3M/wk |
| Cache / Rate-limit | Redis | 8.6.3 | ✅ Latest |
| Validation | Zod | v4.x (via Better Auth) | ✅ |
| FiveM Query | fivem-server-query | Latest (maintained) | ✅ |

### Dependency Audit Notes
- **Better Auth** chosen over NextAuth v5 (still beta, v5.0.0-beta.31). Better Auth has native Prisma adapter, 2FA, RBAC, and is the designated successor (Auth.js redirects to Better Auth).
- **Pino** is async by default (worker thread), zero-blocking on hot path.
- **No deprecated packages** in the stack.

---

## [SYSTEM_FLOW]

### GUI Journey (Admin)
```
Landing → Sign Up → Dashboard → Add Server → Get API Key
  → Install FiveM Resource → See Live Detections → Manage Bans
  → Subscription → Stripe Checkout → PRO/Elite Features Unlock
```

### API Journey (FiveM → Website)
```
FiveM Resource detects Cheat
  → POST /api/fivem/event (API Key auth)
  → Website validates + stores DetectionLog
  → Checks BannedPlayer table → Returns action (kick/ban/warn)
  → FiveM Resource enforces action
```

### Billing Journey
```
Admin clicks "Upgrade"
  → POST /api/subscription/checkout
  → Stripe Checkout Session → Redirect → Webhook
  → DB subscription update → Feature gates unlock
```

### API Endpoints

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | — | Admin signup |
| POST | `/api/auth/login` | — | Admin signin |
| GET | `/api/v1/check-ban?license=X` | API Key | FiveM ban check |
| POST | `/api/fivem/event` | API Key | Report detection |
| POST | `/api/fivem/heartbeat` | API Key | Server alive signal |
| GET | `/api/dashboard/stats` | Session | Stats overview |
| GET/POST/DELETE | `/api/servers` | Session | CRUD servers |
| GET/POST/PATCH | `/api/bans` | Session | Manage bans |
| GET | `/api/detections` | Session | Detection logs |
| POST | `/api/subscription/checkout` | Session | Stripe session |
| POST | `/api/webhooks/stripe` | Stripe-Sig | Billing events |

---

## [ARCHITECTURE]

### Directory Structure (Domain-Driven)
```
mtx-shield/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (marketing)/              # Landing page (public)
│   │   ├── dashboard/                # Dashboard (auth protected)
│   │   │   ├── servers/
│   │   │   ├── bans/
│   │   │   ├── detections/
│   │   │   └── subscription/
│   │   └── api/                      # Route Handlers
│   │       ├── auth/                 # Better Auth handler
│   │       ├── v1/check-ban/         # Public ban check
│   │       ├── fivem/                # FiveM-facing endpoints
│   │       ├── dashboard/            # Admin API
│   │       ├── subscription/         # Stripe sessions
│   │       └── webhooks/stripe/      # Stripe events
│   ├── components/
│   │   ├── ui/                       # Atoms (Button, Card, Modal)
│   │   ├── landing/                  # Hero, Features, Pricing, CTA
│   │   └── dashboard/                # Stats cards, Charts, Tables
│   ├── lib/
│   │   ├── auth.ts                   # Better Auth instance
│   │   ├── db.ts                     # Prisma client singleton
│   │   ├── stripe.ts                 # Stripe client
│   │   ├── logger.ts                 # Pino async logger
│   │   └── fivem.ts                  # FiveM query client
│   ├── types/
│   │   └── index.ts                  # Shared TypeScript types
│   └── middleware.ts                 # Route protection
├── prisma/
│   └── schema.prisma                 # Data models
├── public/                           # Static assets
├── PROJECT_MAP.md
└── package.json
```

### Principles
- **Simplicity First**: No micro-files, no premature abstractions. Shared code only when repeated 3x+.
- **Domain-Driven**: Group by feature domain (bans, servers, detections, subscription), not by layer type.
- **Surgical**: Flat lib/ for utilities, no over-engineering. Core shared logic only.

---

## [DATA_MODEL]

### Prisma Entities

**User**
- `id` (UUID)
- `email` (unique)
- `name`
- `hashedPassword`
- `role` (ADMIN | SUPERADMIN)
- `createdAt`
- Relations: servers, bans

**Server**
- `id` (UUID)
- `userId` (FK → User)
- `name`
- `ip`
- `port`
- `isActive` (boolean)
- `apiKey` (unique, auto-generated)
- `createdAt`
- Relations: user, subscription, bans, detections, apiKey

**Subscription**
- `id` (UUID)
- `serverId` (FK → Server, unique)
- `plan` (FREE | PRO | ELITE)
- `stripeCustomerId`
- `stripeSubscriptionId`
- `status` (ACTIVE | CANCELED | PAST_DUE)
- `currentPeriodStart`
- `currentPeriodEnd`
- `createdAt`
- Relations: server

**BannedPlayer**
- `id` (UUID)
- `license` (FiveM license identifier)
- `steamId` (optional)
- `discordId` (optional)
- `fivemId` (optional)
- `reason` (text)
- `evidence` (text, optional)
- `bannedById` (FK → User)
- `serverId` (FK → Server)
- `isActive` (boolean)
- `bannedAt`
- `expiresAt` (optional)
- `unbannedAt` (optional)
- Relations: server, bannedBy

**DetectionLog**
- `id` (UUID)
- `playerLicense`
- `detectionType`
- `severity` (LOW | MID | HIGH | CRIT)
- `metadata` (JSON)
- `serverId` (FK → Server)
- `createdAt`
- Relations: server

**APIKey**
- `id` (UUID)
- `key` (unique, auto-generated)
- `serverId` (FK → Server)
- `isActive` (boolean)
- `lastUsedAt` (optional)
- `createdAt`
- Relations: server

### Plan Limits Matrix

| Feature | FREE | PRO ($9.99/mo) | ELITE ($24.99/mo) |
|---|---|---|---|
| Max servers | 1 | 3 | Unlimited |
| Log retention | 7 days | 30 days | 90 days |
| API access | ❌ | ✅ | ✅ |
| Custom rules | ❌ | ❌ | ✅ |
| Priority support | ❌ | ❌ | ✅ |

---

## [LOGGING_STRATEGY]

- **Library**: Pino v10.3.1 (async by default, worker thread)
- **Levels**: DEBUG | INFO | WARN | ERROR
- **Format**: JSON (production) / pino-pretty (dev)
- **Output**: stdout + optional file rotation in production
- **Rules**:
  - No logging of secrets, API keys, or passwords
  - Detection events logged at INFO
  - Auth failures logged at WARN
  - Critical errors (Stripe webhook failure, DB down) logged at ERROR
  - DEBUG only in dev mode

---

## [ORPHANS & PENDING]

| Item | Status | Notes |
|---|---|---|
| FiveM resource Lua script (client ↔ website bridge) | ❌ Not created | Out of scope for website repo |
| .env.example with production variables | 🟡 Pending | Current .env has dev values |
| Docker Compose for PostgreSQL + Redis | ❌ Not created | For production deployment |
| Stripe product/price IDs | 🟡 Pending | Need Stripe account → set env vars |
| ESLint / Prettier config | 🟡 Pending | Uses default from create-next-app |
| GitHub Actions CI | ❌ Not created | Deferred |
| Rate limiting (Redis) | 🟡 Designed | Implementation deferred |
| Ban evidence upload (file storage) | ❌ Not designed | Deferred |
| Production PostgreSQL migration | ❌ Not done | Currently using SQLite for dev |
| Unit / integration tests | ❌ Not created | Deferred |

---

## [MILESTONES] — STATUS: ✅ COMPLETED

| # | Milestone | Status | Verification |
|---|---|---|---|
| **M1** | Scaffold + DB | ✅ | Build passes, Prisma migrated, Better Auth configured |
| **M2** | Landing Page | ✅ | Hero, Features, Pricing, CTA, Footer — all render |
| **M3** | Dashboard Core | ✅ | Stats, Servers CRUD, Bans CRUD, Detections table, Recharts |
| **M4** | FiveM Integration | ✅ | `/api/v1/check-ban`, `/api/fivem/event`, `/api/fivem/heartbeat` |
| **M5** | Subscription | ✅ | Stripe checkout, webhook handler, plan upgrade flow |
| **M6** | PRO/Elite Gates | ✅ | Plan limits enforced in /api/servers POST (server cap check) |

### Build Verification (2026-05-10)

| Check | Result |
|---|---|
| `npm run build` | ✅ 0 errors, 0 warnings |
| `npm run dev` | ✅ Server boots on localhost:3000 |
| Registered routes (static) | `/`, `/auth/sign-in`, `/auth/sign-up` |
| Registered routes (dynamic) | `/dashboard`, `/dashboard/servers`, `/dashboard/bans`, `/dashboard/detections`, `/dashboard/subscription` |
| Registered routes (API) | `/api/auth/[...all]`, `/api/bans`, `/api/dashboard/stats`, `/api/detections`, `/api/fivem/event`, `/api/fivem/heartbeat`, `/api/servers`, `/api/subscription`, `/api/v1/check-ban`, `/api/webhooks/stripe` |
| Proxy (Middleware) | ✅ Active — route protection for `/dashboard/*` and `/auth/*` |
