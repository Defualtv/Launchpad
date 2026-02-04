import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { errorResponse, successResponse, createError, ErrorCodes } from '@/lib/errors';
import { calculateScore } from '@/lib/scoring';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/jobs/[id]/score - Recalculate score for a job
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse(createError(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401));
    }

    const { id } = await params;

    // Get job
    const job = await prisma.job.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!job) {
      return errorResponse(createError(ErrorCodes.NOT_FOUND, 'Job not found', 404));
    }

    // Get user profile
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      include: { skills: true },
    });

    if (!profile) {
      return errorResponse(createError(
        ErrorCodes.VALIDATION_ERROR,
        'Please complete your profile first',
        400
      ));
    }

    // Calculate new score
    const scoreResult = calculateScore(
      {
        desiredTitle: profile.desiredTitle,
        desiredLocation: profile.desiredLocation,
        remotePreference: profile.remotePreference || 'FLEXIBLE',
        minSalary: profile.minSalary,
        maxSalary: profile.maxSalary,
        targetSeniority: profile.targetSeniority,
        skills: profile.skills.map((s) => ({
          name: s.name,
          level: s.level,
          yearsExp: s.yearsExp,
        })),
      },
      {
        title: job.title,
        company: job.company,
        location: job.location,
        description: job.description,
        salary: job.salary,
        requirements: job.requirements || [],
      }
    );

    // Get user's custom weights
    const weights = await prisma.userScoringWeights.findUnique({
      where: { userId: session.user.id },
    });

    // Create new score record
    const score = await prisma.jobScore.create({
      data: {
        jobId: job.id,
        profileVersion: profile.profileVersion,
        overallScore: scoreResult.overall,
        skillsScore: scoreResult.breakdown.skills,
        locationScore: scoreResult.breakdown.location,
        salaryScore: scoreResult.breakdown.salary,
        seniorityScore: scoreResult.breakdown.seniority,
        matchedSkills: scoreResult.matchedSkills || [],
        missingSkills: scoreResult.missingSkills || [],
        explanation: scoreResult.explanation,
        weightsSnapshot: weights || undefined,
      },
    });

    return successResponse({ score }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}

// GET /api/jobs/[id]/score - Get score history for a job
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse(createError(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401));
    }

    const { id } = await params;

    // Verify job belongs to user
    const job = await prisma.job.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!job) {
      return errorResponse(createError(ErrorCodes.NOT_FOUND, 'Job not found', 404));
    }

    const scores = await prisma.jobScore.findMany({
      where: { jobId: id },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse({ scores });
  } catch (error) {
    return errorResponse(error);
  }
}
