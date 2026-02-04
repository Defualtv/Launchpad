import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { skillSchema } from '@/lib/validations';
import { errorResponse, successResponse, createError, ErrorCodes } from '@/lib/errors';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse(createError(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401));
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      include: { skills: true },
    });

    return successResponse({ skills: profile?.skills || [] });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse(createError(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401));
    }

    const body = await request.json();
    const result = skillSchema.safeParse(body);
    
    if (!result.success) {
      return errorResponse(createError(
        ErrorCodes.VALIDATION_ERROR,
        'Invalid input',
        400,
        { errors: result.error.flatten().fieldErrors }
      ));
    }

    // Ensure profile exists
    let profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile) {
      profile = await prisma.profile.create({
        data: { userId: session.user.id },
      });
    }

    const skill = await prisma.skill.upsert({
      where: {
        profileId_name: {
          profileId: profile.id,
          name: result.data.name,
        },
      },
      update: {
        level: result.data.level,
        yearsExp: result.data.yearsExp,
      },
      create: {
        profileId: profile.id,
        name: result.data.name,
        level: result.data.level,
        yearsExp: result.data.yearsExp,
      },
    });

    // Increment profile version
    await prisma.profile.update({
      where: { id: profile.id },
      data: { profileVersion: { increment: 1 } },
    });

    return successResponse({ skill }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse(createError(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401));
    }

    const { searchParams } = new URL(request.url);
    const skillId = searchParams.get('id');

    if (!skillId) {
      return errorResponse(createError(ErrorCodes.VALIDATION_ERROR, 'Skill ID required', 400));
    }

    // Verify skill belongs to user
    const skill = await prisma.skill.findFirst({
      where: {
        id: skillId,
        profile: { userId: session.user.id },
      },
    });

    if (!skill) {
      return errorResponse(createError(ErrorCodes.NOT_FOUND, 'Skill not found', 404));
    }

    await prisma.skill.delete({
      where: { id: skillId },
    });

    return successResponse({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
