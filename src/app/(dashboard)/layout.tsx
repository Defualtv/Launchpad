import { Sidebar } from '@/components/layout/sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50/30">
      <Sidebar />
      <main className="md:pl-64 transition-all duration-300">
        <div className="p-4 md:p-8 pt-16 md:pt-8 max-w-[1600px]">
          {children}
        </div>
      </main>
    </div>
  );
}
