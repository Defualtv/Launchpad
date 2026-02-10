import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { jobSchema } from '@/lib/validations';
import { errorResponse, successResponse, createError, ErrorCodes } from '@/lib/errors';
import { checkJobLimit, getPlanLimits } from '@/lib/plans';
import { calculateScore } from '@/lib/scoring';

// GET /api/jobs - List jobs with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse(createError(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401));
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const skip = (page - 1) * limit;
    
    // Filters
    const search = searchParams.get('search') || undefined;
    const minScore = searchParams.get('minScore') ? parseInt(searchParams.get('minScore')!) : undefined;
    const maxScore = searchParams.get('maxScore') ? parseInt(searchParams.get('maxScore')!) : undefined;
    const jobType = searchParams.get('jobType') || undefined;
    const hasKit = searchParams.get('hasKit') === 'true' ? true : searchParams.get('hasKit') === 'false' ? false : undefined;
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    // Build where clause
    const where: any = { userId: session.user.id };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { descriptionRaw: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (jobType) {
      where.jobType = jobType;
    }

    if (hasKit !== undefined) {
      where.applicationKits = hasKit ? { some: {} } : { none: {} };
    }

    // For score filtering, we need to join with JobScore
    if (minScore !== undefined || maxScore !== undefined) {
      where.jobScores = {
        some: {
          ...(minScore !== undefined && { overallScore: { gte: minScore } }),
          ...(maxScore !== undefined && { overallScore: { lte: maxScore } }),
        },
      };
    }

    // Build orderBy
    let orderBy: any = {};
    if (sortBy === 'score') {
      // For score sorting, we'll do a secondary sort
      orderBy = { createdAt: sortOrder };
    } else {
      orderBy = { [sortBy]: sortOrder };
    }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          jobScores: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          applicationKits: {
            take: 1,
          },
          pipelineItem: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.job.count({ where }),
    ]);

    // Sort by score in memory if needed
    let sortedJobs = jobs;
    if (sortBy === 'score') {
      sortedJobs = [...jobs].sort((a, b) => {
        const scoreA = a.jobScores[0]?.overallScore || 0;
        const scoreB = b.jobScores[0]?.overallScore || 0;
        return sortOrder === 'desc' ? scoreB - scoreA : scoreA - scoreB;
      });
    }

    // Transform response
    const jobsWithLatestScore = sortedJobs.map((job) => ({
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      url: job.url,
      jobType: job.jobType,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      postedAt: job.postedAt,
      createdAt: job.createdAt,
      latestScore: job.jobScores[0] || null,
      hasKit: job.applicationKits.length > 0,
      pipelineStage: job.pipelineItem?.stage || null,
    }));

    return successResponse({
      jobs: jobsWithLatestScore,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

// POST /api/jobs - Create a new job
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse(createError(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401));
    }

    // Check job limit based on subscription
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { subscription: true },
    });

    const status = user?.subscription?.status || 'FREE';
    const currentJobCount = await prisma.job.count({
      where: { userId: session.user.id, archived: false },
    });

    if (!checkJobLimit(status, currentJobCount)) {
      const limits = getPlanLimits(status);
      return errorResponse(createError(
        ErrorCodes.JOB_LIMIT_EXCEEDED,
        `Job limit reached (${currentJobCount}/${limits.maxJobs}). Upgrade your plan for more.`,
        403,
        { limit: limits.maxJobs, current: currentJobCount }
      ));
    }

    const body = await request.json();
    const result = jobSchema.safeParse(body);
    
    if (!result.success) {
      return errorResponse(createError(
        ErrorCodes.VALIDATION_ERROR,
        'Invalid input',
        400,
        { errors: result.error.flatten().fieldErrors }
      ));
    }

    // Create the job
    const job = await prisma.job.create({
      data: {
        userId: session.user.id,
        title: result.data.title,
        company: result.data.company,
        location: result.data.location,
        descriptionRaw: result.data.descriptionRaw,
        url: result.data.url || null,
        jobType: result.data.jobType,
        remoteType: result.data.remoteType,
        seniorityEstimate: result.data.seniorityEstimate,
        salaryMin: result.data.salaryMin,
        salaryMax: result.data.salaryMax,
        salaryCurrency: result.data.salaryCurrency,
      },
    });

    // Get user profile for scoring
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      include: { skills: true, experiences: true },
    });

    // Get user's custom weights
    const weights = await prisma.userScoringWeights.findUnique({
      where: { userId: session.user.id },
    });

    // Calculate initial score
    let score = null;
    if (profile) {
      const scoreResult = calculateScore(profile, job, weights);

      score = await prisma.jobScore.create({
        data: {
          jobId: job.id,
          userId: session.user.id,
          profileVersion: profile.profileVersion,
          overallScore: Math.round(scoreResult.breakdown.calibratedScore),
          breakdownJson: JSON.stringify(scoreResult.breakdown),
          explanationJson: JSON.stringify(scoreResult.explanation),
        },
      });
    }

    return successResponse(
      {
        job: {
          ...job,
          latestScore: score,
        },
      },
      201
    );
  } catch (error) {
    return errorResponse(error);
  }
}
