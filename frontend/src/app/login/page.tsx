'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bot, Mail, Lock, ArrowRight, Globe } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/services/api';

export default function Login() {
  const router = useRouter();
  const setAuth = useAuthStore(state => state.setAuth);
  const [formData, setFormData] = useState({
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
      const loginRes = await api.post('/auth/login', formData);
      const userRes = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${loginRes.data.access_token}` }
      });
      
      setAuth(userRes.data, loginRes.data.access_token);
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
        setError('Invalid email or password.');
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
          <h1 className="text-2xl font-bold mb-2">Welcome Back</h1>
          <p className="text-zinc-500 mb-8">Sign in to continue your interview prep.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
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
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Password</label>
                <Link href="#" className="text-xs text-blue-500 hover:underline">Forgot password?</Link>
              </div>
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
              {loading ? 'Signing In...' : 'Sign In'}
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>


          <p className="text-center text-zinc-500 text-sm mt-8">
            Don't have an account? <Link href="/register" className="text-blue-500 hover:underline">Create One</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
