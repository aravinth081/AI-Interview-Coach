'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Bot, 
  Video, 
  Briefcase, 
  Code, 
  Users, 
  ChevronRight,
  ArrowLeft,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useInterviewStore } from '@/store/useInterviewStore';
import Link from 'next/link';

export default function NewInterview() {
  const router = useRouter();
  const { startInterview, loading, error } = useInterviewStore();
  const [selectedType, setSelectedType] = useState('behavioral');

  const handleStart = async () => {
    const title = `${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} Interview - ${new Date().toLocaleDateString()}`;
    const id = await startInterview({
      title,
      interview_type: selectedType
    });
    
    if (id) {
      router.push(`/interview/${id}`);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-3xl mx-auto">
        <Link href="/dashboard" className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-12 group">
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
        </Link>

        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Start New Session</h1>
          <p className="text-zinc-500 text-lg">Choose your focus area. Our AI will tailor questions to your selection.</p>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl mb-8 flex items-center gap-3">
            <AlertCircle size={20} />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <TypeCard 
            id="behavioral"
            selected={selectedType === 'behavioral'}
            onClick={() => setSelectedType('behavioral')}
            icon={<Users className="text-blue-500" />}
            title="Behavioral"
            description="Soft skills, leadership, and situational questions."
          />
          <TypeCard 
            id="technical"
            selected={selectedType === 'technical'}
            onClick={() => setSelectedType('technical')}
            icon={<Code className="text-purple-500" />}
            title="Technical"
            description="Core concepts, problem solving, and architecture."
          />
          <TypeCard 
            id="system_design"
            selected={selectedType === 'system_design'}
            onClick={() => setSelectedType('system_design')}
            icon={<Bot className="text-emerald-500" />}
            title="System Design"
            description="Scalability, database choice, and system flow."
          />
          <TypeCard 
            id="resume_based"
            selected={selectedType === 'resume_based'}
            onClick={() => setSelectedType('resume_based')}
            icon={<Briefcase className="text-amber-500" />}
            title="Resume Based"
            description="Questions specific to your experience and projects."
          />
        </div>

        <button 
          onClick={handleStart}
          disabled={loading}
          className="btn-primary w-full py-5 text-xl flex items-center justify-center gap-3 group"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" /> Initializing Session...
            </>
          ) : (
            <>
              Enter Interview Room <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function TypeCard({ id, selected, onClick, icon, title, description }: any) {
  return (
    <div 
      onClick={onClick}
      className={`glass-card p-8 cursor-pointer transition-all border-2 ${
        selected ? 'border-blue-600 bg-blue-600/5' : 'border-zinc-800 hover:border-zinc-700'
      }`}
    >
      <div className="flex items-start justify-between mb-6">
        <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center">
          {icon}
        </div>
        {selected && (
          <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_white]" />
          </div>
        )}
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-zinc-500 leading-relaxed">{description}</p>
    </div>
  );
}
