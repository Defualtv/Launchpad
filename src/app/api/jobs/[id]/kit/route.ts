import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { errorResponse, successResponse, createError, ErrorCodes } from '@/lib/errors';
import { checkAIGenerationLimit, getPlanFromStatus } from '@/lib/plans';
import { generateApplicationKit, selectVariant } from '@/lib/ai';
import type { Tone, Variant, AssetType } from '@/lib/ai';

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
    const { tone = 'professional', type = 'all' } = body;

    // Check AI generation limit
    const currentMonth = new Date().toISOString().slice(0, 7);
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });
    const quotaUsage = await prisma.quotaUsage.findUnique({
      where: {
        userId_monthKey: {
          userId: session.user.id,
          monthKey: currentMonth,
        },
      },
    });

    const status = subscription?.status || 'FREE';
    const currentUsage = quotaUsage?.aiGenerationsUsed || 0;
    const limitCheck = checkAIGenerationLimit(status, currentUsage);
    
    if (!limitCheck.allowed) {
      return errorResponse(createError(
        ErrorCodes.VALIDATION_ERROR,
        `AI generation limit reached. ${limitCheck.remaining} remaining of ${limitCheck.limit} this month.`,
        403
      ));
    }

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

    // Get user profile with skills and experiences
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      include: {
        skills: true,
        experiences: {
          orderBy: { startDate: 'desc' },
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

    // Get scoring weights for A/B variant selection
    const weights = await prisma.userScoringWeights.findUnique({
      where: { userId: session.user.id },
    });

    const variant: Variant = selectVariant(weights, (type === 'all' ? 'cover' : type) as AssetType);

    // Generate kit using AI (Claude for writing, OpenAI for extraction)
    const kitContent = await generateApplicationKit({
      profile: profile as any,
      job: job as any,
      tone: tone as Tone,
      variant,
      type: type as AssetType | 'all',
    });

    // Save the kit
    const kit = await prisma.applicationKit.create({
      data: {
        userId: session.user.id,
        jobId: job.id,
        variantUsed: kitContent.variantUsed,
        tone,
        resumeBullets: kitContent.resumeBullets,
        coverShort: kitContent.coverShort,
        coverLong: kitContent.coverLong,
        qaJson: JSON.stringify(kitContent.qaJson),
      },
    });

    // Increment AI usage
    await prisma.quotaUsage.upsert({
      where: {
        userId_monthKey: {
          userId: session.user.id,
          monthKey: currentMonth,
        },
      },
      create: {
        userId: session.user.id,
        monthKey: currentMonth,
        aiGenerationsUsed: 1,
      },
      update: {
        aiGenerationsUsed: { increment: 1 },
      },
    });

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
