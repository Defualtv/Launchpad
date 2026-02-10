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
      wSkills: 1.0,
      wLocation: 1.0,
      wSeniorityPenalty: 1.0,
      wMustHaveGap: 1.0,
      wNiceHaveGap: 0.5,
      wSalary: 0.5,
      bias: 0.0,
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
    const { wSkills, wLocation, wSeniorityPenalty, wMustHaveGap, wNiceHaveGap, wSalary, bias } = body;

    // Validate weights are reasonable (0-5 range)
    const weightValues = [wSkills, wLocation, wSeniorityPenalty, wMustHaveGap, wNiceHaveGap, wSalary].filter(w => w !== undefined);
    if (weightValues.some((w) => typeof w === 'number' && (w < 0 || w > 5))) {
      return errorResponse(createError(
        ErrorCodes.VALIDATION_ERROR,
        'Each weight must be between 0 and 5',
        400
      ));
    }

    const updatedWeights = await prisma.userScoringWeights.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        wSkills: wSkills ?? 1.0,
        wLocation: wLocation ?? 1.0,
        wSeniorityPenalty: wSeniorityPenalty ?? 1.0,
        wMustHaveGap: wMustHaveGap ?? 1.0,
        wNiceHaveGap: wNiceHaveGap ?? 0.5,
        wSalary: wSalary ?? 0.5,
        bias: bias ?? 0.0,
      },
      update: {
        ...(wSkills !== undefined && { wSkills }),
        ...(wLocation !== undefined && { wLocation }),
        ...(wSeniorityPenalty !== undefined && { wSeniorityPenalty }),
        ...(wMustHaveGap !== undefined && { wMustHaveGap }),
        ...(wNiceHaveGap !== undefined && { wNiceHaveGap }),
        ...(wSalary !== undefined && { wSalary }),
        ...(bias !== undefined && { bias }),
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
