import React, { useState, useEffect } from 'react';
import { Save, Server, ShieldCheck, Mail } from 'lucide-react';
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
    // Don't show the password in the UI field for security simulation
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
    
    // In a real app, we would validate connection here
    await saveSmtpConfig(config);
    
    setMessage('Settings saved successfully!');
    setIsSaving(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-primary-100 rounded-lg">
          <Server className="text-primary-600" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SMTP Configuration</h1>
          <p className="text-gray-500">Connect your email provider to send campaigns.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Host</label>
              <input
                type="text" name="host" value={config.host} onChange={handleChange}
                placeholder="smtp.gmail.com"
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Port</label>
              <input
                type="number" name="port" value={config.port} onChange={handleChange}
                placeholder="587"
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                required
              />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ShieldCheck size={16} className="text-gray-400" /> Authentication
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username / Email</label>
                <input
                  type="text" name="username" value={config.username} onChange={handleChange}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password / App Password</label>
                <input
                  type="password" name="password" value={config.password || ''} onChange={handleChange}
                  placeholder="••••••••••••"
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  // Not required if editing and assuming previously saved
                />
                <p className="mt-1 text-xs text-gray-500">We encrypt and store this securely.</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Mail size={16} className="text-gray-400" /> Sender Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Name</label>
                <input
                  type="text" name="fromName" value={config.fromName} onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Email</label>
                <input
                  type="email" name="fromEmail" value={config.fromEmail} onChange={handleChange}
                  placeholder="john@company.com"
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-green-600 font-medium">{message}</p>
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 bg-primary-600 text-white px-6 py-2.5 rounded-lg hover:bg-primary-700 font-medium transition-colors disabled:opacity-50"
          >
            <Save size={18} />
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
};