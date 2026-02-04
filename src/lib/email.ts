import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.EMAIL_FROM || 'Job Agent <noreply@jobagent.app>';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  if (!resend) {
    console.log('[Email Mock] Would send email:', {
      to: options.to,
      subject: options.subject,
    });
    return true; // Return success in mock mode
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

// Email templates
export function reminderEmailTemplate(data: {
  userName: string;
  jobs: Array<{
    title: string;
    company: string;
    nextAction: string;
    url: string;
  }>;
}): { subject: string; html: string } {
  const jobsList = data.jobs.map(job => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e5e5;">
        <strong>${job.title}</strong><br>
        <span style="color: #666;">${job.company}</span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e5e5;">
        ${job.nextAction}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e5e5;">
        <a href="${job.url}" style="color: #2563eb;">View Job</a>
      </td>
    </tr>
  `).join('');

  return {
    subject: `🔔 Job Agent Reminder: ${data.jobs.length} job${data.jobs.length > 1 ? 's' : ''} need${data.jobs.length === 1 ? 's' : ''} attention`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Job Agent</h1>
        </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 8px 8px;">
          <p>Hi ${data.userName},</p>
          
          <p>You have upcoming actions scheduled for these jobs:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background: #f5f5f5;">
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e5e5;">Job</th>
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e5e5;">Action Due</th>
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e5e5;">Link</th>
              </tr>
            </thead>
            <tbody>
              ${jobsList}
            </tbody>
          </table>
          
          <p>
            <a href="${APP_URL}/pipeline" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
              View Pipeline
            </a>
          </p>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            You're receiving this because you have reminders enabled. 
            <a href="${APP_URL}/settings" style="color: #2563eb;">Manage preferences</a>
          </p>
        </div>
      </body>
      </html>
    `,
  };
}

export function weeklySummaryEmailTemplate(data: {
  userName: string;
  weekStats: {
    jobsAdded: number;
    applicationsSubmitted: number;
    interviews: number;
    responseRate: number;
  };
  topMatches: Array<{
    title: string;
    company: string;
    score: number;
    url: string;
  }>;
  skillGaps: string[];
  suggestions: string[];
}): { subject: string; html: string } {
  const topMatchesList = data.topMatches.slice(0, 5).map(job => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e5e5;">
        <strong>${job.title}</strong><br>
        <span style="color: #666;">${job.company}</span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: center;">
        <span style="display: inline-block; padding: 4px 12px; border-radius: 20px; font-weight: 600; ${
          job.score >= 80 ? 'background: #dcfce7; color: #166534;' :
          job.score >= 60 ? 'background: #fef9c3; color: #854d0e;' :
          'background: #fee2e2; color: #991b1b;'
        }">
          ${job.score}%
        </span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e5e5;">
        <a href="${job.url}" style="color: #2563eb;">View</a>
      </td>
    </tr>
  `).join('');

  const gapsList = data.skillGaps.length > 0
    ? `<ul style="margin: 0; padding-left: 20px;">${data.skillGaps.map(s => `<li>${s}</li>`).join('')}</ul>`
    : '<p style="color: #666;">No significant skill gaps identified this week.</p>';

  const suggestionsList = data.suggestions.length > 0
    ? `<ul style="margin: 0; padding-left: 20px;">${data.suggestions.map(s => `<li>${s}</li>`).join('')}</ul>`
    : '<p style="color: #666;">Keep up the great work!</p>';

  return {
    subject: `📊 Your Weekly Job Search Summary`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Weekly Summary</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Your job search at a glance</p>
        </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 8px 8px;">
          <p>Hi ${data.userName},</p>
          
          <p>Here's your weekly job search summary:</p>
          
          <!-- Stats -->
          <div style="display: flex; flex-wrap: wrap; gap: 15px; margin: 20px 0;">
            <div style="flex: 1; min-width: 120px; background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center;">
              <div style="font-size: 28px; font-weight: bold; color: #2563eb;">${data.weekStats.jobsAdded}</div>
              <div style="font-size: 12px; color: #666;">Jobs Added</div>
            </div>
            <div style="flex: 1; min-width: 120px; background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center;">
              <div style="font-size: 28px; font-weight: bold; color: #059669;">${data.weekStats.applicationsSubmitted}</div>
              <div style="font-size: 12px; color: #666;">Applied</div>
            </div>
            <div style="flex: 1; min-width: 120px; background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center;">
              <div style="font-size: 28px; font-weight: bold; color: #7c3aed;">${data.weekStats.interviews}</div>
              <div style="font-size: 12px; color: #666;">Interviews</div>
            </div>
            <div style="flex: 1; min-width: 120px; background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center;">
              <div style="font-size: 28px; font-weight: bold; color: #ea580c;">${data.weekStats.responseRate}%</div>
              <div style="font-size: 12px; color: #666;">Response Rate</div>
            </div>
          </div>
          
          ${data.topMatches.length > 0 ? `
            <!-- Top Matches -->
            <h2 style="font-size: 18px; margin-top: 30px;">Top Matches This Week</h2>
            <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
              <thead>
                <tr style="background: #f5f5f5;">
                  <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e5e5;">Job</th>
                  <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e5e5;">Match</th>
                  <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e5e5;">Link</th>
                </tr>
              </thead>
              <tbody>
                ${topMatchesList}
              </tbody>
            </table>
          ` : ''}
          
          <!-- Skill Gaps -->
          <h2 style="font-size: 18px; margin-top: 30px;">Skills to Consider Adding</h2>
          ${gapsList}
          
          <!-- Suggestions -->
          <h2 style="font-size: 18px; margin-top: 30px;">Suggestions for This Week</h2>
          ${suggestionsList}
          
          <p style="margin-top: 30px;">
            <a href="${APP_URL}/dashboard" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
              View Dashboard
            </a>
          </p>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            You're receiving this weekly summary as part of your Power plan.
            <a href="${APP_URL}/settings" style="color: #2563eb;">Manage preferences</a>
          </p>
        </div>
      </body>
      </html>
    `,
  };
}

// ============================================
// Wrapper Functions for Cron Jobs
// ============================================

/**
 * Send a reminder email for upcoming job actions
 */
export async function sendReminderEmail(data: {
  to: string;
  userName: string;
  jobTitle: string;
  company: string;
  stage: string;
  notes?: string;
  jobUrl: string;
}): Promise<boolean> {
  const template = reminderEmailTemplate({
    userName: data.userName,
    jobs: [{
      title: data.jobTitle,
      company: data.company,
      nextAction: `Follow up on ${data.stage.toLowerCase()} stage${data.notes ? `: ${data.notes}` : ''}`,
      url: data.jobUrl,
    }],
  });

  return sendEmail({
    to: data.to,
    subject: template.subject,
    html: template.html,
  });
}

/**
 * Send a weekly summary email to a user
 */
export async function sendWeeklySummary(data: {
  to: string;
  userName: string;
  weeklyStats: {
    newJobs: number;
    applied: number;
    interviewing: number;
    offers: number;
  };
  topJobs: Array<{
    title: string;
    company: string;
    score: number;
    url: string;
  }>;
  upcomingReminders: Array<{
    title: string;
    company: string;
    date: string;
  }>;
  dashboardUrl: string;
}): Promise<boolean> {
  // Calculate response rate
  const responseRate = data.weeklyStats.applied > 0
    ? Math.round((data.weeklyStats.interviewing / data.weeklyStats.applied) * 100)
    : 0;

  const template = weeklySummaryEmailTemplate({
    userName: data.userName,
    weekStats: {
      jobsAdded: data.weeklyStats.newJobs,
      applicationsSubmitted: data.weeklyStats.applied,
      interviews: data.weeklyStats.interviewing,
      responseRate,
    },
    topMatches: data.topJobs.map(job => ({
      title: job.title,
      company: job.company,
      score: job.score,
      url: job.url,
    })),
    skillGaps: [], // Could be calculated from job analysis in future
    suggestions: generateWeeklySuggestions(data.weeklyStats),
  });

  return sendEmail({
    to: data.to,
    subject: template.subject,
    html: template.html,
  });
}

/**
 * Generate personalized suggestions based on weekly stats
 */
function generateWeeklySuggestions(stats: {
  newJobs: number;
  applied: number;
  interviewing: number;
  offers: number;
}): string[] {
  const suggestions: string[] = [];

  if (stats.applied === 0 && stats.newJobs > 0) {
    suggestions.push('You have jobs saved but haven\'t applied yet. Consider submitting applications to your top matches.');
  }

  if (stats.applied > 0 && stats.interviewing === 0) {
    suggestions.push('Keep up the applications! Consider reaching out to hiring managers directly on LinkedIn.');
  }

  if (stats.interviewing > 0 && stats.offers === 0) {
    suggestions.push('Great progress on interviews! Prepare by reviewing common questions and researching the companies.');
  }

  if (stats.offers > 0) {
    suggestions.push('Congratulations on your offers! Take time to compare compensation packages carefully.');
  }

  if (suggestions.length === 0) {
    suggestions.push('Keep building your pipeline with high-match jobs.');
    suggestions.push('Follow up on any pending applications this week.');
  }

  return suggestions;
}
