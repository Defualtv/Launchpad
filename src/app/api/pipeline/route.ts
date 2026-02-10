import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { pipelineItemSchema } from '@/lib/validations';
import { errorResponse, successResponse, createError, ErrorCodes } from '@/lib/errors';
import { PipelineStage } from '@prisma/client';

// GET /api/pipeline - List all pipeline items
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse(createError(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401));
    }

    const { searchParams } = new URL(request.url);
    const stage = searchParams.get('stage') as PipelineStage | null;
    const view = searchParams.get('view') || 'kanban'; // kanban or list

    const where: any = {
      job: { userId: session.user.id },
    };

    if (stage) {
      where.stage = stage;
    }

    const pipelineItems = await prisma.pipelineItem.findMany({
      where,
      include: {
        job: {
          include: {
            jobScores: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
            contacts: true,
          },
        },
      },
      orderBy: [
        { stage: 'asc' },
        { updatedAt: 'desc' },
      ],
    });

    if (view === 'kanban') {
      // Group by stage for kanban view
      const kanban: Record<PipelineStage, any[]> = {
        SAVED: [],
        APPLYING: [],
        APPLIED: [],
        INTERVIEWING: [],
        OFFER: [],
        REJECTED: [],
        WITHDRAWN: [],
        ACCEPTED: [],
      };

      pipelineItems.forEach((item) => {
        kanban[item.stage].push({
          id: item.id,
          jobId: item.jobId,
          stage: item.stage,
          notes: item.notes,
          nextActionAt: item.nextActionAt,
          lastActionAt: item.lastActionAt,
          updatedAt: item.updatedAt,
          job: {
            id: item.job.id,
            title: item.job.title,
            company: item.job.company,
            location: item.job.location,
            score: item.job.jobScores[0]?.overallScore || null,
          },
          contactCount: item.job.contacts.length,
        });
      });

      return successResponse({ kanban });
    }

    // List view
    const items = pipelineItems.map((item) => ({
      id: item.id,
      jobId: item.jobId,
      stage: item.stage,
      notes: item.notes,
      nextActionAt: item.nextActionAt,
      lastActionAt: item.lastActionAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      job: {
        id: item.job.id,
        title: item.job.title,
        company: item.job.company,
        location: item.job.location,
        salaryMin: item.job.salaryMin,
        salaryMax: item.job.salaryMax,
        score: item.job.jobScores[0]?.overallScore || null,
      },
      contacts: item.job.contacts,
    }));

    return successResponse({ items });
  } catch (error) {
    return errorResponse(error);
  }
}

// POST /api/pipeline - Add job to pipeline
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse(createError(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401));
    }

    const body = await request.json();
    const { jobId, ...rest } = body;

    if (!jobId) {
      return errorResponse(createError(ErrorCodes.VALIDATION_ERROR, 'Job ID is required', 400));
    }

    const result = pipelineItemSchema.safeParse(rest);
    
    if (!result.success) {
      return errorResponse(createError(
        ErrorCodes.VALIDATION_ERROR,
        'Invalid input',
        400,
        { errors: result.error.flatten().fieldErrors }
      ));
    }

    // Verify job belongs to user
    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        userId: session.user.id,
      },
    });

    if (!job) {
      return errorResponse(createError(ErrorCodes.NOT_FOUND, 'Job not found', 404));
    }

    // Check if already in pipeline
    const existing = await prisma.pipelineItem.findUnique({
      where: { jobId },
    });

    if (existing) {
      return errorResponse(createError(
        ErrorCodes.VALIDATION_ERROR,
        'Job is already in pipeline',
        400
      ));
    }

    const pipelineItem = await prisma.pipelineItem.create({
      data: {
        userId: session.user.id,
        jobId,
        stage: result.data.stage || 'SAVED',
        notes: result.data.notes,
        nextActionAt: result.data.nextActionAt ? new Date(result.data.nextActionAt) : null,
      },
    });

    return successResponse({ pipelineItem }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}

// PUT /api/pipeline - Update pipeline item
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse(createError(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401));
    }

    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return errorResponse(createError(ErrorCodes.VALIDATION_ERROR, 'Pipeline item ID required', 400));
    }

    // Verify pipeline item belongs to user
    const existing = await prisma.pipelineItem.findFirst({
      where: {
        id,
        job: { userId: session.user.id },
      },
    });

    if (!existing) {
      return errorResponse(createError(ErrorCodes.NOT_FOUND, 'Pipeline item not found', 404));
    }

    // Track stage changes
    const stageChanged = data.stage && data.stage !== existing.stage;

    const pipelineItem = await prisma.pipelineItem.update({
      where: { id },
      data: {
        ...(data.stage && { stage: data.stage }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.nextActionAt !== undefined && { 
          nextActionAt: data.nextActionAt ? new Date(data.nextActionAt) : null 
        }),
        ...(stageChanged && { lastActionAt: new Date() }),
      },
    });

    return successResponse({ pipelineItem });
  } catch (error) {
    return errorResponse(error);
  }
}

// DELETE /api/pipeline - Remove from pipeline
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse(createError(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401));
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse(createError(ErrorCodes.VALIDATION_ERROR, 'Pipeline item ID required', 400));
    }

    // Verify pipeline item belongs to user
    const existing = await prisma.pipelineItem.findFirst({
      where: {
        id,
        job: { userId: session.user.id },
      },
    });

    if (!existing) {
      return errorResponse(createError(ErrorCodes.NOT_FOUND, 'Pipeline item not found', 404));
    }

    await prisma.pipelineItem.delete({
      where: { id },
    });

    return successResponse({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
