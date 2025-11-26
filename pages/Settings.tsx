import React, { useState, useEffect } from 'react';
import { Save, Server, ShieldCheck, Mail, Loader2 } from 'lucide-react';
import { getSmtpConfig, saveSmtpConfig } from '../services/mockBackend';
import { SmtpConfig } from '../types';

export const Settings = () => {
  const [config, setConfig] = useState<SmtpConfig>({
    host: '', port: 587, username: '', password: '', fromName: '', fromEmail: '', isConfigured: false
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loaded = getSmtpConfig();
    setConfig({ ...loaded, password: '' }); 
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');
    
    await saveSmtpConfig(config);
    
    setMessage('Settings saved successfully!');
    setIsSaving(false);
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-8">
      <div className="flex flex-col md:flex-row md:items-center gap-4 border-b border-slate-200 pb-6">
        <div className="p-3.5 bg-primary-50 rounded-xl border border-primary-100 shadow-sm">
          <Server className="text-primary-600" size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">SMTP Configuration</h1>
          <p className="text-slate-500 mt-1">Connect your email provider to start sending campaigns.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-slide-up">
        <div className="p-8 space-y-8">
          {/* Server Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Server Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">SMTP Host</label>
                <input
                  type="text" name="host" value={config.host} onChange={handleChange}
                  placeholder="smtp.gmail.com"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all placeholder:text-slate-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Port</label>
                <input
                  type="number" name="port" value={config.port} onChange={handleChange}
                  placeholder="587"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all placeholder:text-slate-400"
                  required
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Authentication */}
          <div className="space-y-4">
             <div className="flex items-center gap-2 mb-4">
               <ShieldCheck size={18} className="text-primary-500" />
               <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Credentials</h3>
             </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Username / Email</label>
                <input
                  type="text" name="username" value={config.username} onChange={handleChange}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all placeholder:text-slate-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Password / App Password</label>
                <input
                  type="password" name="password" value={config.password || ''} onChange={handleChange}
                  placeholder="••••••••••••"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all placeholder:text-slate-400"
                />
                <p className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                  <ShieldCheck size={12} /> Stored securely via encryption
                </p>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Sender Info */}
          <div className="space-y-4">
             <div className="flex items-center gap-2 mb-4">
               <Mail size={18} className="text-primary-500" />
               <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Sender Profile</h3>
             </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">From Name</label>
                <input
                  type="text" name="fromName" value={config.fromName} onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all placeholder:text-slate-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">From Email</label>
                <input
                  type="email" name="fromEmail" value={config.fromEmail} onChange={handleChange}
                  placeholder="john@company.com"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all placeholder:text-slate-400"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-50/50 px-8 py-6 border-t border-slate-100 flex items-center justify-between backdrop-blur-sm">
          <p className={`text-sm font-medium transition-all ${message ? 'text-green-600 opacity-100' : 'opacity-0'}`}>
            {message}
          </p>
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 bg-primary-600 text-white px-8 py-3 rounded-xl hover:bg-primary-700 font-semibold transition-all disabled:opacity-50 shadow-lg shadow-primary-600/20 hover:shadow-primary-600/30 hover:-translate-y-0.5"
          >
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
};