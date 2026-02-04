'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Briefcase,
  GraduationCap,
  Code,
  Plus,
  Trash2,
  Loader2,
  Save,
  MapPin,
  DollarSign,
} from 'lucide-react';

interface Profile {
  id: string;
  headline: string | null;
  summary: string | null;
  desiredTitle: string | null;
  desiredLocation: string | null;
  remotePreference: string | null;
  minSalary: number | null;
  maxSalary: number | null;
  targetSeniority: string | null;
  skills: Array<{
    id: string;
    name: string;
    level: string;
    yearsExp: number | null;
  }>;
  experiences: Array<{
    id: string;
    company: string;
    title: string;
    location: string | null;
    description: string | null;
    startDate: string;
    endDate: string | null;
    current: boolean;
  }>;
  educations: Array<{
    id: string;
    institution: string;
    degree: string;
    field: string | null;
    graduationYear: number | null;
    gpa: number | null;
  }>;
}

export default function ProfilePage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState({
    headline: '',
    summary: '',
    desiredTitle: '',
    desiredLocation: '',
    remotePreference: 'FLEXIBLE',
    minSalary: '',
    maxSalary: '',
    targetSeniority: '',
  });

  // New skill form
  const [newSkill, setNewSkill] = useState({ name: '', level: 'INTERMEDIATE', yearsExp: '' });
  const [addingSkill, setAddingSkill] = useState(false);

  // New experience form
  const [newExperience, setNewExperience] = useState({
    company: '',
    title: '',
    location: '',
    description: '',
    startDate: '',
    endDate: '',
    current: false,
  });
  const [addingExperience, setAddingExperience] = useState(false);

  // New education form
  const [newEducation, setNewEducation] = useState({
    institution: '',
    degree: '',
    field: '',
    graduationYear: '',
  });
  const [addingEducation, setAddingEducation] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const response = await fetch('/api/profile');
      const data = await response.json();
      if (data.success && data.data.profile) {
        setProfile(data.data.profile);
        setFormData({
          headline: data.data.profile.headline || '',
          summary: data.data.profile.summary || '',
          desiredTitle: data.data.profile.desiredTitle || '',
          desiredLocation: data.data.profile.desiredLocation || '',
          remotePreference: data.data.profile.remotePreference || 'FLEXIBLE',
          minSalary: data.data.profile.minSalary?.toString() || '',
          maxSalary: data.data.profile.maxSalary?.toString() || '',
          targetSeniority: data.data.profile.targetSeniority || '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProfile() {
    setSaving(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          minSalary: formData.minSalary ? parseInt(formData.minSalary) : null,
          maxSalary: formData.maxSalary ? parseInt(formData.maxSalary) : null,
        }),
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: 'Profile updated!' });
        fetchProfile();
      }
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  async function handleAddSkill() {
    if (!newSkill.name) return;
    setAddingSkill(true);
    try {
      const response = await fetch('/api/profile/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSkill.name,
          level: newSkill.level,
          yearsExp: newSkill.yearsExp ? parseInt(newSkill.yearsExp) : null,
        }),
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: 'Skill added!' });
        setNewSkill({ name: '', level: 'INTERMEDIATE', yearsExp: '' });
        fetchProfile();
      }
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive' });
    } finally {
      setAddingSkill(false);
    }
  }

  async function handleDeleteSkill(skillId: string) {
    try {
      const response = await fetch(`/api/profile/skills?id=${skillId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: 'Skill removed' });
        fetchProfile();
      }
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive' });
    }
  }

  async function handleAddExperience() {
    if (!newExperience.company || !newExperience.title || !newExperience.startDate) return;
    setAddingExperience(true);
    try {
      const response = await fetch('/api/profile/experiences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExperience),
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: 'Experience added!' });
        setNewExperience({
          company: '',
          title: '',
          location: '',
          description: '',
          startDate: '',
          endDate: '',
          current: false,
        });
        fetchProfile();
      }
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive' });
    } finally {
      setAddingExperience(false);
    }
  }

  async function handleDeleteExperience(expId: string) {
    try {
      const response = await fetch(`/api/profile/experiences?id=${expId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: 'Experience removed' });
        fetchProfile();
      }
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive' });
    }
  }

  async function handleAddEducation() {
    if (!newEducation.institution || !newEducation.degree) return;
    setAddingEducation(true);
    try {
      const response = await fetch('/api/profile/educations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newEducation,
          graduationYear: newEducation.graduationYear
            ? parseInt(newEducation.graduationYear)
            : null,
        }),
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: 'Education added!' });
        setNewEducation({
          institution: '',
          degree: '',
          field: '',
          graduationYear: '',
        });
        fetchProfile();
      }
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive' });
    } finally {
      setAddingEducation(false);
    }
  }

  async function handleDeleteEducation(eduId: string) {
    try {
      const response = await fetch(`/api/profile/educations?id=${eduId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: 'Education removed' });
        fetchProfile();
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
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">
          Manage your profile to improve job match accuracy
        </p>
      </div>

      <Tabs defaultValue="basics">
        <TabsList>
          <TabsTrigger value="basics">
            <User className="h-4 w-4 mr-2" />
            Basics
          </TabsTrigger>
          <TabsTrigger value="skills">
            <Code className="h-4 w-4 mr-2" />
            Skills
          </TabsTrigger>
          <TabsTrigger value="experience">
            <Briefcase className="h-4 w-4 mr-2" />
            Experience
          </TabsTrigger>
          <TabsTrigger value="education">
            <GraduationCap className="h-4 w-4 mr-2" />
            Education
          </TabsTrigger>
        </TabsList>

        {/* Basics Tab */}
        <TabsContent value="basics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Your professional headline and summary
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="headline">Professional Headline</Label>
                <Input
                  id="headline"
                  placeholder="e.g., Senior Software Engineer | Full Stack Developer"
                  value={formData.headline}
                  onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="summary">Summary</Label>
                <Textarea
                  id="summary"
                  placeholder="Brief summary of your professional background..."
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Job Preferences</CardTitle>
              <CardDescription>
                What you&apos;re looking for in your next role
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="desiredTitle">Desired Job Title</Label>
                  <Input
                    id="desiredTitle"
                    placeholder="e.g., Software Engineer"
                    value={formData.desiredTitle}
                    onChange={(e) => setFormData({ ...formData, desiredTitle: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desiredLocation">Preferred Location</Label>
                  <Input
                    id="desiredLocation"
                    placeholder="e.g., San Francisco, CA"
                    value={formData.desiredLocation}
                    onChange={(e) => setFormData({ ...formData, desiredLocation: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Remote Preference</Label>
                  <Select
                    value={formData.remotePreference}
                    onValueChange={(v) => setFormData({ ...formData, remotePreference: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="REMOTE">Remote Only</SelectItem>
                      <SelectItem value="ONSITE">On-site Only</SelectItem>
                      <SelectItem value="HYBRID">Hybrid</SelectItem>
                      <SelectItem value="FLEXIBLE">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Target Seniority</Label>
                  <Select
                    value={formData.targetSeniority}
                    onValueChange={(v) => setFormData({ ...formData, targetSeniority: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INTERN">Intern</SelectItem>
                      <SelectItem value="ENTRY">Entry Level</SelectItem>
                      <SelectItem value="MID">Mid Level</SelectItem>
                      <SelectItem value="SENIOR">Senior</SelectItem>
                      <SelectItem value="LEAD">Lead</SelectItem>
                      <SelectItem value="PRINCIPAL">Principal</SelectItem>
                      <SelectItem value="EXECUTIVE">Executive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minSalary">Minimum Salary ($)</Label>
                  <Input
                    id="minSalary"
                    type="number"
                    placeholder="e.g., 100000"
                    value={formData.minSalary}
                    onChange={(e) => setFormData({ ...formData, minSalary: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxSalary">Maximum Salary ($)</Label>
                  <Input
                    id="maxSalary"
                    type="number"
                    placeholder="e.g., 150000"
                    value={formData.maxSalary}
                    onChange={(e) => setFormData({ ...formData, maxSalary: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveProfile} disabled={saving}>
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Skills Tab */}
        <TabsContent value="skills" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Skills</CardTitle>
              <CardDescription>
                Add skills to improve job matching accuracy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing Skills */}
              <div className="flex flex-wrap gap-2">
                {profile?.skills.map((skill) => (
                  <Badge
                    key={skill.id}
                    variant="secondary"
                    className="py-2 px-3 text-sm flex items-center gap-2"
                  >
                    {skill.name}
                    <span className="text-xs text-muted-foreground">
                      ({skill.level.toLowerCase()})
                    </span>
                    <button
                      onClick={() => handleDeleteSkill(skill.id)}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
                {(!profile?.skills || profile.skills.length === 0) && (
                  <p className="text-sm text-muted-foreground">No skills added yet</p>
                )}
              </div>

              {/* Add Skill Form */}
              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-3">Add New Skill</h4>
                <div className="flex gap-3">
                  <Input
                    placeholder="Skill name (e.g., React)"
                    value={newSkill.name}
                    onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                    className="flex-1"
                  />
                  <Select
                    value={newSkill.level}
                    onValueChange={(v) => setNewSkill({ ...newSkill, level: v })}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BEGINNER">Beginner</SelectItem>
                      <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                      <SelectItem value="ADVANCED">Advanced</SelectItem>
                      <SelectItem value="EXPERT">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="Years"
                    value={newSkill.yearsExp}
                    onChange={(e) => setNewSkill({ ...newSkill, yearsExp: e.target.value })}
                    className="w-24"
                  />
                  <Button onClick={handleAddSkill} disabled={addingSkill || !newSkill.name}>
                    {addingSkill ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Experience Tab */}
        <TabsContent value="experience" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Work Experience</CardTitle>
              <CardDescription>
                Add your work history
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing Experiences */}
              {profile?.experiences.map((exp) => (
                <div key={exp.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{exp.title}</h4>
                      <p className="text-muted-foreground">{exp.company}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(exp.startDate).toLocaleDateString()} -{' '}
                        {exp.current ? 'Present' : exp.endDate ? new Date(exp.endDate).toLocaleDateString() : 'N/A'}
                      </p>
                      {exp.location && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {exp.location}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteExperience(exp.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  {exp.description && (
                    <p className="text-sm mt-2">{exp.description}</p>
                  )}
                </div>
              ))}

              {(!profile?.experiences || profile.experiences.length === 0) && (
                <p className="text-sm text-muted-foreground">No experiences added yet</p>
              )}

              {/* Add Experience Form */}
              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-3">Add New Experience</h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="Company"
                      value={newExperience.company}
                      onChange={(e) => setNewExperience({ ...newExperience, company: e.target.value })}
                    />
                    <Input
                      placeholder="Job Title"
                      value={newExperience.title}
                      onChange={(e) => setNewExperience({ ...newExperience, title: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <Input
                      placeholder="Location"
                      value={newExperience.location}
                      onChange={(e) => setNewExperience({ ...newExperience, location: e.target.value })}
                    />
                    <Input
                      type="date"
                      placeholder="Start Date"
                      value={newExperience.startDate}
                      onChange={(e) => setNewExperience({ ...newExperience, startDate: e.target.value })}
                    />
                    <Input
                      type="date"
                      placeholder="End Date"
                      value={newExperience.endDate}
                      onChange={(e) => setNewExperience({ ...newExperience, endDate: e.target.value })}
                      disabled={newExperience.current}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="current"
                      checked={newExperience.current}
                      onChange={(e) => setNewExperience({ ...newExperience, current: e.target.checked })}
                    />
                    <Label htmlFor="current">Currently working here</Label>
                  </div>
                  <Textarea
                    placeholder="Description"
                    value={newExperience.description}
                    onChange={(e) => setNewExperience({ ...newExperience, description: e.target.value })}
                    rows={2}
                  />
                  <Button onClick={handleAddExperience} disabled={addingExperience}>
                    {addingExperience ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="mr-2 h-4 w-4" />
                    )}
                    Add Experience
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Education Tab */}
        <TabsContent value="education" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Education</CardTitle>
              <CardDescription>
                Add your educational background
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing Education */}
              {profile?.educations.map((edu) => (
                <div key={edu.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{edu.degree}</h4>
                      <p className="text-muted-foreground">{edu.institution}</p>
                      {edu.field && <p className="text-sm">{edu.field}</p>}
                      {edu.graduationYear && (
                        <p className="text-sm text-muted-foreground">
                          Class of {edu.graduationYear}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteEducation(edu.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}

              {(!profile?.educations || profile.educations.length === 0) && (
                <p className="text-sm text-muted-foreground">No education added yet</p>
              )}

              {/* Add Education Form */}
              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-3">Add New Education</h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="Institution"
                      value={newEducation.institution}
                      onChange={(e) => setNewEducation({ ...newEducation, institution: e.target.value })}
                    />
                    <Input
                      placeholder="Degree (e.g., Bachelor's)"
                      value={newEducation.degree}
                      onChange={(e) => setNewEducation({ ...newEducation, degree: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="Field of Study"
                      value={newEducation.field}
                      onChange={(e) => setNewEducation({ ...newEducation, field: e.target.value })}
                    />
                    <Input
                      type="number"
                      placeholder="Graduation Year"
                      value={newEducation.graduationYear}
                      onChange={(e) => setNewEducation({ ...newEducation, graduationYear: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleAddEducation} disabled={addingEducation}>
                    {addingEducation ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="mr-2 h-4 w-4" />
                    )}
                    Add Education
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


