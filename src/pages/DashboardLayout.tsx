import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Package, FileText, Users, Settings, 
  Search, Bell, Landmark, ChevronUp, ChevronDown, Check, Building2, Plus, 
  HelpCircle, UserCircle, LayoutGrid, Activity, PanelLeftClose, PanelLeftOpen, AlertTriangle, ArrowLeft, LogOut 
} from 'lucide-react';
import { CreateInvoice } from './CreateInvoice';
import { TransactionHistory } from './TransactionHistory';
import { CreatePurchase } from './CreatePurchase';
import { InventoryManagement } from './InventoryManagement';
import { PartiesManagement } from './PartiesManagement';
import { CustomTemplateSettings } from './CustomTemplateSettings';
import { CashBank } from './CashBank';
import { ActivityLogs } from './ActivityLogs';
import { HomeDashboard } from './HomeDashboard';

interface DashboardLayoutProps {
  initialCompanyId?: string; 
  onLogout: () => void;
  onBackToSelection?: () => void;
}

export function DashboardLayout({ initialCompanyId, onLogout, onBackToSelection }: DashboardLayoutProps) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(initialCompanyId || null);
  const [activeTab, setActiveTab] = useState<'home' | 'inventory' | 'invoices' | 'parties' | 'settings' | 'create-sale' | 'create-purchase' | 'cash-bank' | 'logs'>('home');
  
  // NEW: State to hold the transaction data while switching screens
  const [transactionToEdit, setTransactionToEdit] = useState<any>(null);

  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  const [systemAlerts, setSystemAlerts] = useState<any[]>([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const userStr = sessionStorage.getItem('activeUser');
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
      loadCompanies(user.id);
    }
  }, []);

  const loadCompanies = async (userId: number) => {
    const res = await window.electronAPI.getCompanies(userId);
    if (res.success && res.data) {
      setCompanies(res.data);
      if (res.data.length > 0 && !selectedCompanyId) {
        setSelectedCompanyId(res.data[0].id.toString());
      }
    }
  };

  const fetchAlerts = async () => {
    if (!selectedCompanyId) return;
    const res = await window.electronAPI.getSystemAlerts(Number(selectedCompanyId));
    if (res.success && res.data) setSystemAlerts(res.data);
  };

  useEffect(() => {
    fetchAlerts();
  }, [selectedCompanyId, activeTab]);

  const formatTimeAgo = (dateInput: string) => {
    if (!dateInput) return 'Just now';
    const safeDateString = dateInput.replace(' ', 'T'); 
    const date = new Date(safeDateString);
    if (isNaN(date.getTime())) return 'Just now';
    const diffInSeconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const handleQuickPay = async (invoiceId: number, amount: number) => {
    if (window.confirm(`Record a payment of ₹${amount} for this invoice?`)) {
      const res = await window.electronAPI.recordInvoicePayment({
        invoiceId, 
        companyId: Number(selectedCompanyId), 
        paymentAmount: amount
      });
      if (res.success) {
        fetchAlerts();
      } else {
        alert("Failed to record payment.");
      }
    }
  };

  // NEW: Handler to catch the Edit trigger from TransactionHistory
  const handleEditTransaction = (data: any) => {
    setTransactionToEdit(data);
    if (data.type === 'Sale') {
      setActiveTab('create-sale');
    } else if (data.type === 'Purchase') {
      setActiveTab('create-purchase');
    }
  };

  const selectedCompany = companies.find(c => c.id.toString() === selectedCompanyId);

  const NavItem = ({ id, icon: Icon, label }: { id: any, icon: any, label: string }) => {
    const isActive = activeTab === id;
    return (
      <button 
        onClick={() => {
          setActiveTab(id);
          // Optional: Clear edit state if they click a sidebar link midway through editing
          if (id !== 'create-sale' && id !== 'create-purchase') {
            setTransactionToEdit(null);
          }
        }} 
        title={isSidebarCollapsed ? label : ''}
        className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'px-4'} py-3 mb-2 rounded-xl text-sm font-semibold transition-all ${
          isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
        }`}
      >
        <Icon className={`w-5 h-5 ${isSidebarCollapsed ? '' : 'mr-3'} ${isActive ? 'text-blue-600' : ''}`} />
        {!isSidebarCollapsed && label}
      </button>
    );
  };

  if (!currentUser) return null;

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans overflow-hidden">
      
      {/* ================= LEFT SIDEBAR ================= */}
      <div className={`${isSidebarCollapsed ? 'w-[80px]' : 'w-[260px]'} bg-white border-r border-slate-200 flex flex-col z-20 shrink-0 transition-all duration-300 ease-in-out`}>
        
        <div className={`h-16 flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'px-6 justify-between'} border-b border-slate-100`}>
          {!isSidebarCollapsed && (
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-lg mr-3 shadow-md shadow-blue-500/20 shrink-0">
                <LayoutGrid className="w-4 h-4" />
              </div>
              <div className="truncate">
                <h1 className="font-bold text-slate-900 leading-tight">BillingBuddy by Adarsh</h1>
              </div>
            </div>
          )}
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
            className={`text-slate-400 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100 transition-colors ${isSidebarCollapsed ? '' : 'ml-2'}`}
          >
            {isSidebarCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </button>
        </div>

        <nav className={`flex-1 py-6 overflow-y-auto ${isSidebarCollapsed ? 'px-3' : 'px-4'}`}>
          <NavItem id="home" icon={LayoutDashboard} label="Dashboard" />
          <NavItem id="inventory" icon={Package} label="Inventory" />
          <NavItem id="parties" icon={Users} label="Parties" />
          <NavItem id="invoices" icon={FileText} label="Transactions" />
          <NavItem id="cash-bank" icon={Landmark} label="Cash / Bank" />
          <div className="mt-6 mb-2 border-t border-slate-100 pt-6"></div>
          <NavItem id="settings" icon={Settings} label="Settings" />
        </nav>

        {/* Company Switcher */}
        <div className={`p-4 border-t border-slate-100 relative bg-slate-50/50 ${isSidebarCollapsed ? 'flex justify-center' : ''}`}>
          <button 
            onClick={() => setIsCompanyDropdownOpen(!isCompanyDropdownOpen)}
            title={isSidebarCollapsed ? selectedCompany?.business_name : ''}
            className={`flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 shadow-sm hover:border-blue-300 transition-all ${isSidebarCollapsed ? 'w-10 h-10' : 'w-full'}`}
          >
            <div className="flex items-center overflow-hidden text-left w-full justify-center">
              {selectedCompany?.logo_base64 ? (
                <img src={selectedCompany.logo_base64} className={`${isSidebarCollapsed ? 'w-6 h-6' : 'w-8 h-8'} rounded-lg bg-white object-contain border border-slate-200 shrink-0`} />
              ) : (
                <div className={`${isSidebarCollapsed ? 'w-6 h-6' : 'w-8 h-8'} bg-slate-800 rounded-lg flex items-center justify-center text-white shrink-0`}><Building2 className="w-4 h-4" /></div>
              )}
              
              {!isSidebarCollapsed && (
                <div className="ml-3 truncate flex-1">
                  <p className="text-sm font-bold text-slate-900 truncate">{selectedCompany?.business_name || 'Select Company'}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{selectedCompany?.business_type || 'Workspace'}</p>
                </div>
              )}
            </div>
            
            {!isSidebarCollapsed && (
              <div className="flex flex-col text-slate-400 shrink-0 ml-2">
                <ChevronUp className="w-3 h-3" /><ChevronDown className="w-3 h-3 -mt-1" />
              </div>
            )}
          </button>

          {isCompanyDropdownOpen && (
            <div className="absolute bottom-[calc(100%+8px)] left-4 right-4 bg-white border border-slate-200 shadow-xl rounded-xl overflow-hidden z-50 animate-fade-in w-64 flex flex-col">
              <div className="max-h-[200px] overflow-y-auto p-2">
                {companies.map(c => (
                  <button 
                    key={c.id} onClick={() => { setSelectedCompanyId(c.id.toString()); setIsCompanyDropdownOpen(false); }}
                    className="w-full flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-lg text-left"
                  >
                    <span className="text-sm font-semibold text-slate-700 truncate pr-2">{c.business_name}</span>
                    {selectedCompanyId === c.id.toString() && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                  </button>
                ))}
              </div>
              <div className="p-2 border-t border-slate-100 bg-slate-50">
                <button 
                  onClick={() => onBackToSelection ? onBackToSelection() : window.location.reload()} 
                  className="w-full flex items-center justify-center py-2 text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> View All Workspaces
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= MAIN AREA ================= */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 shrink-0 z-30">
          <div className="relative w-[400px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search transactions, parties or items..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium transition-all" />
          </div>
          
          <div className="flex items-center gap-4 relative">
            <button onClick={() => { setActiveTab('create-purchase'); setTransactionToEdit(null); }} className="px-4 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 rounded-lg text-sm font-bold transition-all shadow-sm">New Purchase</button>
            <button onClick={() => { setActiveTab('create-sale'); setTransactionToEdit(null); }} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-all shadow-sm">Create Invoice</button>
            
            <div className="w-px h-6 bg-slate-200 mx-2"></div>
            
            {/* Notifications Dropdown */}
            <div className="relative">
              <button 
                onClick={() => { setIsNotificationsOpen(!isNotificationsOpen); setIsProfileOpen(false); }} 
                className={`p-2 rounded-full transition-colors relative ${isNotificationsOpen ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
              >
                <Bell className="w-5 h-5" />
                {systemAlerts.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>}
              </button>

              {isNotificationsOpen && (
                <div className="absolute top-[calc(100%+8px)] right-0 w-80 bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden z-50 animate-fade-in-up">
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 text-sm">System Alerts</h3>
                  </div>
                  
                  <div className="max-h-[350px] overflow-y-auto">
                    {systemAlerts.length === 0 ? (
                      <div className="p-6 text-center text-slate-500 text-sm">No action required at this time.</div>
                    ) : (
                      <div className="divide-y divide-slate-50">
                        {systemAlerts.map((log, i) => {
                          const isWarning = log.action_type === 'WARNING';
                          const isOverdue = log.action_type === 'OVERDUE';
                          const Icon = isOverdue ? AlertTriangle : Activity;

                          return (
                            <div key={i} className="p-4 hover:bg-slate-50 transition-colors flex gap-3 items-start">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${
                                isOverdue ? 'bg-red-50 text-red-600 border-red-100' : 
                                isWarning ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                                'bg-blue-50 text-blue-600 border-blue-100'
                              }`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-slate-800 leading-snug">{log.description}</p>
                                <div className="flex items-center gap-2 mt-1 mb-2">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{log.module}</span>
                                  <span className="text-xs font-medium text-slate-500">{formatTimeAgo(log.created_at)}</span>
                                </div>
                                
                                {isOverdue && (
                                  <button 
                                    onClick={() => handleQuickPay(log.invoice_id, log.balance_due)}
                                    className="text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 rounded shadow-sm transition-colors w-full"
                                  >
                                    Mark as Paid (₹{log.balance_due})
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button className="text-slate-400 hover:text-slate-600 p-2"><HelpCircle className="w-5 h-5" /></button>

            {/* Profile & Logout Dropdown */}
            <div className="relative">
              <div 
                className="w-8 h-8 bg-slate-800 rounded-full ml-2 border border-slate-300 overflow-hidden cursor-pointer hover:ring-2 ring-blue-500/30 transition-all flex items-center justify-center text-white font-bold text-sm" 
                onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotificationsOpen(false); }}
              >
                {currentUser?.username?.[0]?.toUpperCase() || <UserCircle className="w-full h-full text-slate-500" />}
              </div>

              {isProfileOpen && (
                <div className="absolute top-[calc(100%+12px)] right-0 w-64 bg-white border border-slate-200 shadow-xl rounded-2xl overflow-hidden z-50 animate-fade-in-up">
                  <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col items-center text-center">
                    <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-2xl mb-3 shadow-inner border-2 border-white">
                      {currentUser?.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <p className="font-bold text-slate-900 text-base">{currentUser?.username || 'System User'}</p>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">{currentUser?.email || currentUser?.contact || 'No contact details found'}</p>
                  </div>
                  <div className="p-2">
                    <button 
                      onClick={() => { setIsProfileOpen(false); onLogout(); }} 
                      className="w-full flex items-center justify-center px-4 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-2" /> Sign Out completely
                    </button>
                  </div>
                </div>
              )}
            </div>
            
          </div>
        </header>

        <main className="flex-1 overflow-auto relative">
          {activeTab === 'home' && selectedCompanyId && (
            <HomeDashboard companyId={selectedCompanyId} companyName={selectedCompany?.business_name || ''} onNavigate={(tab) => setActiveTab(tab)} />
          )}

          {selectedCompanyId && activeTab !== 'home' && (
            <div className="p-6 h-full animate-fade-in">
              {activeTab === 'parties' && <PartiesManagement companyId={selectedCompanyId} />}
              
              {/* UPDATED: Pass the handler to TransactionHistory */}
              {activeTab === 'invoices' && (
                <TransactionHistory 
                  companyId={selectedCompanyId} 
                  onEditTransaction={handleEditTransaction} 
                />
              )}
              
              {activeTab === 'inventory' && <InventoryManagement companyId={selectedCompanyId} />}
              {activeTab === 'settings' && <CustomTemplateSettings companyId={selectedCompanyId} />}
              {activeTab === 'cash-bank' && <CashBank companyId={selectedCompanyId} />}
              {activeTab === 'logs' && <ActivityLogs companyId={selectedCompanyId} />}
            </div>
          )}

          {/* UPDATED: Pass editData to CreateInvoice and clear on back */}
          {selectedCompanyId && activeTab === 'create-sale' && (
            <div className="absolute inset-0 z-50 bg-[#f8fafc] animate-fade-in">
              <CreateInvoice 
                companyId={selectedCompanyId} 
                onBack={() => {
                  setActiveTab('home');
                  setTransactionToEdit(null);
                }} 
                editData={transactionToEdit}
              />
            </div>
          )}

          {/* UPDATED: Pass editData to CreatePurchase and clear on back */}
          {selectedCompanyId && activeTab === 'create-purchase' && (
            <div className="absolute inset-0 z-50 bg-[#f8fafc] animate-fade-in">
              <CreatePurchase 
                companyId={selectedCompanyId} 
                onBack={() => {
                  setActiveTab('home');
                  setTransactionToEdit(null);
                }} 
                editData={transactionToEdit}
              />
            </div>
          )}
        </main>
      </div>

    </div>
  );
}