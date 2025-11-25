import React, { useState, useRef } from 'react';
import { useNavigate } from '../App';
import { Play, Square, Loader2, Download, CheckCircle, AlertTriangle, FileText, Globe, Trash2, StopCircle } from 'lucide-react';
import { scrapeWebsite, addContacts } from '../services/mockBackend';
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
  
  // Ref to handle stopping the loop
  const shouldStopRef = useRef(false);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleStartScrape = async () => {
    // 1. Parse URLs
    const urls = input.split('\n')
      .map(u => u.trim())
      .filter(u => u.length > 0 && (u.includes('.') || u.includes('localhost')));

    if (urls.length === 0) {
      alert("Please enter at least one valid URL.");
      return;
    }

    // 2. Initialize Logs
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

    // 3. Process Queue
    for (let i = 0; i < initialLogs.length; i++) {
      if (shouldStopRef.current) break;

      const currentLog = initialLogs[i];
      
      // Update status: Processing
      setLogs(prev => prev.map(log => 
        log.id === currentLog.id ? { ...log, status: 'processing' } : log
      ));

      try {
        // Artificial delay to be polite to servers/proxies
        if (i > 0) await delay(2000); 

        const emails = await scrapeWebsite(currentLog.url);
        
        totalEmailsFound += emails.length;
        
        // Update status: Success
        setLogs(prev => prev.map(log => 
          log.id === currentLog.id ? { ...log, status: 'success', emails } : log
        ));
      } catch (err: any) {
        // Update status: Failed
        setLogs(prev => prev.map(log => 
          log.id === currentLog.id ? { ...log, status: 'failed', error: err.message } : log
        ));
      }

      // Update Progress
      setProgress({ 
        current: i + 1, 
        total: urls.length, 
        found: totalEmailsFound 
      });
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
          // Avoid duplicates within the batch
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

    if (allEmails.length === 0) {
      alert("No emails to save.");
      return;
    }

    await addContacts(allEmails);
    setSaved(true);
    setTimeout(() => {
      navigate('/contacts');
    }, 2000);
  };

  const successCount = logs.filter(l => l.status === 'success').length;
  const failedCount = logs.filter(l => l.status === 'failed').length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bulk Email Scraper</h1>
          <p className="text-gray-500">Extract emails from multiple websites automatically.</p>
        </div>
        <div className="flex gap-2">
          {logs.length > 0 && !isScraping && (
            <button 
              onClick={handleClear}
              className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <Trash2 size={16} /> Clear List
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Section */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-full flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Globe size={16} /> Target Websites
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isScraping}
              placeholder={`example.com\nstartup.io\nmarketing-agency.com\nlocalhost:3000`}
              className="flex-1 w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none font-mono text-sm resize-none min-h-[300px] placeholder:text-gray-400"
            />
            <p className="text-xs text-gray-500 mt-2 mb-4">
              Enter one URL per line. We'll verify sites sequentially.
            </p>
            
            {!isScraping ? (
              <button
                onClick={handleStartScrape}
                disabled={!input.trim()}
                className="w-full py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                <Play size={18} /> Start Bulk Scrape
              </button>
            ) : (
              <button
                onClick={handleStop}
                className="w-full py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 transition-colors animate-pulse"
              >
                <Square size={18} /> Stop Process
              </button>
            )}
          </div>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-full min-h-[400px]">
            {/* Header / Progress */}
            <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">Task Queue</h3>
                <span className="text-sm text-gray-500">
                  {progress.current} / {progress.total} sites processed
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                <div 
                  className="bg-primary-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
                ></div>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1.5 text-green-700 bg-green-50 px-2 py-1 rounded">
                  <CheckCircle size={14} /> {successCount} Success
                </span>
                <span className="flex items-center gap-1.5 text-red-700 bg-red-50 px-2 py-1 rounded">
                  <AlertTriangle size={14} /> {failedCount} Failed
                </span>
                <span className="ml-auto font-medium text-primary-700 bg-primary-50 px-3 py-1 rounded-full">
                  {progress.found} Emails Found
                </span>
              </div>
            </div>

            {/* Logs List */}
            <div className="flex-1 overflow-y-auto max-h-[500px] p-0">
              {logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
                  <FileText size={48} className="mb-4 opacity-20" />
                  <p>Queue is empty. Add URLs to start scraping.</p>
                </div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 font-medium">Website</th>
                      <th className="px-4 py-2 font-medium">Status</th>
                      <th className="px-4 py-2 font-medium text-right">Emails</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50 group">
                        <td className="px-4 py-3 font-mono text-gray-600 max-w-[200px] truncate" title={log.url}>
                          {log.url}
                        </td>
                        <td className="px-4 py-3">
                          {log.status === 'pending' && <span className="text-gray-400">Pending...</span>}
                          {log.status === 'processing' && (
                            <span className="text-primary-600 flex items-center gap-2">
                              <Loader2 size={14} className="animate-spin" /> Scraping...
                            </span>
                          )}
                          {log.status === 'success' && (
                            <span className="text-green-600 flex items-center gap-1">
                              <CheckCircle size={14} /> Done
                            </span>
                          )}
                          {log.status === 'failed' && (
                            <span className="text-red-500 flex items-center gap-1" title={log.error}>
                              <AlertTriangle size={14} /> Failed
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {log.emails.length > 0 ? (
                            <div className="group relative inline-block">
                              <span className="bg-primary-50 text-primary-700 px-2 py-1 rounded cursor-help">
                                {log.emails.length} Found
                              </span>
                              {/* Tooltip for emails */}
                              <div className="absolute right-0 z-10 hidden group-hover:block w-64 p-3 mt-1 bg-gray-900 text-white text-xs rounded-lg shadow-xl text-left">
                                <div className="font-semibold mb-1 border-b border-gray-700 pb-1">Found Emails:</div>
                                {log.emails.join('\n')}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer Action */}
            {progress.found > 0 && (
              <div className="p-4 border-t border-gray-200 bg-white rounded-b-xl flex justify-end">
                {!saved ? (
                  <button 
                    onClick={handleSaveAll}
                    disabled={isScraping}
                    className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50"
                  >
                    <Download size={18} />
                    Save {progress.found} Contacts
                  </button>
                ) : (
                  <span className="flex items-center gap-2 text-green-600 font-medium px-4 py-2 bg-green-50 rounded-lg">
                    <CheckCircle size={20} />
                    Saved to Contacts! Redirecting...
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};