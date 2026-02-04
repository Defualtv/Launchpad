import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { educationSchema } from '@/lib/validations';
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
        educations: {
          orderBy: { graduationYear: 'desc' },
        },
      },
    });

    return successResponse({ educations: profile?.educations || [] });
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
    const result = educationSchema.safeParse(body);
    
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

    const education = await prisma.education.create({
      data: {
        profileId: profile.id,
        institution: result.data.institution,
        degree: result.data.degree,
        field: result.data.field,
        graduationYear: result.data.graduationYear,
        gpa: result.data.gpa,
      },
    });

    // Increment profile version
    await prisma.profile.update({
      where: { id: profile.id },
      data: { profileVersion: { increment: 1 } },
    });

    return successResponse({ education }, 201);
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
      return errorResponse(createError(ErrorCodes.VALIDATION_ERROR, 'Education ID required', 400));
    }

    const result = educationSchema.safeParse(data);
    
    if (!result.success) {
      return errorResponse(createError(
        ErrorCodes.VALIDATION_ERROR,
        'Invalid input',
        400,
        { errors: result.error.flatten().fieldErrors }
      ));
    }

    // Verify education belongs to user
    const existing = await prisma.education.findFirst({
      where: {
        id,
        profile: { userId: session.user.id },
      },
    });

    if (!existing) {
      return errorResponse(createError(ErrorCodes.NOT_FOUND, 'Education not found', 404));
    }

    const education = await prisma.education.update({
      where: { id },
      data: {
        institution: result.data.institution,
        degree: result.data.degree,
        field: result.data.field,
        graduationYear: result.data.graduationYear,
        gpa: result.data.gpa,
      },
    });

    // Increment profile version
    await prisma.profile.update({
      where: { id: existing.profileId },
      data: { profileVersion: { increment: 1 } },
    });

    return successResponse({ education });
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
    const educationId = searchParams.get('id');

    if (!educationId) {
      return errorResponse(createError(ErrorCodes.VALIDATION_ERROR, 'Education ID required', 400));
    }

    // Verify education belongs to user
    const education = await prisma.education.findFirst({
      where: {
        id: educationId,
        profile: { userId: session.user.id },
      },
    });

    if (!education) {
      return errorResponse(createError(ErrorCodes.NOT_FOUND, 'Education not found', 404));
    }

    await prisma.education.delete({
      where: { id: educationId },
    });

    return successResponse({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
