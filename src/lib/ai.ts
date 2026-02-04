import OpenAI from 'openai';
import { Profile, Job, Skill, Experience, UserScoringWeights } from '@prisma/client';

// Initialize OpenAI client only if API key is available
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export type AssetType = 'resume' | 'cover' | 'qa';
export type Tone = 'professional' | 'friendly' | 'confident';
export type Variant = 'A' | 'B';

interface ProfileWithRelations extends Profile {
  skills: Skill[];
  experiences: Experience[];
}

interface GenerateKitOptions {
  profile: ProfileWithRelations;
  job: Job;
  tone: Tone;
  variant: Variant;
  type: AssetType | 'all';
}

interface GeneratedKit {
  resumeBullets: string[];
  coverShort: string;
  coverLong: string;
  qaJson: Array<{ question: string; answer: string }>;
  variantUsed: Variant;
}

// Check if we should use real AI
function useRealAI(): boolean {
  return !!openai && !!process.env.OPENAI_API_KEY;
}

// Select variant based on A/B testing preferences
export function selectVariant(weights: UserScoringWeights | null, assetType: AssetType): Variant {
  if (!weights) {
    return Math.random() < 0.5 ? 'A' : 'B';
  }

  // Epsilon-greedy: 20% exploration, 80% exploitation
  const epsilon = 0.2;
  if (Math.random() < epsilon) {
    return Math.random() < 0.5 ? 'A' : 'B';
  }

  // Pick the better performing variant
  let aSuccess = 0;
  let bSuccess = 0;

  switch (assetType) {
    case 'resume':
      aSuccess = weights.variantASuccessResume;
      bSuccess = weights.variantBSuccessResume;
      break;
    case 'cover':
      aSuccess = weights.variantASuccessCover;
      bSuccess = weights.variantBSuccessCover;
      break;
    case 'qa':
      aSuccess = weights.variantASuccessQA;
      bSuccess = weights.variantBSuccessQA;
      break;
  }

  if (aSuccess === bSuccess) {
    return Math.random() < 0.5 ? 'A' : 'B';
  }

  return aSuccess > bSuccess ? 'A' : 'B';
}

// Generate mock responses when OpenAI is not available
function generateMockKit(options: GenerateKitOptions): GeneratedKit {
  const { profile, job, tone, variant } = options;
  
  const experienceHighlights = profile.experiences
    .flatMap(exp => exp.highlights || [])
    .slice(0, 3);

  const skillsList = profile.skills.map(s => s.name).slice(0, 5).join(', ');
  const toneModifier = tone === 'confident' ? 'I' : tone === 'friendly' ? 'I\'m excited to' : 'I am pleased to';

  const resumeBullets = [
    `Led development of key features resulting in measurable business impact`,
    `Collaborated with cross-functional teams to deliver high-quality solutions`,
    `Implemented ${profile.skills[0]?.name || 'technical solutions'} to solve complex problems`,
    ...experienceHighlights.slice(0, 2),
  ].slice(0, 5);

  const coverShort = variant === 'A' 
    ? `${toneModifier} apply for the ${job.title} position at ${job.company}. With my background in ${skillsList}, I am confident I can make a significant contribution to your team.`
    : `As an experienced professional with expertise in ${skillsList}, ${toneModifier} express my interest in the ${job.title} role at ${job.company}.`;

  const coverLong = `Dear Hiring Manager,

${coverShort}

${profile.summary || 'Throughout my career, I have developed strong expertise in my field and consistently delivered results.'}

In my current role, I have:
${resumeBullets.map(b => `• ${b}`).join('\n')}

I am particularly drawn to ${job.company} because of the opportunity to work on challenging problems and contribute to a dynamic team. My experience with ${skillsList} aligns well with the requirements of this role.

${tone === 'confident' 
  ? 'I am confident that my skills and experience make me an ideal candidate for this position.'
  : tone === 'friendly'
    ? 'I would love the opportunity to discuss how I can contribute to your team.'
    : 'I look forward to the opportunity to discuss how my qualifications align with your needs.'}

Best regards,
${profile.userId}`;

  const qaJson = [
    {
      question: 'Tell me about yourself',
      answer: `I'm a ${profile.targetRole || 'professional'} with experience in ${skillsList}. ${profile.summary?.slice(0, 200) || 'I am passionate about delivering high-quality work and continuously improving my skills.'}`,
    },
    {
      question: `Why are you interested in ${job.company}?`,
      answer: `I'm drawn to ${job.company} because of the opportunity to work on ${job.title} challenges. The company's focus on innovation aligns with my career goals, and I believe I can make a meaningful contribution to the team.`,
    },
    {
      question: 'What are your greatest strengths?',
      answer: `My key strengths include ${profile.skills.slice(0, 2).map(s => s.name).join(' and ')}. I also pride myself on being a collaborative team member and a strong communicator.`,
    },
    {
      question: `Describe a challenging project you've worked on`,
      answer: experienceHighlights[0] 
        ? `One challenging project involved ${experienceHighlights[0]}. This required strong problem-solving skills and collaboration with my team.`
        : 'I recently worked on a complex project that required me to learn new technologies quickly and coordinate with multiple stakeholders.',
    },
    {
      question: 'Where do you see yourself in 5 years?',
      answer: `In 5 years, I see myself growing into a ${profile.targetSeniority || 'senior'} role where I can mentor others and drive technical strategy. I'm committed to continuous learning and taking on increasing responsibility.`,
    },
  ];

  return {
    resumeBullets,
    coverShort,
    coverLong,
    qaJson,
    variantUsed: variant,
  };
}

// Generate kit using OpenAI
async function generateAIKit(options: GenerateKitOptions): Promise<GeneratedKit> {
  if (!openai) {
    return generateMockKit(options);
  }

  const { profile, job, tone, variant } = options;

  const systemPrompt = `You are an expert career coach and resume writer. You help job seekers create compelling application materials.

CRITICAL RULES:
1. NEVER fabricate experience or skills the candidate doesn't have
2. Only mention skills and experience that are provided in the profile
3. If information is missing, acknowledge the gap or use generic language
4. Be ${tone} in tone
5. This is variant ${variant} - ${variant === 'A' ? 'focus on achievements and metrics' : 'focus on skills and potential'}`;

  const userPrompt = `Create application materials for this candidate:

PROFILE:
${profile.summary || 'No summary provided'}

SKILLS: ${profile.skills.map(s => `${s.name} (${s.level})`).join(', ')}

EXPERIENCE:
${profile.experiences.map(e => `- ${e.title} at ${e.company}: ${e.description || 'No description'}`).join('\n')}

TARGET JOB:
Title: ${job.title}
Company: ${job.company}
Description: ${job.descriptionRaw.slice(0, 2000)}

Generate:
1. 5 resume bullet points tailored to this job (based ONLY on the candidate's actual experience)
2. A short cover letter paragraph (3-4 sentences)
3. A full cover letter (3 paragraphs)
4. 5 interview Q&A pairs

Format your response as JSON with keys: resumeBullets (array), coverShort (string), coverLong (string), qaJson (array of {question, answer})`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return generateMockKit(options);
    }

    const parsed = JSON.parse(content);
    return {
      resumeBullets: parsed.resumeBullets || [],
      coverShort: parsed.coverShort || '',
      coverLong: parsed.coverLong || '',
      qaJson: parsed.qaJson || [],
      variantUsed: variant,
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    return generateMockKit(options);
  }
}

// Main export function
export async function generateApplicationKit(options: GenerateKitOptions): Promise<GeneratedKit> {
  if (useRealAI()) {
    return generateAIKit(options);
  }
  return generateMockKit(options);
}

// AI-powered keyword extraction (with fallback)
export async function extractKeywordsAI(description: string): Promise<string[]> {
  if (!useRealAI()) {
    // Use heuristic extraction as fallback
    const { extractKeywords } = await import('@/lib/scoring');
    return extractKeywords(description);
  }

  try {
    const response = await openai!.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Extract technical skills and requirements from job descriptions. Return only a JSON array of skill names.',
        },
        {
          role: 'user',
          content: `Extract all technical skills, tools, and requirements from this job description:\n\n${description.slice(0, 3000)}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      const { extractKeywords } = await import('@/lib/scoring');
      return extractKeywords(description);
    }

    const parsed = JSON.parse(content);
    return parsed.skills || parsed.keywords || [];
  } catch (error) {
    console.error('Keyword extraction error:', error);
    const { extractKeywords } = await import('@/lib/scoring');
    return extractKeywords(description);
  }
}

// Check if AI is available
export function isAIAvailable(): boolean {
  return useRealAI();
}
