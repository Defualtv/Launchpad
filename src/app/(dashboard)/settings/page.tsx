'use client';

import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
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
  User,
  Mail,
  CreditCard,
  Shield,
  Sliders,
  Loader2,
  ExternalLink,
  AlertTriangle,
  Check,
} from 'lucide-react';

interface Settings {
  user: {
    id: string;
    name: string;
    email: string;
    createdAt: string;
  };
  emailPreferences: {
    reminders: boolean;
    weeklySummary: boolean;
    productUpdates: boolean;
  };
  safetySettings: {
    autoApplyEnabled: boolean;
    requireConfirmation: boolean;
    dataRetentionDays: number;
  };
  scoringWeights: {
    skillsWeight: number;
    locationWeight: number;
    salaryWeight: number;
    seniorityWeight: number;
  } | null;
}

interface BillingData {
  subscription: {
    id: string;
    planId: string;
    status: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  } | null;
  currentPlan: {
    id: string;
    name: string;
    price: number;
    limits: any;
  };
  usage: {
    jobs: number;
    aiGenerations: number;
  };
  plans: Array<{
    id: string;
    name: string;
    price: number;
    limits: any;
    features: string[];
    stripePriceId: string | null;
  }>;
}

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [billing, setBilling] = useState<BillingData | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [emailPrefs, setEmailPrefs] = useState({
    reminders: true,
    weeklySummary: true,
    productUpdates: true,
  });
  const [safetySettings, setSafetySettings] = useState({
    requireConfirmation: true,
    dataRetentionDays: 365,
  });
  const [weights, setWeights] = useState({
    skillsWeight: 0.35,
    locationWeight: 0.25,
    salaryWeight: 0.25,
    seniorityWeight: 0.15,
  });

  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  useEffect(() => {
    fetchSettings();
    fetchBilling();
  }, []);

  async function fetchSettings() {
    try {
      const response = await fetch('/api/user/settings');
      const data = await response.json();
      if (data.success) {
        setSettings(data.data);
        setName(data.data.user.name || '');
        setEmailPrefs(data.data.emailPreferences);
        setSafetySettings({
          requireConfirmation: data.data.safetySettings.requireConfirmation,
          dataRetentionDays: data.data.safetySettings.dataRetentionDays,
        });
      }

      // Fetch weights separately
      const weightsRes = await fetch('/api/user/weights');
      const weightsData = await weightsRes.json();
      if (weightsData.success) {
        setWeights(weightsData.data.weights);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchBilling() {
    try {
      const response = await fetch('/api/billing');
      const data = await response.json();
      if (data.success) {
        setBilling(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch billing:', error);
    }
  }

  async function handleSaveSettings() {
    setSaving(true);
    try {
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          emailPreferences: emailPrefs,
          safetySettings,
        }),
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: 'Settings saved!' });
      }
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveWeights() {
    setSaving(true);
    try {
      const response = await fetch('/api/user/weights', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(weights),
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: 'Scoring weights updated!' });
      } else {
        throw new Error(data.error?.message);
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  async function handleResetWeights() {
    try {
      const response = await fetch('/api/user/weights', { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        setWeights({
          skillsWeight: 0.35,
          locationWeight: 0.25,
          salaryWeight: 0.25,
          seniorityWeight: 0.15,
        });
        toast({ title: 'Weights reset to defaults!' });
      }
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive' });
    }
  }

  async function handleUpgrade(planId: string) {
    try {
      const response = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'checkout', planId }),
      });
      const data = await response.json();
      if (data.success && data.data.url) {
        window.location.href = data.data.url;
      }
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive' });
    }
  }

  async function handleManageSubscription() {
    try {
      const response = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'portal' }),
      });
      const data = await response.json();
      if (data.success && data.data.url) {
        window.location.href = data.data.url;
      }
    } catch (error) {
      toast({ title: 'Error', description: 'No active subscription', variant: 'destructive' });
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirmation !== 'DELETE MY ACCOUNT') {
      toast({ title: 'Please type the confirmation text exactly', variant: 'destructive' });
      return;
    }

    try {
      const response = await fetch('/api/user/settings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: deleteConfirmation }),
      });
      const data = await response.json();
      if (data.success) {
        await signOut({ callbackUrl: '/' });
      }
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive' });
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and preferences
        </p>
      </div>

      <Tabs defaultValue="account">
        <TabsList>
          <TabsTrigger value="account">
            <User className="h-4 w-4 mr-2" />
            Account
          </TabsTrigger>
          <TabsTrigger value="billing">
            <CreditCard className="h-4 w-4 mr-2" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Mail className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="scoring">
            <Sliders className="h-4 w-4 mr-2" />
            Scoring
          </TabsTrigger>
          <TabsTrigger value="safety">
            <Shield className="h-4 w-4 mr-2" />
            Safety
          </TabsTrigger>
        </TabsList>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={settings?.user.email || ''}
                  disabled
                />
                <p className="text-xs text-muted-foreground">
                  Contact support to change your email address
                </p>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveSettings} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible actions that affect your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Delete Account</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your account
                      and remove all your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="py-4">
                    <Label>Type &quot;DELETE MY ACCOUNT&quot; to confirm:</Label>
                    <Input
                      value={deleteConfirmation}
                      onChange={(e) => setDeleteConfirmation(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-destructive text-destructive-foreground"
                    >
                      Delete Account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>
                Your subscription and usage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <h3 className="font-semibold text-lg">{billing?.currentPlan.name}</h3>
                  <p className="text-muted-foreground">
                    {billing?.currentPlan.price === 0
                      ? 'Free'
                      : `$${billing?.currentPlan.price}/month`}
                  </p>
                </div>
                {billing?.subscription && (
                  <Button variant="outline" onClick={handleManageSubscription}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Manage
                  </Button>
                )}
              </div>

              {billing?.subscription?.cancelAtPeriodEnd && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-800 rounded-lg">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm">
                    Your subscription will end on{' '}
                    {new Date(billing.subscription.currentPeriodEnd).toLocaleDateString()}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Jobs Tracked</p>
                  <p className="text-2xl font-bold">{billing?.usage.jobs}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">AI Generations Used</p>
                  <p className="text-2xl font-bold">{billing?.usage.aiGenerations}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Available Plans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {billing?.plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`border rounded-lg p-4 ${
                      billing.currentPlan.id === plan.id ? 'border-primary bg-primary/5' : ''
                    }`}
                  >
                    <h3 className="font-semibold">{plan.name}</h3>
                    <p className="text-2xl font-bold mb-4">
                      {plan.price === 0 ? 'Free' : `$${plan.price}`}
                      {plan.price > 0 && <span className="text-sm font-normal">/mo</span>}
                    </p>
                    <ul className="space-y-2 text-sm mb-4">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    {billing.currentPlan.id === plan.id ? (
                      <Button disabled className="w-full">Current Plan</Button>
                    ) : plan.price > 0 ? (
                      <Button className="w-full" onClick={() => handleUpgrade(plan.id)}>
                        Upgrade
                      </Button>
                    ) : (
                      <Button variant="outline" className="w-full" disabled>
                        Downgrade
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>
                Choose what emails you&apos;d like to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Application Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Get reminded about upcoming deadlines and follow-ups
                  </p>
                </div>
                <Switch
                  checked={emailPrefs.reminders}
                  onCheckedChange={(v) => setEmailPrefs({ ...emailPrefs, reminders: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Weekly Summary</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive a weekly summary of your job search progress
                  </p>
                </div>
                <Switch
                  checked={emailPrefs.weeklySummary}
                  onCheckedChange={(v) => setEmailPrefs({ ...emailPrefs, weeklySummary: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Product Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Stay informed about new features and improvements
                  </p>
                </div>
                <Switch
                  checked={emailPrefs.productUpdates}
                  onCheckedChange={(v) => setEmailPrefs({ ...emailPrefs, productUpdates: v })}
                />
              </div>
              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveSettings} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scoring Tab */}
        <TabsContent value="scoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Scoring Weights</CardTitle>
              <CardDescription>
                Customize how different factors affect your match scores.
                Weights must sum to 100%.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Skills Match</Label>
                    <span>{Math.round(weights.skillsWeight * 100)}%</span>
                  </div>
                  <Slider
                    value={[weights.skillsWeight * 100]}
                    onValueChange={([v]) => {
                      const remaining = 1 - v / 100;
                      const others = weights.locationWeight + weights.salaryWeight + weights.seniorityWeight;
                      if (others > 0) {
                        const scale = remaining / others;
                        setWeights({
                          skillsWeight: v / 100,
                          locationWeight: weights.locationWeight * scale,
                          salaryWeight: weights.salaryWeight * scale,
                          seniorityWeight: weights.seniorityWeight * scale,
                        });
                      }
                    }}
                    max={100}
                    step={5}
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Location Match</Label>
                    <span>{Math.round(weights.locationWeight * 100)}%</span>
                  </div>
                  <Slider
                    value={[weights.locationWeight * 100]}
                    onValueChange={([v]) => {
                      const remaining = 1 - v / 100;
                      const others = weights.skillsWeight + weights.salaryWeight + weights.seniorityWeight;
                      if (others > 0) {
                        const scale = remaining / others;
                        setWeights({
                          skillsWeight: weights.skillsWeight * scale,
                          locationWeight: v / 100,
                          salaryWeight: weights.salaryWeight * scale,
                          seniorityWeight: weights.seniorityWeight * scale,
                        });
                      }
                    }}
                    max={100}
                    step={5}
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Salary Match</Label>
                    <span>{Math.round(weights.salaryWeight * 100)}%</span>
                  </div>
                  <Slider
                    value={[weights.salaryWeight * 100]}
                    onValueChange={([v]) => {
                      const remaining = 1 - v / 100;
                      const others = weights.skillsWeight + weights.locationWeight + weights.seniorityWeight;
                      if (others > 0) {
                        const scale = remaining / others;
                        setWeights({
                          skillsWeight: weights.skillsWeight * scale,
                          locationWeight: weights.locationWeight * scale,
                          salaryWeight: v / 100,
                          seniorityWeight: weights.seniorityWeight * scale,
                        });
                      }
                    }}
                    max={100}
                    step={5}
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Seniority Match</Label>
                    <span>{Math.round(weights.seniorityWeight * 100)}%</span>
                  </div>
                  <Slider
                    value={[weights.seniorityWeight * 100]}
                    onValueChange={([v]) => {
                      const remaining = 1 - v / 100;
                      const others = weights.skillsWeight + weights.locationWeight + weights.salaryWeight;
                      if (others > 0) {
                        const scale = remaining / others;
                        setWeights({
                          skillsWeight: weights.skillsWeight * scale,
                          locationWeight: weights.locationWeight * scale,
                          salaryWeight: weights.salaryWeight * scale,
                          seniorityWeight: v / 100,
                        });
                      }
                    }}
                    max={100}
                    step={5}
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t">
                <Button variant="outline" onClick={handleResetWeights}>
                  Reset to Defaults
                </Button>
                <Button onClick={handleSaveWeights} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Weights
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Safety Tab */}
        <TabsContent value="safety" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Safety Settings</CardTitle>
              <CardDescription>
                Control how Job Agent handles your data and applications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800 mb-2">
                  <Shield className="h-5 w-5" />
                  <strong>Your Safety is Guaranteed</strong>
                </div>
                <p className="text-sm text-green-700">
                  Job Agent will <strong>NEVER</strong> automatically apply to jobs on your behalf.
                  You are always in complete control of your applications. We provide tools to help
                  you apply more effectively, but the final action is always yours.
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Require Confirmation</Label>
                  <p className="text-sm text-muted-foreground">
                    Always ask before performing important actions
                  </p>
                </div>
                <Switch
                  checked={safetySettings.requireConfirmation}
                  onCheckedChange={(v) =>
                    setSafetySettings({ ...safetySettings, requireConfirmation: v })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Data Retention</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  How long to keep your job tracking data (30-730 days)
                </p>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[safetySettings.dataRetentionDays]}
                    onValueChange={([v]) =>
                      setSafetySettings({ ...safetySettings, dataRetentionDays: v })
                    }
                    min={30}
                    max={730}
                    step={30}
                    className="flex-1"
                  />
                  <span className="w-24 text-sm">
                    {safetySettings.dataRetentionDays} days
                  </span>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveSettings} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
