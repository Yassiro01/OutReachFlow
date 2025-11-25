import React, { useState } from 'react';
import { useNavigate } from '../App';
import { mockLogin, mockRegister } from '../services/mockBackend';
import { Mail, Lock, ArrowRight, Loader2, UserPlus, LogIn, AlertCircle } from 'lucide-react';

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

    // Client-side Gmail check for instant feedback
    if (!email.toLowerCase().endsWith('@gmail.com')) {
      setError('Please use a valid @gmail.com address');
      setLoading(false);
      return;
    }
    
    try {
      if (isRegistering) {
        await mockRegister(email, password);
      } else {
        await mockLogin(email, password);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || "Authentication failed");
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">O</div>
          <h2 className="text-3xl font-bold text-gray-900">
            {isRegistering ? 'Create Account' : 'Welcome back'}
          </h2>
          <p className="text-gray-500 mt-2">
            {isRegistering 
              ? 'Get started with your outreach automation' 
              : 'Sign in to your OutreachFlow account'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200 flex items-start gap-3">
            <AlertCircle className="shrink-0 mt-0.5" size={18} />
            <div className="flex-1 font-medium">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gmail Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all placeholder:text-gray-400"
                placeholder="yourname@gmail.com"
                required
              />
            </div>
            <p className="mt-1.5 text-xs text-gray-500">Only @gmail.com addresses are supported.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-3 rounded-xl font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              isRegistering ? (
                <>Sign Up <UserPlus size={20} /></>
              ) : (
                <>Sign In <ArrowRight size={20} /></>
              )
            )}
          </button>
        </form>

        <div className="mt-8 text-center pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            {isRegistering ? 'Already have an account?' : "Don't have an account?"}
          </p>
          <button 
            onClick={toggleMode}
            className="mt-2 text-primary-600 font-medium hover:text-primary-700 transition-colors flex items-center justify-center gap-1 mx-auto"
          >
            {isRegistering ? (
              <>Sign in instead <LogIn size={16} /></>
            ) : (
              <>Create free account <ArrowRight size={16} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};