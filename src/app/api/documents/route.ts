import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { DocumentType } from '@prisma/client';

// Validation schema for document metadata
const documentMetadataSchema = z.object({
  name: z.string().min(1).max(255),
  version: z.string().max(50).optional(),
  type: z.enum(['CV', 'COVER_LETTER', 'PORTFOLIO', 'OTHER']).default('CV'),
});

// GET /api/documents - List user's documents
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') as DocumentType | null;

    const where: any = { userId: session.user.id };
    if (type) {
      where.type = type;
    }

    const documents = await prisma.document.findMany({
      where,
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
      select: {
        id: true,
        name: true,
        filename: true,
        mimeType: true,
        size: true,
        version: true,
        isDefault: true,
        type: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: { documents },
    });
  } catch (error) {
    console.error('Documents list error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to fetch documents' } },
      { status: 500 }
    );
  }
}

// POST /api/documents - Upload a new document
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    // Check document limit (10 documents for free users)
    const existingCount = await prisma.document.count({
      where: { userId: session.user.id },
    });

    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });

    const maxDocuments = subscription?.status === 'POWER' ? 50 
      : subscription?.status === 'PRO' ? 25 
      : 10;

    if (existingCount >= maxDocuments) {
      return NextResponse.json(
        { success: false, error: { message: `Document limit reached (${maxDocuments} max). Upgrade your plan for more.` } },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const name = formData.get('name') as string || '';
    const version = formData.get('version') as string || undefined;
    const type = formData.get('type') as string || 'CV';

    if (!file) {
      return NextResponse.json(
        { success: false, error: { message: 'No file provided' } },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid file type. Only PDF and DOCX files are allowed.' } },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: { message: 'File too large. Maximum size is 10MB.' } },
        { status: 400 }
      );
    }

    // Generate S3 key
    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const s3Key = `documents/${session.user.id}/${timestamp}_${sanitizedFilename}`;

    // In a real implementation, you would upload to S3 here
    // For now, we'll store the file reference in the database
    // const s3Client = new S3Client({ ... });
    // await s3Client.send(new PutObjectCommand({ ... }));

    // Check if this is the first document (make it default)
    const isFirstDocument = existingCount === 0;

    const document = await prisma.document.create({
      data: {
        userId: session.user.id,
        name: name || file.name,
        filename: file.name,
        mimeType: file.type,
        size: file.size,
        s3Key,
        version,
        type: type as DocumentType,
        isDefault: isFirstDocument,
      },
    });

    return NextResponse.json({
      success: true,
      data: { document },
    });
  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to upload document' } },
      { status: 500 }
    );
  }
}
