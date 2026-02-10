import { requireOnboarding } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { getQuotaStatus } from '@/lib/quota';
import { getSubscriptionStatus } from '@/lib/session';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Briefcase, Target, TrendingUp, Sparkles, Plus, ArrowRight, 
  ArrowUpRight, Zap
} from 'lucide-react';
import Link from 'next/link';
import { formatRelativeDate, getScoreColor } from '@/lib/utils';
import { PipelineStage } from '@prisma/client';

const stageColors: Record<string, string> = {
  SAVED: 'bg-slate-100 text-slate-700',
  APPLIED: 'bg-blue-50 text-blue-700',
  SCREENING: 'bg-purple-50 text-purple-700',
  INTERVIEWING: 'bg-amber-50 text-amber-700',
  OFFER: 'bg-emerald-50 text-emerald-700',
  ACCEPTED: 'bg-green-50 text-green-700',
  REJECTED: 'bg-red-50 text-red-700',
  WITHDRAWN: 'bg-slate-50 text-slate-500',
};

export default async function DashboardPage() {
  const user = await requireOnboarding();
  const subscriptionStatus = getSubscriptionStatus(user);
  
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

  const totalJobs = await prisma.job.count({ where: { userId: user.id, archived: false } });
  const appliedCount = pipelineStats.find(s => s.stage === PipelineStage.APPLIED)?._count.id || 0;
  const interviewCount = pipelineStats.find(s => s.stage === PipelineStage.INTERVIEWING)?._count.id || 0;
  const avgScore = recentJobs.length > 0
    ? Math.round(recentJobs.reduce((sum, job) => sum + (job.jobScores[0]?.overallScore || 0), 0) / recentJobs.length)
    : 0;
  
  const aiUsagePercent = quotaStatus.aiGenerations.limit === Infinity 
    ? 0 
    : (quotaStatus.aiGenerations.used / quotaStatus.aiGenerations.limit) * 100;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user.name?.split(' ')[0] || user.email.split('@')[0]}
          </h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s how your job search is going.
          </p>
        </div>
        <Link href="/jobs/new">
          <Button className="gradient-primary text-white rounded-xl shadow-lg shadow-violet-500/20 hover:opacity-90 transition-opacity h-11 px-5">
            <Plus className="mr-2 h-4 w-4" />
            Add Job
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-fade-in">
        {/* Total Jobs */}
        <Card className="relative overflow-hidden border-slate-200/60 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-500/5 transition-all duration-300">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-violet-100/50 to-transparent rounded-bl-[40px]" />
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-violet-600" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold tracking-tight">{totalJobs}</p>
            <p className="text-sm text-muted-foreground mt-1">Total Jobs</p>
            <p className="text-xs text-violet-600 mt-2 font-medium">
              {quotaStatus.jobs.limit === Infinity 
                ? 'Unlimited' 
                : `${quotaStatus.jobs.remaining} remaining`}
            </p>
          </CardContent>
        </Card>
        
        {/* Applications */}
        <Card className="relative overflow-hidden border-slate-200/60 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-blue-100/50 to-transparent rounded-bl-[40px]" />
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold tracking-tight">{appliedCount}</p>
            <p className="text-sm text-muted-foreground mt-1">Applications</p>
            <p className="text-xs text-blue-600 mt-2 font-medium">
              {interviewCount} interview{interviewCount !== 1 ? 's' : ''} scheduled
            </p>
          </CardContent>
        </Card>
        
        {/* Avg Match Score */}
        <Card className="relative overflow-hidden border-slate-200/60 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-emerald-100/50 to-transparent rounded-bl-[40px]" />
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className={`text-3xl font-bold tracking-tight ${getScoreColor(avgScore)}`}>
              {avgScore}%
            </p>
            <p className="text-sm text-muted-foreground mt-1">Avg Match Score</p>
            <p className="text-xs text-emerald-600 mt-2 font-medium">Across tracked jobs</p>
          </CardContent>
        </Card>
        
        {/* AI Generations */}
        <Card className="relative overflow-hidden border-slate-200/60 hover:border-amber-200 hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-amber-100/50 to-transparent rounded-bl-[40px]" />
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-amber-600" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold tracking-tight">
              {quotaStatus.aiGenerations.used}
              <span className="text-base font-normal text-muted-foreground">/{quotaStatus.aiGenerations.limit}</span>
            </p>
            <p className="text-sm text-muted-foreground mt-1">AI Generations</p>
            <Progress 
              value={aiUsagePercent} 
              className="mt-3 h-1.5 bg-amber-100 [&>div]:bg-amber-500"
            />
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Jobs */}
        <Card className="border-slate-200/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Recent Jobs</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">Your latest tracked positions</p>
              </div>
              <Link href="/jobs">
                <Button variant="ghost" size="sm" className="text-violet-600 hover:text-violet-700 hover:bg-violet-50 rounded-lg">
                  View all <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentJobs.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-3">
                  <Briefcase className="h-7 w-7 text-violet-400" />
                </div>
                <p className="text-sm font-medium">No jobs tracked yet</p>
                <p className="text-xs text-muted-foreground mt-1">Add your first job to get started</p>
                <Link href="/jobs/new">
                  <Button variant="outline" size="sm" className="mt-4 rounded-lg">
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Add your first job
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentJobs.map((job) => {
                  const score = job.jobScores[0]?.overallScore || 0;
                  const stage = job.pipelineItem?.stage || 'SAVED';
                  return (
                    <Link 
                      key={job.id} 
                      href={`/jobs/${job.id}`}
                      className="group flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-50 transition-all duration-200"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate group-hover:text-violet-700 transition-colors">{job.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{job.company}</p>
                      </div>
                      <div className="flex items-center gap-2.5 ml-4">
                        <span className={`text-[11px] px-2.5 py-1 rounded-lg font-medium ${stageColors[stage] || stageColors.SAVED}`}>
                          {stage.toLowerCase().replace('_', ' ')}
                        </span>
                        <span className={`text-sm font-bold ${getScoreColor(score)}`}>
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
        <Card className="border-slate-200/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">Latest pipeline updates</p>
              </div>
              <Link href="/pipeline">
                <Button variant="ghost" size="sm" className="text-violet-600 hover:text-violet-700 hover:bg-violet-50 rounded-lg">
                  Pipeline <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-3">
                  <Zap className="h-7 w-7 text-violet-400" />
                </div>
                <p className="text-sm font-medium">No activity yet</p>
                <p className="text-xs text-muted-foreground mt-1">Activity appears as you track jobs</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentActivity.map((item) => {
                  const stage = item.stage;
                  return (
                    <div key={item.id} className="flex items-start gap-3 p-3.5 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                        stage === 'OFFER' || stage === 'ACCEPTED' ? 'bg-emerald-500' :
                        stage === 'INTERVIEWING' ? 'bg-amber-500' :
                        stage === 'APPLIED' ? 'bg-blue-500' :
                        stage === 'REJECTED' ? 'bg-red-400' :
                        'bg-violet-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {item.job.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.job.company} &middot; moved to <span className="font-medium">{stage.toLowerCase().replace('_', ' ')}</span>
                        </p>
                        <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                          {formatRelativeDate(item.updatedAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Overview */}
      <Card className="border-slate-200/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Pipeline Overview</CardTitle>
          <p className="text-sm text-muted-foreground mt-0.5">Jobs across each stage</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {Object.values(PipelineStage).map((stage) => {
              const count = pipelineStats.find(s => s.stage === stage)?._count.id || 0;
              const colorClass = stageColors[stage] || stageColors.SAVED;
              return (
                <div key={stage} className={`text-center p-4 rounded-xl ${colorClass} bg-opacity-50`}>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-[11px] font-medium mt-1 capitalize opacity-80">
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
