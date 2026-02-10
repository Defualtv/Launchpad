import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { feedbackSchema } from '@/lib/validations';
import { errorResponse, successResponse, createError, ErrorCodes } from '@/lib/errors';
import { updateWeights } from '@/lib/calibration';

// GET /api/feedback - Get user's feedback history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse(createError(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401));
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));

    const feedbacks = await prisma.feedback.findMany({
      where: {
        job: { userId: session.user.id },
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            company: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Get user's current scoring weights
    const weights = await prisma.userScoringWeights.findUnique({
      where: { userId: session.user.id },
    });

    return successResponse({ feedbacks, currentWeights: weights });
  } catch (error) {
    return errorResponse(error);
  }
}

// POST /api/feedback - Submit feedback for a job
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse(createError(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401));
    }

    const body = await request.json();
    const result = feedbackSchema.safeParse(body);
    
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
        id: result.data.jobId,
        userId: session.user.id,
      },
    });

    if (!job) {
      return errorResponse(createError(ErrorCodes.NOT_FOUND, 'Job not found', 404));
    }

    // Create feedback
    const feedback = await prisma.feedback.create({
      data: {
        userId: session.user.id,
        jobId: result.data.jobId,
        outcome: result.data.outcome,
        accuracy: result.data.accuracy,
        factor: result.data.factor || null,
        note: result.data.note || null,
      },
    });

    // Adjust scoring weights based on feedback
    await updateWeights(session.user.id, {
      outcome: result.data.outcome,
      accuracy: result.data.accuracy,
      factor: result.data.factor || null,
    });

    // If outcome suggests end state, update pipeline stage
    const pipelineItem = await prisma.pipelineItem.findUnique({
      where: { jobId: job.id },
    });

    if (pipelineItem) {
      const newStage = result.data.outcome === 'OFFER' ? 'OFFER' : 
                       result.data.outcome === 'REJECTED' ? 'REJECTED' : 
                       pipelineItem.stage;
      
      if (newStage !== pipelineItem.stage) {
        await prisma.pipelineItem.update({
          where: { id: pipelineItem.id },
          data: { stage: newStage },
        });
      }
    }

    return successResponse({ feedback, weightsUpdated: true }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
