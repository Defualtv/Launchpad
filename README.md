# JobPilot — AI-Powered Job Search Assistant

A modern, full-stack SaaS platform that supercharges your job search with hybrid AI, adaptive scoring, and a beautiful UI.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38BDF8?logo=tailwindcss)

## 🚀 Features

### Core Functionality
- **Job Tracking** — Add and manage job opportunities with full details
- **Pipeline Management** — Kanban-style stages: Saved → Applying → Applied → Interviewing → Offer/Rejected
- **Hybrid AI Scoring** — Instant match scores powered by Claude 3.5 Sonnet + GPT-4o-mini
- **Application Kits** — AI-generated cover letters, resume tweaks, and interview Q&A
- **Analytics Dashboard** — Conversion funnels, skill gap analysis, weekly trends
- **Smart Reminders** — Email notifications for follow-ups via Resend
- **Adaptive Scoring** — Learns from your feedback to improve match accuracy

### Profile & Matching
- **Comprehensive Profile** — Skills, experience, education, location preferences
- **6-Factor Scoring** — Skills match, must-have gaps, nice-to-haves, location, seniority, salary
- **Calibration Engine** — Adjusts scoring weights based on outcome feedback
- **Profile Versioning** — Score history tracks your evolving profile

### Hybrid AI Engine
| Task | Provider | Why |
|------|----------|-----|
| Cover Letters | Claude 3.5 Sonnet | Superior writing quality |
| Resume Tweaks | Claude 3.5 Sonnet | Natural, professional tone |
| Interview Q&A | Claude 3.5 Sonnet | Thoughtful, detailed answers |
| Keyword Extraction | GPT-4o-mini | Fast and cost-effective |
| Score Explanations | GPT-4o-mini | Quick structured output |
| No API Keys | Mock Mode | Zero-cost local development |

### Subscription Tiers
| Feature | FREE | PRO ($19/mo) | POWER ($39/mo) |
|---------|------|--------------|----------------|
| Jobs Tracked | 25 | Unlimited | Unlimited |
| AI Generations/mo | 5 | 60 | 200 |
| Reminders | ❌ | ✅ | ✅ |
| Analytics | ❌ | ✅ | ✅ |
| Weekly Summary | ❌ | ❌ | ✅ |
| Advanced Calibration | ❌ | ❌ | ✅ |

### Modern UI/UX
- **Marketing Landing Page** — Animated hero, feature grid, dashboard preview, CTA
- **Split-Screen Auth** — Branded gradient panel + clean form layout
- **Violet/Indigo Theme** — Consistent design system with glassmorphism and animations
- **Responsive Design** — Desktop, tablet, and mobile optimized
- **Polished Dashboard** — Color-coded stat cards, themed pipeline stages

## 🛡️ Safety First

**JobPilot will NEVER automatically apply to jobs without your explicit action.** The platform helps you discover, score, and prepare — but you always press "Apply" yourself.

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript (strict mode) |
| **Database** | PostgreSQL + Prisma ORM |
| **Auth** | NextAuth.js 4.24 (JWT, 30-day sessions) |
| **Styling** | Tailwind CSS + shadcn/ui + Radix Primitives |
| **AI (Writing)** | Anthropic Claude 3.5 Sonnet |
| **AI (Extraction)** | OpenAI GPT-4o-mini |
| **Payments** | Stripe (Checkout + Customer Portal) |
| **Email** | Resend (with mock mode) |
| **Icons** | Lucide React |
| **Testing** | Vitest (~70 tests) |
| **Deployment** | Vercel (with cron jobs) |

## 📦 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database (Neon or Supabase recommended)
- (Optional) Anthropic and/or OpenAI API keys
- (Optional) Stripe account for billing

### Setup

1. **Clone and install**
   ```bash
   git clone https://github.com/Defualtv/agent1-.git
   cd agent1-
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your values:
   ```env
   # Required
   DATABASE_URL="postgresql://user:password@host:5432/jobpilot"
   NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
   NEXTAUTH_URL="http://localhost:3000"

   # AI (optional — app works without using mock mode)
   ANTHROPIC_API_KEY="sk-ant-..."
   OPENAI_API_KEY="sk-..."

   # Stripe (optional — billing disabled without)
   STRIPE_SECRET_KEY="sk_test_..."
   STRIPE_WEBHOOK_SECRET="whsec_..."
   STRIPE_PRICE_ID_PRO="price_..."
   STRIPE_PRICE_ID_POWER="price_..."

   # Email (optional — mock mode without)
   RESEND_API_KEY="re_..."
   EMAIL_FROM="JobPilot <noreply@yourdomain.com>"

   # Cron protection
   CRON_SECRET="your-random-secret"
   ```

3. **Set up database**
   ```bash
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open http://localhost:3000**

### Demo Credentials

| Account | Email | Password |
|---------|-------|----------|
| Demo User | demo@jobagent.com | demo123456 |
| Admin | admin@jobagent.com | demo123456 |

## 🏗️ Project Structure

```
├── prisma/
│   ├── schema.prisma          # Database schema (15+ models)
│   └── seed.ts                # Demo data seeding
├── src/
│   ├── middleware.ts           # Route protection & auth redirects
│   ├── app/
│   │   ├── page.tsx            # Marketing landing page
│   │   ├── login/              # Split-screen login
│   │   ├── register/           # Split-screen registration
│   │   ├── onboarding/         # 3-step onboarding wizard
│   │   ├── (dashboard)/        # Protected dashboard routes
│   │   │   ├── dashboard/      # Main dashboard with stats
│   │   │   ├── jobs/           # Job listings, details, creation
│   │   │   ├── pipeline/       # Kanban pipeline view
│   │   │   ├── analytics/      # Analytics & insights
│   │   │   ├── profile/        # User profile management
│   │   │   └── settings/       # Account settings
│   │   └── api/                # API routes (REST)
│   ├── components/
│   │   ├── layout/sidebar.tsx  # Main navigation sidebar
│   │   ├── ui/                 # shadcn/ui components (18+)
│   │   └── providers.tsx       # Session + toast providers
│   ├── lib/
│   │   ├── ai.ts               # Hybrid AI engine (Claude + GPT)
│   │   ├── scoring.ts          # 6-factor match scoring
│   │   ├── calibration.ts      # Adaptive weight calibration
│   │   ├── auth.ts             # NextAuth configuration
│   │   ├── stripe.ts           # Stripe integration
│   │   ├── email.ts            # Email templates + sending
│   │   ├── plans.ts            # Subscription tier limits
│   │   ├── quota.ts            # Usage quota enforcement
│   │   └── validations.ts      # Zod schemas
│   └── __tests__/              # 8 test files (~70 tests)
├── vercel.json                 # Cron job configuration
├── tailwind.config.ts          # Design system tokens
└── package.json
```

## 🔌 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/[...nextauth]` | NextAuth handlers |

### Jobs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/jobs` | List jobs (paginated, filterable) |
| POST | `/api/jobs` | Create job |
| GET | `/api/jobs/[id]` | Get job details |
| PUT | `/api/jobs/[id]` | Update job |
| POST | `/api/jobs/[id]/score` | Generate AI match score |
| POST | `/api/jobs/[id]/kit` | Generate application kit |

### Pipeline
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pipeline` | Get pipeline items by stage |
| PUT | `/api/pipeline` | Update item stage |
| GET | `/api/pipeline/[id]/contacts` | Get contacts for pipeline item |

### Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/PUT | `/api/profile` | Get/update profile |
| POST/DELETE | `/api/profile/skills` | Manage skills |
| POST/DELETE | `/api/profile/experiences` | Manage experience |
| POST/DELETE | `/api/profile/educations` | Manage education |

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics` | Dashboard analytics |
| POST | `/api/billing` | Stripe checkout/portal |
| POST | `/api/feedback` | Submit outcome feedback |
| GET | `/api/cron/reminders` | Send reminder emails |
| GET | `/api/cron/weekly-summary` | Send weekly summary |

## 🚢 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables (see setup section above)
4. Deploy
5. Run `npx prisma migrate deploy` via Vercel CLI

Cron jobs configured in `vercel.json`:
- **Reminders:** Every hour
- **Weekly Summary:** Sundays at 6 PM UTC

### Environment Variables Checklist

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | **Yes** | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | **Yes** | JWT signing secret |
| `NEXTAUTH_URL` | **Yes** | Production domain URL |
| `ANTHROPIC_API_KEY` | No | For Claude AI (mock mode without) |
| `OPENAI_API_KEY` | No | For GPT AI (mock mode without) |
| `STRIPE_SECRET_KEY` | For billing | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | For billing | Webhook verification |
| `STRIPE_PRICE_ID_PRO` | For billing | Pro plan price ID |
| `STRIPE_PRICE_ID_POWER` | For billing | Power plan price ID |
| `RESEND_API_KEY` | No | For email notifications |
| `CRON_SECRET` | For cron | Protects cron endpoints |

## 🔒 Security

- ✅ JWT-based authentication with NextAuth.js
- ✅ Server-side session validation on all API routes
- ✅ Input validation with Zod schemas
- ✅ SQL injection prevention via Prisma ORM
- ✅ Stripe webhook signature verification
- ✅ User data isolation (all queries scoped by `userId`)
- ✅ bcrypt password hashing (12 rounds)
- ✅ CSRF protection via NextAuth

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Run once with exit
npm run test:run
```

~70 tests across 8 files covering: scoring, calibration, AI mocks, plan limits, pipeline logic, analytics, validation schemas, and API utilities.

## 🗺️ Roadmap

### Completed ✅
- User authentication & profiles
- Job tracking & pipeline management
- Hybrid AI scoring & application kits
- Analytics dashboard
- Stripe billing integration
- Email reminders & weekly summaries
- Complete UI/UX redesign (violet theme)
- Marketing landing page
- Adaptive scoring with calibration

### Planned
- Mock interview practice with AI
- Job board API integrations (LinkedIn, Indeed)
- Chrome extension for quick job saving
- Mobile-responsive PWA
- Team/agency features

## 📄 License

MIT License

## 🤝 Contributing

Contributions welcome! Please open an issue first to discuss your proposed changes.

---

**JobPilot** — Built with Next.js, Prisma, Claude, and GPT
