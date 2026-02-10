import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { errorResponse, successResponse, createError, ErrorCodes } from '@/lib/errors';

// POST /api/user/onboarding - Complete onboarding
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse(createError(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401));
    }

    const body = await request.json();
    const { step, data } = body;

    // Get or create profile
    let profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile) {
      profile = await prisma.profile.create({
        data: { userId: session.user.id },
      });
    }

    switch (step) {
      case 1:
        // Basic profile info
        await prisma.profile.update({
          where: { id: profile.id },
          data: {
            headline: data.headline,
            targetRole: data.targetRole || data.desiredTitle,
            location: data.location || data.desiredLocation,
            remotePreference: data.remotePreference,
          },
        });
        break;

      case 2:
        // Skills
        if (data.skills && Array.isArray(data.skills)) {
          for (const skill of data.skills) {
            await prisma.skill.upsert({
              where: {
                profileId_name: {
                  profileId: profile.id,
                  name: skill.name,
                },
              },
              update: {
                level: skill.level || 'INTERMEDIATE',
                yearsExp: skill.yearsExp,
              },
              create: {
                profileId: profile.id,
                name: skill.name,
                level: skill.level || 'INTERMEDIATE',
                yearsExp: skill.yearsExp,
              },
            });
          }
        }
        break;

      case 3:
        // Salary preferences
        await prisma.profile.update({
          where: { id: profile.id },
          data: {
            salaryMin: data.salaryMin || data.minSalary,
            salaryMax: data.salaryMax || data.maxSalary,
            targetSeniority: data.targetSeniority,
          },
        });

        // Mark onboarding complete
        await prisma.user.update({
          where: { id: session.user.id },
          data: { onboardingComplete: true },
        });
        break;

      default:
        return errorResponse(createError(ErrorCodes.VALIDATION_ERROR, 'Invalid step', 400));
    }

    // Increment profile version
    await prisma.profile.update({
      where: { id: profile.id },
      data: { profileVersion: { increment: 1 } },
    });

    return successResponse({ success: true, step });
  } catch (error) {
    return errorResponse(error);
  }
}

// GET /api/user/onboarding - Get onboarding status
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse(createError(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401));
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        profile: {
          include: {
            skills: true,
          },
        },
      },
    });

    if (!user) {
      return errorResponse(createError(ErrorCodes.NOT_FOUND, 'User not found', 404));
    }

    // Determine current step
    let currentStep = 1;
    if (user.profile?.targetRole) {
      currentStep = 2;
    }
    if (user.profile?.skills && user.profile.skills.length > 0) {
      currentStep = 3;
    }
    if (user.onboardingComplete) {
      currentStep = 4; // Complete
    }

    return successResponse({
      complete: user.onboardingComplete,
      currentStep,
      profile: user.profile,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
