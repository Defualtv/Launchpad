import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { SubscriptionStatus } from '@prisma/client';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions['adapter'],
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { subscription: true },
        });

        if (!user || !user.password) {
          throw new Error('Invalid email or password');
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error('Invalid email or password');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          onboardingComplete: user.onboardingComplete,
          subscriptionStatus: user.subscription?.status || SubscriptionStatus.FREE,
        };
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    newUser: '/onboarding',
    error: '/login',
  },
  callbacks: {
    async signIn({ user, account }) {
      // For OAuth providers, create subscription if not exists
      if (account?.provider !== 'credentials' && user.id) {
        const existingSubscription = await prisma.subscription.findUnique({
          where: { userId: user.id },
        });
        
        if (!existingSubscription) {
          await prisma.subscription.create({
            data: {
              userId: user.id,
              status: SubscriptionStatus.FREE,
            },
          });
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.onboardingComplete = (user as any).onboardingComplete;
        token.subscriptionStatus = (user as any).subscriptionStatus;
      }
      
      // Handle session update
      if (trigger === 'update' && session) {
        token.onboardingComplete = session.onboardingComplete;
        token.subscriptionStatus = session.subscriptionStatus;
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.onboardingComplete = token.onboardingComplete as boolean;
        session.user.subscriptionStatus = token.subscriptionStatus as SubscriptionStatus;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // Create subscription for new users
      await prisma.subscription.create({
        data: {
          userId: user.id,
          status: SubscriptionStatus.FREE,
        },
      });
      
      // Create default scoring weights
      await prisma.userScoringWeights.create({
        data: {
          userId: user.id,
        },
      });
    },
  },
  debug: process.env.NODE_ENV === 'development',
};
