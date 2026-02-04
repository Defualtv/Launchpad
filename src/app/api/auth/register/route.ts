import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { registerSchema } from '@/lib/validations';
import { errorResponse, successResponse, createError, ErrorCodes } from '@/lib/errors';
import { logInfo, logError } from '@/lib/logger';
import { LogType, SubscriptionStatus } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      return errorResponse(createError(
        ErrorCodes.VALIDATION_ERROR,
        'Invalid input',
        400,
        { errors: result.error.flatten().fieldErrors }
      ));
    }

    const { email, password, name } = result.data;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return errorResponse(createError(
        ErrorCodes.USER_EXISTS,
        'An account with this email already exists',
        409
      ));
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with subscription and scoring weights
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        subscription: {
          create: {
            status: SubscriptionStatus.FREE,
          },
        },
        scoringWeights: {
          create: {},
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    await logInfo(LogType.AUTH, 'New user registered', { userId: user.id, email: user.email });

    return successResponse({ user }, 201);
  } catch (error) {
    await logError(LogType.AUTH, error, { action: 'register' });
    return errorResponse(error);
  }
}
