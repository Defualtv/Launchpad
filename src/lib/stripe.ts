import Stripe from 'stripe';
import { SubscriptionStatus } from '@prisma/client';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
  typescript: true,
});

export const PRICE_IDS = {
  PRO: process.env.STRIPE_PRICE_ID_PRO || '',
  POWER: process.env.STRIPE_PRICE_ID_POWER || '',
};

export function getStatusFromPriceId(priceId: string): SubscriptionStatus {
  if (priceId === PRICE_IDS.POWER) return SubscriptionStatus.POWER;
  if (priceId === PRICE_IDS.PRO) return SubscriptionStatus.PRO;
  return SubscriptionStatus.FREE;
}

export function getPriceIdFromPlan(plan: 'PRO' | 'POWER'): string {
  return PRICE_IDS[plan];
}

export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  userId: string,
  successUrl: string,
  cancelUrl: string
): Promise<Stripe.Checkout.Session> {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
    },
    subscription_data: {
      metadata: {
        userId,
      },
    },
  });

  return session;
}

export async function createCustomer(email: string, name?: string): Promise<Stripe.Customer> {
  const customer = await stripe.customers.create({
    email,
    name: name || undefined,
  });
  return customer;
}

export async function getOrCreateCustomer(
  email: string,
  name?: string,
  existingCustomerId?: string
): Promise<Stripe.Customer> {
  if (existingCustomerId) {
    try {
      const customer = await stripe.customers.retrieve(existingCustomerId);
      if (!customer.deleted) {
        return customer as Stripe.Customer;
      }
    } catch {
      // Customer not found, create new one
    }
  }

  return createCustomer(email, name);
}

export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return session;
}

export async function cancelSubscription(
  subscriptionId: string,
  immediately: boolean = false
): Promise<Stripe.Subscription> {
  if (immediately) {
    return await stripe.subscriptions.cancel(subscriptionId);
  }
  
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

export async function reactivateSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}

export function constructWebhookEvent(
  body: string,
  signature: string,
  secret: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(body, signature, secret);
}
