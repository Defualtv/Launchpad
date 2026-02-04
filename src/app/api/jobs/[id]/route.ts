import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { jobSchema } from '@/lib/validations';
import { errorResponse, successResponse, createError, ErrorCodes } from '@/lib/errors';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/jobs/[id] - Get a single job with all details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse(createError(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401));
    }

    const { id } = await params;

    const job = await prisma.job.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        scores: {
          orderBy: { createdAt: 'desc' },
        },
        applicationKits: {
          orderBy: { createdAt: 'desc' },
        },
        pipelineItem: {
          include: {
            contacts: true,
          },
        },
        feedback: true,
      },
    });

    if (!job) {
      return errorResponse(createError(ErrorCodes.NOT_FOUND, 'Job not found', 404));
    }

    return successResponse({ job });
  } catch (error) {
    return errorResponse(error);
  }
}

// PUT /api/jobs/[id] - Update a job
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse(createError(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401));
    }

    const { id } = await params;
    const body = await request.json();

    // Verify job belongs to user
    const existing = await prisma.job.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return errorResponse(createError(ErrorCodes.NOT_FOUND, 'Job not found', 404));
    }

    const result = jobSchema.partial().safeParse(body);
    
    if (!result.success) {
      return errorResponse(createError(
        ErrorCodes.VALIDATION_ERROR,
        'Invalid input',
        400,
        { errors: result.error.flatten().fieldErrors }
      ));
    }

    const job = await prisma.job.update({
      where: { id },
      data: {
        ...(result.data.title && { title: result.data.title }),
        ...(result.data.company && { company: result.data.company }),
        ...(result.data.location !== undefined && { location: result.data.location }),
        ...(result.data.description && { description: result.data.description }),
        ...(result.data.salary !== undefined && { salary: result.data.salary }),
        ...(result.data.jobType && { jobType: result.data.jobType }),
        ...(result.data.requirements && { requirements: result.data.requirements }),
        ...(result.data.sourceUrl !== undefined && { sourceUrl: result.data.sourceUrl }),
        ...(result.data.postedAt !== undefined && { 
          postedAt: result.data.postedAt ? new Date(result.data.postedAt) : null 
        }),
      },
      include: {
        scores: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    return successResponse({ job });
  } catch (error) {
    return errorResponse(error);
  }
}

// DELETE /api/jobs/[id] - Delete a job
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse(createError(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401));
    }

    const { id } = await params;

    // Verify job belongs to user
    const existing = await prisma.job.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return errorResponse(createError(ErrorCodes.NOT_FOUND, 'Job not found', 404));
    }

    // Delete job (cascades to scores, kits, pipeline items, feedback)
    await prisma.job.delete({
      where: { id },
    });

    return successResponse({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
