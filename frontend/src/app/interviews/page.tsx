'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Video, 
  BarChart3, 
  LogOut, 
  ChevronRight,
  ArrowLeft,
  Calendar,
  Filter
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useDashboardStore } from '@/store/useDashboardStore';

export default function InterviewsHistory() {
  const { user, logout } = useAuthStore();
  const { stats, fetchDashboardData, loading } = useDashboardStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

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

  return (
    <div className="flex h-screen bg-black text-white">
      {/* Sidebar (Reused from Dashboard) */}
      <aside className="w-64 border-r border-zinc-800 flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="font-bold text-white">I</span>
            </div>
            <span className="font-bold text-xl">Coach AI</span>
          </div>

          <nav className="space-y-1">
            <SidebarLink href="/dashboard" icon={<LayoutDashboard size={20} />} label="Dashboard" />
            <SidebarLink href="/interviews" icon={<Video size={20} />} label="My Interviews" active />
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
        <header className="flex justify-between items-end mb-10">
          <div>
            <Link href="/dashboard" className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-4 text-sm group">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold mb-2">Interview History</h1>
            <p className="text-zinc-500">Review your past sessions and track your improvement over time.</p>
          </div>
          <div className="flex gap-4">
            <button className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm flex items-center gap-2 hover:bg-zinc-800 transition-all">
              <Filter size={16} /> Filter
            </button>
            <div className="relative">
              <button className="px-4 py-2 bg-blue-600/10 border border-blue-600/20 text-blue-400 rounded-lg text-sm flex items-center gap-2 hover:bg-blue-600/20 transition-all font-bold">
                <Calendar size={16} /> Last 30 Days
              </button>
              {/* Tooltip hint to show it's active */}
              <div className="absolute top-full right-0 mt-2 p-3 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-20 w-48 hidden group-hover:block">
                <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 px-2">Select Period</div>
                <button className="w-full text-left px-3 py-2 text-xs hover:bg-white/5 rounded-lg transition-colors">Last 7 Days</button>
                <button className="w-full text-left px-3 py-2 text-xs bg-blue-600/20 text-blue-400 rounded-lg font-bold">Last 30 Days</button>
                <button className="w-full text-left px-3 py-2 text-xs hover:bg-white/5 rounded-lg transition-colors">Last 3 Months</button>
                <button className="w-full text-left px-3 py-2 text-xs hover:bg-white/5 rounded-lg transition-colors border-t border-zinc-800 mt-1 pt-2">Custom Range...</button>
              </div>
            </div>
          </div>
        </header>

        <div className="space-y-4">
          {stats?.recent_interviews && stats.recent_interviews.length > 0 ? (
            stats.recent_interviews.map((interview: any) => (
              <InterviewRow key={interview.id} interview={interview} />
            ))
          ) : (
            <div className="glass-card py-20 flex flex-col items-center justify-center text-center">
              <Video size={48} className="text-zinc-800 mb-4" />
              <h3 className="text-lg font-medium mb-2">No interviews found</h3>
              <p className="text-zinc-500 mb-8 max-w-sm">You haven't completed any interviews yet. Start your first session to see it here.</p>
              <Link href="/interview/new" className="btn-primary">Start New Interview</Link>
            </div>
          )}
        </div>
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

function InterviewRow({ interview }: { interview: any }) {
  return (
    <div className="glass-card flex items-center justify-between py-5 px-8 hover:bg-zinc-900/50 transition-all group">
      <div className="flex items-center gap-6">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black ${
          interview.overall_score >= 8 ? 'bg-emerald-500/10 text-emerald-500' : 
          interview.overall_score >= 6 ? 'bg-amber-500/10 text-amber-500' : 'bg-zinc-800 text-zinc-400'
        }`}>
          {interview.overall_score ? interview.overall_score.toFixed(1) : '-'}
        </div>
        <div>
          <h4 className="text-lg font-bold mb-1">{interview.title}</h4>
          <div className="flex items-center gap-4">
            <span className="text-xs font-black uppercase tracking-widest text-zinc-500 px-3 py-1 bg-zinc-900 rounded-lg border border-zinc-800">
              {interview.interview_type}
            </span>
            <span className="text-xs text-zinc-500 flex items-center gap-1.5 font-medium">
              <Calendar size={12} />
              {new Date(interview.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>
      <Link 
        href={`/interview/${interview.id}`}
        className="flex items-center gap-2 px-6 py-3 bg-zinc-900 rounded-xl font-bold text-sm hover:bg-blue-600 transition-all group/btn"
      >
        Review Results
        <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
      </Link>
    </div>
  );
}
