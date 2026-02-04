import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/notifications - List user's notifications
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
    const unreadOnly = searchParams.get('unread') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');
    const cursor = searchParams.get('cursor');

    const where: any = { userId: session.user.id };
    if (unreadOnly) {
      where.read = false;
    }

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        ...(cursor && {
          cursor: { id: cursor },
          skip: 1,
        }),
      }),
      prisma.notification.count({
        where: { userId: session.user.id, read: false },
      }),
    ]);

    const hasMore = notifications.length > limit;
    if (hasMore) {
      notifications.pop();
    }

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        hasMore,
        nextCursor: hasMore ? notifications[notifications.length - 1]?.id : null,
      },
    });
  } catch (error) {
    console.error('Notifications list error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to fetch notifications' } },
      { status: 500 }
    );
  }
}

// PUT /api/notifications - Mark all as read
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        read: false,
      },
      data: { read: true },
    });

    return NextResponse.json({
      success: true,
      data: { message: 'All notifications marked as read' },
    });
  } catch (error) {
    console.error('Mark all read error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to mark notifications as read' } },
      { status: 500 }
    );
  }
}
