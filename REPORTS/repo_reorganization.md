# Repository Reorganization Plan

**Current Status:** Well-organized ✅  
**Recommendation:** Minor improvements only

---

## 1. Current Structure Assessment

The repository follows Next.js 14 App Router conventions and is **well-organized**. No major restructuring is needed.

### 1.1 What's Good ✅

```
✅ src/ directory for source code
✅ app/ uses route groups ((dashboard))
✅ components/ with ui/ subdirectory
✅ lib/ for shared utilities
✅ prisma/ for database schema
✅ docs/ for documentation
✅ REPORTS/ for audit reports
✅ __tests__/ for unit tests
```

### 1.2 Minor Improvements Suggested

---

## 2. Recommended Changes

### 2.1 Add Loading States

Create loading skeletons for each route group:

```
src/app/(dashboard)/
├── loading.tsx          # NEW - Dashboard loading state
├── dashboard/
│   └── loading.tsx      # NEW - Main dashboard skeleton
├── jobs/
│   └── loading.tsx      # NEW - Jobs list skeleton
├── pipeline/
│   └── loading.tsx      # NEW - Pipeline skeleton
└── ...
```

### 2.2 Add Error Boundaries

Create error handlers for route groups:

```
src/app/(dashboard)/
├── error.tsx            # NEW - Dashboard error boundary
├── not-found.tsx        # NEW - 404 for dashboard routes
└── ...
```

### 2.3 Organize Hooks

Extract custom hooks from components:

```
src/
├── hooks/               # NEW directory
│   ├── useJobs.ts       # Job data fetching
│   ├── usePipeline.ts   # Pipeline data
│   ├── useProfile.ts    # Profile data
│   └── useNotifications.ts
└── ...
```

### 2.4 Add Types Directory Structure

Expand types organization:

```
src/types/
├── next-auth.d.ts       # Existing
├── api.ts               # NEW - API response types
├── forms.ts             # NEW - Form data types
└── index.ts             # NEW - Export all types
```

### 2.5 Add Constants File

Centralize magic values:

```
src/lib/
├── constants.ts         # NEW
│   ├── ROUTES
│   ├── API_ENDPOINTS
│   ├── DEFAULT_VALUES
│   └── ERROR_MESSAGES
└── ...
```

---

## 3. Component Refactoring

### 3.1 Large Components to Split

| Component | Current Lines | Recommended Split |
|-----------|---------------|-------------------|
| `documents/page.tsx` | ~500 | DocumentList, DocumentUpload, DocumentCard |
| `pipeline/page.tsx` | ~450 | KanbanView, ListView, PipelineCard |
| `jobs/page.tsx` | ~350 | JobList, JobFilters, JobCard |

### 3.2 Suggested Component Structure

```
src/components/
├── ui/                  # Existing shadcn components
├── layout/              # Existing layout components
├── forms/               # NEW
│   ├── JobForm.tsx
│   ├── ProfileForm.tsx
│   └── ...
├── cards/               # NEW
│   ├── JobCard.tsx
│   ├── PipelineCard.tsx
│   └── ...
├── lists/               # NEW
│   ├── JobList.tsx
│   ├── NotificationList.tsx
│   └── ...
└── providers.tsx
```

---

## 4. Test Organization

### 4.1 Current Structure

```
src/__tests__/
├── ai.test.ts
├── analytics.test.ts
├── api-helpers.test.ts
├── calibration.test.ts
├── pipeline.test.ts
├── plans.test.ts
├── scoring.test.ts
└── validation.test.ts
```

### 4.2 Recommended Structure

```
src/__tests__/
├── unit/                # NEW subdirectory
│   ├── scoring.test.ts
│   ├── calibration.test.ts
│   └── ...
├── integration/         # NEW subdirectory
│   ├── api/
│   │   ├── jobs.test.ts
│   │   └── ...
│   └── ...
└── setup.ts
```

---

## 5. Documentation Structure

### 5.1 Current

```
docs/
├── ARCHITECTURE.md
├── PHASE2_DESIGN.md
└── QA_VERIFICATION_REPORT.md
```

### 5.2 Recommended

```
docs/
├── architecture/
│   ├── OVERVIEW.md
│   ├── DATABASE.md
│   └── API.md
├── features/
│   ├── PHASE2_DESIGN.md
│   └── ...
├── deployment/
│   └── SETUP.md
└── CONTRIBUTING.md
```

---

## 6. Environment Files

### 6.1 Current

```
.env.example
```

### 6.2 Recommended

```
.env.example              # Template
.env.local.example        # Local dev specifics
.env.test.example         # Test environment
```

---

## 7. Priority Order

| Change | Priority | Effort | Impact |
|--------|----------|--------|--------|
| Add loading.tsx files | Medium | Low | UX improvement |
| Add error.tsx files | Medium | Low | Error handling |
| Create hooks directory | Low | Medium | Code organization |
| Split large components | Low | High | Maintainability |
| Reorganize tests | Low | Medium | Test clarity |

---

## 8. No Changes Needed

The following are already well-organized:

- ✅ API route structure (`/api/*`)
- ✅ Component library (`/components/ui/`)
- ✅ Prisma schema location
- ✅ Configuration files (root level)
- ✅ Next.js configuration

---

## Summary

**The repository is 90% well-organized.** Only minor improvements are suggested:

1. Add loading/error states (UX)
2. Extract hooks (code reuse)
3. Split large components (maintainability)

No urgent restructuring required.

---

*Analysis based on Next.js 14 best practices and project requirements*
