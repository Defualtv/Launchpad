'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Briefcase,
  TrendingUp,
  Target,
  Award,
  BarChart3,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

interface AnalyticsData {
  period: string;
  overview: {
    totalJobs: number;
    jobsThisPeriod: number;
    avgScore: string;
    kitsGenerated: number;
  };
  pipeline: {
    byStage: Record<string, number>;
    responseRate: string;
    interviewRate: string;
    offerRate: string;
  };
  scores: {
    distribution: Record<string, number>;
  };
  feedback: {
    byOutcome: Record<string, number>;
  };
  skills: {
    topMatched: Array<{ skill: string; matched: number; missing: number }>;
    topMissing: Array<{ skill: string; matched: number; missing: number }>;
  };
  usage: {
    aiGenerations: {
      used: number;
      resetAt: string | null;
    };
  };
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  async function fetchAnalytics() {
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics?period=${period}`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!data) {
    return <div>Failed to load analytics</div>;
  }

  const totalPipeline = Object.values(data.pipeline.byStage).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Track your job search progress and performance
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Last 7 days</SelectItem>
            <SelectItem value="month">Last 30 days</SelectItem>
            <SelectItem value="3months">Last 3 months</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.totalJobs}</div>
            <p className="text-xs text-muted-foreground">
              +{data.overview.jobsThisPeriod} this period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.avgScore}%</div>
            <p className="text-xs text-muted-foreground">
              Match quality across all jobs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.pipeline.responseRate}%</div>
            <p className="text-xs text-muted-foreground">
              Interview rate: {data.pipeline.interviewRate}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Kits Generated</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.kitsGenerated}</div>
            <p className="text-xs text-muted-foreground">
              AI used: {data.usage.aiGenerations.used}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Pipeline Breakdown</CardTitle>
            <CardDescription>
              Distribution of jobs across pipeline stages
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: 'SAVED', label: 'Saved', color: 'bg-slate-500' },
              { key: 'APPLYING', label: 'Applying', color: 'bg-blue-500' },
              { key: 'APPLIED', label: 'Applied', color: 'bg-purple-500' },
              { key: 'INTERVIEWING', label: 'Interviewing', color: 'bg-amber-500' },
              { key: 'OFFER', label: 'Offer', color: 'bg-green-500' },
              { key: 'REJECTED', label: 'Rejected', color: 'bg-red-500' },
              { key: 'WITHDRAWN', label: 'Withdrawn', color: 'bg-gray-500' },
            ].map(({ key, label, color }) => {
              const count = data.pipeline.byStage[key] || 0;
              const percentage = totalPipeline > 0 ? (count / totalPipeline) * 100 : 0;

              return (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{label}</span>
                    <span className="text-muted-foreground">{count}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${color} transition-all`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Score Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Score Distribution</CardTitle>
            <CardDescription>
              How your jobs score against your profile
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: '90-100', label: 'Excellent (90-100)', color: 'bg-green-500' },
              { key: '80-89', label: 'Great (80-89)', color: 'bg-green-400' },
              { key: '70-79', label: 'Good (70-79)', color: 'bg-yellow-500' },
              { key: '60-69', label: 'Fair (60-69)', color: 'bg-yellow-400' },
              { key: 'below-60', label: 'Below 60', color: 'bg-red-500' },
            ].map(({ key, label, color }) => {
              const count = data.scores.distribution[key] || 0;
              const total = Object.values(data.scores.distribution).reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? (count / total) * 100 : 0;

              return (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{label}</span>
                    <span className="text-muted-foreground">{count} jobs</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${color} transition-all`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Top Matched Skills */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Top Matched Skills
            </CardTitle>
            <CardDescription>
              Skills that appear most often in jobs you&apos;re interested in
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.skills.topMatched.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No skill matches yet. Add more jobs to see patterns.
              </p>
            ) : (
              <div className="space-y-3">
                {data.skills.topMatched.map((skill) => (
                  <div key={skill.skill} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{skill.skill}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        {skill.matched} matches
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Skills to Learn */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-amber-500" />
              Skills to Learn
            </CardTitle>
            <CardDescription>
              Skills frequently required in jobs but missing from your profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.skills.topMissing.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Great job! No frequently missing skills detected.
              </p>
            ) : (
              <div className="space-y-3">
                {data.skills.topMissing.map((skill) => (
                  <div key={skill.skill} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{skill.skill}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-amber-600 border-amber-200">
                        Missing {skill.missing}x
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Feedback Outcomes */}
      {Object.keys(data.feedback.byOutcome).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Feedback Summary</CardTitle>
            <CardDescription>
              Outcomes from your applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { key: 'ACCEPTED', label: 'Accepted', icon: CheckCircle, color: 'text-green-500' },
                { key: 'REJECTED', label: 'Rejected', icon: XCircle, color: 'text-red-500' },
                { key: 'GHOSTED', label: 'No Response', icon: Clock, color: 'text-gray-500' },
                { key: 'WITHDRAWN', label: 'Withdrawn', icon: Award, color: 'text-blue-500' },
              ].map(({ key, label, icon: Icon, color }) => {
                const count = data.feedback.byOutcome[key] || 0;
                return (
                  <div key={key} className="text-center p-4 rounded-lg bg-muted/50">
                    <Icon className={`h-8 w-8 mx-auto mb-2 ${color}`} />
                    <div className="text-2xl font-bold">{count}</div>
                    <div className="text-sm text-muted-foreground">{label}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
          <CardDescription>
            Track your progress through the application process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            {[
              { label: 'Saved', count: data.pipeline.byStage['SAVED'] || 0 },
              { label: 'Applied', count: data.pipeline.byStage['APPLIED'] || 0 },
              { label: 'Interviewing', count: data.pipeline.byStage['INTERVIEWING'] || 0 },
              { label: 'Offers', count: data.pipeline.byStage['OFFER'] || 0 },
            ].map((step, index, arr) => (
              <div key={step.label} className="flex-1 text-center">
                <div className="text-3xl font-bold">{step.count}</div>
                <div className="text-sm text-muted-foreground mb-2">{step.label}</div>
                {index < arr.length - 1 && arr[index].count > 0 && (
                  <div className="text-xs text-muted-foreground">
                    →{' '}
                    {arr[index + 1].count > 0
                      ? Math.round((arr[index + 1].count / arr[index].count) * 100)
                      : 0}
                    %
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
