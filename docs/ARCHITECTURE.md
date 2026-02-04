# JobCircle - Architecture Documentation

## Overview

JobCircle is a professional SaaS web platform for job application management. Users can discover jobs, track applications through a pipeline, manage CVs/documents, and receive AI-powered scoring and recommendations.

## Technology Stack

### Frontend
- **Next.js 14** (App Router) - React framework with SSR/SSG
- **TypeScript** - Type-safe development
- **TailwindCSS** - Utility-first styling
- **shadcn/ui** - Accessible component library
- **React Hook Form + Zod** - Form validation

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **NextAuth.js** - Authentication (JWT strategy)
- **Prisma ORM** - Database access layer

### Database
- **PostgreSQL** - Primary data store
- **Redis** - Session cache, rate limiting (optional)

### External Services
- **OpenAI API** - Job scoring, application kit generation
- **Stripe** - Payment processing (Phase 1.5)
- **Resend** - Transactional emails
- **S3/MinIO** - Document storage

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT (Browser)                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Next.js Frontend                          │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│   │
│  │  │ Dashboard   │ │ Jobs List   │ │ Pipeline (Kanban/List) ││   │
│  │  └─────────────┘ └─────────────┘ └─────────────────────────┘│   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│   │
│  │  │ Documents   │ │ Profile     │ │ Settings                ││   │
│  │  └─────────────┘ └─────────────┘ └─────────────────────────┘│   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                │ HTTPS (REST API)
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      NEXT.JS API LAYER                              │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Middleware (Auth, Rate Limiting, Validation)                │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────────┐  │
│  │ /api/auth  │ │ /api/jobs  │ │/api/pipeline│ │ /api/documents │  │
│  │ - login    │ │ - CRUD     │ │ - stages    │ │ - upload       │  │
│  │ - register │ │ - score    │ │ - timeline  │ │ - download     │  │
│  │ - logout   │ │ - kit      │ │ - contacts  │ │ - delete       │  │
│  └────────────┘ └────────────┘ └────────────┘ └────────────────┘  │
│                                                                     │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────────┐  │
│  │/api/profile│ │/api/billing│ │ /api/cron  │ │/api/notifications│ │
│  │ - update   │ │ - checkout │ │ - discover │ │ - list         │  │
│  │ - skills   │ │ - portal   │ │ - reminders│ │ - mark read    │  │
│  │ - education│ │ - webhook  │ │ - summary  │ │ - settings     │  │
│  └────────────┘ └────────────┘ └────────────┘ └────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        SERVICE LAYER                                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  │
│  │ Auth        │ │ Scoring     │ │ AI          │ │ Storage     │  │
│  │ Service     │ │ Engine      │ │ Generator   │ │ Service     │  │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  │
│  │ Email       │ │ Quota       │ │ Calibration │ │ Validation  │  │
│  │ Service     │ │ Manager     │ │ Service     │ │ Service     │  │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                   │
│                                                                     │
│  ┌───────────────────┐    ┌───────────────────┐                    │
│  │   PostgreSQL      │    │      Redis        │                    │
│  │   (Prisma ORM)    │    │   (Sessions/Cache)│                    │
│  │                   │    │                   │                    │
│  │  - Users          │    │  - Rate limits    │                    │
│  │  - Jobs           │    │  - Session data   │                    │
│  │  - Pipeline       │    │  - Cache          │                    │
│  │  - Documents      │    │                   │                    │
│  │  - Notifications  │    │                   │                    │
│  └───────────────────┘    └───────────────────┘                    │
│                                                                     │
│  ┌───────────────────┐    ┌───────────────────┐                    │
│  │   S3 / MinIO      │    │    OpenAI API     │                    │
│  │   (Documents)     │    │   (AI Features)   │                    │
│  │                   │    │                   │                    │
│  │  - CV uploads     │    │  - Job scoring    │                    │
│  │  - Cover letters  │    │  - Kit generation │                    │
│  │  - Exports        │    │  - Q&A prep       │                    │
│  └───────────────────┘    └───────────────────┘                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### 1. User Registration & Onboarding Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Register│ ──▶ │  Verify  │ ──▶ │ Onboard  │ ──▶ │Dashboard │
│   Page   │     │  Email   │     │  Wizard  │     │          │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
     │                                  │
     ▼                                  ▼
┌──────────┐                     ┌──────────┐
│  Create  │                     │  Create  │
│   User   │                     │ Profile  │
│ + Sub    │                     │ + Skills │
│ + Weights│                     │ + Prefs  │
└──────────┘                     └──────────┘
```

**Steps:**
1. User submits registration form (email, password, name)
2. Server creates User record + Subscription (FREE) + ScoringWeights
3. User redirected to onboarding wizard (3 steps)
4. Step 1: Basic info (headline, location, remote preference)
5. Step 2: Experience summary and skills
6. Step 3: Target role, seniority, salary expectations
7. Profile created, onboardingComplete flag set
8. User redirected to dashboard

### 2. CV/Document Upload Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Select  │ ──▶ │ Validate │ ──▶ │  Upload  │ ──▶ │  Store   │
│   File   │     │ Type/Size│     │  to S3   │     │ Metadata │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                      │                                  │
                      ▼                                  ▼
                ┌──────────┐                      ┌──────────┐
                │  Error   │                      │  Parse   │
                │ Message  │                      │  Content │
                └──────────┘                      │ (optional)│
                                                 └──────────┘
```

**Validation Rules:**
- File types: PDF, DOCX only
- Max size: 10MB
- Max files per user: 10 (based on plan)
- Signed URLs for secure download (expires in 1 hour)

### 3. Job Discovery & Pipeline Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Manual  │ ──▶ │  Parse   │ ──▶ │  Score   │ ──▶ │   Add    │
│  Add Job │     │   JD     │     │  Match   │     │ Pipeline │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                      ▲
                      │
┌──────────┐     ┌──────────┐
│Discovery │ ──▶ │  Create  │
│   Cron   │     │   Jobs   │
└──────────┘     └──────────┘
```

**Pipeline Stages:**
```
SAVED ──▶ APPLYING ──▶ APPLIED ──▶ INTERVIEWING ──▶ OFFER
                            │                          │
                            ▼                          ▼
                       REJECTED                    ACCEPTED
                            │
                            ▼
                       WITHDRAWN
```

### 4. Application Kit Generation Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Select  │ ──▶ │  Load    │ ──▶ │   AI     │ ──▶ │  Store   │
│   Job    │     │ Profile  │     │ Generate │     │   Kit    │
│          │     │ + Job    │     │          │     │          │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                                       │
                                       ▼
                                 ┌──────────┐
                                 │  Outputs │
                                 │ - Resume │
                                 │   bullets│
                                 │ - Cover  │
                                 │   letter │
                                 │ - Q&A    │
                                 └──────────┘
```

---

## Database Schema Overview

### Core Models

| Model | Purpose | Key Fields |
|-------|---------|------------|
| User | User account | email, password, onboardingComplete |
| Profile | User preferences | headline, targetRole, salary, remotePreference |
| Subscription | Plan management | status (FREE/PRO/POWER), stripeCustomerId |
| Job | Job listings | title, company, description, url |
| PipelineItem | Application tracking | stage, notes, timeline |
| Document | CV/file storage | name, s3Key, mimeType, isDefault |
| Notification | User notifications | type, title, read |
| JobScore | Match scoring | overallScore, breakdown |
| ApplicationKit | Generated content | resumeBullets, coverLetter |

### Relationships

```
User
  ├── Profile (1:1)
  ├── Subscription (1:1)
  ├── Jobs (1:N)
  │     ├── PipelineItem (1:1)
  │     ├── JobScores (1:N)
  │     ├── ApplicationKits (1:N)
  │     └── Contacts (1:N)
  ├── Documents (1:N)
  ├── Notifications (1:N)
  └── ScoringWeights (1:1)
```

---

## API Specification

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Create new account |
| POST | /api/auth/[...nextauth] | NextAuth handlers |
| GET | /api/auth/session | Get current session |

### Jobs Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/jobs | List jobs (paginated, filterable) |
| POST | /api/jobs | Create new job |
| GET | /api/jobs/[id] | Get job details |
| PUT | /api/jobs/[id] | Update job |
| DELETE | /api/jobs/[id] | Archive job |
| POST | /api/jobs/[id]/score | Generate/refresh score |
| POST | /api/jobs/[id]/kit | Generate application kit |

### Pipeline Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/pipeline | Get pipeline (kanban or list) |
| POST | /api/pipeline | Create pipeline item |
| PUT | /api/pipeline | Update stage |
| GET | /api/pipeline/[id]/contacts | Get contacts for job |
| POST | /api/pipeline/[id]/contacts | Add contact |

### Documents Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/documents | List user documents |
| POST | /api/documents | Upload document |
| GET | /api/documents/[id] | Get document (signed URL) |
| DELETE | /api/documents/[id] | Delete document |
| PUT | /api/documents/[id]/default | Set as default CV |

### Notifications Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/notifications | List notifications |
| PUT | /api/notifications/[id]/read | Mark as read |
| PUT | /api/notifications/read-all | Mark all read |

---

## Security Decisions

### 1. Authentication

- **Strategy**: JWT stored in httpOnly cookies
- **Session Duration**: 30 days
- **Password Hashing**: bcrypt with 12 rounds
- **OAuth**: Google provider (optional)

### 2. Authorization

- **Middleware Protection**: All /api/* and /(dashboard)/* routes
- **Resource Ownership**: Users can only access their own data
- **Admin Check**: Email whitelist or role-based

### 3. Input Validation

- **Schema Validation**: Zod schemas for all API inputs
- **SQL Injection**: Prisma parameterized queries
- **XSS Prevention**: React automatic escaping
- **File Validation**: Type + size + virus scan (stub)

### 4. Rate Limiting

```typescript
// Per-endpoint limits
const rateLimits = {
  'POST /api/auth/register': '5/minute',
  'POST /api/auth/login': '10/minute',
  'POST /api/jobs': '30/hour',
  'POST /api/jobs/*/score': '100/hour',
  'POST /api/jobs/*/kit': '50/hour (quota-based)',
};
```

### 5. File Upload Security

- **Allowed Types**: PDF, DOCX only
- **Max Size**: 10MB
- **Storage**: Private S3 bucket with signed URLs
- **Download**: Temporary signed URLs (1hr expiry)
- **Virus Scanning**: Integration point (not MVP)

### 6. Data Privacy

- **Encryption at Rest**: PostgreSQL encryption
- **Encryption in Transit**: TLS/HTTPS only
- **PII Handling**: Minimal retention, user deletion
- **GDPR**: Export/delete user data endpoints

---

## Scalability Considerations

### 5000 Users Target

| Resource | Strategy |
|----------|----------|
| Database | Connection pooling (PgBouncer), read replicas |
| API | Vercel serverless auto-scaling |
| Storage | S3 with CloudFront CDN |
| AI Calls | Queue-based processing, caching |
| Sessions | JWT (stateless), Redis cache optional |

### Performance Optimizations

1. **Database Indexes**: All foreign keys, common queries
2. **Pagination**: Cursor-based for large lists
3. **Caching**: Score results, profile data
4. **Lazy Loading**: Documents, activity history
5. **CDN**: Static assets, document previews

---

## Environment Configuration

### Required Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# AI
OPENAI_API_KEY=sk-xxx

# Storage (S3-compatible)
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=jobcircle-documents

# Email
RESEND_API_KEY=re_xxx

# Stripe (Phase 1.5)
STRIPE_SECRET_KEY=sk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Cron Secret
CRON_SECRET=your-cron-secret
```

---

## Deployment Architecture

### Development

```
Local Machine
├── Next.js (npm run dev)
├── PostgreSQL (Docker)
├── Redis (Docker, optional)
└── MinIO (Docker, S3-compatible)
```

### Production (Vercel + AWS)

```
┌─────────────┐     ┌─────────────┐
│   Vercel    │ ──▶ │   AWS RDS   │
│  (Next.js)  │     │ (PostgreSQL)│
└─────────────┘     └─────────────┘
       │
       ├──────────▶ AWS S3 (Documents)
       │
       ├──────────▶ OpenAI API
       │
       └──────────▶ Stripe API
```

---

## Monitoring & Logging

### Structured Logging

```typescript
// Log format
{
  timestamp: '2024-01-15T10:30:00Z',
  level: 'INFO' | 'WARN' | 'ERROR',
  type: 'AUTH' | 'API' | 'CRON' | 'AI',
  message: 'User logged in',
  userId: 'cuid_xxx',
  metadata: { ... }
}
```

### Health Checks

- `GET /api/health` - API health
- Database connectivity
- External service status
- Cron job execution status

---

## Phase 2: Mock Interview Feature

See [PHASE2_DESIGN.md](./PHASE2_DESIGN.md) for detailed design of:
- Video/audio interview practice
- AI-powered feedback and scoring
- Question bank management
- Performance analytics
