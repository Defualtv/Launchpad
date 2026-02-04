import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { errorResponse, successResponse, createError, ErrorCodes } from '@/lib/errors';
import { createCheckoutSession, createCustomerPortalSession } from '@/lib/stripe';
import { PLANS } from '@/lib/plans';

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
        quotaUsage: true,
      },
    });

    if (!user) {
      return errorResponse(createError(ErrorCodes.NOT_FOUND, 'User not found', 404));
    }

    const currentPlan = user.subscription?.planId || 'FREE';
    const planDetails = PLANS[currentPlan as keyof typeof PLANS] || PLANS.FREE;

    return successResponse({
      subscription: user.subscription
        ? {
            id: user.subscription.id,
            planId: user.subscription.planId,
            status: user.subscription.status,
            currentPeriodStart: user.subscription.currentPeriodStart,
            currentPeriodEnd: user.subscription.currentPeriodEnd,
            cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd,
          }
        : null,
      currentPlan: {
        id: currentPlan,
        name: planDetails.name,
        limits: planDetails.limits,
        price: planDetails.price,
      },
      usage: {
        jobs: await prisma.job.count({ where: { userId: user.id } }),
        aiGenerations: user.quotaUsage?.aiGenerationsUsed || 0,
        aiGenerationsResetAt: user.quotaUsage?.aiGenerationsResetAt,
      },
      plans: Object.entries(PLANS).map(([id, plan]) => ({
        id,
        name: plan.name,
        price: plan.price,
        limits: plan.limits,
        features: plan.features,
        stripePriceId: plan.stripePriceId,
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
      if (!plan.stripePriceId) {
        return errorResponse(createError(ErrorCodes.VALIDATION_ERROR, 'Plan is free', 400));
      }

      const checkoutUrl = await createCheckoutSession({
        userId: user.id,
        email: session.user.email,
        priceId: plan.stripePriceId,
        customerId: user.subscription?.stripeCustomerId || undefined,
      });

      return successResponse({ url: checkoutUrl });
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

      const portalUrl = await createCustomerPortalSession(
        user.subscription.stripeCustomerId
      );

      return successResponse({ url: portalUrl });
    }

    return errorResponse(createError(ErrorCodes.VALIDATION_ERROR, 'Invalid action', 400));
  } catch (error) {
    return errorResponse(error);
  }
}
