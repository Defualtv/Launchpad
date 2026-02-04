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
        emailPreferences: true,
        safetySettings: true,
        scoringWeights: true,
        createdAt: true,
      },
    });

    if (!user) {
      return errorResponse(createError(ErrorCodes.NOT_FOUND, 'User not found', 404));
    }

    // Default preferences
    const emailPreferences = (user.emailPreferences as Record<string, boolean>) || {
      reminders: true,
      weeklySummary: true,
      productUpdates: true,
    };

    const safetySettings = (user.safetySettings as Record<string, any>) || {
      autoApplyEnabled: false, // Always false - we never auto-apply
      requireConfirmation: true,
      dataRetentionDays: 365,
    };

    return successResponse({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
      emailPreferences,
      safetySettings,
      scoringWeights: user.scoringWeights,
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
    const { name, emailPreferences, safetySettings } = body;

    const updateData: any = {};

    if (name !== undefined) {
      updateData.name = name;
    }

    if (emailPreferences) {
      updateData.emailPreferences = {
        reminders: emailPreferences.reminders ?? true,
        weeklySummary: emailPreferences.weeklySummary ?? true,
        productUpdates: emailPreferences.productUpdates ?? true,
      };
    }

    if (safetySettings) {
      // IMPORTANT: Never allow autoApply to be enabled
      updateData.safetySettings = {
        autoApplyEnabled: false, // Always false
        requireConfirmation: safetySettings.requireConfirmation ?? true,
        dataRetentionDays: Math.min(
          Math.max(safetySettings.dataRetentionDays || 365, 30),
          730
        ), // 30-730 days
      };
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        emailPreferences: true,
        safetySettings: true,
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
