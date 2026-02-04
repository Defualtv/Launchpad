import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { JobType, RemotePreference, SeniorityLevel, PipelineStage } from '@prisma/client';

// This is a stub job discovery endpoint that creates demo jobs
// In production, this would integrate with job APIs (LinkedIn, Indeed, etc.)

// Demo job templates
const JOB_TEMPLATES = [
  {
    title: 'Senior Software Engineer',
    company: 'TechCorp',
    location: 'San Francisco, CA',
    remoteType: RemotePreference.HYBRID,
    seniorityEstimate: SeniorityLevel.SENIOR,
    salaryMin: 150000,
    salaryMax: 200000,
    description: 'We are looking for a Senior Software Engineer to join our team. You will be responsible for designing and implementing scalable backend systems.',
    mustHaveSkills: ['Python', 'AWS', 'PostgreSQL'],
    niceToHaveSkills: ['Kubernetes', 'GraphQL'],
  },
  {
    title: 'Frontend Developer',
    company: 'StartupXYZ',
    location: 'New York, NY',
    remoteType: RemotePreference.REMOTE,
    seniorityEstimate: SeniorityLevel.MID,
    salaryMin: 100000,
    salaryMax: 140000,
    description: 'Join our fast-growing startup as a Frontend Developer. You will build beautiful and performant user interfaces.',
    mustHaveSkills: ['React', 'TypeScript', 'CSS'],
    niceToHaveSkills: ['Next.js', 'Tailwind'],
  },
  {
    title: 'Full Stack Developer',
    company: 'BigTech Inc',
    location: 'Seattle, WA',
    remoteType: RemotePreference.ONSITE,
    seniorityEstimate: SeniorityLevel.MID,
    salaryMin: 120000,
    salaryMax: 160000,
    description: 'We need a Full Stack Developer to help us build the next generation of our platform.',
    mustHaveSkills: ['JavaScript', 'Node.js', 'React'],
    niceToHaveSkills: ['AWS', 'Docker'],
  },
  {
    title: 'DevOps Engineer',
    company: 'CloudFirst',
    location: 'Austin, TX',
    remoteType: RemotePreference.REMOTE,
    seniorityEstimate: SeniorityLevel.SENIOR,
    salaryMin: 140000,
    salaryMax: 180000,
    description: 'Looking for a DevOps Engineer to help us scale our infrastructure and improve our CI/CD pipelines.',
    mustHaveSkills: ['AWS', 'Terraform', 'Docker'],
    niceToHaveSkills: ['Kubernetes', 'Python'],
  },
  {
    title: 'Data Engineer',
    company: 'DataDriven',
    location: 'Boston, MA',
    remoteType: RemotePreference.HYBRID,
    seniorityEstimate: SeniorityLevel.MID,
    salaryMin: 130000,
    salaryMax: 170000,
    description: 'Join our data team to build robust data pipelines and analytics infrastructure.',
    mustHaveSkills: ['Python', 'SQL', 'Spark'],
    niceToHaveSkills: ['Airflow', 'dbt'],
  },
  {
    title: 'Product Manager',
    company: 'ProductLab',
    location: 'Los Angeles, CA',
    remoteType: RemotePreference.HYBRID,
    seniorityEstimate: SeniorityLevel.SENIOR,
    salaryMin: 140000,
    salaryMax: 190000,
    description: 'We are looking for an experienced Product Manager to lead our B2B product line.',
    mustHaveSkills: ['Product Strategy', 'Agile', 'Analytics'],
    niceToHaveSkills: ['Technical Background', 'SQL'],
  },
  {
    title: 'Machine Learning Engineer',
    company: 'AI Innovations',
    location: 'San Jose, CA',
    remoteType: RemotePreference.REMOTE,
    seniorityEstimate: SeniorityLevel.SENIOR,
    salaryMin: 170000,
    salaryMax: 220000,
    description: 'Build and deploy ML models that power our AI-first products.',
    mustHaveSkills: ['Python', 'TensorFlow', 'MLOps'],
    niceToHaveSkills: ['PyTorch', 'AWS SageMaker'],
  },
  {
    title: 'Backend Engineer',
    company: 'ScaleUp',
    location: 'Denver, CO',
    remoteType: RemotePreference.REMOTE,
    seniorityEstimate: SeniorityLevel.MID,
    salaryMin: 110000,
    salaryMax: 150000,
    description: 'Help us build scalable microservices architecture.',
    mustHaveSkills: ['Go', 'PostgreSQL', 'gRPC'],
    niceToHaveSkills: ['Kubernetes', 'Redis'],
  },
];

// POST /api/cron/discovery - Create demo discovered jobs for users
export async function POST(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    // Get users with completed onboarding
    const users = await prisma.user.findMany({
      where: { onboardingComplete: true },
      include: {
        profile: true,
        preferences: true,
      },
    });

    let jobsCreated = 0;
    let notificationsCreated = 0;

    for (const user of users) {
      // Check how many jobs user already has
      const existingJobCount = await prisma.job.count({
        where: { userId: user.id },
      });

      // Skip if user already has many jobs (demo limit)
      if (existingJobCount >= 50) continue;

      // Pick 1-3 random jobs for this user
      const jobCount = Math.floor(Math.random() * 3) + 1;
      const shuffled = [...JOB_TEMPLATES].sort(() => 0.5 - Math.random());
      const selectedJobs = shuffled.slice(0, jobCount);

      for (const template of selectedJobs) {
        // Check if similar job already exists
        const existingJob = await prisma.job.findFirst({
          where: {
            userId: user.id,
            title: template.title,
            company: template.company,
          },
        });

        if (existingJob) continue;

        // Create job
        const job = await prisma.job.create({
          data: {
            userId: user.id,
            title: template.title,
            company: template.company,
            location: template.location,
            remoteType: template.remoteType,
            seniorityEstimate: template.seniorityEstimate,
            salaryMin: template.salaryMin,
            salaryMax: template.salaryMax,
            descriptionRaw: template.description,
            descriptionClean: template.description,
            mustHaveSkills: template.mustHaveSkills,
            niceToHaveSkills: template.niceToHaveSkills,
            jobType: JobType.FULL_TIME,
            source: 'JobCircle Discovery',
            url: `https://example.com/jobs/${Date.now()}`,
            postedAt: new Date(),
          },
        });

        // Create pipeline item (SAVED stage)
        await prisma.pipelineItem.create({
          data: {
            userId: user.id,
            jobId: job.id,
            stage: PipelineStage.SAVED,
          },
        });

        jobsCreated++;
      }

      // Create notification for discovered jobs
      if (selectedJobs.length > 0) {
        await prisma.notification.create({
          data: {
            userId: user.id,
            type: 'JOB_MATCH',
            title: `${selectedJobs.length} new job${selectedJobs.length > 1 ? 's' : ''} discovered!`,
            message: `We found ${selectedJobs.length} job${selectedJobs.length > 1 ? 's' : ''} matching your preferences.`,
            link: '/jobs',
          },
        });
        notificationsCreated++;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        usersProcessed: users.length,
        jobsCreated,
        notificationsCreated,
      },
    });
  } catch (error) {
    console.error('Job discovery error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Discovery failed' } },
      { status: 500 }
    );
  }
}

// GET - Health check for cron
export async function GET() {
  return NextResponse.json({
    success: true,
    data: { status: 'Job discovery cron endpoint ready' },
  });
}
