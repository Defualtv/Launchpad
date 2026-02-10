import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { errorResponse, successResponse, createError, ErrorCodes } from '@/lib/errors';
import { createCheckoutSession, createBillingPortalSession, getOrCreateCustomer } from '@/lib/stripe';
import { PLANS, getPlanFromStatus } from '@/lib/plans';

// GET /api/billing - Get billing info
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse(createError(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401));
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        subscription: true,
      },
    });

    if (!user) {
      return errorResponse(createError(ErrorCodes.NOT_FOUND, 'User not found', 404));
    }

    const currentPlanType = user.subscription 
      ? getPlanFromStatus(user.subscription.status) 
      : 'FREE';
    const planDetails = PLANS[currentPlanType];

    // Get current month quota
    const currentMonth = new Date().toISOString().slice(0, 7);
    const quotaUsage = await prisma.quotaUsage.findUnique({
      where: {
        userId_monthKey: {
          userId: user.id,
          monthKey: currentMonth,
        },
      },
    });

    return successResponse({
      subscription: user.subscription
        ? {
            id: user.subscription.id,
            status: user.subscription.status,
            currentPeriodEnd: user.subscription.currentPeriodEnd,
            cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd,
          }
        : null,
      currentPlan: {
        id: currentPlanType,
        name: planDetails.name,
        limits: planDetails.limits,
        price: planDetails.price,
      },
      usage: {
        jobs: await prisma.job.count({ where: { userId: user.id } }),
        aiGenerations: quotaUsage?.aiGenerationsUsed || 0,
        monthKey: currentMonth,
      },
      plans: Object.entries(PLANS).map(([id, plan]) => ({
        id,
        name: plan.name,
        price: plan.price,
        limits: plan.limits,
        features: plan.features,
        priceId: plan.priceId,
      })),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

// POST /api/billing - Create checkout session or manage subscription
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.email) {
      return errorResponse(createError(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401));
    }

    const body = await request.json();
    const { action, planId } = body;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { subscription: true },
    });

    if (!user) {
      return errorResponse(createError(ErrorCodes.NOT_FOUND, 'User not found', 404));
    }

    if (action === 'checkout') {
      // Create new subscription checkout
      if (!planId || !PLANS[planId as keyof typeof PLANS]) {
        return errorResponse(createError(ErrorCodes.VALIDATION_ERROR, 'Invalid plan', 400));
      }

      const plan = PLANS[planId as keyof typeof PLANS];
      if (!plan.priceId) {
        return errorResponse(createError(ErrorCodes.VALIDATION_ERROR, 'Plan is free', 400));
      }

      // Get or create Stripe customer
      const customer = await getOrCreateCustomer(
        session.user.email,
        session.user.name || undefined,
        user.subscription?.stripeCustomerId || undefined,
      );

      const origin = request.headers.get('origin') || process.env.NEXTAUTH_URL || 'http://localhost:3000';
      
      const checkoutSession = await createCheckoutSession(
        customer.id,
        plan.priceId,
        user.id,
        `${origin}/settings?billing=success`,
        `${origin}/settings?billing=cancel`,
      );

      return successResponse({ url: checkoutSession.url });
    }

    if (action === 'portal') {
      // Access customer portal to manage subscription
      if (!user.subscription?.stripeCustomerId) {
        return errorResponse(createError(
          ErrorCodes.VALIDATION_ERROR,
          'No active subscription',
          400
        ));
      }

      const origin = request.headers.get('origin') || process.env.NEXTAUTH_URL || 'http://localhost:3000';
      
      const portalSession = await createBillingPortalSession(
        user.subscription.stripeCustomerId,
        `${origin}/settings`,
      );

      return successResponse({ url: portalSession.url });
    }

    return errorResponse(createError(ErrorCodes.VALIDATION_ERROR, 'Invalid action', 400));
  } catch (error) {
    return errorResponse(error);
  }
}
