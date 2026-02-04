# JobCircle Phase 2: Mock Interview Feature

## Overview

The Mock Interview feature allows users to practice interviews using their CV and specific job descriptions. The system provides AI-powered feedback and scoring to help users improve their interview skills.

---

## Feature Goals

1. **Interview Practice**: Simulate real interview scenarios
2. **Personalized Questions**: Generate questions based on user's CV and target job
3. **Feedback & Scoring**: Provide detailed feedback on answers
4. **Progress Tracking**: Track improvement over time
5. **Question Bank**: Curated questions by category and difficulty

---

## Data Model Additions

### New Prisma Models

```prisma
// Interview Session
model InterviewSession {
  id              String            @id @default(cuid())
  userId          String
  jobId           String?           // Optional link to a specific job
  type            InterviewType     @default(BEHAVIORAL)
  status          InterviewStatus   @default(PENDING)
  startedAt       DateTime?
  completedAt     DateTime?
  totalScore      Int?              // 0-100
  feedbackSummary String?           @db.Text
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  user      User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
  job       Job?                  @relation(fields: [jobId], references: [id])
  questions InterviewQuestion[]
  answers   InterviewAnswer[]

  @@index([userId])
  @@index([jobId])
  @@index([type])
  @@index([status])
}

enum InterviewType {
  BEHAVIORAL
  TECHNICAL
  CASE_STUDY
  SYSTEM_DESIGN
  MIXED
}

enum InterviewStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  ABANDONED
}

// Interview Question
model InterviewQuestion {
  id          String          @id @default(cuid())
  sessionId   String
  bankId      String?         // Optional link to question bank
  orderIndex  Int
  question    String          @db.Text
  category    QuestionCategory
  difficulty  Difficulty      @default(MEDIUM)
  hints       String[]
  rubric      String?         @db.Text  // JSON scoring rubric
  timeLimit   Int?            // Seconds
  createdAt   DateTime        @default(now())

  session InterviewSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  bank    QuestionBank?    @relation(fields: [bankId], references: [id])
  answer  InterviewAnswer?

  @@index([sessionId])
  @@index([category])
}

enum QuestionCategory {
  BEHAVIORAL
  TECHNICAL
  PROBLEM_SOLVING
  COMMUNICATION
  LEADERSHIP
  CULTURE_FIT
  ROLE_SPECIFIC
}

enum Difficulty {
  EASY
  MEDIUM
  HARD
  EXPERT
}

// Interview Answer
model InterviewAnswer {
  id            String          @id @default(cuid())
  sessionId     String
  questionId    String          @unique
  answerText    String?         @db.Text
  answerAudio   String?         // S3 key for audio recording
  answerVideo   String?         // S3 key for video recording
  durationMs    Int?
  score         Int?            // 0-100
  feedback      String?         @db.Text
  feedbackJson  String?         @db.Text  // Detailed breakdown
  submittedAt   DateTime        @default(now())
  scoredAt      DateTime?

  session  InterviewSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  question InterviewQuestion @relation(fields: [questionId], references: [id], onDelete: Cascade)

  @@index([sessionId])
}

// Question Bank
model QuestionBank {
  id            String            @id @default(cuid())
  question      String            @db.Text
  category      QuestionCategory
  difficulty    Difficulty        @default(MEDIUM)
  industry      String?           // e.g., "Tech", "Finance", "Healthcare"
  role          String?           // e.g., "Software Engineer", "Product Manager"
  hints         String[]
  sampleAnswer  String?           @db.Text
  rubric        String            @db.Text  // JSON scoring criteria
  tags          String[]
  usageCount    Int               @default(0)
  avgScore      Float?
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt

  questions InterviewQuestion[]

  @@index([category])
  @@index([difficulty])
  @@index([industry])
  @@index([role])
}

// User Interview Stats
model InterviewStats {
  id                  String   @id @default(cuid())
  userId              String   @unique
  totalSessions       Int      @default(0)
  completedSessions   Int      @default(0)
  avgScore            Float?
  bestScore           Int?
  lastSessionAt       DateTime?
  
  // Category-wise scores
  behavioralAvg       Float?
  technicalAvg        Float?
  communicationAvg    Float?
  problemSolvingAvg   Float?
  
  // Progress tracking
  weeklyProgress      String?  @db.Text  // JSON array of weekly scores
  strengthsJson       String?  @db.Text  // JSON array of identified strengths
  areasToImproveJson  String?  @db.Text  // JSON array of areas needing work
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

## API Endpoints

### Interview Sessions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/interviews | List user's interview sessions |
| POST | /api/interviews | Start new interview session |
| GET | /api/interviews/[id] | Get session details |
| PUT | /api/interviews/[id] | Update session (complete, abandon) |
| DELETE | /api/interviews/[id] | Delete session |

### Questions & Answers

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/interviews/[id]/questions | Get session questions |
| POST | /api/interviews/[id]/questions/[qid]/answer | Submit answer |
| POST | /api/interviews/[id]/score | Score all answers |

### Question Bank

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/questions/bank | Search question bank |
| GET | /api/questions/generate | Generate questions for job |

### Stats & Progress

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/interviews/stats | Get user's interview stats |
| GET | /api/interviews/progress | Get progress over time |

---

## API Request/Response Examples

### Start Interview Session

**Request:**
```json
POST /api/interviews
{
  "type": "BEHAVIORAL",
  "jobId": "clx123...",  // Optional
  "questionCount": 5,
  "difficulty": "MEDIUM",
  "focusAreas": ["LEADERSHIP", "PROBLEM_SOLVING"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "session": {
      "id": "cls456...",
      "type": "BEHAVIORAL",
      "status": "IN_PROGRESS",
      "questionCount": 5,
      "startedAt": "2024-01-15T10:30:00Z"
    },
    "questions": [
      {
        "id": "clq789...",
        "orderIndex": 1,
        "question": "Tell me about a time you led a challenging project.",
        "category": "LEADERSHIP",
        "difficulty": "MEDIUM",
        "hints": ["Focus on the STAR method", "Quantify results"],
        "timeLimit": 180
      }
    ]
  }
}
```

### Submit Answer

**Request:**
```json
POST /api/interviews/cls456/questions/clq789/answer
{
  "answerText": "In my previous role at TechCorp, I led a team of 5 engineers...",
  "durationMs": 145000
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "answer": {
      "id": "cla123...",
      "questionId": "clq789...",
      "score": 78,
      "feedback": "Strong example with clear context. Consider adding more specific metrics about the project's impact.",
      "feedbackJson": {
        "structure": { "score": 85, "notes": "Good STAR format" },
        "relevance": { "score": 80, "notes": "Directly addresses leadership" },
        "specificity": { "score": 70, "notes": "Could include more quantified results" },
        "communication": { "score": 75, "notes": "Clear but could be more concise" }
      }
    },
    "nextQuestion": { ... }
  }
}
```

---

## UI Pages & Components

### 1. Interview Hub Page (`/interviews`)

**Sections:**
- Quick Start Card: Start behavioral/technical/custom interview
- Recent Sessions: List of past interviews with scores
- Progress Chart: Score trends over time
- Weak Areas: Categories needing improvement
- Upcoming Practice: Suggested practice areas

**Components:**
- `<InterviewTypeSelector />` - Choose interview type
- `<SessionCard />` - Display session summary
- `<ProgressChart />` - Line chart of scores
- `<SkillRadar />` - Radar chart of competencies

### 2. Interview Session Page (`/interviews/[id]`)

**Sections:**
- Progress Bar: Current question / total
- Question Display: Current question with hints
- Timer: Countdown for timed questions
- Answer Input: Text area or audio/video recorder
- Navigation: Previous/Next buttons

**Components:**
- `<QuestionCard />` - Display question with hints
- `<AnswerInput />` - Text/audio/video input
- `<Timer />` - Countdown timer
- `<ProgressIndicator />` - Question progress

### 3. Session Results Page (`/interviews/[id]/results`)

**Sections:**
- Overall Score: Big score display with grade
- Score Breakdown: By category
- Question Review: Each Q&A with feedback
- Recommendations: Next steps to improve
- Actions: Retry, Share, Export

**Components:**
- `<ScoreGauge />` - Visual score display
- `<FeedbackCard />` - Question + answer + feedback
- `<ImprovementTips />` - Actionable suggestions
- `<ComparisonChart />` - Compare to previous attempts

### 4. Question Bank Browser (`/interviews/questions`)

**Sections:**
- Search/Filter: By category, difficulty, role
- Question List: Browsable questions
- Practice Mode: Practice individual questions

**Components:**
- `<QuestionFilters />` - Filter controls
- `<QuestionList />` - Paginated question list
- `<QuestionPreview />` - Question details modal

---

## Scoring Rubric Approach

### Overall Score Calculation

```typescript
interface AnswerScore {
  structure: number;      // 0-100: STAR method usage
  relevance: number;      // 0-100: Answers the question
  specificity: number;    // 0-100: Concrete examples & metrics
  communication: number;  // 0-100: Clarity & conciseness
  impact: number;         // 0-100: Demonstrates value
}

function calculateOverallScore(scores: AnswerScore): number {
  const weights = {
    structure: 0.15,
    relevance: 0.30,
    specificity: 0.25,
    communication: 0.15,
    impact: 0.15,
  };
  
  return Object.entries(weights).reduce(
    (total, [key, weight]) => total + scores[key] * weight,
    0
  );
}
```

### Category-Specific Rubrics

#### Behavioral Questions
- **Situation** (20%): Clear context provided
- **Task** (20%): Role and responsibility clear
- **Action** (30%): Specific actions taken
- **Result** (30%): Quantified outcomes

#### Technical Questions
- **Accuracy** (40%): Correct technical approach
- **Depth** (25%): Thorough explanation
- **Trade-offs** (20%): Discusses alternatives
- **Communication** (15%): Clear explanation

#### System Design Questions
- **Requirements** (15%): Clarifying questions asked
- **High-Level Design** (25%): Appropriate architecture
- **Deep Dive** (25%): Detailed component design
- **Scalability** (20%): Handles growth concerns
- **Trade-offs** (15%): Discusses pros/cons

---

## AI Integration

### Question Generation

```typescript
async function generateQuestions(
  jobDescription: string,
  userProfile: Profile,
  type: InterviewType,
  count: number
): Promise<Question[]> {
  const prompt = `
    Generate ${count} ${type} interview questions for:
    
    Job: ${jobDescription}
    
    Candidate Background:
    - Skills: ${userProfile.skills.join(', ')}
    - Experience: ${userProfile.experienceYears} years
    - Target Role: ${userProfile.targetRole}
    
    Questions should:
    1. Be relevant to the job requirements
    2. Assess key competencies
    3. Have varying difficulty
    4. Include hints for the candidate
    
    Return JSON array with: question, category, difficulty, hints[]
  `;
  
  return await openai.chat({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  });
}
```

### Answer Scoring

```typescript
async function scoreAnswer(
  question: Question,
  answer: string,
  rubric: Rubric
): Promise<AnswerFeedback> {
  const prompt = `
    Score this interview answer:
    
    Question: ${question.text}
    Category: ${question.category}
    
    Answer: ${answer}
    
    Scoring Rubric:
    ${JSON.stringify(rubric)}
    
    Provide:
    1. Overall score (0-100)
    2. Breakdown by rubric criteria
    3. Specific, actionable feedback
    4. Example of a stronger answer
    
    Return JSON with: score, breakdown{}, feedback, suggestion
  `;
  
  return await openai.chat({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  });
}
```

---

## Implementation Phases

### Phase 2.1: Core Infrastructure (Week 1-2)
- [ ] Database models and migrations
- [ ] Basic API endpoints
- [ ] Question bank seeding
- [ ] Interview session management

### Phase 2.2: Interview Flow (Week 3-4)
- [ ] Interview start/resume flow
- [ ] Question display component
- [ ] Text answer submission
- [ ] Basic scoring (rule-based)

### Phase 2.3: AI Integration (Week 5-6)
- [ ] Question generation from job
- [ ] AI-powered answer scoring
- [ ] Feedback generation
- [ ] Score calibration

### Phase 2.4: Analytics & Polish (Week 7-8)
- [ ] Progress tracking
- [ ] Score trends visualization
- [ ] Weak areas identification
- [ ] Practice recommendations
- [ ] Audio/video recording (stretch)

---

## Security Considerations

1. **Rate Limiting**: Limit interview sessions per user
2. **Content Moderation**: Screen user answers
3. **API Costs**: Track AI API usage per user
4. **Data Privacy**: Don't store sensitive answers long-term
5. **Audio/Video**: Secure storage with expiring URLs

---

## Future Enhancements (Phase 3+)

1. **Live Mock Interviews**: Video call with AI interviewer
2. **Peer Practice**: Match users for practice
3. **Company-Specific Prep**: Questions by company
4. **Interview Recording Review**: Record actual interviews
5. **Interviewer Mode**: Practice being the interviewer
6. **Team Interviews**: Panel interview simulation
