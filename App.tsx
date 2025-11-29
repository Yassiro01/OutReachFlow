import React, { useState, useEffect, useContext, createContext } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Scraper } from './pages/Scraper';
import { Contacts } from './pages/Contacts';
import { Campaigns } from './pages/Campaigns';
import { Settings } from './pages/Settings';
import { AdminPanel } from './pages/AdminPanel';

const RouterContext = createContext<{ path: string; navigate: (p: string) => void }>({ path: '/', navigate: () => {} });

// Fixed: Made children optional to resolve TS error 'Property children is missing'
interface HashRouterProps {
  children?: React.ReactNode;
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

// Fixed: Made children optional to resolve TS error 'Property children is missing'
interface RoutesProps {
  children?: React.ReactNode;
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
}

export function Route(props: RouteProps) {
  return null;
}

interface NavigateProps {
  to: string;
}

export function Navigate({ to }: NavigateProps) {
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

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={
          <Layout>
            <Dashboard />
          </Layout>
        } />
        
        <Route path="/scraper" element={
          <Layout>
            <Scraper />
          </Layout>
        } />
        
        <Route path="/contacts" element={
          <Layout>
            <Contacts />
          </Layout>
        } />
        
        <Route path="/campaigns" element={
          <Layout>
            <Campaigns />
          </Layout>
        } />
        
        <Route path="/settings" element={
          <Layout>
            <Settings />
          </Layout>
        } />
        
        <Route path="/admin" element={
          <Layout>
            <AdminPanel />
          </Layout>
        } />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </HashRouter>
  );
}

export default App;