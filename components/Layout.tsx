import React from 'react';
import { 
  Link, useLocation, useNavigate 
} from '../App';
import { 
  LayoutDashboard, Search, Users, Send, Settings,
  Menu, X, ChevronRight, ShieldAlert
} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (v: boolean) => void }) => {
  const location = useLocation();

  const links = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/scraper', icon: Search, label: 'Email Scraper' },
    { to: '/contacts', icon: Users, label: 'Contacts' },
    { to: '/campaigns', icon: Send, label: 'Campaigns' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <>
      <div 
        className={`fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-20 md:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      />

      <aside 
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 cubic-bezier(0.4, 0, 0.2, 1) md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-600 rounded-lg shadow-lg shadow-primary-500/30 flex items-center justify-center text-white font-bold text-xl">
              O
            </div>
            <span className="text-lg font-bold text-slate-800 tracking-tight">OutreachFlow</span>
          </div>
          <button 
            onClick={() => setIsOpen(false)} 
            className="md:hidden p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to || (link.to !== '/' && location.pathname.startsWith(link.to));
            
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setIsOpen(false)}
                className={`group flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary-50 text-primary-700 shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={20} className={`transition-colors ${isActive ? 'text-primary-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  {link.label}
                </div>
                {isActive && <ChevronRight size={16} className="text-primary-400" />}
              </Link>
            );
          })}

          <div className="my-2 border-t border-slate-100 mx-2"></div>
          <Link
            to="/admin"
            onClick={() => setIsOpen(false)}
            className={`group flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              location.pathname === '/admin'
                ? 'bg-slate-800 text-white shadow-md shadow-slate-900/20' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <ShieldAlert size={20} className={`transition-colors ${location.pathname === '/admin' ? 'text-rose-400' : 'text-slate-400 group-hover:text-slate-600'}`} />
              Admin Panel
            </div>
            {location.pathname === '/admin' && <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>}
          </Link>
        </nav>
      </aside>
    </>
  );
};

export const Layout = ({ children }: { children?: React.ReactNode }) => {
  const [isSidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen transition-all duration-300">
        <header className="bg-white/80 backdrop-blur-md h-16 border-b border-slate-200 flex items-center px-4 md:hidden sticky top-0 z-10 transition-colors">
          <button 
            onClick={() => setSidebarOpen(true)} 
            className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Menu size={24} />
          </button>
          <span className="ml-3 font-bold text-slate-800 text-lg">OutreachFlow</span>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto overflow-x-hidden">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};