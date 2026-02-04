/**
 * Test Setup File
 * 
 * This file is loaded before all tests via vitest.config.ts setupFiles.
 * It provides:
 * - Global mocks for external services (Prisma, NextAuth, etc.)
 * - Test utilities and helpers
 * - Environment setup for consistent testing
 */

import { vi, beforeEach, afterEach } from 'vitest';

// ============================================
// Environment Setup
// ============================================

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.CRON_SECRET = 'test-cron-secret';

// ============================================
// Mock: Prisma Client
// ============================================

vi.mock('@/lib/prisma', () => {
  const mockPrismaClient = {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    job: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    jobScore: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
    profile: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
    skill: {
      findMany: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    experience: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    education: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    subscription: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
    pipelineItem: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    contact: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    applicationKit: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },
    feedback: {
      findMany: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
    userScoringWeights: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
    quotaUsage: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
    eventMetric: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    systemLog: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn((fn) => fn(mockPrismaClient)),
    $connect: vi.fn(),
    $disconnect: vi.fn(),
  };

  return {
    prisma: mockPrismaClient,
    default: mockPrismaClient,
  };
});

// ============================================
// Mock: NextAuth
// ============================================

const mockSession = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

vi.mock('next-auth', () => ({
  default: vi.fn(),
  getServerSession: vi.fn(() => Promise.resolve(mockSession)),
}));

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({
    data: mockSession,
    status: 'authenticated',
  })),
  signIn: vi.fn(),
  signOut: vi.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// ============================================
// Mock: OpenAI
// ============================================

vi.mock('openai', () => ({
  default: vi.fn(() => ({
    chat: {
      completions: {
        create: vi.fn(() =>
          Promise.resolve({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    coverLetter: 'Mock cover letter content',
                    resumeTweaks: ['Mock tweak 1', 'Mock tweak 2'],
                    interviewQuestions: [
                      { question: 'Mock question?', suggestedAnswer: 'Mock answer' },
                    ],
                    keywordsToInclude: ['keyword1', 'keyword2'],
                    toneRecommendation: 'Professional',
                  }),
                },
              },
            ],
            usage: { total_tokens: 100 },
          })
        ),
      },
    },
  })),
}));

// ============================================
// Mock: Stripe
// ============================================

vi.mock('stripe', () => ({
  default: vi.fn(() => ({
    checkout: {
      sessions: {
        create: vi.fn(() =>
          Promise.resolve({
            id: 'cs_test_123',
            url: 'https://checkout.stripe.com/test',
          })
        ),
      },
    },
    billingPortal: {
      sessions: {
        create: vi.fn(() =>
          Promise.resolve({
            url: 'https://billing.stripe.com/test',
          })
        ),
      },
    },
    webhooks: {
      constructEvent: vi.fn(),
    },
    customers: {
      create: vi.fn(() => Promise.resolve({ id: 'cus_test_123' })),
    },
    subscriptions: {
      retrieve: vi.fn(() =>
        Promise.resolve({
          id: 'sub_test_123',
          status: 'active',
          current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        })
      ),
    },
  })),
}));

// ============================================
// Mock: Resend
// ============================================

vi.mock('resend', () => ({
  Resend: vi.fn(() => ({
    emails: {
      send: vi.fn(() =>
        Promise.resolve({
          id: 'email_test_123',
        })
      ),
    },
  })),
}));

// ============================================
// Mock: Next.js Navigation
// ============================================

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  })),
  usePathname: vi.fn(() => '/dashboard'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  redirect: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
  headers: vi.fn(() => new Headers()),
}));

// ============================================
// Test Utilities
// ============================================

/**
 * Create a mock user for testing
 */
export function createMockUser(overrides = {}) {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    passwordHash: 'hashed_password',
    createdAt: new Date(),
    updatedAt: new Date(),
    onboardingComplete: true,
    emailPreferences: { reminders: true, weeklySummary: true },
    safetySettings: { autoApplyEnabled: false },
    ...overrides,
  };
}

/**
 * Create a mock job for testing
 */
export function createMockJob(overrides = {}) {
  return {
    id: 'test-job-id',
    userId: 'test-user-id',
    title: 'Software Engineer',
    company: 'Test Company',
    url: 'https://example.com/job',
    description: 'A great job opportunity',
    location: 'San Francisco, CA',
    salary: '$100,000 - $150,000',
    remoteType: 'HYBRID',
    jobType: 'FULL_TIME',
    requirements: ['JavaScript', 'React', 'Node.js'],
    archived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create a mock profile for testing
 */
export function createMockProfile(overrides = {}) {
  return {
    id: 'test-profile-id',
    userId: 'test-user-id',
    headline: 'Senior Software Engineer',
    summary: 'Experienced developer with 5+ years',
    location: 'San Francisco, CA',
    remotePreference: 'HYBRID',
    minSalary: 100000,
    maxSalary: 150000,
    targetSeniority: 'SENIOR',
    profileVersion: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    skills: [
      { id: '1', name: 'JavaScript', level: 'ADVANCED', profileId: 'test-profile-id' },
      { id: '2', name: 'React', level: 'ADVANCED', profileId: 'test-profile-id' },
      { id: '3', name: 'Node.js', level: 'INTERMEDIATE', profileId: 'test-profile-id' },
    ],
    experiences: [],
    educations: [],
    ...overrides,
  };
}

/**
 * Create a mock subscription for testing
 */
export function createMockSubscription(overrides = {}) {
  return {
    id: 'test-subscription-id',
    userId: 'test-user-id',
    status: 'ACTIVE',
    plan: 'FREE',
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    currentPeriodEnd: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ============================================
// Global Hooks
// ============================================

beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();
});

afterEach(() => {
  // Reset any mock implementations after each test
  vi.resetAllMocks();
});

// ============================================
// Global Test Configuration
// ============================================

// Increase timeout for integration tests
vi.setConfig({
  testTimeout: 10000,
});

// Export mock session for tests that need direct access
export { mockSession };
