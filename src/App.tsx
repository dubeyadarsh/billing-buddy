import { useState, useEffect } from 'react';
import { AuthPage } from './pages/AuthPage';
import { CompanySelection } from './pages/CompanySelection';
import { DashboardLayout } from './pages/DashboardLayout';

function App() {
  // We added 'auth' and made it the default starting view
  const [view, setView] = useState<'auth' | 'selection' | 'dashboard'>('auth');
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);

  // Check if user is already logged in (session survives React reloads)
  useEffect(() => {
    const activeUser = sessionStorage.getItem('activeUser');
    if (activeUser) {
      setView('selection');
    }
  }, []);

  const handleLoginSuccess = () => {
    setView('selection'); // Move to company selection after login
  };

  const handleCompanySelect = (id: string) => {
    setActiveCompanyId(id);
    setView('dashboard');
  };

  const handleSwitchCompany = () => {
    setActiveCompanyId(null);
    setView('selection');
  };

  // Optional: Add a logout handler to clear session and return to auth
  const handleLogout = () => {
    sessionStorage.removeItem('activeUser');
    setActiveCompanyId(null);
    setView('auth');
  };

  return (
    <>
      {view === 'auth' && (
        <AuthPage onLoginSuccess={handleLoginSuccess} />
      )}

      {view === 'selection' && (
        <CompanySelection 
          onSelectCompany={handleCompanySelect} 
          onLogout={handleLogout} // Pass this down to your selection screen UI
        />
      )}
      
      {view === 'dashboard' && activeCompanyId && (
        <DashboardLayout 
          companyId={activeCompanyId} 
          onSwitchCompany={handleSwitchCompany} 
        />
      )}
    </>
  );
}

export default App;