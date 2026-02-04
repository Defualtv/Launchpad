import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { jobSchema } from '@/lib/validations';
import { errorResponse, successResponse, createError, ErrorCodes } from '@/lib/errors';
import { checkJobLimit } from '@/lib/plans';
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
        { description: { contains: search, mode: 'insensitive' } },
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
      where.scores = {
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
          scores: {
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
        const scoreA = a.scores[0]?.overallScore || 0;
        const scoreB = b.scores[0]?.overallScore || 0;
        return sortOrder === 'desc' ? scoreB - scoreA : scoreA - scoreB;
      });
    }

    // Transform response
    const jobsWithLatestScore = sortedJobs.map((job) => ({
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      salary: job.salary,
      jobType: job.jobType,
      sourceUrl: job.sourceUrl,
      postedAt: job.postedAt,
      createdAt: job.createdAt,
      latestScore: job.scores[0] || null,
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
    const canCreate = await checkJobLimit(session.user.id);
    if (!canCreate.allowed) {
      return errorResponse(createError(
        ErrorCodes.QUOTA_EXCEEDED,
        canCreate.message,
        403,
        { limit: canCreate.limit, current: canCreate.current }
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
        description: result.data.description,
        salary: result.data.salary,
        jobType: result.data.jobType,
        requirements: result.data.requirements,
        sourceUrl: result.data.sourceUrl,
        postedAt: result.data.postedAt ? new Date(result.data.postedAt) : null,
      },
    });

    // Get user profile for scoring
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      include: { skills: true },
    });

    // Calculate initial score
    let score = null;
    if (profile) {
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

      score = await prisma.jobScore.create({
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
