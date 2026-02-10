import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import Link from 'next/link';
import { 
  Briefcase, Target, Sparkles, BarChart3, ArrowRight, 
  CheckCircle2, Zap, Shield, ChevronRight 
} from 'lucide-react';

export default async function Home() {
  const session = await getSession();
  if (session?.user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="fixed top-0 w-full z-50 glass border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Briefcase className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">JobPilot</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link 
              href="/login" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-4 py-2"
            >
              Sign in
            </Link>
            <Link 
              href="/register" 
              className="text-sm font-medium gradient-primary text-white px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-violet-500/25"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-violet-100/60 via-purple-50/30 to-transparent rounded-full blur-3xl" />
          <div className="absolute top-40 left-20 w-72 h-72 bg-violet-200/20 rounded-full blur-3xl" />
          <div className="absolute top-60 right-20 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-violet-200 bg-violet-50 text-violet-700 text-sm font-medium mb-8">
              <Sparkles className="h-4 w-4" />
              AI-Powered Job Search Assistant
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6">
              Land your dream job{' '}
              <span className="text-gradient">faster</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Track applications, get instant match scores, and generate tailored cover letters 
              and interview prep — all powered by AI.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/register" 
                className="group inline-flex items-center gap-2 gradient-primary text-white font-semibold px-8 py-4 rounded-2xl text-lg hover:opacity-90 transition-all shadow-xl shadow-violet-500/25 hover:shadow-violet-500/40"
              >
                Start for Free
                <ArrowRight className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link 
                href="/login" 
                className="inline-flex items-center gap-2 font-medium text-muted-foreground hover:text-foreground px-6 py-4 transition-colors"
              >
                I have an account
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-20 max-w-5xl mx-auto">
            <div className="relative rounded-2xl border border-slate-200/60 shadow-2xl shadow-violet-500/10 overflow-hidden bg-white">
              <div className="flex items-center gap-2 px-4 py-3 border-b bg-slate-50/80">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white border text-xs text-muted-foreground">
                    <Shield className="h-3 w-3" /> app.jobpilot.io/dashboard
                  </div>
                </div>
              </div>
              <div className="p-6 grid grid-cols-4 gap-4">
                {[
                  { label: 'Jobs Tracked', value: '24', color: 'text-violet-600' },
                  { label: 'Applied', value: '12', color: 'text-blue-600' },
                  { label: 'Interviews', value: '5', color: 'text-emerald-600' },
                  { label: 'Avg Match', value: '87%', color: 'text-amber-600' },
                ].map((stat) => (
                  <div key={stat.label} className="text-center p-4 rounded-xl bg-slate-50">
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
              <div className="px-6 pb-6 space-y-3">
                {[
                  { title: 'Senior Frontend Engineer', company: 'Stripe', score: 94, stage: 'Interview' },
                  { title: 'Full Stack Developer', company: 'Vercel', score: 88, stage: 'Applied' },
                  { title: 'React Developer', company: 'Linear', score: 82, stage: 'Saved' },
                ].map((job) => (
                  <div key={job.title} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white hover:border-violet-200 transition-colors">
                    <div>
                      <p className="font-semibold text-sm">{job.title}</p>
                      <p className="text-xs text-muted-foreground">{job.company}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 font-medium">{job.stage}</span>
                      <span className="text-sm font-bold text-emerald-600">{job.score}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Everything you need to <span className="text-gradient">win</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From tracking jobs to acing interviews — JobPilot handles it all.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-fade-in">
            {[
              {
                icon: Target,
                title: 'Smart Match Scores',
                desc: 'Instantly see how well you match each job based on your skills, experience, and preferences.',
                color: 'from-violet-500 to-purple-500',
              },
              {
                icon: Sparkles,
                title: 'AI Cover Letters',
                desc: 'Generate tailored cover letters and resume bullets powered by Claude AI — not generic templates.',
                color: 'from-blue-500 to-cyan-500',
              },
              {
                icon: BarChart3,
                title: 'Pipeline Tracker',
                desc: 'Kanban-style board to track every job from saved to offer. Never lose track of an application.',
                color: 'from-emerald-500 to-teal-500',
              },
              {
                icon: Zap,
                title: 'Interview Prep',
                desc: 'AI-generated Q&A prep based on the actual job description and your background.',
                color: 'from-amber-500 to-orange-500',
              },
              {
                icon: BarChart3,
                title: 'Analytics Dashboard',
                desc: 'Track your application rate, response rate, and which job types you match best.',
                color: 'from-pink-500 to-rose-500',
              },
              {
                icon: Shield,
                title: 'Privacy First',
                desc: 'Your data is yours. We never auto-apply or share your information with third parties.',
                color: 'from-slate-500 to-slate-700',
              },
            ].map((feature) => (
              <div key={feature.title} className="group relative p-6 rounded-2xl border border-slate-200/60 bg-white hover:border-violet-200 hover:shadow-lg hover:shadow-violet-500/5 transition-all duration-300">
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.color} mb-4`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Ready to land your next role?
          </h2>
          <p className="text-lg text-muted-foreground mb-10">
            Join thousands of job seekers who track smarter, apply better, and get hired faster.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16">
            {['Free forever plan', 'No credit card needed', 'Set up in 2 minutes'].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                {item}
              </div>
            ))}
          </div>

          <Link 
            href="/register" 
            className="group inline-flex items-center gap-2 gradient-primary text-white font-semibold px-10 py-5 rounded-2xl text-lg hover:opacity-90 transition-all shadow-xl shadow-violet-500/25 hover:shadow-violet-500/40"
          >
            Get Started — It&apos;s Free
            <ArrowRight className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
              <Briefcase className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold">JobPilot</span>
          </div>
          <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} JobPilot. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
