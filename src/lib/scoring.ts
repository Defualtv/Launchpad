import { Profile, Job, Skill, UserScoringWeights, Experience, SeniorityLevel, RemotePreference } from '@prisma/client';

export interface ScoreBreakdown {
  skillsScore: number;
  skillsMatched: string[];
  skillsMissing: string[];
  mustHaveScore: number;
  mustHaveMatched: string[];
  mustHaveMissing: string[];
  niceToHaveScore: number;
  niceToHaveMatched: string[];
  niceToHaveMissing: string[];
  locationScore: number;
  locationReason: string;
  seniorityScore: number;
  seniorityReason: string;
  salaryScore: number;
  salaryReason: string;
  rawScore: number;
  calibratedScore: number;
}

export interface ScoreExplanation {
  summary: string;
  strengths: string[];
  gaps: string[];
  recommendations: string[];
}

interface ProfileWithRelations extends Profile {
  skills: Skill[];
  experiences: Experience[];
}

const DEFAULT_WEIGHTS: UserScoringWeights = {
  id: '',
  userId: '',
  wSkills: 1.0,
  wLocation: 1.0,
  wSeniorityPenalty: 1.0,
  wMustHaveGap: 1.0,
  wNiceHaveGap: 0.5,
  wSalary: 0.5,
  bias: 0.0,
  preferredVariantResume: null,
  preferredVariantCover: null,
  preferredVariantQA: null,
  variantASuccessResume: 0,
  variantBSuccessResume: 0,
  variantASuccessCover: 0,
  variantBSuccessCover: 0,
  variantASuccessQA: 0,
  variantBSuccessQA: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Seniority level ordering for comparison
const SENIORITY_ORDER: Record<SeniorityLevel, number> = {
  INTERN: 0,
  JUNIOR: 1,
  MID: 2,
  SENIOR: 3,
  LEAD: 4,
  MANAGER: 5,
  DIRECTOR: 6,
  VP: 7,
  C_LEVEL: 8,
};

// Normalize skill names for matching
function normalizeSkill(skill: string): string {
  return skill.toLowerCase().trim().replace(/[^a-z0-9+#]/g, '');
}

// Calculate years of experience from experiences
function calculateYearsOfExperience(experiences: Experience[]): number {
  let totalMonths = 0;
  
  for (const exp of experiences) {
    const start = new Date(exp.startDate);
    const end = exp.current ? new Date() : (exp.endDate ? new Date(exp.endDate) : new Date());
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    totalMonths += Math.max(0, months);
  }
  
  return totalMonths / 12;
}

// Estimate seniority from experience
function estimateSeniorityFromExperience(years: number): SeniorityLevel {
  if (years < 1) return SeniorityLevel.INTERN;
  if (years < 2) return SeniorityLevel.JUNIOR;
  if (years < 4) return SeniorityLevel.MID;
  if (years < 7) return SeniorityLevel.SENIOR;
  if (years < 10) return SeniorityLevel.LEAD;
  return SeniorityLevel.MANAGER;
}

// Check location compatibility
function checkLocationFit(
  profileLocation: string | null,
  profileRemote: RemotePreference,
  jobLocation: string | null,
  jobRemote: RemotePreference
): { score: number; reason: string } {
  // If job is remote and profile wants remote, perfect match
  if (jobRemote === RemotePreference.REMOTE && profileRemote === RemotePreference.REMOTE) {
    return { score: 100, reason: 'Perfect remote match' };
  }
  
  // If profile is flexible (ANY), give good score
  if (profileRemote === RemotePreference.ANY) {
    return { score: 90, reason: 'Flexible location preference' };
  }
  
  // If job is remote but profile prefers onsite, slight penalty
  if (jobRemote === RemotePreference.REMOTE && profileRemote === RemotePreference.ONSITE) {
    return { score: 60, reason: 'Job is remote but you prefer onsite' };
  }
  
  // Check if locations match (simple string match)
  if (profileLocation && jobLocation) {
    const profileLoc = profileLocation.toLowerCase();
    const jobLoc = jobLocation.toLowerCase();
    
    if (profileLoc.includes(jobLoc) || jobLoc.includes(profileLoc)) {
      return { score: 100, reason: 'Location match' };
    }
    
    // Check for same city/state
    const profileParts = profileLoc.split(',').map(p => p.trim());
    const jobParts = jobLoc.split(',').map(p => p.trim());
    
    if (profileParts.some(p => jobParts.includes(p))) {
      return { score: 80, reason: 'Partial location match' };
    }
  }
  
  // Hybrid preferences
  if (profileRemote === RemotePreference.HYBRID) {
    if (jobRemote === RemotePreference.HYBRID) {
      return { score: 90, reason: 'Hybrid match' };
    }
    return { score: 70, reason: 'Hybrid preference, different job arrangement' };
  }
  
  return { score: 50, reason: 'Location mismatch' };
}

// Check seniority fit
function checkSeniorityFit(
  profileSeniority: SeniorityLevel | null,
  jobSeniority: SeniorityLevel | null,
  yearsExp: number
): { score: number; reason: string } {
  if (!jobSeniority) {
    return { score: 100, reason: 'Job seniority not specified' };
  }
  
  const estimatedSeniority = profileSeniority || estimateSeniorityFromExperience(yearsExp);
  const profileLevel = SENIORITY_ORDER[estimatedSeniority];
  const jobLevel = SENIORITY_ORDER[jobSeniority];
  const diff = profileLevel - jobLevel;
  
  if (diff === 0) {
    return { score: 100, reason: 'Exact seniority match' };
  }
  
  if (diff === 1) {
    return { score: 90, reason: 'Slightly overqualified (good)' };
  }
  
  if (diff === -1) {
    return { score: 70, reason: 'Slightly junior - growth opportunity' };
  }
  
  if (diff > 1) {
    return { score: 60, reason: 'Significantly overqualified' };
  }
  
  if (diff < -1) {
    return { score: 40, reason: 'May need more experience' };
  }
  
  return { score: 50, reason: 'Seniority unclear' };
}

// Check salary fit
function checkSalaryFit(
  profileMin: number | null,
  profileMax: number | null,
  jobMin: number | null,
  jobMax: number | null
): { score: number; reason: string } {
  if (!jobMin && !jobMax) {
    return { score: 100, reason: 'Job salary not specified' };
  }
  
  if (!profileMin && !profileMax) {
    return { score: 100, reason: 'Profile salary not specified' };
  }
  
  const pMin = profileMin || 0;
  const pMax = profileMax || Infinity;
  const jMin = jobMin || 0;
  const jMax = jobMax || Infinity;
  
  // Check overlap
  if (jMax >= pMin && jMin <= pMax) {
    // Good overlap
    const overlapMin = Math.max(pMin, jMin);
    const overlapMax = Math.min(pMax, jMax);
    const overlapRange = overlapMax - overlapMin;
    const totalRange = Math.max(pMax, jMax) - Math.min(pMin, jMin);
    
    if (totalRange === 0) return { score: 100, reason: 'Exact salary match' };
    
    const overlapPercent = (overlapRange / totalRange) * 100;
    if (overlapPercent >= 80) return { score: 100, reason: 'Strong salary overlap' };
    if (overlapPercent >= 50) return { score: 85, reason: 'Good salary overlap' };
    return { score: 70, reason: 'Some salary overlap' };
  }
  
  // No overlap
  if (jMax < pMin) {
    const gap = ((pMin - jMax) / pMin) * 100;
    if (gap > 30) return { score: 20, reason: 'Job pays significantly below expectations' };
    if (gap > 15) return { score: 40, reason: 'Job pays below expectations' };
    return { score: 60, reason: 'Job pays slightly below expectations' };
  }
  
  // Job pays more than expected (rare problem)
  return { score: 90, reason: 'Job may pay more than expected' };
}

// Main scoring function
export function calculateScore(
  profile: ProfileWithRelations,
  job: Job,
  weights: UserScoringWeights | null
): { breakdown: ScoreBreakdown; explanation: ScoreExplanation } {
  const w = weights || DEFAULT_WEIGHTS;
  
  // Extract profile skills as normalized set
  const profileSkills = new Set(profile.skills.map(s => normalizeSkill(s.name)));
  
  // Extract job skills
  const jobMustHave = (job.mustHaveSkills || []).map(normalizeSkill);
  const jobNiceToHave = (job.niceToHaveSkills || []).map(normalizeSkill);
  
  // Parse keywords from job if available
  let jobKeywords: string[] = [];
  try {
    if (job.keywordsJson) {
      jobKeywords = JSON.parse(job.keywordsJson).map(normalizeSkill);
    }
  } catch {
    // Ignore parse errors
  }
  
  // Calculate skill matches
  const skillsMatched = [...profileSkills].filter(s => 
    jobKeywords.includes(s) || jobMustHave.includes(s) || jobNiceToHave.includes(s)
  );
  const skillsMissing = [...new Set([...jobKeywords, ...jobMustHave])].filter(s => !profileSkills.has(s));
  
  // Must-have analysis
  const mustHaveMatched = jobMustHave.filter(s => profileSkills.has(s));
  const mustHaveMissing = jobMustHave.filter(s => !profileSkills.has(s));
  
  // Nice-to-have analysis
  const niceToHaveMatched = jobNiceToHave.filter(s => profileSkills.has(s));
  const niceToHaveMissing = jobNiceToHave.filter(s => !profileSkills.has(s));
  
  // Calculate individual scores
  const allRequiredSkills = new Set([...jobMustHave, ...jobKeywords]);
  const skillsScore = allRequiredSkills.size > 0
    ? (skillsMatched.length / allRequiredSkills.size) * 100
    : 100;
  
  const mustHaveScore = jobMustHave.length > 0
    ? (mustHaveMatched.length / jobMustHave.length) * 100
    : 100;
  
  const niceToHaveScore = jobNiceToHave.length > 0
    ? (niceToHaveMatched.length / jobNiceToHave.length) * 100
    : 100;
  
  // Experience and seniority
  const yearsExp = calculateYearsOfExperience(profile.experiences);
  
  // Location score
  const locationResult = checkLocationFit(
    profile.location,
    profile.remotePreference,
    job.location,
    job.remoteType
  );
  
  // Seniority score
  const seniorityResult = checkSeniorityFit(
    profile.targetSeniority,
    job.seniorityEstimate,
    yearsExp
  );
  
  // Salary score
  const salaryResult = checkSalaryFit(
    profile.salaryMin,
    profile.salaryMax,
    job.salaryMin,
    job.salaryMax
  );
  
  // Calculate raw score (weighted average)
  const components = [
    { score: skillsScore, weight: w.wSkills * 0.3 },
    { score: mustHaveScore, weight: w.wMustHaveGap * 0.25 },
    { score: niceToHaveScore, weight: w.wNiceHaveGap * 0.1 },
    { score: locationResult.score, weight: w.wLocation * 0.15 },
    { score: seniorityResult.score, weight: w.wSeniorityPenalty * 0.1 },
    { score: salaryResult.score, weight: w.wSalary * 0.1 },
  ];
  
  const totalWeight = components.reduce((sum, c) => sum + c.weight, 0);
  const rawScore = components.reduce((sum, c) => sum + (c.score * c.weight), 0) / totalWeight;
  
  // Apply calibration bias
  const calibratedScore = Math.max(0, Math.min(100, rawScore + w.bias));
  
  const breakdown: ScoreBreakdown = {
    skillsScore: Math.round(skillsScore),
    skillsMatched,
    skillsMissing,
    mustHaveScore: Math.round(mustHaveScore),
    mustHaveMatched,
    mustHaveMissing,
    niceToHaveScore: Math.round(niceToHaveScore),
    niceToHaveMatched,
    niceToHaveMissing,
    locationScore: locationResult.score,
    locationReason: locationResult.reason,
    seniorityScore: seniorityResult.score,
    seniorityReason: seniorityResult.reason,
    salaryScore: salaryResult.score,
    salaryReason: salaryResult.reason,
    rawScore: Math.round(rawScore),
    calibratedScore: Math.round(calibratedScore),
  };
  
  // Generate explanation
  const strengths: string[] = [];
  const gaps: string[] = [];
  const recommendations: string[] = [];
  
  if (skillsMatched.length > 0) {
    strengths.push(`Strong match on ${skillsMatched.length} key skills`);
  }
  if (mustHaveScore >= 80) {
    strengths.push('You meet most must-have requirements');
  }
  if (locationResult.score >= 80) {
    strengths.push(locationResult.reason);
  }
  if (seniorityResult.score >= 80) {
    strengths.push(seniorityResult.reason);
  }
  
  if (mustHaveMissing.length > 0) {
    gaps.push(`Missing must-have skills: ${mustHaveMissing.slice(0, 3).join(', ')}${mustHaveMissing.length > 3 ? '...' : ''}`);
    recommendations.push(`Consider adding ${mustHaveMissing[0]} to your profile if you have relevant experience`);
  }
  if (locationResult.score < 70) {
    gaps.push(locationResult.reason);
  }
  if (seniorityResult.score < 70) {
    gaps.push(seniorityResult.reason);
  }
  if (salaryResult.score < 70) {
    gaps.push(salaryResult.reason);
  }
  
  if (recommendations.length === 0 && gaps.length > 0) {
    recommendations.push('Update your profile to better match job requirements');
  }
  
  let summary: string;
  if (calibratedScore >= 80) {
    summary = 'Excellent match! You\'re well-qualified for this role.';
  } else if (calibratedScore >= 60) {
    summary = 'Good match with some areas for improvement.';
  } else if (calibratedScore >= 40) {
    summary = 'Moderate match. Consider if this role aligns with your goals.';
  } else {
    summary = 'Lower match. This role may require skills you\'re still developing.';
  }
  
  const explanation: ScoreExplanation = {
    summary,
    strengths,
    gaps,
    recommendations,
  };
  
  return { breakdown, explanation };
}

// Extract keywords from job description (heuristic)
export function extractKeywords(description: string): string[] {
  const text = description.toLowerCase();
  
  // Common tech skills and keywords
  const techPatterns = [
    // Languages
    'javascript', 'typescript', 'python', 'java', 'c\\+\\+', 'c#', 'ruby', 'go', 'golang', 'rust', 'php', 'swift', 'kotlin', 'scala',
    // Frontend
    'react', 'vue', 'angular', 'next\\.?js', 'nuxt', 'svelte', 'html', 'css', 'sass', 'tailwind', 'bootstrap',
    // Backend
    'node\\.?js', 'express', 'django', 'flask', 'fastapi', 'spring', 'rails', 'laravel', 'asp\\.net',
    // Databases
    'postgresql', 'postgres', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'dynamodb', 'sqlite', 'sql', 'nosql',
    // Cloud
    'aws', 'azure', 'gcp', 'google cloud', 'heroku', 'vercel', 'netlify', 'cloudflare',
    // DevOps
    'docker', 'kubernetes', 'k8s', 'jenkins', 'circleci', 'github actions', 'terraform', 'ansible',
    // Tools
    'git', 'graphql', 'rest', 'api', 'microservices', 'ci/cd', 'agile', 'scrum',
    // Data
    'machine learning', 'ml', 'data science', 'pandas', 'numpy', 'tensorflow', 'pytorch',
  ];
  
  const found = new Set<string>();
  
  for (const pattern of techPatterns) {
    const regex = new RegExp(`\\b${pattern}\\b`, 'gi');
    if (regex.test(text)) {
      // Normalize the matched term
      let term = pattern.replace(/\\\./g, '.').replace(/\\+/g, '+');
      // Handle special cases
      if (term === 'next.js' || term === 'next\\.?js') term = 'Next.js';
      else if (term === 'node.js' || term === 'node\\.?js') term = 'Node.js';
      else if (term === 'c\\+\\+') term = 'C++';
      else if (term === 'c#') term = 'C#';
      else if (term === 'asp\\.net') term = 'ASP.NET';
      else if (term === 'golang') term = 'Go';
      else if (term === 'k8s') term = 'Kubernetes';
      else term = term.charAt(0).toUpperCase() + term.slice(1);
      found.add(term);
    }
  }
  
  // Extract years of experience mentions
  const yearsPattern = /(\d+)\+?\s*(?:years?|yrs?)(?:\s+of)?\s+(?:experience|exp)/gi;
  let match;
  while ((match = yearsPattern.exec(text)) !== null) {
    found.add(`${match[1]}+ years experience`);
  }
  
  return Array.from(found);
}

// Estimate seniority from job description
export function estimateSeniority(title: string, description: string): SeniorityLevel | null {
  const text = (title + ' ' + description).toLowerCase();
  
  if (/\b(intern|internship)\b/.test(text)) return SeniorityLevel.INTERN;
  if (/\b(junior|entry[\s-]?level|associate)\b/.test(text)) return SeniorityLevel.JUNIOR;
  if (/\b(mid[\s-]?level|intermediate)\b/.test(text)) return SeniorityLevel.MID;
  if (/\b(senior|sr\.?)\b/.test(text) && !/\b(staff|principal|lead|manager|director)\b/.test(text)) return SeniorityLevel.SENIOR;
  if (/\b(lead|tech[\s-]?lead|team[\s-]?lead)\b/.test(text)) return SeniorityLevel.LEAD;
  if (/\b(staff|principal)\b/.test(text)) return SeniorityLevel.LEAD;
  if (/\b(manager|engineering[\s-]?manager)\b/.test(text)) return SeniorityLevel.MANAGER;
  if (/\b(director)\b/.test(text)) return SeniorityLevel.DIRECTOR;
  if (/\b(vp|vice[\s-]?president)\b/.test(text)) return SeniorityLevel.VP;
  if (/\b(cto|ceo|chief)\b/.test(text)) return SeniorityLevel.C_LEVEL;
  
  // Default based on experience requirements
  const yearsMatch = text.match(/(\d+)\+?\s*(?:years?|yrs?)/);
  if (yearsMatch) {
    const years = parseInt(yearsMatch[1]);
    if (years <= 1) return SeniorityLevel.JUNIOR;
    if (years <= 3) return SeniorityLevel.MID;
    if (years <= 6) return SeniorityLevel.SENIOR;
    return SeniorityLevel.LEAD;
  }
  
  return null;
}

// Parse salary from description
export function extractSalary(description: string): { min: number | null; max: number | null; currency: string } {
  const text = description.toLowerCase();
  
  // Look for salary patterns
  const patterns = [
    /\$\s*(\d{2,3})[,.]?(\d{3})?\s*[-–to]+\s*\$?\s*(\d{2,3})[,.]?(\d{3})?/gi,
    /(\d{2,3})[,.]?(\d{3})?\s*[-–to]+\s*(\d{2,3})[,.]?(\d{3})?\s*(?:usd|per\s+year|annually|\/yr|\/year)/gi,
  ];
  
  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (match) {
      const min = parseInt(match[1] + (match[2] || '000').replace(/[.,]/g, ''));
      const max = parseInt(match[3] + (match[4] || '000').replace(/[.,]/g, ''));
      
      // Sanity check - salaries should be reasonable
      if (min >= 20000 && max <= 1000000 && min <= max) {
        return { min, max, currency: 'USD' };
      }
    }
  }
  
  return { min: null, max: null, currency: 'USD' };
}
