import { NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { sendReminderEmail } from '@/lib/email';
import { logger } from '@/lib/logger';

// This endpoint should be called by a cron job every hour
// Vercel Cron: Add to vercel.json
// Other: Use external cron service like cron-job.org

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const headersList = await headers();
    const authHeader = headersList.get('authorization');
    
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    // Find pipeline items with reminders due in the next hour
    const dueReminders = await prisma.pipelineItem.findMany({
      where: {
        nextActionAt: {
          gte: now,
          lt: oneHourFromNow,
        },
      },
      include: {
        job: {
          include: {
            user: true,
          },
        },
      },
    });

    logger.info(`Found ${dueReminders.length} reminders to send`);

    let sent = 0;
    let failed = 0;

    for (const item of dueReminders) {
      try {
        // Skip if user has no email or email reminders disabled
        if (!item.job.user.email) {
          continue;
        }

        // Check user's email preferences (use individual boolean fields)
        if (item.job.user.emailReminders === false) {
          continue;
        }

        await sendReminderEmail({
          to: item.job.user.email,
          userName: item.job.user.name || 'there',
          jobTitle: item.job.title,
          company: item.job.company,
          stage: item.stage,
          notes: item.notes || undefined,
          jobUrl: `${process.env.NEXT_PUBLIC_APP_URL}/jobs/${item.job.id}`,
        });

        // Clear the reminder after sending
        await prisma.pipelineItem.update({
          where: { id: item.id },
          data: { nextActionAt: null },
        });

        sent++;
      } catch (error: any) {
        logger.error(`Failed to send reminder for item ${item.id}: ${error.message}`);
        failed++;
      }
    }

    // Log event
    await prisma.eventMetric.create({
      data: {
        eventType: 'REMINDER_SENT',
        count: sent,
        metadata: { failed },
      },
    });

    return Response.json({
      success: true,
      processed: dueReminders.length,
      sent,
      failed,
    });
  } catch (error: any) {
    logger.error(`Reminder cron error: ${error.message}`);
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
}
