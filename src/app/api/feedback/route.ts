import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { feedbackSchema } from '@/lib/validations';
import { errorResponse, successResponse, createError, ErrorCodes } from '@/lib/errors';
import { adjustWeights } from '@/lib/calibration';

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
      include: {
        scores: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!job) {
      return errorResponse(createError(ErrorCodes.NOT_FOUND, 'Job not found', 404));
    }

    // Create feedback
    const feedback = await prisma.feedback.create({
      data: {
        jobId: result.data.jobId,
        outcome: result.data.outcome,
        primaryFactor: result.data.primaryFactor,
        secondaryFactors: result.data.secondaryFactors || [],
        scoreAtFeedback: job.scores[0]?.overallScore,
        notes: result.data.notes,
      },
    });

    // Adjust scoring weights based on feedback
    const currentWeights = await prisma.userScoringWeights.findUnique({
      where: { userId: session.user.id },
    });

    const newWeights = adjustWeights(
      currentWeights || undefined,
      result.data.outcome,
      result.data.primaryFactor,
      result.data.secondaryFactors || []
    );

    // Save updated weights
    await prisma.userScoringWeights.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        ...newWeights,
      },
      update: newWeights,
    });

    // If outcome is ACCEPTED or REJECTED, update pipeline stage
    if (job) {
      const pipelineItem = await prisma.pipelineItem.findUnique({
        where: { jobId: job.id },
      });

      if (pipelineItem) {
        const newStage = result.data.outcome === 'ACCEPTED' ? 'OFFER' : 
                         result.data.outcome === 'REJECTED' ? 'REJECTED' : 
                         pipelineItem.stage;
        
        if (newStage !== pipelineItem.stage) {
          await prisma.pipelineItem.update({
            where: { id: pipelineItem.id },
            data: { stage: newStage },
          });
        }
      }
    }

    return successResponse({ feedback, weightsUpdated: true }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
