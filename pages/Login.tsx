import React, { useState } from 'react';
import { useNavigate } from '../App';
import { login, register } from '../services/api';
import { Mail, Lock, ArrowRight, Loader2, UserPlus, AlertCircle } from 'lucide-react';

export const Login = () => {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!email.toLowerCase().includes('@')) {
      setError('Please use a valid email address');
      setLoading(false);
      return;
    }
    
    try {
      if (isRegistering) {
        await register(email, password);
      } else {
        await login(email, password);
      }
      // Successful auth redirects to dashboard
      navigate('/');
    } catch (err: any) {
      console.error("Auth Error:", err);
      setError(err.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError('');
    setEmail('');
    setPassword('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-slate-50 to-white px-4">
      <div className="max-w-[420px] w-full animate-slide-up">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-tr from-primary-600 to-primary-500 rounded-2xl shadow-xl shadow-primary-500/20 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-6 transform rotate-3 hover:rotate-6 transition-transform duration-300">
            O
          </div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
            {isRegistering ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-slate-500 mt-2 text-sm leading-relaxed max-w-[280px] mx-auto">
            {isRegistering 
              ? 'Start automating your cold outreach campaigns today.' 
              : 'Sign in to manage your campaigns and contacts.'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 p-8 border border-slate-100">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100 flex items-start gap-3 animate-fade-in">
              <AlertCircle className="shrink-0 mt-0.5" size={18} />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700 ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all placeholder:text-slate-400 text-slate-900"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between ml-1">
                <label className="block text-sm font-semibold text-slate-700">Password</label>
                {!isRegistering && (
                  <button type="button" className="text-xs font-medium text-primary-600 hover:text-primary-700">Forgot?</button>
                )}
              </div>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all placeholder:text-slate-400 text-slate-900"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-3.5 rounded-xl font-semibold hover:bg-primary-700 focus:ring-4 focus:ring-primary-100 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-primary-600/20 hover:shadow-primary-600/30 transform active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                isRegistering ? (
                  <>Create Account <UserPlus size={20} /></>
                ) : (
                  <>Sign In <ArrowRight size={20} /></>
                )
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100">
             <button 
              onClick={toggleMode}
              className="w-full group flex flex-col items-center justify-center gap-1"
            >
              <span className="text-sm text-slate-500">
                {isRegistering ? 'Already have an account?' : "Don't have an account?"}
              </span>
              <span className="text-sm font-semibold text-primary-600 group-hover:text-primary-700 transition-colors flex items-center gap-1">
                {isRegistering ? 'Sign in instead' : 'Create free account'} 
                <ArrowRight size={14} className="transform group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </div>
        </div>
        
        <p className="text-center text-xs text-slate-400 mt-8">
          &copy; 2024 OutreachFlow Inc.
        </p>
      </div>
    </div>
  );
};