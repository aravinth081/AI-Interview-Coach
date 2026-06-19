import Link from 'next/link';
import { Bot, Mic, Video, BarChart3, ChevronRight, CheckCircle2 } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-black text-white selection:bg-blue-500/30">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <Bot size={24} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">AI Interview Coach</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
          <Link href="#features" className="hover:text-white transition-colors">Features</Link>
          <Link href="#how-it-works" className="hover:text-white transition-colors">How it Works</Link>
          <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium hover:text-blue-500 transition-colors">Sign In</Link>
          <Link href="/register" className="btn-primary py-2 px-6">Get Started</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center px-4 pt-20 pb-32 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-8 animate-fade-in">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          V1.0 IS LIVE
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-500">
          Master Your Next <br /> Tech Interview with AI.
        </h1>
        <p className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
          Get real-time feedback on your speech, content, and behavior. 
          The only platform that evaluates you like a FAANG engineer.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link href="/register" className="btn-primary text-lg px-8 py-4 flex items-center gap-2 w-full sm:w-auto justify-center">
            Start Free Practice <ChevronRight size={20} />
          </Link>
          <Link href="#demo" className="px-8 py-4 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-all font-medium w-full sm:w-auto text-center">
            Watch Demo
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-zinc-950 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-8">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold mb-4">Elite Feedback for Elite Roles</h2>
            <p className="text-zinc-400">Everything you need to go from anxious to unstoppable.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Mic className="text-blue-500" />}
              title="Speech Intelligence"
              description="Detect filler words, track speaking pace, and analyze your tone for maximum confidence."
            />
            <FeatureCard 
              icon={<Bot className="text-purple-500" />}
              title="LLM-Powered Content"
              description="Our AI evaluates your technical accuracy and STAR method structure in real-time."
            />
            <FeatureCard 
              icon={<Video className="text-emerald-500" />}
              title="Behavior Analysis"
              description="Eye contact tracking and emotion detection ensures you project the right energy."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-8">
          <div className="glass-card bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-blue-500/30 flex flex-col items-center text-center py-16">
            <h2 className="text-4xl font-bold mb-6">Ready to land your dream job?</h2>
            <p className="text-zinc-300 mb-10 text-lg">
              Join 5,000+ candidates who have improved their scores by 40% in just two weeks.
            </p>
            <Link href="/register" className="btn-primary text-lg px-10 py-4">
              Create Your Free Account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-900 py-12 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <Bot size={24} className="text-blue-500" />
            <span className="font-bold">AI Interview Coach</span>
          </div>
          <p className="text-zinc-500 text-sm">© 2026 AI Interview Coach. Built for the elite.</p>
          <div className="flex gap-6 text-zinc-500 text-sm">
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms</Link>
            <Link href="#" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="glass-card hover:border-zinc-700 transition-all group">
      <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-zinc-400 leading-relaxed">{description}</p>
    </div>
  );
}
