import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';
import { Activity, Mail, Users, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { getCampaigns, getContacts, simulateCampaignProgress } from '../services/mockBackend';

export const Dashboard = () => {
  const [stats, setStats] = useState({
    totalContacts: 0,
    activeCampaigns: 0,
    emailsSent: 0,
    avgOpenRate: 0
  });

  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    simulateCampaignProgress();
    const contacts = getContacts();
    const campaigns = getCampaigns();
    
    const sent = campaigns.reduce((acc, curr) => acc + curr.sentCount, 0);
    const opens = campaigns.reduce((acc, curr) => acc + curr.openCount, 0);
    
    setStats({
      totalContacts: contacts.length,
      activeCampaigns: campaigns.filter(c => c.status === 'running').length,
      emailsSent: sent,
      avgOpenRate: sent > 0 ? Math.round((opens / sent) * 100) : 0
    });

    setChartData([
      { name: 'Mon', sent: 120, opened: 45 },
      { name: 'Tue', sent: 150, opened: 60 },
      { name: 'Wed', sent: 180, opened: 90 },
      { name: 'Thu', sent: 140, opened: 55 },
      { name: 'Fri', sent: 200, opened: 80 },
      { name: 'Sat', sent: 50, opened: 20 },
      { name: 'Sun', sent: 30, opened: 15 },
    ]);
  }, []);

  const StatCard = ({ title, value, icon: Icon, colorClass, trend }: any) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{value}</h3>
          
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>{Math.abs(trend)}% vs last week</span>
            </div>
          )}
        </div>
        <div className={`p-3.5 rounded-xl ${colorClass} bg-opacity-10`}>
          <Icon size={24} className={colorClass.replace('bg-', 'text-')} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Overview</h1>
          <p className="text-slate-500 mt-1">Track your campaign performance and contact growth.</p>
        </div>
        <div className="text-sm bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm text-slate-600">
          Last updated: <span className="font-semibold text-slate-900">Just now</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Contacts" value={stats.totalContacts} icon={Users} colorClass="bg-blue-500 text-blue-600" trend={12} />
        <StatCard title="Active Campaigns" value={stats.activeCampaigns} icon={Activity} colorClass="bg-green-500 text-green-600" trend={5} />
        <StatCard title="Emails Sent" value={stats.emailsSent.toLocaleString()} icon={Mail} colorClass="bg-indigo-500 text-indigo-600" trend={24} />
        <StatCard title="Open Rate" value={`${stats.avgOpenRate}%`} icon={AlertCircle} colorClass="bg-purple-500 text-purple-600" trend={-2} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-slate-800">Email Performance</h3>
            <select className="text-sm border-none bg-slate-50 rounded-lg px-3 py-1.5 text-slate-600 focus:ring-0 cursor-pointer">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                />
                <Bar dataKey="sent" name="Sent" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={32} />
                <Bar dataKey="opened" name="Opened" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Line Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
           <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-slate-800">Engagement Timeline</h3>
             <div className="flex gap-2">
                <span className="flex items-center gap-1 text-xs text-slate-500"><div className="w-2 h-2 rounded-full bg-primary-500"></div> Sent</span>
             </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Area type="monotone" dataKey="sent" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorSent)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};