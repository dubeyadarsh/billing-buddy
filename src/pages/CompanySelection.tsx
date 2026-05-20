import { useState, useEffect, useRef } from 'react';
import { 
  Search, Plus, Building2, ChevronRight, X, Upload, 
  Landmark, LogOut, CheckCircle2, ArrowRight, ArrowLeft,
  LayoutGrid
} from 'lucide-react';

interface CompanySelectionProps {
  onSelectCompany: (id: string) => void;
  onLogout: () => void;
}

const emptyForm = {
  id: null, businessName: '', businessType: 'Retail', logoBase64: '', 
  gstNumber: '', state: '', pincode: '', phone: '', email: '', address: '',
  bankName: '', accountNo: '', ifscCode: '', upiId: ''
};

export function CompanySelection({ onSelectCompany, onLogout }: CompanySelectionProps) {
  const [companies, setCompanies] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  
  // State to hold the activity logs for the selected company
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<any>(emptyForm);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Fetch logs automatically whenever the selected company changes
  useEffect(() => {
    if (selectedCompanyId) {
      const fetchLogs = async () => {
        // Fetch the top 5 most recent logs
        const res = await window.electronAPI.getActivityLogs(Number(selectedCompanyId), 5);
        if (res.success && res.data) {
          setRecentLogs(res.data);
        }
      };
      fetchLogs();
    } else {
      setRecentLogs([]);
    }
  }, [selectedCompanyId]);

 const formatTimeAgo = (dateInput: string) => {
    if (!dateInput) return 'Just now'; // Fallback if no date is provided
    
    // Safely parse SQLite dates (replaces spaces with T to satisfy JS Date parser)
    const safeDateString = dateInput.replace(' ', 'T'); 
    const date = new Date(safeDateString);
    
    if (isNaN(date.getTime())) return 'Just now'; // Fallback if parsing completely fails

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) return alert("Logo must be smaller than 1MB");
    
    const reader = new FileReader();
    reader.onloadend = () => setFormData({ ...formData, logoBase64: reader.result });
    reader.readAsDataURL(file);
  };

  const handleSaveCompany = async () => {
    const dataToSend = { userId: currentUser.id, ...formData };
    const res = isEditMode ? await window.electronAPI.updateCompany(dataToSend) : await window.electronAPI.addCompany(dataToSend);
    
    if (res.success) {
      closeModal();
      loadCompanies(currentUser.id);
    } else {
      alert(res.message);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false); setStep(1); setIsEditMode(false); setFormData(emptyForm);
  };

  const filteredCompanies = companies.filter(c => 
    c.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.gst_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedCompany = companies.find(c => c.id.toString() === selectedCompanyId);

  return (
    <div className="min-h-screen bg-[#f1f4f9] flex flex-col font-sans">
      
      {/* --- TOP NAVBAR --- */}
      <header className="w-full h-[60px] bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-2">
                    <LayoutGrid className="w-5 h-5 text-blue-600" fill="currentColor" fillOpacity={0.2} /> 

          <div className="font-bold text-lg text-blue-700 tracking-tight">BillingBuddy</div>
          
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 pl-4 border-l border-slate-200 cursor-pointer group" onClick={onLogout}>
            <div className="w-7 h-7 bg-slate-800 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {currentUser?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">{currentUser?.username || 'User'}</span>
            <LogOut className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
          </div>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 max-w-[1200px] w-full mx-auto p-6 md:p-10 flex flex-col md:flex-row gap-6 items-stretch">
        
        {/* LEFT PANEL: Master List */}
        <div className="w-full md:w-[380px] bg-white rounded-2xl shadow-sm border border-slate-200/60 flex flex-col overflow-hidden shrink-0">
          
          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search companies..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredCompanies.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm font-medium">
                No companies found.
              </div>
            ) : (
              filteredCompanies.map(company => {
                const isSelected = selectedCompanyId === company.id.toString();
                return (
                  <button 
                    key={company.id}
                    onClick={() => setSelectedCompanyId(company.id.toString())}
                    className={`w-full text-left p-4 rounded-xl transition-all flex items-center justify-between border ${
                      isSelected 
                        ? 'bg-blue-50/50 border-blue-200 shadow-[0_2px_10px_rgba(37,99,235,0.05)]' 
                        : 'bg-white border-transparent hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">{company.business_name}</h3>
                      <div className="flex gap-2 items-center text-[11px] text-slate-500 uppercase font-bold tracking-wider">
                        {company.gst_number ? <span>GSTIN: <span className="text-slate-700">{company.gst_number}</span></span> : <span>UNREGISTERED</span>}
                        {company.state && (
                          <>
                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                            <span>{company.state}</span>
                          </>
                        )}
                      </div>
                    </div>
                    {isSelected ? (
                      <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Details View */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200/60 p-8 flex flex-col relative overflow-hidden">
          
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-50/50 rounded-bl-[100%] pointer-events-none"></div>

          {selectedCompany ? (
            <>
              {/* Company Header */}
              <div className="flex items-center gap-5 mb-10 relative z-10">
                <div className="w-[60px] h-[60px] bg-[#0d47a1] rounded-xl shadow-md flex items-center justify-center text-white shrink-0 overflow-hidden">
                  {selectedCompany.logo_base64 ? (
                     <img src={selectedCompany.logo_base64} alt="logo" className="w-full h-full object-cover bg-white" />
                  ) : (
                     <Building2 className="w-7 h-7" />
                  )}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900 mb-1 tracking-tight">{selectedCompany.business_name}</h1>
                  <p className="text-sm font-medium text-slate-500">
                    {selectedCompany.business_type} Workspace • <span className="text-slate-600">ID: {selectedCompany.id}</span>
                  </p>
                </div>
              </div>

              {/* Information Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10 relative z-10">
                <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Legal Identity</p>
                  <h3 className="font-semibold text-slate-800 mb-1">{selectedCompany.business_name}</h3>
                  {selectedCompany.gst_number ? (
                     <p className="text-sm font-medium text-blue-700 uppercase">{selectedCompany.gst_number}</p>
                  ) : (
                     <p className="text-sm font-medium text-slate-400 italic">No GST Details Available</p>
                  )}
                </div>
                
                <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Primary Contact</p>
                  <h3 className="font-semibold text-slate-800 mb-1">{selectedCompany.phone || 'No Phone Recorded'}</h3>
                  <p className="text-sm font-medium text-slate-600 truncate">{selectedCompany.email || 'No Email Recorded'}</p>
                </div>
              </div>

              {/* LIVE ACTIVITY FEED (Capped at 5 or 6 items) */}
              <div className="mb-auto relative z-10">
                <h3 className="text-sm font-semibold text-slate-900 mb-6">Recent Activity</h3>
                
                <div className="space-y-6 pl-2 border-l-2 border-slate-100 ml-2">
                  
                  {/* Dynamic Database Logs (Slice to 4 items so it never gets congested) */}
                  {recentLogs.slice(0, 4).map((log, index) => {
                    let dotColor = "bg-slate-400";
                    if (log.action_type === 'CREATED') dotColor = "bg-[#0d47a1]"; 
                    if (log.action_type === 'DELETED') dotColor = "bg-red-500";
                    if (log.action_type === 'UPDATED') dotColor = "bg-emerald-500";

                    return (
                      <div key={log.id || index} className="relative pl-6">
                        <div className={`absolute left-[-5px] top-1.5 w-2 h-2 rounded-full ring-4 ring-white ${dotColor}`}></div>
                        <div className="flex justify-between items-start gap-4">
                          <p className="text-sm text-slate-600 leading-snug">
                            {log.description} {log.user_name && log.user_name !== 'System' && <span className="font-bold text-slate-900"> by {log.user_name}</span>}
                          </p>
                          <span className="text-xs font-medium text-slate-400 shrink-0 whitespace-nowrap pt-0.5">
                            {formatTimeAgo(log.created_at)}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {/* STATIC ANCHOR LOG: Always shows at the bottom */}
                  <div className="relative pl-6">
                    <div className="absolute left-[-5px] top-1.5 w-2 h-2 bg-slate-300 rounded-full ring-4 ring-white"></div>
                    <div className="flex justify-between items-start">
                      <p className="text-sm text-slate-600">
                        Workspace initialized by <span className="font-bold text-slate-900">{currentUser?.username || 'User'}</span>
                      </p>
                      <span className="text-xs font-medium text-slate-400">Setup</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Action Footer */}
              <div className="mt-8 pt-6 border-t border-slate-100 flex gap-4 relative z-10">
                <button 
                  onClick={() => onSelectCompany(selectedCompany.id.toString())}
                  className="flex-1 bg-[#004ee3] hover:bg-[#003bb8] text-white py-3.5 rounded-xl font-medium shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
                >
                  Open Company <ArrowRight className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="flex-1 bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 py-3.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Create New
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-200 mb-4">
                <Building2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No Workspace Selected</h3>
              <p className="text-sm text-slate-500 font-medium mb-6">Select a company from the sidebar or create a new one.</p>
              <button 
                  onClick={() => setIsModalOpen(true)}
                  className="bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 py-2.5 px-6 rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Create New Company
              </button>
            </div>
          )}
        </div>
      </main>

      {/* --- ADD COMPANY MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-in border border-slate-100">
            
            <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">{isEditMode ? 'Edit Business Details' : 'Onboard New Business'}</h2>
              <button onClick={closeModal} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"><X className="w-5 h-5"/></button>
            </div>

            <div className="flex px-8 py-5 border-b border-slate-100 bg-white">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex-1 flex items-center relative">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold z-10 transition-all duration-300 ${step >= i ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 ring-4 ring-blue-50' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>{i}</div>
                  {i !== 3 && <div className={`absolute top-1/2 left-8 right-0 h-[2px] -translate-y-1/2 transition-all duration-500 ${step > i ? 'bg-blue-600' : 'bg-slate-100'}`}></div>}
                </div>
              ))}
            </div>

            <div className="p-8 h-[400px] overflow-y-auto bg-white">
              {step === 1 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex gap-6 items-center bg-slate-50 p-5 rounded-2xl border border-slate-200 border-dashed">
                    <div onClick={() => fileInputRef.current?.click()} className="w-24 h-24 bg-white border border-slate-200 shadow-sm rounded-xl flex flex-col items-center justify-center text-slate-500 cursor-pointer hover:border-blue-500 hover:text-blue-500 transition-all overflow-hidden relative group">
                      {formData.logoBase64 ? <img src={formData.logoBase64} className="w-full h-full object-contain p-1" /> : <><Upload className="w-6 h-6 mb-1 group-hover:-translate-y-1 transition-transform" /><span className="text-[10px] font-bold uppercase tracking-wider">Logo</span></>}
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Business Name <span className="text-red-500">*</span></label>
                      <input type="text" value={formData.businessName} onChange={e => setFormData({...formData, businessName: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-slate-900" placeholder="e.g. Quantum Dynamics Inc." />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Business Type</label>
                    <select value={formData.businessType} onChange={e => setFormData({...formData, businessType: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-slate-900">
                      <option>Retail</option><option>Wholesale</option><option>Services</option><option>Manufacturing</option><option>Enterprise</option>
                    </select>
                  </div>
                </div>
              )}
              {step === 2 && (
                <div className="space-y-5 animate-fade-in">
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">GSTIN Number</label>
                      <input type="text" value={formData.gstNumber} onChange={e => setFormData({...formData, gstNumber: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl uppercase outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium" placeholder="27AABCQ1234F1Z5" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">State / Region</label>
                      <input type="text" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium" placeholder="San Francisco, CA" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Phone</label>
                      <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email</label>
                      <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-5">
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Billing Address</label>
                      <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Pincode</label>
                      <input type="text" value={formData.pincode} onChange={e => setFormData({...formData, pincode: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium" />
                    </div>
                  </div>
                </div>
              )}
              {step === 3 && (
                <div className="space-y-5 animate-fade-in">
                   <div className="bg-emerald-50/50 text-emerald-700 p-4 rounded-xl border border-emerald-100 flex items-start mb-2">
                    <Landmark className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
                    <p className="text-sm font-medium leading-relaxed">Add your bank details so clients know where to send payments. These will automatically appear on your printed invoices.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Bank Name</label>
                      <input type="text" value={formData.bankName} onChange={e => setFormData({...formData, bankName: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium" placeholder="HDFC Bank" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Account Number</label>
                      <input type="text" value={formData.accountNo} onChange={e => setFormData({...formData, accountNo: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium" placeholder="0000000000" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">IFSC Code</label>
                      <input type="text" value={formData.ifscCode} onChange={e => setFormData({...formData, ifscCode: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl uppercase outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium" placeholder="HDFC0001234" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Business UPI ID</label>
                      <input type="text" value={formData.upiId} onChange={e => setFormData({...formData, upiId: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium" placeholder="business@upi" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-50 px-8 py-5 border-t border-slate-100 flex justify-between items-center">
              {step > 1 ? (
                <button onClick={() => setStep(step - 1)} className="flex items-center text-slate-600 font-bold hover:text-slate-900 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors"><ArrowLeft className="w-4 h-4 mr-2" /> Back</button>
              ) : <div></div>}
              
              {step < 3 ? (
                <button onClick={() => { if(formData.businessName) setStep(step + 1); else alert('Business Name is required!') }} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl font-bold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center">Next <ChevronRight className="w-4 h-4 ml-1" /></button>
              ) : (
                <button onClick={handleSaveCompany} className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-2.5 rounded-xl font-bold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                  {isEditMode ? 'Save Changes' : 'Complete Setup'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}