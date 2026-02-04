import { SubscriptionStatus } from '@prisma/client';
import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      onboardingComplete: boolean;
      subscriptionStatus: SubscriptionStatus;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    onboardingComplete?: boolean;
    subscriptionStatus?: SubscriptionStatus;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    onboardingComplete?: boolean;
    subscriptionStatus?: SubscriptionStatus;
  }
}
