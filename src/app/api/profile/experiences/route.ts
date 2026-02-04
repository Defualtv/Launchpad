import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { experienceSchema } from '@/lib/validations';
import { errorResponse, successResponse, createError, ErrorCodes } from '@/lib/errors';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse(createError(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401));
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      include: { 
        experiences: {
          orderBy: { startDate: 'desc' },
        },
      },
    });

    return successResponse({ experiences: profile?.experiences || [] });
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
    const result = experienceSchema.safeParse(body);
    
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

    const experience = await prisma.experience.create({
      data: {
        profileId: profile.id,
        company: result.data.company,
        title: result.data.title,
        location: result.data.location,
        description: result.data.description,
        startDate: new Date(result.data.startDate),
        endDate: result.data.endDate ? new Date(result.data.endDate) : null,
        current: result.data.current,
      },
    });

    // Increment profile version
    await prisma.profile.update({
      where: { id: profile.id },
      data: { profileVersion: { increment: 1 } },
    });

    return successResponse({ experience }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse(createError(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401));
    }

    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return errorResponse(createError(ErrorCodes.VALIDATION_ERROR, 'Experience ID required', 400));
    }

    const result = experienceSchema.safeParse(data);
    
    if (!result.success) {
      return errorResponse(createError(
        ErrorCodes.VALIDATION_ERROR,
        'Invalid input',
        400,
        { errors: result.error.flatten().fieldErrors }
      ));
    }

    // Verify experience belongs to user
    const existing = await prisma.experience.findFirst({
      where: {
        id,
        profile: { userId: session.user.id },
      },
    });

    if (!existing) {
      return errorResponse(createError(ErrorCodes.NOT_FOUND, 'Experience not found', 404));
    }

    const experience = await prisma.experience.update({
      where: { id },
      data: {
        company: result.data.company,
        title: result.data.title,
        location: result.data.location,
        description: result.data.description,
        startDate: new Date(result.data.startDate),
        endDate: result.data.endDate ? new Date(result.data.endDate) : null,
        current: result.data.current,
      },
    });

    // Increment profile version
    await prisma.profile.update({
      where: { id: existing.profileId },
      data: { profileVersion: { increment: 1 } },
    });

    return successResponse({ experience });
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
    const experienceId = searchParams.get('id');

    if (!experienceId) {
      return errorResponse(createError(ErrorCodes.VALIDATION_ERROR, 'Experience ID required', 400));
    }

    // Verify experience belongs to user
    const experience = await prisma.experience.findFirst({
      where: {
        id: experienceId,
        profile: { userId: session.user.id },
      },
    });

    if (!experience) {
      return errorResponse(createError(ErrorCodes.NOT_FOUND, 'Experience not found', 404));
    }

    await prisma.experience.delete({
      where: { id: experienceId },
    });

    return successResponse({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
