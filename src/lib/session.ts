import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { SubscriptionStatus } from '@prisma/client';

export const getSession = cache(async () => {
  return await getServerSession(authOptions);
});

export const getCurrentUser = cache(async () => {
  const session = await getSession();
  
  if (!session?.user?.email) {
    return null;
  }
  
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      subscription: true,
      profile: true,
    },
  });
  
  return user;
});

export async function requireAuth() {
  const session = await getSession();
  
  if (!session?.user) {
    redirect('/login');
  }
  
  return session;
}

export async function requireAuthWithUser() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }
  
  return user;
}

export async function requireOnboarding() {
  const user = await requireAuthWithUser();
  
  if (!user.onboardingComplete) {
    redirect('/onboarding');
  }
  
  return user;
}

export function isAdmin(email: string): boolean {
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [];
  return adminEmails.includes(email.toLowerCase());
}

export async function requireAdmin() {
  const user = await requireAuthWithUser();
  
  if (!isAdmin(user.email)) {
    redirect('/dashboard');
  }
  
  return user;
}

export function getSubscriptionStatus(user: { subscription: { status: SubscriptionStatus } | null }): SubscriptionStatus {
  return user.subscription?.status || SubscriptionStatus.FREE;
}
