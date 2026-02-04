'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Briefcase, User, Target, Check, Loader2, ArrowLeft, ArrowRight } from 'lucide-react';

const steps = [
  { id: 1, title: 'Basic Info', icon: User },
  { id: 2, title: 'Experience', icon: Briefcase },
  { id: 3, title: 'Goals', icon: Target },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { update } = useSession();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    headline: '',
    location: '',
    remotePreference: 'HYBRID',
    summary: '',
    targetRole: '',
    targetSeniority: '',
    salaryMin: '',
    salaryMax: '',
    skills: '',
  });

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      // Create profile
      const profileRes = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headline: formData.headline || undefined,
          location: formData.location || undefined,
          remotePreference: formData.remotePreference,
          summary: formData.summary || undefined,
          targetRole: formData.targetRole || undefined,
          targetSeniority: formData.targetSeniority || null,
          salaryMin: formData.salaryMin ? parseInt(formData.salaryMin) : null,
          salaryMax: formData.salaryMax ? parseInt(formData.salaryMax) : null,
        }),
      });

      if (!profileRes.ok) {
        const data = await profileRes.json();
        throw new Error(data.error?.message || 'Failed to save profile');
      }

      // Add skills if provided
      if (formData.skills) {
        const skillsList = formData.skills.split(',').map(s => s.trim()).filter(Boolean);
        for (const skillName of skillsList) {
          await fetch('/api/profile/skills', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: skillName }),
          });
        }
      }

      // Mark onboarding complete
      await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      // Update session
      await update({ onboardingComplete: true });

      // Redirect to dashboard
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                    currentStep >= step.id 
                      ? 'bg-primary border-primary text-primary-foreground' 
                      : 'border-muted-foreground/30 text-muted-foreground'
                  }`}>
                    {currentStep > step.id ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-0.5 mx-2 transition-colors ${
                      currentStep > step.id ? 'bg-primary' : 'bg-muted-foreground/30'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
          <CardTitle className="text-center text-2xl">
            {currentStep === 1 && 'Tell us about yourself'}
            {currentStep === 2 && 'Your background'}
            {currentStep === 3 && 'Your goals'}
          </CardTitle>
          <CardDescription className="text-center">
            {currentStep === 1 && 'Basic information for your profile'}
            {currentStep === 2 && 'Share your experience and skills'}
            {currentStep === 3 && 'What are you looking for?'}
          </CardDescription>
          <Progress value={(currentStep / 3) * 100} className="mt-4" />
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
              {error}
            </div>
          )}

          {currentStep === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="headline">Professional Headline</Label>
                <Input
                  id="headline"
                  placeholder="e.g., Full Stack Developer | React & Node.js"
                  value={formData.headline}
                  onChange={(e) => updateFormData('headline', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., San Francisco, CA"
                  value={formData.location}
                  onChange={(e) => updateFormData('location', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="remotePreference">Remote Preference</Label>
                <Select
                  value={formData.remotePreference}
                  onValueChange={(value) => updateFormData('remotePreference', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REMOTE">Remote only</SelectItem>
                    <SelectItem value="HYBRID">Hybrid</SelectItem>
                    <SelectItem value="ONSITE">On-site</SelectItem>
                    <SelectItem value="ANY">Flexible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="summary">Professional Summary</Label>
                <Textarea
                  id="summary"
                  placeholder="Brief description of your background and expertise..."
                  value={formData.summary}
                  onChange={(e) => updateFormData('summary', e.target.value)}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="skills">Skills (comma-separated)</Label>
                <Textarea
                  id="skills"
                  placeholder="e.g., JavaScript, React, Node.js, PostgreSQL, AWS"
                  value={formData.skills}
                  onChange={(e) => updateFormData('skills', e.target.value)}
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  List your key technical and professional skills
                </p>
              </div>
            </>
          )}

          {currentStep === 3 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="targetRole">Target Role</Label>
                <Input
                  id="targetRole"
                  placeholder="e.g., Senior Software Engineer"
                  value={formData.targetRole}
                  onChange={(e) => updateFormData('targetRole', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetSeniority">Target Seniority</Label>
                <Select
                  value={formData.targetSeniority}
                  onValueChange={(value) => updateFormData('targetSeniority', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INTERN">Intern</SelectItem>
                    <SelectItem value="JUNIOR">Junior</SelectItem>
                    <SelectItem value="MID">Mid-level</SelectItem>
                    <SelectItem value="SENIOR">Senior</SelectItem>
                    <SelectItem value="LEAD">Lead</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="DIRECTOR">Director</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salaryMin">Min Salary (USD)</Label>
                  <Input
                    id="salaryMin"
                    type="number"
                    placeholder="e.g., 100000"
                    value={formData.salaryMin}
                    onChange={(e) => updateFormData('salaryMin', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salaryMax">Max Salary (USD)</Label>
                  <Input
                    id="salaryMax"
                    type="number"
                    placeholder="e.g., 150000"
                    value={formData.salaryMax}
                    onChange={(e) => updateFormData('salaryMax', e.target.value)}
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          {currentStep < 3 ? (
            <Button onClick={handleNext}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Complete Setup
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
