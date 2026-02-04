'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LayoutGrid,
  List,
  Briefcase,
  MapPin,
  GripVertical,
  Clock,
  ExternalLink,
} from 'lucide-react';

interface PipelineItem {
  id: string;
  jobId: string;
  stage: string;
  priority: number;
  notes: string | null;
  appliedAt: string | null;
  reminderAt: string | null;
  updatedAt: string;
  job: {
    id: string;
    title: string;
    company: string;
    location: string | null;
    salary?: string | null;
    score: number | null;
  };
  contactCount?: number;
}

type PipelineStage = 'SAVED' | 'APPLYING' | 'APPLIED' | 'INTERVIEWING' | 'OFFER' | 'REJECTED' | 'WITHDRAWN';

const STAGE_LABELS: Record<PipelineStage, string> = {
  SAVED: 'Saved',
  APPLYING: 'Applying',
  APPLIED: 'Applied',
  INTERVIEWING: 'Interviewing',
  OFFER: 'Offer',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
};

const STAGE_COLORS: Record<PipelineStage, string> = {
  SAVED: 'bg-slate-100 border-slate-300',
  APPLYING: 'bg-blue-50 border-blue-300',
  APPLIED: 'bg-purple-50 border-purple-300',
  INTERVIEWING: 'bg-amber-50 border-amber-300',
  OFFER: 'bg-green-50 border-green-300',
  REJECTED: 'bg-red-50 border-red-300',
  WITHDRAWN: 'bg-gray-50 border-gray-300',
};

function getScoreColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  return 'bg-red-500';
}

export default function PipelinePage() {
  const { toast } = useToast();
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [loading, setLoading] = useState(true);
  const [kanban, setKanban] = useState<Record<PipelineStage, PipelineItem[]> | null>(null);
  const [listItems, setListItems] = useState<PipelineItem[]>([]);

  useEffect(() => {
    fetchPipeline();
  }, [view]);

  async function fetchPipeline() {
    setLoading(true);
    try {
      const response = await fetch(`/api/pipeline?view=${view}`);
      const data = await response.json();
      if (data.success) {
        if (view === 'kanban') {
          setKanban(data.data.kanban);
        } else {
          setListItems(data.data.items);
        }
      }
    } catch (error) {
      console.error('Failed to fetch pipeline:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleStageChange(itemId: string, newStage: string) {
    try {
      const response = await fetch('/api/pipeline', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: itemId, stage: newStage }),
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: `Moved to ${STAGE_LABELS[newStage as PipelineStage]}` });
        fetchPipeline();
      }
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive' });
    }
  }

  const stages: PipelineStage[] = ['SAVED', 'APPLYING', 'APPLIED', 'INTERVIEWING', 'OFFER', 'REJECTED', 'WITHDRAWN'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pipeline</h1>
          <p className="text-muted-foreground">
            Track your job applications through each stage
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={view === 'kanban' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('kanban')}
          >
            <LayoutGrid className="h-4 w-4 mr-1" />
            Kanban
          </Button>
          <Button
            variant={view === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('list')}
          >
            <List className="h-4 w-4 mr-1" />
            List
          </Button>
        </div>
      </div>

      {/* Kanban View */}
      {view === 'kanban' && (
        <div className="overflow-x-auto pb-4">
          {loading ? (
            <div className="flex gap-4">
              {stages.slice(0, 5).map((stage) => (
                <div key={stage} className="w-72 shrink-0">
                  <Skeleton className="h-8 mb-3" />
                  <Skeleton className="h-32" />
                  <Skeleton className="h-32 mt-3" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex gap-4">
              {stages.map((stage) => (
                <div key={stage} className="w-72 shrink-0">
                  <div
                    className={`rounded-lg border-2 ${STAGE_COLORS[stage]} p-3 mb-3`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{STAGE_LABELS[stage]}</h3>
                      <Badge variant="secondary">
                        {kanban?.[stage]?.length || 0}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-3 min-h-[200px]">
                    {kanban?.[stage]?.map((item) => (
                      <Card
                        key={item.id}
                        className="cursor-pointer hover:border-primary/50 transition-colors"
                      >
                        <CardContent className="p-4">
                          <Link href={`/jobs/${item.jobId}`}>
                            <div className="flex items-start gap-3">
                              {item.job.score !== null && (
                                <div
                                  className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-white text-xs font-bold ${getScoreColor(
                                    item.job.score
                                  )}`}
                                >
                                  {item.job.score}
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <h4 className="font-medium text-sm truncate">
                                  {item.job.title}
                                </h4>
                                <p className="text-xs text-muted-foreground truncate">
                                  {item.job.company}
                                </p>
                                {item.job.location && (
                                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {item.job.location}
                                  </p>
                                )}
                              </div>
                            </div>
                          </Link>

                          {item.reminderAt && (
                            <div className="mt-2 pt-2 border-t text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(item.reminderAt).toLocaleDateString()}
                            </div>
                          )}

                          {/* Quick stage change */}
                          <div className="mt-2 pt-2 border-t">
                            <Select
                              value={stage}
                              onValueChange={(v) => handleStageChange(item.id, v)}
                            >
                              <SelectTrigger className="h-7 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {stages.map((s) => (
                                  <SelectItem key={s} value={s}>
                                    {STAGE_LABELS[s]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {(!kanban?.[stage] || kanban[stage].length === 0) && (
                      <div className="h-32 border-2 border-dashed rounded-lg flex items-center justify-center text-sm text-muted-foreground">
                        No jobs in {STAGE_LABELS[stage].toLowerCase()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : listItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No jobs in pipeline</h3>
                <p className="text-muted-foreground mb-4">
                  Add jobs to your pipeline to track their progress
                </p>
                <Link href="/jobs">
                  <Button>Browse Jobs</Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y">
                {listItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 hover:bg-muted/50"
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />

                    {item.job.score !== null && (
                      <div
                        className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-white font-bold ${getScoreColor(
                          item.job.score
                        )}`}
                      >
                        {item.job.score}
                      </div>
                    )}

                    <Link href={`/jobs/${item.jobId}`} className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium truncate">{item.job.title}</h4>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span>{item.job.company}</span>
                        {item.job.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {item.job.location}
                          </span>
                        )}
                        {item.job.salary && <span>{item.job.salary}</span>}
                      </div>
                    </Link>

                    <div className="flex items-center gap-3 shrink-0">
                      <Badge variant="secondary">
                        {STAGE_LABELS[item.stage as PipelineStage]}
                      </Badge>

                      {item.appliedAt && (
                        <span className="text-xs text-muted-foreground">
                          Applied {new Date(item.appliedAt).toLocaleDateString()}
                        </span>
                      )}

                      <Select
                        value={item.stage}
                        onValueChange={(v) => handleStageChange(item.id, v)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {stages.map((s) => (
                            <SelectItem key={s} value={s}>
                              {STAGE_LABELS[s]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Link href={`/jobs/${item.jobId}`}>
                        <Button variant="ghost" size="icon">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pipeline Summary */}
      {!loading && kanban && (
        <Card>
          <CardHeader>
            <CardTitle>Pipeline Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {stages.map((stage) => {
                const count = kanban[stage]?.length || 0;
                const total = Object.values(kanban).flat().length;
                const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

                return (
                  <div key={stage} className="text-center">
                    <div className="text-2xl font-bold">{count}</div>
                    <div className="text-sm text-muted-foreground">
                      {STAGE_LABELS[stage]}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {percentage}%
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
