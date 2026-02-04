'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  DollarSign,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Copy,
  Loader2,
  Calendar,
  Plus,
} from 'lucide-react';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string | null;
  description: string;
  salary: string | null;
  jobType: string;
  requirements: string[];
  sourceUrl: string | null;
  postedAt: string | null;
  createdAt: string;
  scores: Array<{
    id: string;
    overallScore: number;
    skillsScore: number;
    locationScore: number;
    salaryScore: number;
    seniorityScore: number;
    matchedSkills: string[];
    missingSkills: string[];
    explanation: any;
    profileVersion: number;
    createdAt: string;
  }>;
  applicationKits: Array<{
    id: string;
    assetType: string;
    variant: string;
    coverLetter: string;
    resumeTweaks: string[];
    interviewTips: string[];
    questions: string[];
    negotiationTips: string[];
    createdAt: string;
  }>;
  pipelineItem: {
    id: string;
    stage: string;
    priority: number;
    notes: string | null;
    appliedAt: string | null;
    reminderAt: string | null;
  } | null;
  feedback: Array<{
    id: string;
    outcome: string;
    primaryFactor: string;
    createdAt: string;
  }>;
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-yellow-500';
  return 'text-red-500';
}

function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  return 'bg-red-500';
}

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [rescoring, setRescoring] = useState(false);
  const [generatingKit, setGeneratingKit] = useState(false);
  const [addingToPipeline, setAddingToPipeline] = useState(false);

  useEffect(() => {
    fetchJob();
  }, [id]);

  async function fetchJob() {
    try {
      const response = await fetch(`/api/jobs/${id}`);
      const data = await response.json();
      if (data.success) {
        setJob(data.data.job);
      }
    } catch (error) {
      console.error('Failed to fetch job:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRescore() {
    setRescoring(true);
    try {
      const response = await fetch(`/api/jobs/${id}/score`, { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Score updated!',
          description: `New score: ${data.data.score.overallScore}%`,
        });
        fetchJob();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to rescore job',
        variant: 'destructive',
      });
    } finally {
      setRescoring(false);
    }
  }

  async function handleGenerateKit() {
    setGeneratingKit(true);
    try {
      const response = await fetch(`/api/jobs/${id}/kit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetType: 'FULL_KIT' }),
      });
      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Application kit generated!',
          description: 'Your personalized materials are ready.',
        });
        fetchJob();
      } else {
        throw new Error(data.error?.message || 'Failed to generate kit');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setGeneratingKit(false);
    }
  }

  async function handleAddToPipeline() {
    setAddingToPipeline(true);
    try {
      const response = await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: id, stage: 'SAVED' }),
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: 'Added to pipeline!' });
        fetchJob();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add to pipeline',
        variant: 'destructive',
      });
    } finally {
      setAddingToPipeline(false);
    }
  }

  async function handleUpdateStage(stage: string) {
    if (!job?.pipelineItem) return;
    try {
      const response = await fetch('/api/pipeline', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: job.pipelineItem.id, stage }),
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: `Stage updated to ${stage}` });
        fetchJob();
      }
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive' });
    }
  }

  async function handleDelete() {
    try {
      const response = await fetch(`/api/jobs/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        toast({ title: 'Job deleted' });
        router.push('/jobs');
      }
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive' });
    }
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied to clipboard!` });
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <h2 className="text-xl font-semibold mb-2">Job not found</h2>
        <Link href="/jobs">
          <Button>Back to Jobs</Button>
        </Link>
      </div>
    );
  }

  const latestScore = job.scores[0];
  const latestKit = job.applicationKits[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link href="/jobs">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{job.title}</h1>
            <p className="text-lg text-muted-foreground">{job.company}</p>
            <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
              {job.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {job.location}
                </span>
              )}
              {job.salary && (
                <span className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  {job.salary}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Briefcase className="h-4 w-4" />
                {job.jobType.replace('_', ' ')}
              </span>
              {job.sourceUrl && (
                <a
                  href={job.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-primary"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Original
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="icon">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this job?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this job and all associated data including scores,
                  application kits, and pipeline tracking.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="kit">Application Kit</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Score Breakdown */}
              {latestScore && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Match Score</CardTitle>
                      <Button variant="outline" size="sm" onClick={handleRescore} disabled={rescoring}>
                        {rescoring ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                        <span className="ml-2">Rescore</span>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-6">
                      <div
                        className={`flex h-24 w-24 items-center justify-center rounded-full text-white font-bold text-3xl ${getScoreBgColor(
                          latestScore.overallScore
                        )}`}
                      >
                        {latestScore.overallScore}
                      </div>
                      <div className="flex-1 space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Skills</span>
                            <span className={getScoreColor(latestScore.skillsScore)}>
                              {latestScore.skillsScore}%
                            </span>
                          </div>
                          <Progress value={latestScore.skillsScore} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Location</span>
                            <span className={getScoreColor(latestScore.locationScore)}>
                              {latestScore.locationScore}%
                            </span>
                          </div>
                          <Progress value={latestScore.locationScore} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Salary</span>
                            <span className={getScoreColor(latestScore.salaryScore)}>
                              {latestScore.salaryScore}%
                            </span>
                          </div>
                          <Progress value={latestScore.salaryScore} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Seniority</span>
                            <span className={getScoreColor(latestScore.seniorityScore)}>
                              {latestScore.seniorityScore}%
                            </span>
                          </div>
                          <Progress value={latestScore.seniorityScore} className="h-2" />
                        </div>
                      </div>
                    </div>

                    {/* Skills Match */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <h4 className="font-medium text-sm mb-2 text-green-600 flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          Matched Skills ({latestScore.matchedSkills.length})
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {latestScore.matchedSkills.map((skill) => (
                            <Badge key={skill} variant="outline" className="text-green-600 border-green-200">
                              {skill}
                            </Badge>
                          ))}
                          {latestScore.matchedSkills.length === 0 && (
                            <span className="text-sm text-muted-foreground">None detected</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm mb-2 text-amber-600 flex items-center gap-1">
                          <XCircle className="h-4 w-4" />
                          Missing Skills ({latestScore.missingSkills.length})
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {latestScore.missingSkills.map((skill) => (
                            <Badge key={skill} variant="outline" className="text-amber-600 border-amber-200">
                              {skill}
                            </Badge>
                          ))}
                          {latestScore.missingSkills.length === 0 && (
                            <span className="text-sm text-muted-foreground">None detected</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle>Job Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm">{job.description}</p>
                </CardContent>
              </Card>

              {/* Requirements */}
              {job.requirements.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Requirements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {job.requirements.map((req, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-muted-foreground">•</span>
                          {req}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="kit" className="space-y-6">
              {!latestKit ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Application Kit Yet</h3>
                    <p className="text-muted-foreground text-center max-w-md mb-6">
                      Generate a personalized cover letter, resume tweaks, and interview
                      preparation materials tailored to this job.
                    </p>
                    <Button onClick={handleGenerateKit} disabled={generatingKit}>
                      {generatingKit ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="mr-2 h-4 w-4" />
                      )}
                      Generate Application Kit
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="flex justify-end">
                    <Button onClick={handleGenerateKit} disabled={generatingKit} variant="outline">
                      {generatingKit ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="mr-2 h-4 w-4" />
                      )}
                      Generate New Kit
                    </Button>
                  </div>

                  {/* Cover Letter */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Cover Letter</CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(latestKit.coverLetter, 'Cover letter')}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copy
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap text-sm">{latestKit.coverLetter}</p>
                    </CardContent>
                  </Card>

                  {/* Resume Tweaks */}
                  {latestKit.resumeTweaks.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Resume Tweaks</CardTitle>
                        <CardDescription>
                          Suggestions to tailor your resume for this position
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {latestKit.resumeTweaks.map((tweak, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <span className="text-primary">→</span>
                              {tweak}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Interview Tips */}
                  {latestKit.interviewTips.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Interview Preparation</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {latestKit.interviewTips.map((tip, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <span className="text-primary">💡</span>
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Sample Questions */}
                  {latestKit.questions.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Sample Interview Questions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-3">
                          {latestKit.questions.map((question, i) => (
                            <li key={i} className="text-sm p-3 bg-muted rounded-lg">
                              <span className="font-medium">Q{i + 1}:</span> {question}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              {/* Score History */}
              <Card>
                <CardHeader>
                  <CardTitle>Score History</CardTitle>
                </CardHeader>
                <CardContent>
                  {job.scores.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No scores yet</p>
                  ) : (
                    <div className="space-y-3">
                      {job.scores.map((score) => (
                        <div
                          key={score.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold ${getScoreBgColor(
                                score.overallScore
                              )}`}
                            >
                              {score.overallScore}
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                Profile v{score.profileVersion}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(score.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Skills: {score.skillsScore}% | Location: {score.locationScore}%
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Feedback History */}
              {job.feedback.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Feedback History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {job.feedback.map((fb) => (
                        <div key={fb.id} className="flex items-center gap-3 p-3 border rounded-lg">
                          <Badge variant={fb.outcome === 'ACCEPTED' ? 'default' : 'secondary'}>
                            {fb.outcome}
                          </Badge>
                          <span className="text-sm">Primary factor: {fb.primaryFactor}</span>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {new Date(fb.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pipeline Status */}
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Status</CardTitle>
            </CardHeader>
            <CardContent>
              {!job.pipelineItem ? (
                <Button onClick={handleAddToPipeline} disabled={addingToPipeline} className="w-full">
                  {addingToPipeline ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Add to Pipeline
                </Button>
              ) : (
                <div className="space-y-4">
                  <Select
                    value={job.pipelineItem.stage}
                    onValueChange={handleUpdateStage}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SAVED">Saved</SelectItem>
                      <SelectItem value="APPLYING">Applying</SelectItem>
                      <SelectItem value="APPLIED">Applied</SelectItem>
                      <SelectItem value="INTERVIEWING">Interviewing</SelectItem>
                      <SelectItem value="OFFER">Offer</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                      <SelectItem value="WITHDRAWN">Withdrawn</SelectItem>
                    </SelectContent>
                  </Select>

                  {job.pipelineItem.appliedAt && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Applied: {new Date(job.pipelineItem.appliedAt).toLocaleDateString()}
                    </div>
                  )}

                  {job.pipelineItem.reminderAt && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Reminder: {new Date(job.pipelineItem.reminderAt).toLocaleDateString()}
                    </div>
                  )}

                  <Link href="/pipeline">
                    <Button variant="outline" className="w-full">
                      View Pipeline
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {job.sourceUrl && (
                <a href={job.sourceUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full justify-start">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Original Posting
                  </Button>
                </a>
              )}
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleGenerateKit}
                disabled={generatingKit}
              >
                {generatingKit ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Generate Application Kit
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleRescore}
                disabled={rescoring}
              >
                {rescoring ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Recalculate Score
              </Button>
            </CardContent>
          </Card>

          {/* Job Info */}
          <Card>
            <CardHeader>
              <CardTitle>Job Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Added</span>
                <span>{new Date(job.createdAt).toLocaleDateString()}</span>
              </div>
              {job.postedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Posted</span>
                  <span>{new Date(job.postedAt).toLocaleDateString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span>{job.jobType.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kits Generated</span>
                <span>{job.applicationKits.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
