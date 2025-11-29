import React, { useState, useRef } from 'react';
import { useNavigate } from '../App';
import { Play, Loader2, Download, CheckCircle, AlertTriangle, Terminal, Globe, Trash2, MapPin, X } from 'lucide-react';
import { scrapeWebsite, addContacts, scrapeGoogleMaps } from '../services/api';
import { Contact } from '../types';

interface ScrapeLog {
  id: string;
  url: string;
  status: 'pending' | 'processing' | 'success' | 'failed';
  emails: string[];
  error?: string;
}

export const Scraper = () => {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [logs, setLogs] = useState<ScrapeLog[]>([]);
  const [isScraping, setIsScraping] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, found: 0 });
  const [saved, setSaved] = useState(false);
  const shouldStopRef = useRef(false);
  
  // Google Maps State
  const [showMapsModal, setShowMapsModal] = useState(false);
  const [mapsUrl, setMapsUrl] = useState('');
  const [isMapsScraping, setIsMapsScraping] = useState(false);
  const [mapsStatus, setMapsStatus] = useState('');

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleStartScrape = async () => {
    const urls = input.split('\n')
      .map(u => u.trim())
      .filter(u => u.length > 0);

    if (urls.length === 0) {
      alert("Please enter at least one valid URL.");
      return;
    }

    const initialLogs: ScrapeLog[] = urls.map(url => ({
      id: Math.random().toString(36).substr(2, 9),
      url,
      status: 'pending',
      emails: []
    }));

    setLogs(initialLogs);
    setIsScraping(true);
    setSaved(false);
    setProgress({ current: 0, total: urls.length, found: 0 });
    shouldStopRef.current = false;

    let totalEmailsFound = 0;

    for (let i = 0; i < initialLogs.length; i++) {
      if (shouldStopRef.current) break;
      const currentLog = initialLogs[i];
      
      setLogs(prev => prev.map(log => 
        log.id === currentLog.id ? { ...log, status: 'processing' } : log
      ));

      try {
        if (i > 0) await delay(1000); 
        const emails = await scrapeWebsite(currentLog.url);
        totalEmailsFound += emails.length;
        setLogs(prev => prev.map(log => 
          log.id === currentLog.id ? { ...log, status: 'success', emails } : log
        ));
      } catch (err: any) {
        setLogs(prev => prev.map(log => 
          log.id === currentLog.id ? { ...log, status: 'failed', error: err.message } : log
        ));
      }

      setProgress({ current: i + 1, total: urls.length, found: totalEmailsFound });
    }
    setIsScraping(false);
  };

  const handleStop = () => {
    shouldStopRef.current = true;
    setIsScraping(false);
  };

  const handleClear = () => {
    setInput('');
    setLogs([]);
    setProgress({ current: 0, total: 0, found: 0 });
    setSaved(false);
  };

  const handleSaveAll = async () => {
    const allEmails: Contact[] = [];
    logs.forEach(log => {
      if (log.status === 'success' && log.emails.length > 0) {
        log.emails.forEach(email => {
          if (!allEmails.find(c => c.email === email)) {
            allEmails.push({
              id: Math.random().toString(36).substr(2, 9),
              email,
              source: `Bulk Scrape: ${log.url}`,
              status: 'new',
              createdAt: new Date().toISOString()
            });
          }
        });
      }
    });

    if (allEmails.length === 0) return;
    await addContacts(allEmails);
    setSaved(true);
    setTimeout(() => navigate('/contacts'), 1500);
  };
  
  const handleMapsScrape = async () => {
    if (!mapsUrl) return;
    setIsMapsScraping(true);
    setMapsStatus('Initializing Puppeteer on backend...');
    
    try {
      const urls = await scrapeGoogleMaps(mapsUrl, (status) => setMapsStatus(status));
      
      // Merge results
      const currentUrls = input.split('\n').map(u => u.trim()).filter(Boolean);
      const newUrls = [...new Set([...currentUrls, ...urls])]; // Remove duplicates
      
      setInput(newUrls.join('\n'));
      setMapsStatus(`Success! Found ${urls.length} websites.`);
      setTimeout(() => {
        setShowMapsModal(false);
        setIsMapsScraping(false);
        setMapsUrl('');
        setMapsStatus('');
      }, 2000);
    } catch (e: any) {
      setMapsStatus('Error: ' + e.message);
      setIsMapsScraping(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-8 relative">
      {/* Google Maps Modal */}
      {showMapsModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 animate-slide-up overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <MapPin className="text-red-500" size={20} /> Google Maps Scraper
              </h3>
              {!isMapsScraping && (
                <button onClick={() => setShowMapsModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              )}
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Maps Search URL</label>
                <input 
                  type="text" 
                  value={mapsUrl}
                  onChange={(e) => setMapsUrl(e.target.value)}
                  placeholder="https://www.google.com/maps/search/..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm"
                  disabled={isMapsScraping}
                />
                <p className="text-xs text-slate-500">
                  We will launch a headless browser to scroll the results and extract website links.
                </p>
              </div>
              
              {mapsStatus && (
                <div className={`text-sm p-3 rounded-lg flex items-center gap-2 ${
                  mapsStatus.includes('Error') 
                    ? 'bg-red-50 text-red-600' 
                    : mapsStatus.includes('Success') 
                      ? 'bg-green-50 text-green-600'
                      : 'bg-blue-50 text-blue-600'
                }`}>
                  {isMapsScraping && <Loader2 size={16} className="animate-spin" />}
                  {mapsStatus}
                </div>
              )}

              <button 
                onClick={handleMapsScrape}
                disabled={isMapsScraping || !mapsUrl}
                className="w-full py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-all shadow-lg shadow-primary-600/20 flex items-center justify-center gap-2"
              >
                {isMapsScraping ? 'Extracting...' : 'Start Extraction'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Email Scraper</h1>
          <p className="text-slate-500 mt-1">Extract leads from websites efficiently.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowMapsModal(true)}
            disabled={isScraping}
            className="px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 flex items-center gap-2 text-sm font-semibold transition-all shadow-sm"
          >
            <MapPin size={16} className="text-red-500" /> Google Maps
          </button>
          
          {logs.length > 0 && !isScraping && (
            <button 
              onClick={handleClear}
              className="px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-2 text-sm font-medium transition-colors"
            >
              <Trash2 size={16} /> Clear Logs
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Column */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full">
            <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Globe size={16} className="text-primary-500" /> Target Websites
            </label>
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isScraping}
                placeholder={`example.com\nstartup.io\nmarketing-agency.com`}
                className="w-full h-full min-h-[320px] p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none font-mono text-sm resize-none placeholder:text-slate-400 text-slate-700 leading-relaxed"
              />
              <div className="absolute bottom-3 right-3 text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                {input ? input.split('\n').filter(l => l.trim()).length : 0} URL(s)
              </div>
            </div>
            
            <div className="mt-4">
              {!isScraping ? (
                <button
                  onClick={handleStartScrape}
                  disabled={!input.trim()}
                  className="w-full py-3.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary-600/20 hover:shadow-primary-600/30 active:scale-[0.98]"
                >
                  <Play size={18} fill="currentColor" /> Start Extraction
                </button>
              ) : (
                <button
                  onClick={handleStop}
                  className="w-full py-3.5 bg-red-50 text-red-600 font-semibold rounded-xl hover:bg-red-100 border border-red-100 flex items-center justify-center gap-2 transition-colors"
                >
                  <Loader2 size={18} className="animate-spin" /> Stop Process
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Console/Output Column */}
        <div className="lg:col-span-8 flex flex-col h-full min-h-[500px]">
           <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl flex flex-col h-full overflow-hidden">
             
             {/* Terminal Header */}
             <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal size={16} className="text-slate-400" />
                  <span className="text-sm font-medium text-slate-300">Process Log</span>
                </div>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-600"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-600"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-600"></div>
                </div>
             </div>

             {/* Progress Strip */}
             {(isScraping || logs.length > 0) && (
               <div className="bg-slate-800/30 px-4 py-3 border-b border-slate-800">
                 <div className="flex items-center justify-between text-xs font-mono mb-2">
                   <span className="text-slate-400">Progress: {Math.round(progress.total > 0 ? (progress.current / progress.total) * 100 : 0)}%</span>
                   <span className="text-primary-400">{progress.found} Emails Found</span>
                 </div>
                 <div className="w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                   <div 
                     className="bg-primary-500 h-full transition-all duration-300 ease-out"
                     style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
                   ></div>
                 </div>
               </div>
             )}

             {/* Log Content */}
             <div className="flex-1 p-4 overflow-y-auto font-mono text-sm space-y-1">
               {logs.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-slate-600">
                   <Terminal size={32} className="mb-3 opacity-50" />
                   <p>Waiting for input...</p>
                 </div>
               ) : (
                 logs.map((log) => (
                   <div key={log.id} className="flex items-start gap-3 p-2 rounded hover:bg-white/5 transition-colors group">
                     <div className="mt-0.5">
                        {log.status === 'pending' && <div className="w-3 h-3 rounded-full border-2 border-slate-600" />}
                        {log.status === 'processing' && <Loader2 size={14} className="text-blue-400 animate-spin" />}
                        {log.status === 'success' && <CheckCircle size={14} className="text-green-400" />}
                        {log.status === 'failed' && <AlertTriangle size={14} className="text-red-400" />}
                     </div>
                     <div className="flex-1 min-w-0">
                       <div className="flex items-center justify-between">
                         <span className={`truncate ${log.status === 'failed' ? 'text-red-300' : 'text-slate-300'}`}>
                           {log.url}
                         </span>
                         {log.emails.length > 0 && (
                           <span className="text-xs text-slate-900 bg-primary-400 px-1.5 rounded font-bold">
                             {log.emails.length}
                           </span>
                         )}
                       </div>
                       {log.status === 'failed' && (
                         <div className="text-xs text-red-400/80 mt-1 pl-1 border-l-2 border-red-400/30">
                           {log.error}
                         </div>
                       )}
                       {log.emails.length > 0 && (
                         <div className="mt-1 pl-2 border-l-2 border-slate-700 hidden group-hover:block animate-fade-in">
                            {log.emails.map(e => (
                              <div key={e} className="text-xs text-slate-400 block py-0.5">{e}</div>
                            ))}
                         </div>
                       )}
                     </div>
                   </div>
                 ))
               )}
             </div>

             {/* Footer Actions */}
             {progress.found > 0 && (
               <div className="p-4 bg-slate-800 border-t border-slate-700 flex justify-end">
                 {!saved ? (
                    <button 
                      onClick={handleSaveAll}
                      disabled={isScraping}
                      className="flex items-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium text-sm transition-all shadow-lg shadow-green-900/20"
                    >
                      <Download size={16} /> Save Results
                    </button>
                 ) : (
                    <div className="flex items-center gap-2 text-green-400 text-sm font-medium animate-fade-in">
                      <CheckCircle size={16} /> saved to contacts
                    </div>
                 )}
               </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};