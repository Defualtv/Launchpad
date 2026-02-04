# Job Agent - AI-Powered Job Search Assistant

A production-ready SaaS platform that helps job seekers track opportunities, get AI-generated application materials, and optimize their job search with data-driven insights.

## 🚀 Features

### Core Functionality
- **Job Tracking** - Add jobs and get instant match scores based on your profile
- **AI Application Kits** - Generate personalized cover letters, resume tweaks, and interview prep
- **Pipeline Management** - Kanban and list views to track application progress
- **Analytics Dashboard** - Track response rates, score distributions, and skill gaps
- **Smart Reminders** - Never miss a follow-up with automated reminders

### Profile & Scoring
- **Skill-based Matching** - Weighted scoring based on skills, location, salary, and seniority
- **Adaptive Weights** - Scoring improves based on your feedback
- **Profile Versioning** - Track how profile changes affect scores over time

### Subscription Tiers
| Feature | FREE | PRO ($19/mo) | POWER ($39/mo) |
|---------|------|--------------|----------------|
| Jobs Tracked | 25 | Unlimited | Unlimited |
| AI Generations/mo | 5 | 60 | 200 |
| Score History | Last 3 | Full | Full |
| Priority Support | ❌ | ✅ | ✅ |

## 🛡️ Safety First

**Job Agent will NEVER automatically apply to jobs on your behalf.** You are always in complete control. We provide tools to help you apply more effectively, but the final action is always yours.

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js
- **Styling**: Tailwind CSS + Radix UI
- **Payments**: Stripe
- **Email**: Resend
- **AI**: OpenAI GPT-4o-mini (with mock fallback)
- **Testing**: Vitest

## 📦 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- (Optional) OpenAI API key
- (Optional) Stripe account
- (Optional) Resend account

### Installation

1. **Clone and install dependencies**
   ```bash
   cd agent
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration:
   ```env
   DATABASE_URL="postgresql://..."
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   
   # Optional - AI features work in mock mode without this
   OPENAI_API_KEY="sk-..."
   
   # Optional - Billing features
   STRIPE_SECRET_KEY="sk_..."
   STRIPE_WEBHOOK_SECRET="whsec_..."
   STRIPE_PRICE_ID_PRO="price_..."
   STRIPE_PRICE_ID_POWER="price_..."
   
   # Optional - Email features
   RESEND_API_KEY="re_..."
   ```

3. **Set up the database**
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

### Demo Account
After seeding, you can login with:
- Email: `demo@jobagent.com`
- Password: `demo123456`

Or the admin account:
- Email: `admin@jobagent.com`
- Password: `demo123456`

## 🏗️ Project Structure

```
src/
├── app/
│   ├── (dashboard)/      # Protected dashboard routes
│   │   ├── dashboard/    # Main dashboard
│   │   ├── jobs/         # Job listing and detail
│   │   ├── pipeline/     # Application tracking
│   │   ├── analytics/    # Insights and stats
│   │   ├── profile/      # User profile
│   │   └── settings/     # Account settings
│   ├── api/              # API routes
│   │   ├── auth/         # Authentication
│   │   ├── jobs/         # Job CRUD + scoring
│   │   ├── pipeline/     # Pipeline management
│   │   ├── profile/      # Profile management
│   │   ├── feedback/     # Outcome feedback
│   │   ├── analytics/    # Analytics data
│   │   ├── billing/      # Stripe integration
│   │   ├── webhooks/     # Stripe webhooks
│   │   ├── cron/         # Scheduled jobs
│   │   └── user/         # User settings
│   ├── login/            # Login page
│   ├── register/         # Registration page
│   └── onboarding/       # Onboarding wizard
├── components/
│   ├── ui/               # Reusable UI components
│   ├── layout/           # Layout components
│   └── providers.tsx     # Context providers
├── lib/
│   ├── prisma.ts         # Database client
│   ├── auth.ts           # NextAuth config
│   ├── scoring.ts        # Match scoring engine
│   ├── calibration.ts    # Weight adjustment
│   ├── ai.ts             # OpenAI integration
│   ├── stripe.ts         # Stripe integration
│   ├── email.ts          # Email templates
│   ├── plans.ts          # Subscription plans
│   ├── quota.ts          # Usage limits
│   └── validations.ts    # Zod schemas
└── types/
    └── next-auth.d.ts    # Type extensions
```

## 🔌 API Reference

### Jobs
- `GET /api/jobs` - List jobs with pagination and filtering
- `POST /api/jobs` - Create a new job (auto-scores)
- `GET /api/jobs/[id]` - Get job details
- `PUT /api/jobs/[id]` - Update job
- `DELETE /api/jobs/[id]` - Delete job
- `POST /api/jobs/[id]/score` - Recalculate score
- `POST /api/jobs/[id]/kit` - Generate application kit

### Pipeline
- `GET /api/pipeline` - Get pipeline items (kanban/list view)
- `POST /api/pipeline` - Add job to pipeline
- `PUT /api/pipeline` - Update pipeline item
- `DELETE /api/pipeline` - Remove from pipeline

### Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update profile
- `POST /api/profile/skills` - Add skill
- `POST /api/profile/experiences` - Add experience
- `POST /api/profile/educations` - Add education

### Feedback
- `POST /api/feedback` - Submit outcome feedback (adjusts scoring weights)

### Billing
- `GET /api/billing` - Get subscription status
- `POST /api/billing` - Create checkout session or portal link

## 🚢 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

Cron jobs are configured in `vercel.json`:
- Reminders: Every hour
- Weekly Summary: Sundays at 6 PM

### Self-hosted

```bash
npm run build
npm start
```

Set up external cron to call:
- `GET /api/cron/reminders` (hourly)
- `GET /api/cron/weekly-summary` (weekly)

Include `Authorization: Bearer YOUR_CRON_SECRET` header.

## 🧪 Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines first.

---

Built with ❤️ for job seekers everywhere. Good luck with your search!
