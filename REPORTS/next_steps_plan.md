# Next Steps Plan - JobCircle MVP Launch

**Version:** 1.0  
**Based On:** Progress Audit Report  
**Target:** Production-Ready MVP  

---

## 🎯 Goal: Achieve 100% MVP Readiness

Current Status: **77.75%** → Target: **100%**

---

## Phase 1: Critical Fixes (Blocks Deployment)
**Timeline:** 2-4 hours  
**Priority:** 🔴 CRITICAL

### 1.1 Fix ESLint Build Errors

| Task | File | Action | Est. Time |
|------|------|--------|-----------|
| Escape quotes | `documents/page.tsx:485` | Replace `"` with `{'"'}` or `&quot;` | 5 min |
| Escape quotes | `notifications/page.tsx:231` | Replace `'` with `{'\'''}` or `&apos;` | 5 min |
| Escape quotes | `login/page.tsx:96` | Replace `'` with `{'\'''}` | 5 min |
| Rename function | `ai.ts:226-275` | Rename `useRealAI` → `getRealAIEnabled` | 15 min |

### 1.2 Fix Import Mismatches

| Consumer | Bad Import | Correct Import | Action |
|----------|------------|----------------|--------|
| `billing/route.ts` | `createCustomerPortalSession` | `createBillingPortalSession` | Rename |
| `feedback/route.ts` | `adjustWeights` | `updateWeights` | Rename |
| `jobs/route.ts` | `jobSchema` | `jobCreateSchema` | Rename |
| `jobs/[id]/route.ts` | `jobSchema` | `jobCreateSchema` | Rename |
| `pipeline/route.ts` | `pipelineItemSchema` | `pipelineUpdateSchema` | Rename |
| `jobs/[id]/kit/route.ts` | `incrementAIUsage` | Create function or remove | Create |
| `cron/*.ts`, `webhooks/*.ts` | `logger` | `log`, `logError`, `logInfo` | Create alias |

### 1.3 Add Missing Exports

**File:** `src/lib/logger.ts`
```typescript
// Add at bottom of file
export const logger = {
  info: logInfo,
  error: logError,
  log,
};
```

**File:** `src/lib/plans.ts`
```typescript
// Add function for AI usage tracking
export async function incrementAIUsage(userId: string): Promise<void> {
  // Implementation for tracking AI generation usage
  // Store in database or increment counter
}
```

---

## Phase 2: Test Suite Fixes
**Timeline:** 2-3 hours  
**Priority:** 🟠 HIGH

### 2.1 Fix Prisma Enum Import Issues

**Option A (Recommended):** Use string literals in tests instead of enum imports

```typescript
// Before
import { SubscriptionStatus } from '@prisma/client';
expect(result).toBe(SubscriptionStatus.FREE);

// After
expect(result).toBe('FREE');
```

**Option B:** Add Prisma mock to test setup

```typescript
// src/test/setup.ts
vi.mock('@prisma/client', async () => {
  const actual = await vi.importActual('@prisma/client');
  return {
    ...actual,
    SubscriptionStatus: {
      FREE: 'FREE',
      PRO: 'PRO',
      POWER: 'POWER',
      PAST_DUE: 'PAST_DUE',
      CANCELED: 'CANCELED',
    },
    SeniorityLevel: {
      INTERN: 'INTERN',
      JUNIOR: 'JUNIOR',
      MID: 'MID',
      SENIOR: 'SENIOR',
      LEAD: 'LEAD',
      PRINCIPAL: 'PRINCIPAL',
      EXECUTIVE: 'EXECUTIVE',
    },
    // ... other enums
  };
});
```

### 2.2 Fix Test Function Names

| Test File | Fix |
|-----------|-----|
| `calibration.test.ts` | Change `adjustWeights` → `updateWeights` |
| `ai.test.ts` | Add mock function exports or update imports |
| `scoring.test.ts` | Update expected return formats |

### 2.3 Fix Analytics Test

**File:** `analytics.test.ts` line 165
- Issue: `groupByWeek` returns different date key format
- Action: Update test expectations to match actual implementation

---

## Phase 3: Security & Dependencies
**Timeline:** 1 hour  
**Priority:** 🟡 MEDIUM

### 3.1 Fix Vulnerabilities

```bash
# Run in terminal
npm audit fix

# If any remain:
npm audit fix --force  # Use with caution, may introduce breaking changes

# Review remaining issues
npm audit
```

### 3.2 Update Package Lock

```bash
# Regenerate package-lock.json
rm package-lock.json
npm install
```

---

## Phase 4: Environment & Configuration
**Timeline:** 1-2 hours  
**Priority:** 🟡 MEDIUM

### 4.1 Production Environment Variables

Create production `.env` with all required values:

```env
# Required
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=<generate-with-openssl>
NEXTAUTH_URL=https://your-domain.com

# Optional but recommended
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
```

### 4.2 Generate Secrets

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32
```

---

## Phase 5: Feature Completion
**Timeline:** 4-6 hours  
**Priority:** 🟢 NICE TO HAVE

### 5.1 Complete S3 Upload

| Task | Est. Time |
|------|-----------|
| Configure AWS S3 or Cloudflare R2 | 30 min |
| Implement presigned URL generation | 1 hour |
| Add upload progress indicator | 1 hour |
| Test upload/download flow | 30 min |

### 5.2 Complete Stripe Integration

| Task | Est. Time |
|------|-----------|
| Create Stripe products/prices | 30 min |
| Test checkout flow | 30 min |
| Test webhook handling | 30 min |
| Test billing portal | 30 min |

### 5.3 Email Setup

| Task | Est. Time |
|------|-----------|
| Configure Resend domain | 30 min |
| Test email templates | 30 min |
| Test reminder cron | 30 min |

---

## Phase 6: Pre-Launch Checklist
**Timeline:** 2 hours  
**Priority:** 🟠 HIGH

### 6.1 Deployment Preparation

- [ ] Build passes locally: `npm run build`
- [ ] All tests pass: `npm run test:run`
- [ ] No lint errors: `npm run lint`
- [ ] Database migrated: `npx prisma migrate deploy`
- [ ] Seed data loaded (if needed): `npx prisma db seed`

### 6.2 Production Deployment

**Vercel (Recommended):**
1. Connect GitHub repository
2. Add environment variables in Vercel dashboard
3. Deploy

**Alternative (Railway/Render):**
1. Connect repository
2. Configure environment
3. Set build command: `npm run build`
4. Set start command: `npm start`

### 6.3 Post-Deployment Verification

- [ ] Homepage loads
- [ ] Can register new user
- [ ] Can login
- [ ] Dashboard accessible
- [ ] Can add job
- [ ] Can move job in pipeline
- [ ] Can view analytics
- [ ] Can update profile

---

## Timeline Summary

| Phase | Tasks | Time | Priority |
|-------|-------|------|----------|
| Phase 1 | Critical fixes | 2-4 hrs | 🔴 |
| Phase 2 | Test fixes | 2-3 hrs | 🟠 |
| Phase 3 | Security | 1 hr | 🟡 |
| Phase 4 | Environment | 1-2 hrs | 🟡 |
| Phase 5 | Features | 4-6 hrs | 🟢 |
| Phase 6 | Deployment | 2 hrs | 🟠 |
| **TOTAL** | | **12-18 hrs** | |

---

## Quick Wins (Do First)

1. ✅ Fix 4 ESLint string escape errors (20 min)
2. ✅ Rename `useRealAI` to `getRealAIEnabled` (10 min)
3. ✅ Add `logger` export alias (5 min)
4. ✅ Run `npm audit fix` (5 min)
5. ✅ Update test function imports (30 min)

**After these 5 tasks, build should pass and test pass rate should jump to ~85%+**

---

## Success Criteria

MVP is ready when:

- [x] Project structure complete
- [ ] `npm run build` succeeds
- [ ] `npm run test:run` passes 90%+
- [ ] `npm run lint` has 0 errors
- [ ] Core user flows work end-to-end
- [ ] Production environment configured
- [ ] Deployed to public URL

---

*Plan generated based on Progress Audit Report findings*
