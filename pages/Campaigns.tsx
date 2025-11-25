import React, { useState, useEffect } from 'react';
import { Send, Wand2, Play, Pause, Plus, Loader2, Trash2, Clock, Mail, ArrowDown } from 'lucide-react';
import { Campaign, CampaignStep } from '../types';
import { getContacts, getCampaigns, saveCampaign, getSmtpConfig } from '../services/mockBackend';
import { generateEmailContent } from '../services/gemini';

export const Campaigns = () => {
  const [view, setView] = useState<'list' | 'create'>('list');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  
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
    setCampaigns(getCampaigns());
  }, [view]);

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
        delayDays: 3, // Default follow-up delay
        subject: '',
        body: ''
      }
    ]);
  };

  const removeStep = (index: number) => {
    if (steps.length <= 1) return;
    const newSteps = steps.filter((_, i) => i !== index);
    // Reorder
    setSteps(newSteps.map((s, i) => ({ ...s, order: i + 1 })));
    // Reset active index if needed
    if (activeStepIndex >= newSteps.length) {
      setActiveStepIndex(newSteps.length - 1);
    }
  };

  const handleCreate = async () => {
    const smtp = getSmtpConfig();
    if (!smtp.isConfigured) {
      alert("Please configure SMTP settings before creating a campaign.");
      return;
    }

    if (!name || steps.some(s => !s.body)) {
      alert("Please fill in campaign name and email content for all steps.");
      return;
    }

    const contacts = getContacts();
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
  };

  const resetForm = () => {
    setName('');
    setSteps([{ id: '1', order: 1, delayDays: 0, subject: '', body: '' }]);
    setAiPrompt('');
  };

  if (view === 'create') {
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">New Campaign Sequence</h1>
          <button onClick={() => setView('list')} className="text-gray-500 hover:text-gray-700">Cancel</button>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
            <input 
              value={name} onChange={e => setName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" 
              placeholder="e.g. SaaS Outreach - Q4"
            />
          </div>

          {/* AI Generator Helper */}
          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 space-y-3">
            <div className="flex items-center gap-2 text-indigo-800 font-semibold">
              <Wand2 size={20} />
              <span>AI Writing Assistant</span>
            </div>
            <p className="text-xs text-indigo-600">
              Generates content for <strong>Step {activeStepIndex + 1}</strong>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input 
                value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
                placeholder="Topic (e.g. Follow up on proposal)"
                className="col-span-3 p-2 border border-indigo-200 rounded-lg text-sm"
              />
              <select 
                value={aiTone} onChange={e => setAiTone(e.target.value)}
                className="p-2 border border-indigo-200 rounded-lg text-sm"
              >
                <option>Professional</option>
                <option>Friendly</option>
                <option>Urgent</option>
                <option>Persuasive</option>
              </select>
            </div>
            <button 
              onClick={handleAiGenerate}
              disabled={isGenerating || !aiPrompt}
              className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <Wand2 size={16} />}
              Generate Draft for Step {activeStepIndex + 1}
            </button>
          </div>

          {/* Steps Timeline */}
          <div className="space-y-0">
            {steps.map((step, index) => (
              <div key={step.id} className="relative pl-8 pb-8 group" onClick={() => setActiveStepIndex(index)}>
                {/* Connecting Line */}
                {index !== steps.length - 1 && (
                  <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-gray-200 group-hover:bg-primary-200 transition-colors"></div>
                )}
                
                {/* Step Icon/Number */}
                <div className={`absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 z-10 transition-colors ${
                  activeStepIndex === index 
                    ? 'bg-primary-600 border-primary-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-500'
                }`}>
                  {index + 1}
                </div>

                <div className={`bg-white rounded-xl border transition-all duration-200 cursor-pointer ${
                  activeStepIndex === index 
                    ? 'border-primary-500 ring-4 ring-primary-50 shadow-md' 
                    : 'border-gray-200 shadow-sm hover:border-gray-300'
                }`}>
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50 rounded-t-xl">
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-gray-500" />
                      <span className="font-semibold text-gray-700">
                        {index === 0 ? 'Initial Email' : 'Follow-up Email'}
                      </span>
                    </div>
                    {index > 0 && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeStep(index); }}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>

                  <div className="p-6 space-y-4">
                    {index > 0 && (
                      <div className="flex items-center gap-3 bg-yellow-50 p-3 rounded-lg border border-yellow-100 w-fit">
                        <Clock size={16} className="text-yellow-700" />
                        <span className="text-sm text-yellow-800">Wait</span>
                        <input 
                          type="number" 
                          min="1"
                          max="90"
                          value={step.delayDays}
                          onChange={(e) => updateStep(index, 'delayDays', parseInt(e.target.value))}
                          className="w-16 p-1 text-center border border-yellow-300 rounded bg-white text-sm"
                        />
                        <span className="text-sm text-yellow-800">days if no reply</span>
                      </div>
                    )}

                    <div>
                      <input 
                        value={step.subject}
                        onChange={(e) => updateStep(index, 'subject', e.target.value)}
                        placeholder={index > 0 ? "Subject (leave empty to reply to previous thread)" : "Subject Line"}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 font-medium"
                      />
                    </div>

                    <div>
                      <textarea 
                        value={step.body}
                        onChange={(e) => updateStep(index, 'body', e.target.value)}
                        placeholder="Hi {{firstName}}, ..."
                        rows={6}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 font-mono text-sm resize-y"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Add Step Button */}
            <div className="relative pl-8">
               <div className="absolute left-0 top-0 w-8 flex justify-center">
                 <div className="w-0.5 h-full bg-gray-200"></div>
               </div>
               <button 
                onClick={addStep}
                className="ml-0 flex items-center gap-2 text-primary-600 font-medium hover:text-primary-700 bg-primary-50 px-4 py-2 rounded-lg border border-primary-200 transition-all hover:shadow-sm"
              >
                <Plus size={18} /> Add Follow-up Step
              </button>
            </div>
          </div>

          <div className="fixed bottom-0 left-0 md:left-64 right-0 p-4 bg-white border-t border-gray-200 flex justify-end items-center gap-4 z-20">
            <span className="text-sm text-gray-500 hidden sm:inline">
              {steps.length} email{steps.length > 1 ? 's' : ''} in sequence
            </span>
            <button 
              onClick={handleCreate}
              className="bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 font-bold flex items-center gap-2 shadow-lg shadow-primary-200"
            >
              <Send size={18} /> Launch Campaign
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
        <button 
          onClick={() => setView('create')}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 font-medium flex items-center gap-2"
        >
          <Plus size={18} /> New Campaign
        </button>
      </div>

      <div className="grid gap-4">
        {campaigns.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-500">No campaigns yet. Start your first outreach!</p>
          </div>
        ) : (
          campaigns.map(c => (
            <div key={c.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between hover:border-primary-200 transition-colors gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-lg font-semibold text-gray-900">{c.name}</h3>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium 
                    ${c.status === 'running' ? 'bg-green-100 text-green-800' : 
                      c.status === 'completed' ? 'bg-blue-100 text-blue-800' : 
                      'bg-gray-100 text-gray-800'}`}>
                    {c.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-6 text-sm text-gray-500">
                  <span>Created: {new Date(c.createdAt).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1">
                     <ArrowDown size={14} /> {c.steps?.length || 1} Steps
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-8">
                 <div className="flex gap-8 text-center">
                    <div>
                      <div className="text-xl font-bold text-gray-900">{c.sentCount}</div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Sent</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-gray-900">{c.openCount}</div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Opened</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-gray-900">{c.totalContacts}</div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Total</div>
                    </div>
                 </div>

                 <div className="flex items-center gap-3 border-l pl-6 border-gray-200">
                  {c.status === 'running' ? (
                    <button className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg" title="Pause">
                      <Pause size={20} />
                    </button>
                  ) : (
                    <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Resume">
                      <Play size={20} />
                    </button>
                  )}
                 </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};