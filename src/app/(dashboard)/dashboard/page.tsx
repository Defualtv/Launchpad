import { requireOnboarding } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { getQuotaStatus } from '@/lib/quota';
import { getSubscriptionStatus } from '@/lib/session';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Briefcase, Target, TrendingUp, Calendar, Plus, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { formatRelativeDate, getScoreColor } from '@/lib/utils';
import { PipelineStage } from '@prisma/client';

export default async function DashboardPage() {
  const user = await requireOnboarding();
  const subscriptionStatus = getSubscriptionStatus(user);
  
  // Fetch dashboard data
  const [quotaStatus, recentJobs, pipelineStats, recentActivity] = await Promise.all([
    getQuotaStatus(user.id, subscriptionStatus),
    prisma.job.findMany({
      where: { userId: user.id, archived: false },
      include: {
        pipelineItem: true,
        jobScores: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.pipelineItem.groupBy({
      by: ['stage'],
      where: { userId: user.id },
      _count: { id: true },
    }),
    prisma.pipelineItem.findMany({
      where: { userId: user.id },
      include: { job: true },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    }),
  ]);

  // Calculate stats
  const totalJobs = await prisma.job.count({ where: { userId: user.id, archived: false } });
  const appliedCount = pipelineStats.find(s => s.stage === PipelineStage.APPLIED)?._count.id || 0;
  const interviewCount = pipelineStats.find(s => s.stage === PipelineStage.INTERVIEWING)?._count.id || 0;
  const avgScore = recentJobs.length > 0
    ? Math.round(recentJobs.reduce((sum, job) => sum + (job.jobScores[0]?.score || 0), 0) / recentJobs.length)
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user.name || user.email.split('@')[0]}!
          </p>
        </div>
        <Link href="/jobs/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Job
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalJobs}</div>
            <p className="text-xs text-muted-foreground">
              {quotaStatus.jobs.limit === Infinity 
                ? 'Unlimited' 
                : `${quotaStatus.jobs.remaining} remaining`}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applications</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appliedCount}</div>
            <p className="text-xs text-muted-foreground">
              {interviewCount} interviews scheduled
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Match Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(avgScore)}`}>
              {avgScore}%
            </div>
            <p className="text-xs text-muted-foreground">
              Across tracked jobs
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Generations</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quotaStatus.aiGenerations.used}/{quotaStatus.aiGenerations.limit}
            </div>
            <Progress 
              value={(quotaStatus.aiGenerations.used / quotaStatus.aiGenerations.limit) * 100} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Jobs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Jobs</CardTitle>
                <CardDescription>Your latest tracked positions</CardDescription>
              </div>
              <Link href="/jobs">
                <Button variant="ghost" size="sm">
                  View all <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentJobs.length === 0 ? (
              <div className="text-center py-8">
                <Briefcase className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">No jobs tracked yet</p>
                <Link href="/jobs/new">
                  <Button variant="outline" size="sm" className="mt-4">
                    Add your first job
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentJobs.map((job) => {
                  const score = job.jobScores[0]?.score || 0;
                  return (
                    <Link 
                      key={job.id} 
                      href={`/jobs/${job.id}`}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{job.title}</p>
                        <p className="text-sm text-muted-foreground truncate">{job.company}</p>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <Badge variant={job.pipelineItem?.stage === 'APPLIED' ? 'success' : 'secondary'}>
                          {job.pipelineItem?.stage.toLowerCase() || 'saved'}
                        </Badge>
                        <span className={`text-sm font-medium ${getScoreColor(score)}`}>
                          {score}%
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pipeline Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest pipeline updates</CardDescription>
              </div>
              <Link href="/pipeline">
                <Button variant="ghost" size="sm">
                  View pipeline <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <Target className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">No activity yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.job.title} at {item.job.company}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Moved to {item.stage.toLowerCase()} • {formatRelativeDate(item.updatedAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Overview</CardTitle>
          <CardDescription>Jobs by stage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {Object.values(PipelineStage).map((stage) => {
              const count = pipelineStats.find(s => s.stage === stage)?._count.id || 0;
              return (
                <div key={stage} className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {stage.toLowerCase().replace('_', ' ')}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
