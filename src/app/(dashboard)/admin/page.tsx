import { requireOnboarding } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Briefcase, 
  FileText, 
  TrendingUp,
  Clock,
  Mail,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { redirect } from 'next/navigation';

// Admin email whitelist - in production, use a proper role system
const ADMIN_EMAILS = ['demo@jobagent.com', 'admin@jobcircle.com'];

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function AdminPage() {
  const user = await requireOnboarding();
  
  // Check if user is admin
  if (!ADMIN_EMAILS.includes(user.email || '')) {
    redirect('/dashboard');
  }

  // Fetch admin stats
  const [
    totalUsers,
    totalJobs,
    totalDocuments,
    recentUsers,
    subscriptionStats,
    pipelineStats,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.job.count(),
    prisma.document.count(),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        subscription: true,
        _count: {
          select: {
            jobs: true,
            documents: true,
          },
        },
      },
    }),
    prisma.subscription.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
    prisma.pipelineItem.groupBy({
      by: ['stage'],
      _count: { id: true },
    }),
  ]);

  // Calculate stats
  const proUsers = subscriptionStats.find(s => s.status === 'PRO')?._count.id || 0;
  const powerUsers = subscriptionStats.find(s => s.status === 'POWER')?._count.id || 0;
  const paidUsers = proUsers + powerUsers;

  const appliedJobs = pipelineStats.find(s => s.stage === 'APPLIED')?._count.id || 0;
  const interviewingJobs = pipelineStats.find(s => s.stage === 'INTERVIEWING')?._count.id || 0;
  const offerJobs = pipelineStats.find(s => s.stage === 'OFFER')?._count.id || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Platform overview and user management
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {paidUsers} paid subscribers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalJobs}</div>
            <p className="text-xs text-muted-foreground">
              {appliedJobs} applied, {interviewingJobs} interviewing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDocuments}</div>
            <p className="text-xs text-muted-foreground">
              CVs and cover letters
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {appliedJobs > 0 ? Math.round((offerJobs / appliedJobs) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {offerJobs} offers from {appliedJobs} applications
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Breakdown</CardTitle>
          <CardDescription>Users by plan type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {subscriptionStats.map((stat) => (
              <div key={stat.status} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium capitalize">{stat.status.toLowerCase()}</p>
                  <p className="text-2xl font-bold">{stat._count.id}</p>
                </div>
                <Badge variant={stat.status === 'FREE' ? 'secondary' : stat.status === 'POWER' ? 'default' : 'outline'}>
                  {stat.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Users */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Users</CardTitle>
          <CardDescription>Latest user registrations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-medium">User</th>
                  <th className="text-left py-3 px-2 font-medium">Status</th>
                  <th className="text-left py-3 px-2 font-medium">Plan</th>
                  <th className="text-left py-3 px-2 font-medium">Jobs</th>
                  <th className="text-left py-3 px-2 font-medium">Docs</th>
                  <th className="text-left py-3 px-2 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((user) => (
                  <tr key={user.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-3 px-2">
                      <div>
                        <p className="font-medium">{user.name || 'Unnamed'}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      {user.onboardingComplete ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Clock className="mr-1 h-3 w-3" />
                          Onboarding
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      <Badge variant={user.subscription?.status === 'FREE' ? 'outline' : 'default'}>
                        {user.subscription?.status || 'FREE'}
                      </Badge>
                    </td>
                    <td className="py-3 px-2">
                      {user._count.jobs}
                    </td>
                    <td className="py-3 px-2">
                      {user._count.documents}
                    </td>
                    <td className="py-3 px-2 text-sm text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pipeline Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Overview</CardTitle>
          <CardDescription>Jobs by pipeline stage across all users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7">
            {pipelineStats.map((stat) => (
              <div key={stat.stage} className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold">{stat._count.id}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {stat.stage.toLowerCase().replace('_', ' ')}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
