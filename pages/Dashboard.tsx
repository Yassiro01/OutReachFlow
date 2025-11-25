import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Activity, Mail, Users, AlertCircle } from 'lucide-react';
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
    // Simulate backend activity when dashboard loads
    simulateCampaignProgress();

    // Load data
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

    // Mock chart data
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

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="text-sm text-gray-500">Last updated: Just now</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Contacts" value={stats.totalContacts} icon={Users} color="bg-blue-500" />
        <StatCard title="Active Campaigns" value={stats.activeCampaigns} icon={Activity} color="bg-green-500" />
        <StatCard title="Emails Sent" value={stats.emailsSent} icon={Mail} color="bg-indigo-500" />
        <StatCard title="Open Rate" value={`${stats.avgOpenRate}%`} icon={AlertCircle} color="bg-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Email Performance</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{fill: '#6b7280'}} axisLine={false} />
                <YAxis tick={{fill: '#6b7280'}} axisLine={false} />
                <Tooltip cursor={{fill: '#f3f4f6'}} />
                <Bar dataKey="sent" name="Sent" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="opened" name="Opened" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Activity Timeline</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{fill: '#6b7280'}} axisLine={false} />
                <YAxis tick={{fill: '#6b7280'}} axisLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="sent" stroke="#6366f1" strokeWidth={3} dot={{r: 4}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};