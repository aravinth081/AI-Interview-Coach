'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bot, Mail, Lock, User, ArrowRight, Globe } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/services/api';

export default function Register() {
  const router = useRouter();
  const setAuth = useAuthStore(state => state.setAuth);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // 1. Register
      const regRes = await api.post('/auth/register', formData);
      
      // 2. Login to get token
      const loginRes = await api.post('/auth/login', {
        email: formData.email,
        password: formData.password
      });
      
      setAuth(regRes.data, loginRes.data.access_token);
      router.push('/dashboard');
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setError(detail);
      } else if (Array.isArray(detail)) {
        setError(detail[0]?.msg || 'Validation error occurred.');
      } else if (typeof detail === 'object' && detail !== null) {
        setError(detail.msg || JSON.stringify(detail));
      } else {
        setError('Something went wrong during registration.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
      <Link href="/" className="flex items-center gap-2 mb-12">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
          <Bot size={24} className="text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight text-white">AI Interview Coach</span>
      </Link>

      <div className="w-full max-w-md">
        <div className="glass-card">
          <h1 className="text-2xl font-bold mb-2">Create your account</h1>
          <p className="text-zinc-500 mb-8">Start your journey to interview mastery today.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input 
                  type="text"
                  required
                  placeholder="John Doe"
                  className="input-field w-full pl-12"
                  value={formData.full_name}
                  onChange={e => setFormData({...formData, full_name: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input 
                  type="email"
                  required
                  placeholder="john@example.com"
                  className="input-field w-full pl-12"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input 
                  type="password"
                  required
                  placeholder="••••••••"
                  className="input-field w-full pl-12"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

            <button 
              disabled={loading}
              className="btn-primary w-full py-4 mt-6 flex items-center justify-center gap-2 group"
            >
              {loading ? 'Creating Account...' : 'Get Started Now'}
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>


          <p className="text-center text-zinc-500 text-sm mt-8">
            Already have an account? <Link href="/login" className="text-blue-500 hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
