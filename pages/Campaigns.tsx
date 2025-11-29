import React, { useState, useEffect } from 'react';
import { Send, Wand2, Plus, Loader2, Trash2, Clock, Mail, ArrowDown, ChevronRight, Calendar, ArrowLeft, Download, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { Campaign, CampaignStep, EmailLog } from '../types';
import { getContacts, getCampaigns, saveCampaign, getSmtpConfig, getEmailLogs } from '../services/api';
import { generateEmailContent } from '../services/gemini';

export const Campaigns = () => {
  const [view, setView] = useState<'list' | 'create' | 'details'>('list');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  
  // Creation State
  const [name, setName] = useState('');
  const [steps, setSteps] = useState<CampaignStep[]>([
    { id: '1', order: 1, delayDays: 0, subject: '', body: '' }
  ]);
  
  // AI State
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiTone, setAiTone] = useState('Professional');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadCampaigns();
  }, [view]);

  const loadCampaigns = async () => {
    const data = await getCampaigns();
    setCampaigns(data);
  };

  useEffect(() => {
    if (selectedCampaign) {
      getEmailLogs(selectedCampaign.id).then(setLogs);
      // Refresh list to update counts
      loadCampaigns();
    }
  }, [selectedCampaign?.id]);

  const handleAiGenerate = async () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    try {
      const result = await generateEmailContent(aiPrompt, aiTone);
      updateStep(activeStepIndex, 'subject', result.subject);
      updateStep(activeStepIndex, 'body', result.body.replace(/<br>/g, '\n'));
    } catch (e) {
      alert("Failed to generate content. Ensure API Key is in metadata.");
    } finally {
      setIsGenerating(false);
    }
  };

  const updateStep = (index: number, field: keyof CampaignStep, value: any) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  const addStep = () => {
    setSteps([
      ...steps,
      {
        id: Math.random().toString(36).substr(2, 9),
        order: steps.length + 1,
        delayDays: 3, 
        subject: '',
        body: ''
      }
    ]);
  };

  const removeStep = (index: number) => {
    if (steps.length <= 1) return;
    const newSteps = steps.filter((_, i) => i !== index);
    setSteps(newSteps.map((s, i) => ({ ...s, order: i + 1 })));
    if (activeStepIndex >= newSteps.length) {
      setActiveStepIndex(newSteps.length - 1);
    }
  };

  const handleCreate = async () => {
    try {
      const smtp = await getSmtpConfig();
      if (!smtp.isConfigured) {
        alert("Please configure SMTP settings before creating a campaign.");
        return;
      }
      if (!name || steps.some(s => !s.body)) {
        alert("Please fill in campaign name and email content for all steps.");
        return;
      }
      const contacts = await getContacts();
      const newCampaign: Campaign = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        steps,
        status: 'running',
        sentCount: 0,
        openCount: 0,
        totalContacts: contacts.length,
        createdAt: new Date().toISOString()
      };
      await saveCampaign(newCampaign);
      setView('list');
      resetForm();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const resetForm = () => {
    setName('');
    setSteps([{ id: '1', order: 1, delayDays: 0, subject: '', body: '' }]);
    setAiPrompt('');
  };

  const handleExportLogs = () => {
    if (!selectedCampaign) return;
    const headers = ["Sent At", "Step", "To", "Subject", "Status"];
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + logs.map(l => 
          `${l.sentAt},${l.stepOrder},${l.contactEmail},"${l.subject.replace(/"/g, '""')}",${l.status}`
        ).join("\n");
    
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `campaign_${selectedCampaign.name.replace(/\s+/g, '_')}_logs.csv`;
    link.click();
  };

  if (view === 'create') {
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-24 animate-fade-in">
        <div className="flex items-center justify-between sticky top-0 bg-slate-50/95 backdrop-blur z-20 py-4 border-b border-slate-200 -mx-4 px-4 md:-mx-8 md:px-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Sequence</h1>
            <p className="text-sm text-slate-500">Design your automated outreach workflow.</p>
          </div>
          <button onClick={() => setView('list')} className="text-sm font-medium text-slate-500 hover:text-slate-800 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors">Cancel</button>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Campaign Name</label>
            <input 
              value={name} onChange={e => setName(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all" 
              placeholder="e.g. SaaS Outreach - Q4"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
               <div className="relative pl-6 space-y-8">
                 <div className="absolute left-[35px] top-6 bottom-6 w-0.5 bg-slate-200"></div>

                 {steps.map((step, index) => (
                   <div key={step.id} className="relative pl-12 group" onClick={() => setActiveStepIndex(index)}>
                     <div className={`absolute left-0 top-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-4 z-10 transition-all duration-300 ${
                       activeStepIndex === index 
                         ? 'bg-primary-600 border-slate-50 text-white shadow-lg shadow-primary-500/30 scale-110' 
                         : 'bg-white border-slate-100 text-slate-400 shadow-sm'
                     }`}>
                       {index + 1}
                     </div>

                     <div className={`bg-white rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden ${
                       activeStepIndex === index 
                         ? 'border-primary-500 shadow-lg shadow-primary-500/5 ring-4 ring-primary-500/5' 
                         : 'border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md'
                     }`}>
                       <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                         <div className="flex items-center gap-3">
                           <div className={`p-2 rounded-lg ${activeStepIndex === index ? 'bg-primary-100 text-primary-600' : 'bg-slate-100 text-slate-500'}`}>
                             <Mail size={16} />
                           </div>
                           <span className={`font-semibold ${activeStepIndex === index ? 'text-primary-900' : 'text-slate-600'}`}>
                             {index === 0 ? 'Initial Email' : 'Follow-up Email'}
                           </span>
                         </div>
                         {index > 0 && (
                           <button 
                             onClick={(e) => { e.stopPropagation(); removeStep(index); }}
                             className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                           >
                             <Trash2 size={16} />
                           </button>
                         )}
                       </div>

                       <div className="p-6 space-y-5">
                         {index > 0 && (
                           <div className="flex items-center gap-3 bg-amber-50 p-3 rounded-xl border border-amber-100 w-fit text-sm">
                             <Clock size={16} className="text-amber-600" />
                             <span className="text-amber-900 font-medium">Wait</span>
                             <input 
                               type="number" 
                               min="1"
                               max="90"
                               value={step.delayDays}
                               onChange={(e) => updateStep(index, 'delayDays', parseInt(e.target.value))}
                               className="w-14 p-1 text-center border border-amber-200 rounded-md bg-white focus:ring-2 focus:ring-amber-500/20 outline-none"
                             />
                             <span className="text-amber-900">days if no reply</span>
                           </div>
                         )}

                         <div className="space-y-4">
                           <input 
                             value={step.subject}
                             onChange={(e) => updateStep(index, 'subject', e.target.value)}
                             placeholder={index > 0 ? "Subject (leave empty to reply to previous thread)" : "Subject Line"}
                             className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 font-medium text-slate-800 placeholder:text-slate-400"
                           />
                           <div>
                              <textarea 
                                value={step.body}
                                onChange={(e) => updateStep(index, 'body', e.target.value)}
                                placeholder="Hi {{firstName}}, I saw your company {{company}}..."
                                rows={6}
                                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 font-mono text-sm resize-y text-slate-700 placeholder:text-slate-400 leading-relaxed"
                              />
                              <p className="text-xs text-slate-400 mt-2">
                                Available variables: <span className="font-mono bg-slate-100 px-1 rounded">{`{{firstName}}`}</span>, <span className="font-mono bg-slate-100 px-1 rounded">{`{{company}}`}</span>, <span className="font-mono bg-slate-100 px-1 rounded">{`{{email}}`}</span>
                              </p>
                           </div>
                         </div>
                       </div>
                     </div>
                   </div>
                 ))}

                 <div className="pl-12 pt-2">
                   <button 
                    onClick={addStep}
                    className="flex items-center gap-2 text-primary-600 font-semibold hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-5 py-3 rounded-xl border border-primary-200 border-dashed hover:border-solid transition-all w-full justify-center group"
                  >
                    <Plus size={18} className="group-hover:scale-110 transition-transform" /> Add Follow-up Step
                  </button>
                 </div>
               </div>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-indigo-50/50 backdrop-blur-xl p-5 rounded-2xl border border-indigo-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-indigo-900 font-bold text-lg border-b border-indigo-100 pb-3">
                  <Wand2 size={20} className="text-indigo-600" />
                  <span>AI Assistant</span>
                </div>
                
                <div className="space-y-3">
                  <p className="text-sm text-indigo-700 font-medium">
                    Generating for <span className="bg-white px-2 py-0.5 rounded text-indigo-600 border border-indigo-100">Step {activeStepIndex + 1}</span>
                  </p>
                  
                  <div>
                    <label className="text-xs font-semibold text-indigo-600 uppercase mb-1 block">Topic / Goal</label>
                    <textarea 
                      value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
                      placeholder="e.g. Follow up on previous email about partnership..."
                      rows={3}
                      className="w-full p-3 border border-indigo-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-indigo-600 uppercase mb-1 block">Tone</label>
                    <select 
                      value={aiTone} onChange={e => setAiTone(e.target.value)}
                      className="w-full p-2.5 border border-indigo-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    >
                      <option>Professional</option>
                      <option>Friendly</option>
                      <option>Urgent</option>
                      <option>Persuasive</option>
                      <option>Witty</option>
                    </select>
                  </div>

                  <button 
                    onClick={handleAiGenerate}
                    disabled={isGenerating || !aiPrompt}
                    className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 flex justify-center items-center gap-2 mt-2"
                  >
                    {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <Wand2 size={16} />}
                    Generate Draft
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-8 bg-slate-900 text-white p-2 pl-6 pr-2 rounded-full shadow-2xl shadow-slate-900/40 flex items-center gap-6 z-30 border border-slate-700 animate-slide-up">
           <div className="text-sm font-medium text-slate-300">
             <span className="text-white font-bold">{steps.length}</span> step{steps.length > 1 ? 's' : ''} configured
           </div>
           <button 
             onClick={handleCreate}
             className="bg-primary-500 text-white px-6 py-2.5 rounded-full hover:bg-primary-400 font-bold text-sm flex items-center gap-2 transition-colors"
           >
             Launch Campaign <Send size={16} />
           </button>
        </div>
      </div>
    );
  }

  if (view === 'details' && selectedCampaign) {
    return (
      <div className="space-y-8 pb-8 animate-fade-in">
        <div className="flex items-center gap-4 border-b border-slate-200 pb-6">
          <button onClick={() => setView('list')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{selectedCampaign.name}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
               <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide
                  ${selectedCampaign.status === 'running' ? 'bg-green-100 text-green-700' : 
                    selectedCampaign.status === 'completed' ? 'bg-blue-100 text-blue-700' : 
                    'bg-slate-100 text-slate-600'}`}>
                  {selectedCampaign.status}
               </span>
               <span>Created {new Date(selectedCampaign.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="ml-auto flex gap-3">
             <button onClick={handleExportLogs} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium text-sm transition-colors shadow-sm">
                <Download size={16} /> Export Logs
             </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
            <p className="text-sm font-medium text-slate-500">Total Sent</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{selectedCampaign.sentCount}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
             <p className="text-sm font-medium text-slate-500">Opens</p>
             <p className="text-3xl font-bold text-slate-900 mt-1">{selectedCampaign.openCount}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
             <p className="text-sm font-medium text-slate-500">Open Rate</p>
             <p className="text-3xl font-bold text-slate-900 mt-1">
               {selectedCampaign.sentCount > 0 ? Math.round((selectedCampaign.openCount / selectedCampaign.sentCount) * 100) : 0}%
             </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
           <div className="px-6 py-4 border-b border-slate-100 font-bold text-slate-800">
             Campaign Activity Log
           </div>
           {logs.length === 0 ? (
             <div className="p-12 text-center text-slate-400">
               No emails sent yet. Logs will appear here once the campaign starts processing.
             </div>
           ) : (
             <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-slate-500">Time</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-500">Recipient</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-500">Step</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-3 text-slate-500 font-mono text-xs">
                        {new Date(log.sentAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-3 text-slate-900">
                        {log.contactEmail}
                      </td>
                      <td className="px-6 py-3 text-slate-500">
                        #{log.stepOrder}
                      </td>
                      <td className="px-6 py-3">
                         <span className={`flex items-center gap-1.5 
                           ${log.status === 'opened' ? 'text-green-600 font-medium' : 
                             log.status === 'failed' ? 'text-red-500' : 'text-slate-600'}`}>
                            {log.status === 'opened' && <ExternalLink size={14} />}
                            {log.status === 'sent' && <CheckCircle2 size={14} />}
                            {log.status === 'failed' && <AlertCircle size={14} />}
                            {log.status.toUpperCase()}
                         </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
           )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Campaigns</h1>
           <p className="text-slate-500 mt-1">Monitor and manage your outreach sequences.</p>
        </div>
        <button 
          onClick={() => setView('create')}
          className="bg-primary-600 text-white px-5 py-2.5 rounded-xl hover:bg-primary-700 font-medium flex items-center gap-2 shadow-lg shadow-primary-600/20 transition-all hover:scale-105 active:scale-95"
        >
          <Plus size={18} /> New Campaign
        </button>
      </div>

      <div className="grid gap-5">
        {campaigns.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
               <Send size={24} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">No campaigns yet</h3>
            <p className="text-slate-500 mt-1 mb-6">Create your first campaign to start reaching out.</p>
            <button 
              onClick={() => setView('create')}
              className="text-primary-600 font-medium hover:text-primary-700"
            >
              Create Campaign &rarr;
            </button>
          </div>
        ) : (
          campaigns.map(c => (
            <div 
              key={c.id} 
              onClick={() => { setSelectedCampaign(c); setView('details'); }}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-primary-200 transition-all group cursor-pointer"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary-600 transition-colors">{c.name}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide
                      ${c.status === 'running' ? 'bg-green-100 text-green-700' : 
                        c.status === 'completed' ? 'bg-blue-100 text-blue-700' : 
                        'bg-slate-100 text-slate-600'}`}>
                      {c.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-slate-500">
                    <span className="flex items-center gap-1.5"><Calendar size={14} /> {new Date(c.createdAt).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1.5"><ArrowDown size={14} /> {c.steps?.length || 1} Steps</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-8 md:border-l md:border-slate-100 md:pl-8">
                   <div className="flex gap-8 text-center">
                      <div>
                        <div className="text-2xl font-bold text-slate-900">{c.sentCount}</div>
                        <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">Sent</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-slate-900">{c.openCount}</div>
                        <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">Opens</div>
                      </div>
                      <div>
                         <div className="text-2xl font-bold text-slate-900">{c.sentCount > 0 ? Math.round((c.openCount/c.sentCount * 100)) : 0}%</div>
                         <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">Rate</div>
                      </div>
                   </div>

                   <div className="pl-4">
                     <ChevronRight className="text-slate-300 group-hover:text-primary-500 transition-colors" />
                   </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};