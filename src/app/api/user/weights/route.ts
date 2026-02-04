import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { errorResponse, successResponse, createError, ErrorCodes } from '@/lib/errors';

// GET /api/user/weights - Get scoring weights
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse(createError(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401));
    }

    const weights = await prisma.userScoringWeights.findUnique({
      where: { userId: session.user.id },
    });

    // Default weights if none set
    const defaultWeights = {
      skillsWeight: 0.35,
      locationWeight: 0.25,
      salaryWeight: 0.25,
      seniorityWeight: 0.15,
    };

    return successResponse({
      weights: weights || defaultWeights,
      isCustom: !!weights,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

// PUT /api/user/weights - Update scoring weights
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse(createError(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401));
    }

    const body = await request.json();
    const { skillsWeight, locationWeight, salaryWeight, seniorityWeight } = body;

    // Validate weights sum to 1 (with some tolerance)
    const total = skillsWeight + locationWeight + salaryWeight + seniorityWeight;
    if (Math.abs(total - 1) > 0.01) {
      return errorResponse(createError(
        ErrorCodes.VALIDATION_ERROR,
        'Weights must sum to 1.0',
        400,
        { total }
      ));
    }

    // Validate each weight is between 0 and 1
    const weights = [skillsWeight, locationWeight, salaryWeight, seniorityWeight];
    if (weights.some((w) => w < 0 || w > 1)) {
      return errorResponse(createError(
        ErrorCodes.VALIDATION_ERROR,
        'Each weight must be between 0 and 1',
        400
      ));
    }

    const updatedWeights = await prisma.userScoringWeights.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        skillsWeight,
        locationWeight,
        salaryWeight,
        seniorityWeight,
      },
      update: {
        skillsWeight,
        locationWeight,
        salaryWeight,
        seniorityWeight,
      },
    });

    return successResponse({ weights: updatedWeights });
  } catch (error) {
    return errorResponse(error);
  }
}

// DELETE /api/user/weights - Reset to defaults
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse(createError(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401));
    }

    await prisma.userScoringWeights.delete({
      where: { userId: session.user.id },
    }).catch(() => {
      // Ignore if not found
    });

    return successResponse({ success: true, message: 'Weights reset to defaults' });
  } catch (error) {
    return errorResponse(error);
  }
}
