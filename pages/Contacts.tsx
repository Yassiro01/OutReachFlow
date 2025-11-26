
import React, { useState, useEffect, useRef } from 'react';
import { Upload, Download, Trash2, Plus, Search, MoreHorizontal, FileSpreadsheet, Check } from 'lucide-react';
import { Contact } from '../types';
import { getContacts, addContacts } from '../services/mockBackend';

export const Contacts = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setContacts(getContacts());
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const newContacts: Contact[] = [];
      
      // Basic CSV parsing (skipping header)
      // Expected format: email, firstName, lastName, company
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        const email = cols[0];
        
        if (email && email.includes('@')) {
          newContacts.push({
            id: Math.random().toString(36).substr(2, 9),
            email: email,
            firstName: cols[1] || '',
            lastName: cols[2] || '',
            company: cols[3] || '',
            source: 'CSV Import',
            status: 'new',
            createdAt: new Date().toISOString()
          });
        }
      }

      if (newContacts.length > 0) {
        await addContacts(newContacts);
        setContacts(getContacts());
        alert(`Successfully imported ${newContacts.length} contacts.`);
      } else {
        alert('No valid contacts found in CSV. Please ensure the first column is Email.');
      }
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.readAsText(file);
  };

  const handleExport = () => {
    const headers = ["Email", "First Name", "Last Name", "Company", "Source", "Status", "Created At"];
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + contacts.map(c => 
          `${c.email},${c.firstName || ''},${c.lastName || ''},${c.company || ''},${c.source},${c.status},${c.createdAt}`
        ).join("\n");
    
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `contacts_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const filteredContacts = contacts.filter(c => 
    c.email.toLowerCase().includes(search.toLowerCase()) || 
    (c.company || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Contacts</h1>
          <p className="text-slate-500 mt-1">Manage your leads and track their status.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input 
            type="file" 
            ref={fileInputRef}
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={isImporting}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium text-sm transition-colors shadow-sm disabled:opacity-50"
          >
            {isImporting ? <Check size={16} /> : <Upload size={16} />} Import CSV
          </button>
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium text-sm transition-colors shadow-sm">
            <Download size={16} /> Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium text-sm transition-all shadow-lg shadow-primary-600/20">
            <Plus size={16} /> Add Contact
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search contacts..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm"
            />
          </div>
          <div className="text-sm text-slate-500 font-medium">
            {filteredContacts.length} results
          </div>
        </div>
        
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact Details</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Source</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Search size={32} className="mb-2 opacity-20" />
                      <p>No contacts found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredContacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold uppercase">
                          {contact.firstName ? contact.firstName[0] : contact.email[0]}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-900">
                            {contact.firstName} {contact.lastName}
                          </div>
                          <div className="text-xs text-slate-500">{contact.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {contact.company || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      <span className="truncate max-w-[150px] inline-block" title={contact.source}>{contact.source}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-4 font-semibold rounded-full border 
                        ${contact.status === 'new' ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                          contact.status === 'contacted' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' : 
                          contact.status === 'replied' ? 'bg-green-50 text-green-700 border-green-100' :
                          'bg-red-50 text-red-700 border-red-100'}`}>
                        {contact.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
