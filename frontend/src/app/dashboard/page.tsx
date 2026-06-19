'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Video, 
  BarChart3, 
  LogOut, 
  Plus, 
  ChevronRight,
  TrendingUp,
  Clock,
  Award
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useDashboardStore } from '@/store/useDashboardStore';

export default function Dashboard() {
  const { user, logout } = useAuthStore();
  const { stats, fetchDashboardData, loading, error } = useDashboardStore();
  const router = useRouter();

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading && !stats) {
    return (
      <div className="flex h-screen bg-black items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="flex h-screen bg-black">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-800 flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="font-bold text-white">I</span>
            </div>
            <span className="font-bold text-xl">Coach AI</span>
          </div>

          <nav className="space-y-1">
            <SidebarLink href="/dashboard" icon={<LayoutDashboard size={20} />} label="Dashboard" active />
            <SidebarLink href="/interviews" icon={<Video size={20} />} label="My Interviews" />
            <SidebarLink href="/analytics" icon={<BarChart3 size={20} />} label="Analytics" />
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-zinc-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.full_name || 'User'}</p>
              <p className="text-xs text-zinc-500 truncate">{user?.role === 'pro' ? 'Pro Plan' : 'Free Plan'}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-zinc-500 hover:text-red-500 transition-colors text-sm font-bold w-full"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-[#09090b] p-8">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.full_name?.split(' ')[0] || 'Interviewer'}!</h1>
            <p className="text-zinc-500">You're making great progress. Ready for another session?</p>
          </div>
          <Link href="/interview/new" className="btn-primary flex items-center gap-2 px-6 py-3">
            <Plus size={20} /> Start New Interview
          </Link>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <StatCard icon={<TrendingUp className="text-emerald-500" />} label="Average Score" value={`${stats?.avg_overall_score.toFixed(1) || '0.0'}/10`} subValue={`Last ${stats?.total_interviews || 0} sessions`} />
          <StatCard icon={<Video className="text-blue-500" />} label="Total Sessions" value={stats?.total_interviews.toString() || '0'} subValue="Across all categories" />
          <StatCard icon={<Clock className="text-purple-500" />} label="Practice Time" value={`${stats?.total_practice_minutes || 0}m`} subValue="This month" />
          <StatCard icon={<Award className="text-amber-500" />} label="Ranking" value={stats?.total_interviews && stats.total_interviews > 0 ? "Top 5%" : "N/A"} subValue="vs. other candidates" />
        </div>

        {/* Recent Interviews */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Recent Interviews</h2>
            <Link href="/interviews" className="text-sm text-blue-500 hover:underline flex items-center gap-1">
              View all <ChevronRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {stats?.recent_interviews && stats.recent_interviews.length > 0 ? (
              stats.recent_interviews.map((interview: any) => (
                <InterviewRow key={interview.id} interview={interview} />
              ))
            ) : (
              <div className="glass-card py-20 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-4">
                  <Video size={32} className="text-zinc-700" />
                </div>
                <h3 className="text-lg font-medium mb-2">No interviews yet</h3>
                <p className="text-zinc-500 mb-6 max-w-sm">Start your first AI-powered interview simulation to begin tracking your performance.</p>
                <Link href="/interview/new" className="btn-primary">Start First Session</Link>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function SidebarLink({ href, icon, label, active = false }: { href: string, icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <Link 
      href={href} 
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
        active ? 'bg-zinc-900 text-white font-medium' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

function StatCard({ icon, label, value, subValue }: { icon: React.ReactNode, label: string, value: string, subValue: string }) {
  return (
    <div className="glass-card border-zinc-800/50">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-zinc-900">{icon}</div>
        <span className="text-sm text-zinc-500 font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-xs text-zinc-500">{subValue}</div>
    </div>
  );
}

function InterviewRow({ interview }: { interview: any }) {
  return (
    <div className="glass-card flex items-center justify-between py-4 px-6 hover:bg-zinc-900/50 transition-all group">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${
          interview.overall_score >= 8 ? 'bg-emerald-500/10 text-emerald-500' : 
          interview.overall_score >= 6 ? 'bg-amber-500/10 text-amber-500' : 'bg-zinc-800 text-zinc-400'
        }`}>
          {interview.overall_score ? interview.overall_score.toFixed(1) : '-'}
        </div>
        <div>
          <h4 className="font-bold">{interview.title}</h4>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-zinc-500 px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 capitalize">
              {interview.interview_type}
            </span>
            <span className="text-xs text-zinc-500">
              {new Date(interview.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
      <Link 
        href={`/interview/${interview.id}`}
        className="p-2 rounded-lg bg-zinc-900 group-hover:bg-blue-600 transition-all"
      >
        <ChevronRight size={20} />
      </Link>
    </div>
  );
}
