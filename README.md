# JobCircle - AI-Powered Job Application Platform

A professional SaaS web platform for managing your entire job search journey - from discovery to offer.

## 🚀 Features

### Core Functionality
- **Job Tracking** - Add jobs manually or discover them automatically
- **Pipeline Management** - Kanban and list views with drag-and-drop
- **AI Match Scoring** - Get instant match scores based on your profile
- **Application Kits** - Generate personalized cover letters and interview prep
- **Document Management** - Store and manage multiple CV versions
- **Smart Notifications** - Never miss important updates or reminders

### Profile & Matching
- **Comprehensive Profile** - Skills, experience, education, preferences
- **Smart Preferences** - Target roles, locations, companies, salary range
- **Adaptive Scoring** - Learns from your feedback to improve matches
- **Keyword Matching** - Include/exclude keywords and companies

### Pipeline Stages
```
SAVED → APPLYING → APPLIED → INTERVIEWING → OFFER/REJECTED
```

### Subscription Tiers
| Feature | FREE | PRO ($19/mo) | POWER ($39/mo) |
|---------|------|--------------|----------------|
| Jobs Tracked | 25 | Unlimited | Unlimited |
| Documents | 10 | 25 | 50 |
| AI Generations/mo | 5 | 60 | 200 |
| Priority Support | ❌ | ✅ | ✅ |

## 🛡️ Safety First

**JobCircle will NEVER automatically apply to jobs without your explicit action.** The platform helps you:
- Discover relevant jobs
- Score and prioritize opportunities
- Generate application materials
- Track your progress

But the final "Apply" action is always yours to take.

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Database** | PostgreSQL + Prisma ORM |
| **Auth** | NextAuth.js (JWT) |
| **Styling** | Tailwind CSS + shadcn/ui |
| **Payments** | Stripe |
| **Email** | Resend |
| **AI** | OpenAI GPT-4o-mini |
| **Storage** | S3-compatible (MinIO for local) |
| **Testing** | Vitest |

## 📦 Quick Start

### Prerequisites
- Node.js 18+
- Docker (recommended) OR PostgreSQL database
- (Optional) OpenAI API key
- (Optional) Stripe account

### Option A: Docker Setup (Recommended)

1. **Clone and install**
   ```bash
   git clone https://github.com/Defualtv/agent1-.git
   cd agent1-
   npm install
   ```

2. **Start local services**
   ```bash
   docker-compose up -d
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env.local
   ```
   
   The defaults work with Docker. For AI features, add your OpenAI key.

4. **Set up database**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   npx prisma db seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open http://localhost:3000**

### Option B: External Database

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
   
   Edit `.env.local`:
   ```env
   DATABASE_URL="postgresql://user:password@host:5432/jobcircle"
   NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
   NEXTAUTH_URL="http://localhost:3000"
   ```

3. **Set up database**
   ```bash
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   ```

4. **Start server**
   ```bash
   npm run dev
   ```

### Demo Credentials

| Account | Email | Password |
|---------|-------|----------|
| Demo User | demo@jobagent.com | demo123456 |
| Admin | admin@jobagent.com | demo123456 |

## 🏗️ Project Structure

```
├── docs/                    # Documentation
│   ├── ARCHITECTURE.md      # System architecture & design
│   └── PHASE2_DESIGN.md     # Mock interview feature design
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.ts              # Demo data seeding
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── (dashboard)/     # Protected dashboard routes
│   │   │   ├── admin/       # Admin dashboard
│   │   │   ├── analytics/   # Analytics & insights
│   │   │   ├── dashboard/   # Main dashboard
│   │   │   ├── documents/   # CV & document management
│   │   │   ├── jobs/        # Job listings & details
│   │   │   ├── notifications/ # Notifications
│   │   │   ├── pipeline/    # Kanban/list pipeline view
│   │   │   ├── profile/     # User profile
│   │   │   └── settings/    # Account settings
│   │   ├── api/             # API routes
│   │   ├── login/           # Auth pages
│   │   └── onboarding/      # Onboarding wizard
│   ├── components/          # React components
│   │   ├── layout/          # Layout components
│   │   └── ui/              # shadcn/ui components
│   └── lib/                 # Utility functions
├── docker-compose.yml       # Local services
├── .env.example             # Environment template
└── package.json
```

## 🔌 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Create account |
| POST | /api/auth/[...nextauth] | NextAuth handlers |

### Jobs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/jobs | List jobs (paginated, filterable) |
| POST | /api/jobs | Create job |
| GET | /api/jobs/[id] | Get job details |
| PUT | /api/jobs/[id] | Update job |
| POST | /api/jobs/[id]/score | Generate match score |
| POST | /api/jobs/[id]/kit | Generate application kit |

### Pipeline
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/pipeline | Get pipeline items |
| PUT | /api/pipeline | Update stage |

### Documents
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/documents | List documents |
| POST | /api/documents | Upload document |
| PUT | /api/documents/[id] | Update document |
| DELETE | /api/documents/[id] | Delete document |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/notifications | List notifications |
| PUT | /api/notifications | Mark all read |
| PUT | /api/notifications/[id] | Mark one read |

### Cron Jobs
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/cron/discovery | Discover new jobs |
| GET | /api/cron/reminders | Send reminders |
| GET | /api/cron/weekly-summary | Send weekly summary |

## 🚢 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables:
   ```
   DATABASE_URL=postgresql://...
   NEXTAUTH_SECRET=...
   NEXTAUTH_URL=https://yourdomain.com
   ```
4. Deploy

Cron jobs configured in `vercel.json`:
- Reminders: Every hour
- Weekly Summary: Sundays at 6 PM
- Job Discovery: Daily at 8 AM

## 🔒 Security

- ✅ JWT-based authentication with httpOnly cookies
- ✅ Server-side session validation
- ✅ Input validation with Zod schemas
- ✅ SQL injection prevention via Prisma
- ✅ Rate limiting on sensitive endpoints
- ✅ Signed URLs for document downloads
- ✅ User data isolation

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Run once
npm run test:run
```

## 🗺️ Roadmap

### Phase 1 (Current) ✅
- User authentication & profiles
- Job tracking & pipeline
- AI scoring & application kits
- Document management
- Notifications
- Analytics dashboard
- Admin dashboard

### Phase 2 (Planned)
- Mock interview practice
- AI-powered feedback
- Progress tracking
- Question bank

### Phase 3 (Future)
- Job API integrations
- Chrome extension
- Mobile app

## 📄 License

MIT License

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines first.

---

Built with ❤️ using Next.js, Prisma, and AI
