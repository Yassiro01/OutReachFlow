import React, { useEffect, useState } from 'react';
import { 
  Users, Server, Activity, Shield, Ban, CheckCircle, Terminal, 
  AlertTriangle, Search, RefreshCw, Cpu
} from 'lucide-react';
import { 
  getSystemStats, getAllUsers, toggleUserStatus, getSystemLogs 
} from '../services/api';
import { SystemStats, AdminLog } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const AdminPanel = () => {
  const [tab, setTab] = useState<'dashboard' | 'users' | 'logs'>('dashboard');
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsData, usersData, logsData] = await Promise.all([
          getSystemStats(),
          getAllUsers(),
          getSystemLogs()
        ]);
        setStats(statsData);
        setUsers(usersData);
        setLogs(logsData);
      } catch (e) {
        console.error("Admin Fetch Error", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [refreshKey, tab]);

  const handleToggleStatus = async (userId: string) => {
    try {
      await toggleUserStatus(userId);
      setRefreshKey(p => p + 1);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const StatCard = ({ title, value, sub, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-slate-900">{value}</h3>
          <p className="text-xs text-slate-400 mt-2">{sub}</p>
        </div>
        <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-slate-900 text-white text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider">Admin Area</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Administration</h1>
        </div>
        
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          {[
            { id: 'dashboard', label: 'Overview', icon: Activity },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'logs', label: 'System Logs', icon: Terminal },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.id 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading && !stats ? (
        <div className="h-64 flex items-center justify-center">
          <RefreshCw className="animate-spin text-slate-400" size={32} />
        </div>
      ) : (
        <>
          {tab === 'dashboard' && stats && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Users" value={stats.totalUsers} sub={`${stats.activeUsers} Active`} icon={Users} color="bg-blue-500" />
                <StatCard title="System Load" value={`${stats.systemHealth.cpuUsage}%`} sub={`${stats.systemHealth.memoryUsage}% Memory Used`} icon={Cpu} color="bg-purple-500" />
                <StatCard title="Queue Depth" value={stats.systemHealth.queueLength} sub="Jobs Pending" icon={Server} color="bg-amber-500" />
                <StatCard title="Emails Processed" value={stats.totalEmailsSent.toLocaleString()} sub="Lifetime Volume" icon={CheckCircle} color="bg-green-500" />
              </div>
            </div>
          )}

          {tab === 'users' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-slide-up">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="relative w-64">
                   <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                   <input type="text" placeholder="Search users..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-slate-200" />
                </div>
                <button onClick={() => setRefreshKey(p => p + 1)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"><RefreshCw size={18} /></button>
              </div>
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Joined</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                            {u.name[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-900">{u.name}</div>
                            <div className="text-xs text-slate-500">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                         {u.role === 'admin' 
                           ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700"><Shield size={10} /> Admin</span>
                           : <span className="inline-flex px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-700">User</span>
                         }
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(u.createdAt || u.joinedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleToggleStatus(u.id)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                            u.status === 'active' 
                            ? 'border-red-100 text-red-600 hover:bg-red-50' 
                            : 'border-green-100 text-green-600 hover:bg-green-50'
                          }`}
                        >
                          {u.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'logs' && (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden animate-slide-up flex flex-col min-h-[500px]">
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-300 font-mono text-sm">
                  <Terminal size={16} /> System Event Stream
                </div>
              </div>
              <div className="flex-1 p-4 overflow-y-auto space-y-2 font-mono text-sm max-h-[600px]">
                <div className="text-slate-600 text-center py-10">-- Backend Log Stream Not Connected --</div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};