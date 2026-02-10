# Repository Inventory Report
**Project:** JobCircle (job-agent)  
**Date:** Auto-generated  
**Version:** 1.0.0  

---

## 📁 Root Structure

```
agent/
├── .env.example           # Environment variables template
├── .github/workflows/     # CI/CD configuration
│   └── ci.yml
├── .gitignore
├── docker-compose.yml     # Local dev services (Postgres, Redis, MinIO)
├── docs/                  # Documentation
├── next-env.d.ts
├── next.config.js
├── package.json
├── postcss.config.mjs
├── prisma/                # Database schema & seed
├── PROJECT_VERIFICATION_REPORT.md
├── README.md
├── REPORTS/               # Audit reports (this folder)
├── src/                   # Application source code
├── tailwind.config.ts
├── tsconfig.json
├── vercel.json            # Vercel deployment config
└── vitest.config.ts       # Test configuration
```

---

## 📂 Source Code Structure (`src/`)

### Application (`src/app/`)

#### Dashboard Routes (`src/app/(dashboard)/`)
| Route | File | Purpose | Status |
|-------|------|---------|--------|
| `/admin` | `admin/page.tsx` | Admin dashboard with user stats | ✅ New |
| `/analytics` | `analytics/page.tsx` | Analytics charts & insights | ✅ Existing |
| `/dashboard` | `dashboard/page.tsx` | Main user dashboard | ✅ Existing |
| `/documents` | `documents/page.tsx` | CV/resume management | ✅ New |
| `/jobs` | `jobs/page.tsx` | Job listings | ✅ Existing |
| `/jobs/[id]` | `jobs/[id]/page.tsx` | Single job detail | ✅ Existing |
| `/jobs/new` | `jobs/new/page.tsx` | Add new job | ✅ Existing |
| `/notifications` | `notifications/page.tsx` | Notification center | ✅ New |
| `/pipeline` | `pipeline/page.tsx` | Application pipeline/kanban | ✅ Existing |
| `/profile` | `profile/page.tsx` | User profile editor | ✅ Existing |
| `/settings` | `settings/page.tsx` | User settings | ✅ Existing |

#### Auth Routes
| Route | File | Purpose |
|-------|------|---------|
| `/login` | `login/page.tsx` | User login |
| `/register` | `register/page.tsx` | User registration |
| `/onboarding` | `onboarding/page.tsx` | New user onboarding |

#### API Routes (`src/app/api/`)
| Endpoint | Method(s) | Purpose |
|----------|-----------|---------|
| `/api/analytics` | GET | Fetch analytics data |
| `/api/auth/[...nextauth]` | * | NextAuth handlers |
| `/api/auth/register` | POST | User registration |
| `/api/billing` | GET/POST | Billing management |
| `/api/cron/discovery` | POST | Job discovery cron |
| `/api/cron/reminders` | POST | Send reminders |
| `/api/cron/weekly-summary` | POST | Weekly email summary |
| `/api/documents` | GET/POST | Documents CRUD |
| `/api/documents/[id]` | GET/PUT/DELETE | Single document ops |
| `/api/feedback` | POST | Submit feedback |
| `/api/jobs` | GET/POST | Jobs CRUD |
| `/api/jobs/[id]` | GET/PUT/DELETE | Single job ops |
| `/api/jobs/[id]/kit` | GET/POST | Application kit generation |
| `/api/jobs/[id]/score` | POST | Job scoring |
| `/api/notifications` | GET/POST | Notifications CRUD |
| `/api/notifications/[id]` | GET/PATCH/DELETE | Single notification ops |
| `/api/pipeline` | GET/POST/PATCH | Pipeline management |
| `/api/pipeline/[id]/contacts` | GET/POST | Pipeline contacts |
| `/api/profile` | GET/PUT | Profile data |
| `/api/profile/educations` | * | Education entries |
| `/api/profile/experiences` | * | Experience entries |
| `/api/profile/skills` | * | Skills |
| `/api/user/onboarding` | POST | Complete onboarding |
| `/api/user/settings` | GET/PUT | User settings |
| `/api/user/weights` | GET/PUT | Scoring weights |
| `/api/webhooks/stripe` | POST | Stripe webhooks |

---

### Components (`src/components/`)

#### Layout Components
- `layout/sidebar.tsx` - Main navigation sidebar

#### UI Components (shadcn/ui)
| Component | File |
|-----------|------|
| AlertDialog | `ui/alert-dialog.tsx` |
| Badge | `ui/badge.tsx` |
| Button | `ui/button.tsx` |
| Card | `ui/card.tsx` |
| Dialog | `ui/dialog.tsx` |
| DropdownMenu | `ui/dropdown-menu.tsx` |
| Input | `ui/input.tsx` |
| Label | `ui/label.tsx` |
| Progress | `ui/progress.tsx` |
| Select | `ui/select.tsx` |
| Skeleton | `ui/skeleton.tsx` |
| Slider | `ui/slider.tsx` |
| Switch | `ui/switch.tsx` |
| Tabs | `ui/tabs.tsx` |
| Textarea | `ui/textarea.tsx` |
| Toast | `ui/toast.tsx` |
| Toaster | `ui/toaster.tsx` |
| Tooltip | `ui/tooltip.tsx` |
| useToast (hook) | `ui/use-toast.ts` |

#### Providers
- `providers.tsx` - React context providers (auth, theme)

---

### Library (`src/lib/`)
| File | Purpose |
|------|---------|
| `ai.ts` | OpenAI integration for kit generation |
| `auth.ts` | NextAuth configuration |
| `calibration.ts` | Score calibration logic |
| `email.ts` | Resend email integration |
| `errors.ts` | Error handling utilities |
| `logger.ts` | Logging utilities |
| `plans.ts` | Subscription plan definitions |
| `prisma.ts` | Prisma client singleton |
| `quota.ts` | Usage quota management |
| `scoring.ts` | Job-profile scoring algorithm |
| `session.ts` | Session utilities |
| `stripe.ts` | Stripe integration |
| `utils.ts` | General utilities |
| `validations.ts` | Zod schemas for validation |

---

### Types (`src/types/`)
- `next-auth.d.ts` - NextAuth type augmentation

### Middleware
- `middleware.ts` - Route protection middleware

---

## 🗄️ Database (`prisma/`)

### Files
- `schema.prisma` - Database schema definition
- `seed.ts` - Demo data seeding script

### Models
| Model | Purpose |
|-------|---------|
| User | User accounts |
| Profile | User profile details |
| Experience | Work experience entries |
| Education | Education entries |
| Skill | User skills |
| Subscription | Billing subscriptions |
| Job | Saved job listings |
| JobScore | AI scoring results |
| ApplicationKit | Generated cover letters/emails |
| PipelineItem | Application pipeline entries |
| PipelineContact | Contacts per pipeline item |
| Document | CV/resume uploads |
| Notification | User notifications |
| UserPreferences | User preferences/settings |
| TimelineEvent | Activity timeline |

---

## 🧪 Tests (`src/__tests__/`)
| Test File | Coverage Area |
|-----------|---------------|
| `ai.test.ts` | AI integration |
| `analytics.test.ts` | Analytics logic |
| `api-helpers.test.ts` | API utilities |
| `calibration.test.ts` | Score calibration |
| `pipeline.test.ts` | Pipeline logic |
| `plans.test.ts` | Subscription plans |
| `scoring.test.ts` | Scoring algorithm |
| `validation.test.ts` | Input validation |

---

## 📚 Documentation (`docs/`)
| File | Purpose |
|------|---------|
| `ARCHITECTURE.md` | System architecture overview |
| `PHASE2_DESIGN.md` | Mock interview feature design |
| `QA_VERIFICATION_REPORT.md` | QA checklist template |

---

## 🔧 Configuration Files
| File | Purpose |
|------|---------|
| `.env.example` | Environment variables template |
| `docker-compose.yml` | Local services (Postgres, Redis, MinIO) |
| `next.config.js` | Next.js configuration |
| `tailwind.config.ts` | Tailwind CSS config |
| `tsconfig.json` | TypeScript configuration |
| `vitest.config.ts` | Vitest test runner config |
| `postcss.config.mjs` | PostCSS plugins |
| `vercel.json` | Vercel deployment settings |

---

## 📊 File Statistics

| Category | Count |
|----------|-------|
| **Pages (Frontend)** | 13 |
| **API Routes** | 24+ endpoints |
| **UI Components** | 19 |
| **Library Modules** | 14 |
| **Database Models** | 15 |
| **Test Files** | 8 |
| **Doc Files** | 3 |

---

## 🔗 Dependencies Summary

### Runtime Dependencies
- **Framework:** Next.js 14.1.0
- **React:** 18.2.0
- **Auth:** next-auth 4.24.6
- **Database:** @prisma/client 5.10.0
- **AI:** openai 4.29.0
- **Payments:** stripe 14.18.0
- **Email:** resend 3.2.0
- **UI:** Radix primitives, lucide-react, recharts
- **Styling:** Tailwind CSS, class-variance-authority

### Dev Dependencies
- **Testing:** vitest, @testing-library/react, jsdom
- **Types:** TypeScript 5.3.3
- **Linting:** ESLint + Next.js config
- **Database:** prisma 5.10.0

---

*Generated as part of QA audit process*
