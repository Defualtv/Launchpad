import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PUT /api/notifications/[id] - Mark notification as read
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

    const notification = await prisma.notification.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!notification) {
      return NextResponse.json(
        { success: false, error: { message: 'Notification not found' } },
        { status: 404 }
      );
    }

    const updated = await prisma.notification.update({
      where: { id: params.id },
      data: { read: true },
    });

    return NextResponse.json({
      success: true,
      data: { notification: updated },
    });
  } catch (error) {
    console.error('Mark read error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to mark notification as read' } },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications/[id] - Delete notification
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

    const notification = await prisma.notification.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!notification) {
      return NextResponse.json(
        { success: false, error: { message: 'Notification not found' } },
        { status: 404 }
      );
    }

    await prisma.notification.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      data: { message: 'Notification deleted' },
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to delete notification' } },
      { status: 500 }
    );
  }
}
