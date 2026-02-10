import { NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { PLANS, getPlanFromStatus } from '@/lib/plans';
import { logger } from '@/lib/logger';
import { LogType, SubscriptionStatus } from '@prisma/client';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return new Response('No signature', { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      logger.warn(LogType.STRIPE, `Webhook signature verification failed: ${err.message}`);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    logger.info(LogType.STRIPE, `Stripe webhook received: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        logger.info(LogType.STRIPE, `Unhandled event type: ${event.type}`);
    }

    return new Response('OK', { status: 200 });
  } catch (error: any) {
    logger.error(LogType.STRIPE, `Webhook error: ${error.message}`);
    return new Response(`Webhook Error: ${error.message}`, { status: 500 });
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!userId) {
    logger.error(LogType.STRIPE, 'Checkout complete but no userId in metadata');
    return;
  }

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0]?.price.id;

  // Determine status from price ID
  const planEntry = Object.entries(PLANS).find(
    ([, plan]) => plan.priceId === priceId
  );
  const status: SubscriptionStatus = planEntry 
    ? (planEntry[0] as SubscriptionStatus) 
    : SubscriptionStatus.PRO;

  // Create or update subscription in database
  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      priceId,
      status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
    update: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      priceId,
      status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  });

  logger.info(LogType.STRIPE, `Subscription created for user ${userId}, status: ${status}`);
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const priceId = subscription.items.data[0]?.price.id;

  // Find user by customer ID
  const existingSubscription = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!existingSubscription) {
    logger.warn(LogType.STRIPE, `Subscription update for unknown customer: ${customerId}`);
    return;
  }

  // Map Stripe status to our SubscriptionStatus enum
  let status: SubscriptionStatus = SubscriptionStatus.PRO;
  
  // First determine plan from price
  const planEntry = Object.entries(PLANS).find(
    ([, plan]) => plan.priceId === priceId
  );
  
  if (subscription.status === 'canceled') {
    status = SubscriptionStatus.CANCELED;
  } else if (subscription.status === 'past_due') {
    status = SubscriptionStatus.PAST_DUE;
  } else if (planEntry) {
    status = planEntry[0] as SubscriptionStatus;
  }

  await prisma.subscription.update({
    where: { id: existingSubscription.id },
    data: {
      priceId,
      status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });

  logger.info(LogType.STRIPE, `Subscription updated for customer ${customerId}, status: ${status}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  // Find user by customer ID
  const existingSubscription = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!existingSubscription) {
    logger.warn(LogType.STRIPE, `Subscription delete for unknown customer: ${customerId}`);
    return;
  }

  await prisma.subscription.update({
    where: { id: existingSubscription.id },
    data: {
      status: SubscriptionStatus.CANCELED,
      cancelAtPeriodEnd: false,
    },
  });

  logger.info(LogType.STRIPE, `Subscription canceled for customer ${customerId}`);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  // Find subscription
  const subscription = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (subscription && subscription.status === SubscriptionStatus.PAST_DUE) {
    // Reactivate subscription
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: SubscriptionStatus.PRO },
    });

    logger.info(LogType.STRIPE, `Subscription reactivated for customer ${customerId}`);
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  // Find subscription
  const subscription = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (subscription) {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: SubscriptionStatus.PAST_DUE },
    });

    // TODO: Send email notification about failed payment
    logger.warn(LogType.STRIPE, `Payment failed for customer ${customerId}`);
  }
}
