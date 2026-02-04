import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/documents/[id] - Get document details with signed URL
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const document = await prisma.document.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!document) {
      return NextResponse.json(
        { success: false, error: { message: 'Document not found' } },
        { status: 404 }
      );
    }

    // In production, generate a signed URL for S3 download
    // const signedUrl = await getSignedUrl(s3Client, new GetObjectCommand({
    //   Bucket: process.env.S3_BUCKET,
    //   Key: document.s3Key,
    // }), { expiresIn: 3600 });

    // For now, return document metadata
    return NextResponse.json({
      success: true,
      data: {
        document,
        // downloadUrl: signedUrl,
      },
    });
  } catch (error) {
    console.error('Document get error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to get document' } },
      { status: 500 }
    );
  }
}

// PUT /api/documents/[id] - Update document metadata
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name, version, isDefault } = body;

    // Check ownership
    const existing = await prisma.document.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { message: 'Document not found' } },
        { status: 404 }
      );
    }

    // If setting as default, unset other defaults of the same type
    if (isDefault) {
      await prisma.document.updateMany({
        where: {
          userId: session.user.id,
          type: existing.type,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    const document = await prisma.document.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(version !== undefined && { version }),
        ...(isDefault !== undefined && { isDefault }),
      },
    });

    return NextResponse.json({
      success: true,
      data: { document },
    });
  } catch (error) {
    console.error('Document update error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to update document' } },
      { status: 500 }
    );
  }
}

// DELETE /api/documents/[id] - Delete a document
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    // Check ownership
    const document = await prisma.document.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!document) {
      return NextResponse.json(
        { success: false, error: { message: 'Document not found' } },
        { status: 404 }
      );
    }

    // In production, delete from S3
    // await s3Client.send(new DeleteObjectCommand({
    //   Bucket: process.env.S3_BUCKET,
    //   Key: document.s3Key,
    // }));

    await prisma.document.delete({
      where: { id: params.id },
    });

    // If this was the default document, set another one as default
    if (document.isDefault) {
      const nextDocument = await prisma.document.findFirst({
        where: {
          userId: session.user.id,
          type: document.type,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (nextDocument) {
        await prisma.document.update({
          where: { id: nextDocument.id },
          data: { isDefault: true },
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: { message: 'Document deleted' },
    });
  } catch (error) {
    console.error('Document delete error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to delete document' } },
      { status: 500 }
    );
  }
}
