import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { errorResponse, successResponse, createError, ErrorCodes } from '@/lib/errors';
import { checkAIGenerationLimit, incrementAIUsage } from '@/lib/plans';
import { generateApplicationKit } from '@/lib/ai';
import { AssetType } from '@prisma/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/jobs/[id]/kit - Generate application kit
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse(createError(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401));
    }

    const { id } = await params;
    const body = await request.json();
    const { assetType = 'FULL_KIT', variant = 'A' } = body;

    // Check AI generation limit
    const canGenerate = await checkAIGenerationLimit(session.user.id);
    if (!canGenerate.allowed) {
      return errorResponse(createError(
        ErrorCodes.QUOTA_EXCEEDED,
        canGenerate.message,
        403,
        { limit: canGenerate.limit, current: canGenerate.current }
      ));
    }

    // Get job
    const job = await prisma.job.findFirst({
      where: {
        id,
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

    // Get user profile
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      include: {
        skills: true,
        experiences: {
          orderBy: { startDate: 'desc' },
        },
        educations: {
          orderBy: { graduationYear: 'desc' },
        },
      },
    });

    if (!profile) {
      return errorResponse(createError(
        ErrorCodes.VALIDATION_ERROR,
        'Please complete your profile first',
        400
      ));
    }

    // Generate kit using AI
    const kitContent = await generateApplicationKit({
      profile: {
        headline: profile.headline,
        summary: profile.summary,
        skills: profile.skills.map((s) => s.name),
        experiences: profile.experiences.map((e) => ({
          company: e.company,
          title: e.title,
          description: e.description,
          startDate: e.startDate.toISOString(),
          endDate: e.endDate?.toISOString(),
          current: e.current,
        })),
        educations: profile.educations.map((e) => ({
          institution: e.institution,
          degree: e.degree,
          field: e.field,
          graduationYear: e.graduationYear,
        })),
      },
      job: {
        title: job.title,
        company: job.company,
        description: job.description,
        requirements: job.requirements || [],
      },
      matchedSkills: job.scores[0]?.matchedSkills || [],
      missingSkills: job.scores[0]?.missingSkills || [],
      assetType,
      variant,
    });

    // Save the kit
    const kit = await prisma.applicationKit.create({
      data: {
        jobId: job.id,
        assetType: assetType as AssetType,
        variant,
        profileVersionUsed: profile.profileVersion,
        coverLetter: kitContent.coverLetter,
        resumeTweaks: kitContent.resumeTweaks,
        interviewTips: kitContent.interviewTips,
        questions: kitContent.questions,
        negotiationTips: kitContent.negotiationTips,
      },
    });

    // Increment AI usage
    await incrementAIUsage(session.user.id);

    return successResponse({ kit }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}

// GET /api/jobs/[id]/kit - Get application kits for a job
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

    const kits = await prisma.applicationKit.findMany({
      where: { jobId: id },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse({ kits });
  } catch (error) {
    return errorResponse(error);
  }
}

// DELETE /api/jobs/[id]/kit - Delete an application kit
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse(createError(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401));
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const kitId = searchParams.get('kitId');

    if (!kitId) {
      return errorResponse(createError(ErrorCodes.VALIDATION_ERROR, 'Kit ID required', 400));
    }

    // Verify job and kit belong to user
    const kit = await prisma.applicationKit.findFirst({
      where: {
        id: kitId,
        job: {
          id,
          userId: session.user.id,
        },
      },
    });

    if (!kit) {
      return errorResponse(createError(ErrorCodes.NOT_FOUND, 'Kit not found', 404));
    }

    await prisma.applicationKit.delete({
      where: { id: kitId },
    });

    return successResponse({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
