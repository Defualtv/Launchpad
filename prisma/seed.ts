import { PrismaClient, SubscriptionStatus, RemotePreference, SeniorityLevel, SkillLevel, PipelineStage, JobType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create demo user
  const hashedPassword = await bcrypt.hash('demo123456', 12);
  
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@jobagent.com' },
    update: {},
    create: {
      email: 'demo@jobagent.com',
      name: 'Demo User',
      password: hashedPassword,
      onboardingComplete: true,
      emailReminders: true,
      emailWeeklySummary: true,
    },
  });

  console.log('✅ Created demo user:', demoUser.email);

  // Create subscription for demo user (FREE tier)
  await prisma.subscription.upsert({
    where: { userId: demoUser.id },
    update: {},
    create: {
      userId: demoUser.id,
      status: SubscriptionStatus.FREE,
    },
  });

  console.log('✅ Created demo subscription');

  // Create profile for demo user
  const profile = await prisma.profile.upsert({
    where: { userId: demoUser.id },
    update: {},
    create: {
      userId: demoUser.id,
      profileVersion: 1,
      headline: 'Full Stack Developer',
      summary: 'Experienced full stack developer with 5+ years of experience building web applications. Passionate about creating user-friendly interfaces and scalable backend systems.',
      location: 'San Francisco, CA',
      remotePreference: RemotePreference.HYBRID,
      targetRole: 'Senior Software Engineer',
      targetSeniority: SeniorityLevel.SENIOR,
      salaryMin: 120000,
      salaryMax: 180000,
    },
  });

  console.log('✅ Created demo profile');

  // Create experiences
  await prisma.experience.createMany({
    data: [
      {
        profileId: profile.id,
        title: 'Senior Software Engineer',
        company: 'Tech Startup Inc',
        location: 'San Francisco, CA',
        startDate: new Date('2021-03-01'),
        current: true,
        description: 'Lead development of core platform features',
        highlights: [
          'Led team of 4 engineers to deliver new payment system',
          'Reduced API response time by 40% through optimization',
          'Implemented CI/CD pipeline reducing deployment time by 60%',
        ],
      },
      {
        profileId: profile.id,
        title: 'Software Engineer',
        company: 'Big Corp',
        location: 'New York, NY',
        startDate: new Date('2018-06-01'),
        endDate: new Date('2021-02-28'),
        current: false,
        description: 'Full stack development for enterprise applications',
        highlights: [
          'Built customer portal serving 100k+ users',
          'Migrated legacy system to microservices architecture',
          'Mentored 2 junior developers',
        ],
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Created demo experiences');

  // Create education
  await prisma.education.create({
    data: {
      profileId: profile.id,
      institution: 'University of California, Berkeley',
      degree: 'Bachelor of Science',
      field: 'Computer Science',
      startDate: new Date('2014-08-01'),
      endDate: new Date('2018-05-15'),
      gpa: 3.7,
      highlights: ['Dean\'s List', 'Computer Science Honor Society'],
    },
  });

  console.log('✅ Created demo education');

  // Create skills
  const skills = [
    { name: 'TypeScript', level: SkillLevel.EXPERT, yearsExp: 4 },
    { name: 'React', level: SkillLevel.EXPERT, yearsExp: 5 },
    { name: 'Node.js', level: SkillLevel.ADVANCED, yearsExp: 5 },
    { name: 'PostgreSQL', level: SkillLevel.ADVANCED, yearsExp: 4 },
    { name: 'Python', level: SkillLevel.INTERMEDIATE, yearsExp: 3 },
    { name: 'AWS', level: SkillLevel.INTERMEDIATE, yearsExp: 2 },
    { name: 'Docker', level: SkillLevel.INTERMEDIATE, yearsExp: 3 },
    { name: 'GraphQL', level: SkillLevel.INTERMEDIATE, yearsExp: 2 },
    { name: 'Next.js', level: SkillLevel.ADVANCED, yearsExp: 3 },
    { name: 'Prisma', level: SkillLevel.INTERMEDIATE, yearsExp: 2 },
  ];

  for (const skill of skills) {
    await prisma.skill.upsert({
      where: { profileId_name: { profileId: profile.id, name: skill.name } },
      update: skill,
      create: { ...skill, profileId: profile.id },
    });
  }

  console.log('✅ Created demo skills');

  // Create sample jobs
  const jobs = [
    {
      userId: demoUser.id,
      title: 'Senior Full Stack Engineer',
      company: 'Innovative Tech Co',
      url: 'https://example.com/jobs/123',
      location: 'San Francisco, CA',
      jobType: JobType.FULL_TIME,
      remoteType: RemotePreference.HYBRID,
      seniorityEstimate: SeniorityLevel.SENIOR,
      salaryMin: 150000,
      salaryMax: 200000,
      salaryCurrency: 'USD',
      descriptionRaw: `We are looking for a Senior Full Stack Engineer to join our growing team. 

Requirements:
- 5+ years of experience in software development
- Strong proficiency in TypeScript, React, and Node.js
- Experience with PostgreSQL or similar databases
- Experience with cloud services (AWS preferred)
- Strong communication skills

Nice to have:
- Experience with GraphQL
- Experience with Docker and Kubernetes
- Experience with CI/CD pipelines

Benefits:
- Competitive salary
- Equity package
- Health insurance
- Flexible PTO`,
      mustHaveSkills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'AWS'],
      niceToHaveSkills: ['GraphQL', 'Docker', 'Kubernetes', 'CI/CD'],
      keywordsJson: JSON.stringify(['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'AWS', 'GraphQL', 'Docker', 'Kubernetes']),
    },
    {
      userId: demoUser.id,
      title: 'Frontend Engineer',
      company: 'Design Studio',
      url: 'https://example.com/jobs/456',
      location: 'Remote',
      jobType: JobType.FULL_TIME,
      remoteType: RemotePreference.REMOTE,
      seniorityEstimate: SeniorityLevel.MID,
      salaryMin: 100000,
      salaryMax: 140000,
      salaryCurrency: 'USD',
      descriptionRaw: `Join our design-focused team as a Frontend Engineer.

Requirements:
- 3+ years of frontend development experience
- Expert in React and modern JavaScript
- Strong CSS/Tailwind skills
- Eye for design and UX

Nice to have:
- Experience with animation libraries
- Figma skills`,
      mustHaveSkills: ['React', 'JavaScript', 'CSS', 'Tailwind'],
      niceToHaveSkills: ['Animation', 'Figma'],
      keywordsJson: JSON.stringify(['React', 'JavaScript', 'CSS', 'Tailwind', 'UX', 'Animation', 'Figma']),
    },
    {
      userId: demoUser.id,
      title: 'Staff Software Engineer',
      company: 'Enterprise Solutions',
      url: 'https://example.com/jobs/789',
      location: 'New York, NY',
      jobType: JobType.FULL_TIME,
      remoteType: RemotePreference.ONSITE,
      seniorityEstimate: SeniorityLevel.LEAD,
      salaryMin: 180000,
      salaryMax: 250000,
      salaryCurrency: 'USD',
      descriptionRaw: `Looking for a Staff Engineer to lead technical initiatives.

Requirements:
- 8+ years of experience
- Strong system design skills
- Experience leading teams
- Java or Python expertise
- Experience with microservices

Nice to have:
- Machine learning experience
- Distributed systems expertise`,
      mustHaveSkills: ['System Design', 'Java', 'Python', 'Microservices', 'Leadership'],
      niceToHaveSkills: ['Machine Learning', 'Distributed Systems'],
      keywordsJson: JSON.stringify(['System Design', 'Java', 'Python', 'Microservices', 'Leadership', 'ML']),
    },
  ];

  for (const jobData of jobs) {
    const job = await prisma.job.create({
      data: jobData,
    });

    // Create pipeline item for each job
    await prisma.pipelineItem.create({
      data: {
        userId: demoUser.id,
        jobId: job.id,
        stage: job.title.includes('Senior Full Stack') ? PipelineStage.APPLIED : PipelineStage.SAVED,
        nextActionAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        stageHistory: JSON.stringify([
          { stage: 'SAVED', timestamp: new Date().toISOString() }
        ]),
      },
    });
  }

  console.log('✅ Created demo jobs and pipeline items');

  // Create scoring weights for demo user
  await prisma.userScoringWeights.upsert({
    where: { userId: demoUser.id },
    update: {},
    create: {
      userId: demoUser.id,
      wSkills: 1.0,
      wLocation: 1.0,
      wSeniorityPenalty: 1.0,
      wMustHaveGap: 1.0,
      wNiceHaveGap: 0.5,
      wSalary: 0.5,
      bias: 0.0,
    },
  });

  console.log('✅ Created scoring weights');

  // Create quota usage for current month
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  await prisma.quotaUsage.upsert({
    where: { userId_monthKey: { userId: demoUser.id, monthKey } },
    update: {},
    create: {
      userId: demoUser.id,
      monthKey,
      aiGenerationsUsed: 2,
      jobsCreated: 3,
    },
  });

  console.log('✅ Created quota usage');

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@jobagent.com' },
    update: {},
    create: {
      email: 'admin@jobagent.com',
      name: 'Admin User',
      password: hashedPassword,
      onboardingComplete: true,
    },
  });

  await prisma.subscription.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      status: SubscriptionStatus.POWER,
    },
  });

  console.log('✅ Created admin user');

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
