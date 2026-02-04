import { NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { sendWeeklySummary } from '@/lib/email';
import { logger } from '@/lib/logger';
import { subWeeks } from 'date-fns';

// This endpoint should be called by a cron job once a week (e.g., Sunday evening)
// Vercel Cron: Add to vercel.json
// Other: Use external cron service

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const headersList = await headers();
    const authHeader = headersList.get('authorization');
    
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    const oneWeekAgo = subWeeks(new Date(), 1);

    // Get all users with weekly summary enabled
    const users = await prisma.user.findMany({
      where: {
        // Only users active in the last month
        jobs: {
          some: {
            createdAt: {
              gte: subWeeks(new Date(), 4),
            },
          },
        },
      },
      include: {
        jobs: {
          where: {
            createdAt: {
              gte: oneWeekAgo,
            },
          },
          include: {
            scores: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
        _count: {
          select: {
            jobs: true,
          },
        },
      },
    });

    logger.info(`Sending weekly summary to ${users.length} users`);

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const user of users) {
      try {
        // Skip if user has no email
        if (!user.email) {
          skipped++;
          continue;
        }

        // Check user's email preferences (use individual boolean field)
        if (user.emailWeeklySummary === false) {
          skipped++;
          continue;
        }

        // Calculate stats for this user
        const newJobs = user.jobs.length;
        
        // Get pipeline stats
        const pipelineStats = await prisma.pipelineItem.groupBy({
          by: ['stage'],
          where: {
            job: { userId: user.id },
            updatedAt: { gte: oneWeekAgo },
          },
          _count: true,
        });

        const applied = pipelineStats.find((s) => s.stage === 'APPLIED')?._count || 0;
        const interviewing = pipelineStats.find((s) => s.stage === 'INTERVIEWING')?._count || 0;
        const offers = pipelineStats.find((s) => s.stage === 'OFFER')?._count || 0;

        // Top scored jobs this week
        const topJobs = user.jobs
          .filter((j) => j.scores[0])
          .sort((a, b) => (b.scores[0]?.score || 0) - (a.scores[0]?.score || 0))
          .slice(0, 5)
          .map((j) => ({
            title: j.title,
            company: j.company,
            score: j.scores[0]?.score || 0,
            url: `${process.env.NEXT_PUBLIC_APP_URL}/jobs/${j.id}`,
          }));

        // Get upcoming reminders
        const upcomingReminders = await prisma.pipelineItem.findMany({
          where: {
            job: { userId: user.id },
            nextActionAt: {
              gte: new Date(),
              lte: subWeeks(new Date(), -1), // Next week
            },
          },
          include: {
            job: {
              select: {
                title: true,
                company: true,
              },
            },
          },
          take: 5,
        });

        const reminders = upcomingReminders.map((r) => ({
          title: r.job.title,
          company: r.job.company,
          date: r.nextActionAt!.toISOString(),
        }));

        // Skip if nothing happened this week
        if (newJobs === 0 && applied === 0 && interviewing === 0 && offers === 0) {
          skipped++;
          continue;
        }

        await sendWeeklySummary({
          to: user.email,
          userName: user.name || 'there',
          weeklyStats: {
            newJobs,
            applied,
            interviewing,
            offers,
          },
          topJobs,
          upcomingReminders: reminders,
          dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        });

        sent++;
      } catch (error: any) {
        logger.error(`Failed to send weekly summary to user ${user.id}: ${error.message}`);
        failed++;
      }
    }

    // Log event
    await prisma.eventMetric.create({
      data: {
        eventType: 'WEEKLY_SUMMARY',
        count: sent,
        metadata: { skipped, failed },
      },
    });

    return Response.json({
      success: true,
      processed: users.length,
      sent,
      skipped,
      failed,
    });
  } catch (error: any) {
    logger.error(`Weekly summary cron error: ${error.message}`);
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
}
