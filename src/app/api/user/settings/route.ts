import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { errorResponse, successResponse, createError, ErrorCodes } from '@/lib/errors';

// GET /api/user/settings - Get user settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse(createError(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401));
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        emailReminders: true,
        emailWeeklySummary: true,
        scoringWeights: true,
        preferences: true,
        createdAt: true,
      },
    });

    if (!user) {
      return errorResponse(createError(ErrorCodes.NOT_FOUND, 'User not found', 404));
    }

    return successResponse({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
      emailPreferences: {
        reminders: user.emailReminders,
        weeklySummary: user.emailWeeklySummary,
      },
      scoringWeights: user.scoringWeights,
      preferences: user.preferences,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

// PUT /api/user/settings - Update user settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse(createError(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401));
    }

    const body = await request.json();
    const { name, emailPreferences } = body;

    const updateData: Record<string, unknown> = {};

    if (name !== undefined) {
      updateData.name = name;
    }

    if (emailPreferences) {
      if (emailPreferences.reminders !== undefined) {
        updateData.emailReminders = emailPreferences.reminders;
      }
      if (emailPreferences.weeklySummary !== undefined) {
        updateData.emailWeeklySummary = emailPreferences.weeklySummary;
      }
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        emailReminders: true,
        emailWeeklySummary: true,
      },
    });

    return successResponse({ user });
  } catch (error) {
    return errorResponse(error);
  }
}

// DELETE /api/user/settings - Delete account
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse(createError(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401));
    }

    const body = await request.json();
    const { confirmation } = body;

    if (confirmation !== 'DELETE MY ACCOUNT') {
      return errorResponse(createError(
        ErrorCodes.VALIDATION_ERROR,
        'Please type "DELETE MY ACCOUNT" to confirm',
        400
      ));
    }

    // Delete user and all associated data (cascades)
    await prisma.user.delete({
      where: { id: session.user.id },
    });

    return successResponse({ success: true, message: 'Account deleted' });
  } catch (error) {
    return errorResponse(error);
  }
}
