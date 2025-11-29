import React, { useState, useEffect, useContext, createContext } from 'react';
import { Login } from './pages/Login';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Scraper } from './pages/Scraper';
import { Contacts } from './pages/Contacts';
import { Campaigns } from './pages/Campaigns';
import { Settings } from './pages/Settings';
import { AdminPanel } from './pages/AdminPanel';
import { getCurrentUser } from './services/api';

const RouterContext = createContext<{ path: string; navigate: (p: string) => void }>({ path: '/', navigate: () => {} });

interface HashRouterProps {
  children: React.ReactNode;
}

export function HashRouter({ children }: HashRouterProps) {
  const [path, setPath] = useState(window.location.hash.slice(1) || '/');

  useEffect(() => {
    const handler = () => {
      const currentPath = window.location.hash.slice(1);
      setPath(currentPath || '/');
    };
    window.addEventListener('hashchange', handler);
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

interface RoutesProps {
  children: React.ReactNode;
}

export function Routes({ children }: RoutesProps) {
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

interface RouteProps {
  path: string;
  element: React.ReactNode;
  children?: React.ReactNode;
}

export function Route(props: RouteProps) {
  return null;
}

interface NavigateProps {
  to: string;
  replace?: boolean;
  children?: React.ReactNode;
}

export function Navigate({ to, replace, children }: NavigateProps) {
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

const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const user = getCurrentUser();
  // Ensure user object has an ID to confirm it's valid, not just {}
  if (!user || !user.id) {
    return <Navigate to="/login" replace />;
  }
  
  return (
    <Layout>
      {children}
    </Layout>
  );
};

const AdminRoute = ({ children }: { children?: React.ReactNode }) => {
  const user = getCurrentUser();
  
  if (!user || !user.id) {
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