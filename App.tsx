import React, { useState, useEffect, useContext, createContext } from 'react';
import { Login } from './pages/Login';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Scraper } from './pages/Scraper';
import { Contacts } from './pages/Contacts';
import { Campaigns } from './pages/Campaigns';
import { Settings } from './pages/Settings';
import { AdminPanel } from './pages/AdminPanel';
import { getCurrentUser } from './services/mockBackend';

// Custom Router Implementation to replace missing react-router-dom
const RouterContext = createContext<{ path: string; navigate: (p: string) => void }>({ path: '/', navigate: () => {} });

export function HashRouter({ children }: { children: React.ReactNode }) {
  const [path, setPath] = useState(window.location.hash.slice(1) || '/');

  useEffect(() => {
    const handler = () => {
      const currentPath = window.location.hash.slice(1);
      setPath(currentPath || '/');
    };
    window.addEventListener('hashchange', handler);
    // Initialize if needed
    if (!window.location.hash) window.location.hash = '#/';
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const navigate = (newPath: string) => {
    window.location.hash = newPath;
  };

  return (
    <RouterContext.Provider value={{ path, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function Routes({ children }: { children?: React.ReactNode }) {
  const { path } = useContext(RouterContext);
  let match: React.ReactNode = null;
  let fallback: React.ReactNode = null;

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    const { path: routePath, element } = child.props as any;
    
    if (routePath === path) {
      match = element;
    }
    if (routePath === '*') {
      fallback = element;
    }
  });

  return <>{match || fallback}</>;
}

export function Route({ path, element }: { path: string, element: React.ReactNode; children?: React.ReactNode }) {
  return null;
}

export function Navigate({ to, replace }: { to: string, replace?: boolean }) {
  const { navigate } = useContext(RouterContext);
  useEffect(() => {
    navigate(to);
  }, [to]);
  return null;
}

export function useLocation() {
  const { path } = useContext(RouterContext);
  return { pathname: path };
}

export function useNavigate() {
  const { navigate } = useContext(RouterContext);
  return navigate;
}

export function Link({ to, children, className, onClick }: any) {
  const { navigate } = useContext(RouterContext);
  return (
    <a 
      href={`#${to}`} 
      className={className}
      onClick={(e) => {
        e.preventDefault();
        if (onClick) onClick(e);
        navigate(to);
      }}
    >
      {children}
    </a>
  );
}

// Wrapper for protected routes
const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const user = getCurrentUser();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return (
    <Layout>
      {children}
    </Layout>
  );
};

// Wrapper for Admin Routes
const AdminRoute = ({ children }: { children?: React.ReactNode }) => {
  const user = getCurrentUser();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <Layout>
      {children}
    </Layout>
  );
};

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/scraper" element={
          <ProtectedRoute>
            <Scraper />
          </ProtectedRoute>
        } />
        
        <Route path="/contacts" element={
          <ProtectedRoute>
            <Contacts />
          </ProtectedRoute>
        } />
        
        <Route path="/campaigns" element={
          <ProtectedRoute>
            <Campaigns />
          </ProtectedRoute>
        } />
        
        <Route path="/settings" element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } />
        
        <Route path="/admin" element={
          <AdminRoute>
            <AdminPanel />
          </AdminRoute>
        } />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;