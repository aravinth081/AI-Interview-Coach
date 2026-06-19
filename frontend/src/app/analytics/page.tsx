'use client';

import { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area 
} from 'recharts';
import { 
  TrendingUp, 
  Target, 
  Award, 
  Clock, 
  Calendar,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Brain,
  ArrowLeft,
  LayoutDashboard,
  Video,
  BarChart3
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useDashboardStore } from '@/store/useDashboardStore';

const data = [
  { name: 'Jan', score: 6.2 },
  { name: 'Feb', score: 6.8 },
  { name: 'Mar', score: 7.5 },
  { name: 'Apr', score: 8.4 },
];

const categoryData = [
  { subject: 'Technical', A: 85, fullMark: 100 },
  { subject: 'Behavioral', A: 70, fullMark: 100 },
  { subject: 'Clarity', A: 90, fullMark: 100 },
  { subject: 'Confidence', A: 75, fullMark: 100 },
  { subject: 'Pacing', A: 60, fullMark: 100 },
];

export default function Analytics() {
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
            <SidebarLink href="/dashboard" icon={<LayoutDashboard size={20} />} label="Dashboard" />
            <SidebarLink href="/interviews" icon={<Video size={20} />} label="My Interviews" />
            <SidebarLink href="/analytics" icon={<BarChart3 size={20} />} label="Analytics" active />
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
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex justify-between items-end">
            <div>
              <Link href="/dashboard" className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-4 text-sm group">
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
              </Link>
              <h1 className="text-4xl font-black tracking-tight mb-2">Performance Analytics</h1>
              <p className="text-zinc-500 font-medium">Deep insights into your interview progression and AI evaluation history.</p>
            </div>
            <div className="flex gap-4">
              <div className="relative group">
                <button className="glass-card px-4 py-2 flex items-center gap-2 hover:bg-blue-600/10 transition-all border-blue-500/20 text-blue-400 font-bold">
                  <Calendar size={16} />
                  <span className="text-sm">Last 30 Days</span>
                </button>
                <div className="absolute top-full right-0 mt-3 p-4 bg-zinc-900 border border-zinc-800 rounded-[1.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.8)] z-30 w-56 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-3 px-2">Analytics Range</div>
                  <div className="space-y-1">
                    <button className="w-full text-left px-4 py-2.5 text-xs text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">Last 7 Days</button>
                    <button className="w-full text-left px-4 py-2.5 text-xs bg-blue-600/10 text-blue-400 rounded-xl font-bold">Last 30 Days</button>
                    <button className="w-full text-left px-4 py-2.5 text-xs text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">Last 6 Months</button>
                    <button className="w-full text-left px-4 py-2.5 text-xs text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all border-t border-zinc-800/50 mt-2 pt-3">Custom Data Range</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard icon={<Award className="text-yellow-500" />} label="Average Score" value={stats?.avg_overall_score.toFixed(1) || '0.0'} trend="+12%" />
          <StatCard icon={<Target className="text-blue-500" />} label="Interviews" value={stats?.total_interviews.toString() || '0'} trend="+4" />
          <StatCard icon={<Clock className="text-emerald-500" />} label="Practice Time" value={`${stats?.total_practice_minutes || 0}m`} trend="+2.5h" />
          <StatCard icon={<TrendingUp className="text-purple-500" />} label="Growth Rate" value="22%" trend="Stable" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart */}
          <div className="lg:col-span-2 glass-card p-8 min-h-[400px] flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <TrendingUp size={20} className="text-blue-500" /> Score Progression
              </h3>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-black rounded-full uppercase tracking-widest">Global Top 5%</span>
              </div>
            </div>
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} domain={[0, 10]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid #1f2937', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Weakness Radar / List */}
          <div className="glass-card p-8">
            <h3 className="text-lg font-bold mb-8 flex items-center gap-2">
              <Brain size={20} className="text-purple-500" /> Skill Distribution
            </h3>
            <div className="space-y-6">
              <SkillProgress label="Technical Knowledge" value={85} color="bg-blue-500" />
              <SkillProgress label="Communication Clarity" value={92} color="bg-emerald-500" />
              <SkillProgress label="Problem Solving" value={78} color="bg-purple-500" />
              <SkillProgress label="Situational Confidence" value={65} color="bg-amber-500" />
              <SkillProgress label="Speech Pacing" value={58} color="bg-red-500" />
            </div>
            
            <div className="mt-12 p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800">
              <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <AlertCircle size={14} className="text-amber-500" /> Top Improvement Area
              </h4>
              <p className="text-sm font-medium text-zinc-300 leading-relaxed">
                Your speaking pace tends to accelerate during complex technical questions. Focus on deliberate pausing.
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="glass-card p-8">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <CheckCircle2 size={20} className="text-emerald-500" /> Key Strengths
            </h3>
            <div className="space-y-3">
              <StrengthItem text="Strong articulation of distributed systems concepts" />
              <StrengthItem text="Excellent usage of the STAR method in behavioral rounds" />
              <StrengthItem text="Consistent eye contact during high-pressure questions" />
              <StrengthItem text="Highly professional vocal tone and projection" />
            </div>
          </div>
          <div className="glass-card p-8">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Award size={20} className="text-blue-500" /> Recent Milestone
            </h3>
            <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-500/20">
                <TrendingUp size={32} className="text-white" />
              </div>
              <div>
                <div className="text-sm font-bold text-blue-100 mb-1">Consistency King</div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  You've practiced for 7 consecutive days and improved your behavioral score by 15%.
                </p>
              </div>
            </div>
          </div>
        </div>
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

function StatCard({ icon, label, value, trend }: any) {
  return (
    <div className="glass-card p-6 border-zinc-800/50">
      <div className="flex justify-between items-start mb-4">
        <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center border border-white/5">
          {icon}
        </div>
        <span className={`text-[10px] font-black px-2 py-1 rounded-full ${trend.startsWith('+') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-500/10 text-zinc-500'}`}>
          {trend}
        </span>
      </div>
      <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">{label}</div>
      <div className="text-2xl font-black">{value}</div>
    </div>
  );
}

function SkillProgress({ label, value, color }: any) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          className={`h-full ${color}`}
        />
      </div>
    </div>
  );
}

function StrengthItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group">
      <div className="mt-1">
        <ChevronRight size={14} className="text-zinc-700 group-hover:text-blue-500 transition-colors" />
      </div>
      <p className="text-sm text-zinc-400 group-hover:text-zinc-200 transition-colors">{text}</p>
    </div>
  );
}
