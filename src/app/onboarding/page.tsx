'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Briefcase, User, Target, Check, Loader2, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';

const steps = [
  { id: 1, title: 'Basic Info', icon: User, desc: 'Tell us about yourself' },
  { id: 2, title: 'Experience', icon: Briefcase, desc: 'Your skills & background' },
  { id: 3, title: 'Goals', icon: Target, desc: 'What you\'re looking for' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { update } = useSession();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
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

      await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      await update({ onboardingComplete: true });
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — steps */}
      <div className="hidden lg:flex lg:w-[340px] relative overflow-hidden gradient-hero">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-60" />
        
        <div className="relative z-10 flex flex-col justify-between p-10 text-white w-full">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Briefcase className="h-5 w-5" />
            </div>
            <span className="font-bold text-xl">JobPilot</span>
          </div>

          <div className="space-y-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    currentStep > step.id 
                      ? 'bg-emerald-400 text-white' 
                      : currentStep === step.id 
                        ? 'bg-white text-violet-600' 
                        : 'bg-white/10 text-white/50'
                  }`}>
                    {currentStep > step.id ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-0.5 h-12 my-1.5 rounded-full transition-colors ${
                      currentStep > step.id ? 'bg-emerald-400' : 'bg-white/20'
                    }`} />
                  )}
                </div>
                <div className="pt-2">
                  <p className={`font-semibold text-sm ${currentStep === step.id ? 'text-white' : 'text-white/60'}`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-white/40 mt-0.5">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 text-white/40 text-xs">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Step {currentStep} of 3</span>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-lg animate-fade-in">
          {/* Mobile logo + steps */}
          <div className="lg:hidden mb-8">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-violet-500/25">
                <Briefcase className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl">JobPilot</span>
            </div>
            {/* Mobile step indicators */}
            <div className="flex items-center gap-2">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center flex-1">
                  <div className={`h-1.5 flex-1 rounded-full transition-colors ${
                    currentStep >= step.id ? 'gradient-primary' : 'bg-slate-100'
                  }`} />
                  {index < steps.length - 1 && <div className="w-1" />}
                </div>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight">
              {currentStep === 1 && 'Tell us about yourself'}
              {currentStep === 2 && 'Your background'}
              {currentStep === 3 && 'Your goals'}
            </h2>
            <p className="text-muted-foreground mt-1.5">
              {currentStep === 1 && 'Basic information to personalize your experience'}
              {currentStep === 2 && 'Help us match you with the right jobs'}
              {currentStep === 3 && 'What does your ideal next role look like?'}
            </p>
          </div>

          {error && (
            <div className="p-3.5 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl mb-6">
              {error}
            </div>
          )}

          <div className="space-y-5">
            {currentStep === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="headline" className="text-sm font-medium">Professional Headline</Label>
                  <Input
                    id="headline"
                    placeholder="e.g., Full Stack Developer | React & Node.js"
                    value={formData.headline}
                    onChange={(e) => updateFormData('headline', e.target.value)}
                    className="h-11 rounded-xl border-slate-200 focus:border-violet-400 focus:ring-violet-400/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-sm font-medium">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g., San Francisco, CA"
                    value={formData.location}
                    onChange={(e) => updateFormData('location', e.target.value)}
                    className="h-11 rounded-xl border-slate-200 focus:border-violet-400 focus:ring-violet-400/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="remotePreference" className="text-sm font-medium">Work Preference</Label>
                  <Select
                    value={formData.remotePreference}
                    onValueChange={(value) => updateFormData('remotePreference', value)}
                  >
                    <SelectTrigger className="h-11 rounded-xl border-slate-200">
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
                  <Label htmlFor="summary" className="text-sm font-medium">Professional Summary</Label>
                  <Textarea
                    id="summary"
                    placeholder="Brief description of your background and expertise..."
                    value={formData.summary}
                    onChange={(e) => updateFormData('summary', e.target.value)}
                    rows={4}
                    className="rounded-xl border-slate-200 focus:border-violet-400 focus:ring-violet-400/20 resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="skills" className="text-sm font-medium">Skills</Label>
                  <Textarea
                    id="skills"
                    placeholder="e.g., JavaScript, React, Node.js, PostgreSQL, AWS"
                    value={formData.skills}
                    onChange={(e) => updateFormData('skills', e.target.value)}
                    rows={2}
                    className="rounded-xl border-slate-200 focus:border-violet-400 focus:ring-violet-400/20 resize-none"
                  />
                  <p className="text-xs text-muted-foreground">Separate skills with commas</p>
                </div>
              </>
            )}

            {currentStep === 3 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="targetRole" className="text-sm font-medium">Target Role</Label>
                  <Input
                    id="targetRole"
                    placeholder="e.g., Senior Software Engineer"
                    value={formData.targetRole}
                    onChange={(e) => updateFormData('targetRole', e.target.value)}
                    className="h-11 rounded-xl border-slate-200 focus:border-violet-400 focus:ring-violet-400/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetSeniority" className="text-sm font-medium">Seniority Level</Label>
                  <Select
                    value={formData.targetSeniority}
                    onValueChange={(value) => updateFormData('targetSeniority', value)}
                  >
                    <SelectTrigger className="h-11 rounded-xl border-slate-200">
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
                    <Label htmlFor="salaryMin" className="text-sm font-medium">Min Salary (USD)</Label>
                    <Input
                      id="salaryMin"
                      type="number"
                      placeholder="100,000"
                      value={formData.salaryMin}
                      onChange={(e) => updateFormData('salaryMin', e.target.value)}
                      className="h-11 rounded-xl border-slate-200 focus:border-violet-400 focus:ring-violet-400/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salaryMax" className="text-sm font-medium">Max Salary (USD)</Label>
                    <Input
                      id="salaryMax"
                      type="number"
                      placeholder="150,000"
                      value={formData.salaryMax}
                      onChange={(e) => updateFormData('salaryMax', e.target.value)}
                      className="h-11 rounded-xl border-slate-200 focus:border-violet-400 focus:ring-violet-400/20"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-10">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="rounded-xl text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            
            {currentStep < 3 ? (
              <Button 
                onClick={handleNext}
                className="gradient-primary text-white rounded-xl shadow-lg shadow-violet-500/20 hover:opacity-90 transition-opacity px-6"
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={loading}
                className="gradient-primary text-white rounded-xl shadow-lg shadow-violet-500/20 hover:opacity-90 transition-opacity px-6"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Complete Setup
                <Sparkles className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
