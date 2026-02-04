import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { profileSchema } from '@/lib/validations';
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
        skills: true,
        experiences: { orderBy: { startDate: 'desc' } },
        educations: { orderBy: { endDate: 'desc' } },
      },
    });

    return successResponse({ profile });
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
    const result = profileSchema.safeParse(body);
    
    if (!result.success) {
      return errorResponse(createError(
        ErrorCodes.VALIDATION_ERROR,
        'Invalid input',
        400,
        { errors: result.error.flatten().fieldErrors }
      ));
    }

    const profile = await prisma.profile.upsert({
      where: { userId: session.user.id },
      update: {
        ...result.data,
        profileVersion: { increment: 1 },
      },
      create: {
        userId: session.user.id,
        ...result.data,
      },
      include: {
        skills: true,
        experiences: true,
        educations: true,
      },
    });

    return successResponse({ profile });
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
    const result = profileSchema.partial().safeParse(body);
    
    if (!result.success) {
      return errorResponse(createError(
        ErrorCodes.VALIDATION_ERROR,
        'Invalid input',
        400,
        { errors: result.error.flatten().fieldErrors }
      ));
    }

    // Check if meaningful changes were made
    const existingProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    const meaningfulChanges = ['headline', 'summary', 'targetRole', 'targetSeniority'];
    const hasMeaningfulChange = meaningfulChanges.some(field => 
      result.data[field as keyof typeof result.data] !== undefined &&
      result.data[field as keyof typeof result.data] !== existingProfile?.[field as keyof typeof existingProfile]
    );

    const profile = await prisma.profile.update({
      where: { userId: session.user.id },
      data: {
        ...result.data,
        ...(hasMeaningfulChange ? { profileVersion: { increment: 1 } } : {}),
      },
      include: {
        skills: true,
        experiences: true,
        educations: true,
      },
    });

    return successResponse({ profile });
  } catch (error) {
    return errorResponse(error);
  }
}
