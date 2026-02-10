import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { contactSchema } from '@/lib/validations';
import { errorResponse, successResponse, createError, ErrorCodes } from '@/lib/errors';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Helper: get the pipeline item and verify ownership, return the jobId
async function getPipelineJobId(pipelineItemId: string, userId: string) {
  const pipelineItem = await prisma.pipelineItem.findFirst({
    where: {
      id: pipelineItemId,
      job: { userId },
    },
    select: { jobId: true },
  });
  return pipelineItem?.jobId ?? null;
}

// GET /api/pipeline/[id]/contacts - Get contacts for a pipeline item's job
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse(createError(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401));
    }

    const { id } = await params;
    const jobId = await getPipelineJobId(id, session.user.id);

    if (!jobId) {
      return errorResponse(createError(ErrorCodes.NOT_FOUND, 'Pipeline item not found', 404));
    }

    const contacts = await prisma.contact.findMany({
      where: { jobId },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse({ contacts });
  } catch (error) {
    return errorResponse(error);
  }
}

// POST /api/pipeline/[id]/contacts - Add a contact
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse(createError(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401));
    }

    const { id } = await params;
    const jobId = await getPipelineJobId(id, session.user.id);

    if (!jobId) {
      return errorResponse(createError(ErrorCodes.NOT_FOUND, 'Pipeline item not found', 404));
    }

    const body = await request.json();
    const result = contactSchema.safeParse(body);

    if (!result.success) {
      return errorResponse(createError(
        ErrorCodes.VALIDATION_ERROR,
        'Invalid input',
        400,
        { errors: result.error.flatten().fieldErrors }
      ));
    }

    const contact = await prisma.contact.create({
      data: {
        userId: session.user.id,
        jobId,
        name: result.data.name,
        role: result.data.role,
        email: result.data.email,
        phone: result.data.phone,
        linkedin: result.data.linkedin,
        notes: result.data.notes,
      },
    });

    return successResponse({ contact }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}

// PUT /api/pipeline/[id]/contacts - Update a contact
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse(createError(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401));
    }

    const { id } = await params;
    const jobId = await getPipelineJobId(id, session.user.id);

    if (!jobId) {
      return errorResponse(createError(ErrorCodes.NOT_FOUND, 'Pipeline item not found', 404));
    }

    const body = await request.json();
    const { contactId, ...data } = body;

    if (!contactId) {
      return errorResponse(createError(ErrorCodes.VALIDATION_ERROR, 'Contact ID required', 400));
    }

    // Verify contact belongs to this job
    const existing = await prisma.contact.findFirst({
      where: { id: contactId, jobId },
    });

    if (!existing) {
      return errorResponse(createError(ErrorCodes.NOT_FOUND, 'Contact not found', 404));
    }

    const result = contactSchema.partial().safeParse(data);

    if (!result.success) {
      return errorResponse(createError(
        ErrorCodes.VALIDATION_ERROR,
        'Invalid input',
        400,
        { errors: result.error.flatten().fieldErrors }
      ));
    }

    const updatedContact = await prisma.contact.update({
      where: { id: contactId },
      data: {
        ...(result.data.name && { name: result.data.name }),
        ...(result.data.role !== undefined && { role: result.data.role }),
        ...(result.data.email !== undefined && { email: result.data.email }),
        ...(result.data.phone !== undefined && { phone: result.data.phone }),
        ...(result.data.linkedin !== undefined && { linkedin: result.data.linkedin }),
        ...(result.data.notes !== undefined && { notes: result.data.notes }),
      },
    });

    return successResponse({ contact: updatedContact });
  } catch (error) {
    return errorResponse(error);
  }
}

// DELETE /api/pipeline/[id]/contacts - Delete a contact
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse(createError(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401));
    }

    const { id } = await params;
    const jobId = await getPipelineJobId(id, session.user.id);

    if (!jobId) {
      return errorResponse(createError(ErrorCodes.NOT_FOUND, 'Pipeline item not found', 404));
    }

    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get('contactId');

    if (!contactId) {
      return errorResponse(createError(ErrorCodes.VALIDATION_ERROR, 'Contact ID required', 400));
    }

    // Verify contact belongs to this job
    const contact = await prisma.contact.findFirst({
      where: { id: contactId, jobId },
    });

    if (!contact) {
      return errorResponse(createError(ErrorCodes.NOT_FOUND, 'Contact not found', 404));
    }

    await prisma.contact.delete({
      where: { id: contactId },
    });

    return successResponse({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
