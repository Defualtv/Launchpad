import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { contactSchema } from '@/lib/validations';
import { errorResponse, successResponse, createError, ErrorCodes } from '@/lib/errors';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/pipeline/[id]/contacts - Get contacts for a pipeline item
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse(createError(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401));
    }

    const { id } = await params;

    // Verify pipeline item belongs to user
    const pipelineItem = await prisma.pipelineItem.findFirst({
      where: {
        id,
        job: { userId: session.user.id },
      },
      include: { contacts: true },
    });

    if (!pipelineItem) {
      return errorResponse(createError(ErrorCodes.NOT_FOUND, 'Pipeline item not found', 404));
    }

    return successResponse({ contacts: pipelineItem.contacts });
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

    // Verify pipeline item belongs to user
    const pipelineItem = await prisma.pipelineItem.findFirst({
      where: {
        id,
        job: { userId: session.user.id },
      },
    });

    if (!pipelineItem) {
      return errorResponse(createError(ErrorCodes.NOT_FOUND, 'Pipeline item not found', 404));
    }

    const contact = await prisma.contact.create({
      data: {
        pipelineItemId: id,
        name: result.data.name,
        role: result.data.role,
        email: result.data.email,
        phone: result.data.phone,
        linkedIn: result.data.linkedIn,
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
    const body = await request.json();
    const { contactId, ...data } = body;

    if (!contactId) {
      return errorResponse(createError(ErrorCodes.VALIDATION_ERROR, 'Contact ID required', 400));
    }

    // Verify contact belongs to user's pipeline
    const contact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        pipelineItem: {
          id,
          job: { userId: session.user.id },
        },
      },
    });

    if (!contact) {
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
        ...(result.data.linkedIn !== undefined && { linkedIn: result.data.linkedIn }),
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
    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get('contactId');

    if (!contactId) {
      return errorResponse(createError(ErrorCodes.VALIDATION_ERROR, 'Contact ID required', 400));
    }

    // Verify contact belongs to user's pipeline
    const contact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        pipelineItem: {
          id,
          job: { userId: session.user.id },
        },
      },
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
