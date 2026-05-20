import { useState, useEffect } from 'react';
import { Search, Plus, Users, Edit, Trash2, X, Phone, TrendingUp, TrendingDown } from 'lucide-react';

export function PartiesManagement({ companyId }: { companyId: string }) {
  const [parties, setParties] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', gstNumber: '', billingAddress: '', 
    partyType: 'Customer', openingBalance: '', balanceType: 'Receive'
  });

  const fetchParties = async () => {
    const res = await window.electronAPI.getParties(Number(companyId));
    if (res.success && res.data) setParties(res.data);
  };

  useEffect(() => { fetchParties(); }, [companyId]);

  const handleSaveParty = async () => {
    if (!formData.name) return alert("Party Name is required!");
    const payload = { ...formData, companyId: Number(companyId), openingBalance: Number(formData.openingBalance) };
    const res = await window.electronAPI.addParty(payload);
    
    if (res.success) {
      setIsModalOpen(false);
      setFormData({ name: '', phone: '', email: '', gstNumber: '', billingAddress: '', partyType: 'Customer', openingBalance: '', balanceType: 'Receive' });
      fetchParties();
    } else {
      alert(res.message);
    }
  };

  const filteredParties = parties.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.phone?.includes(searchTerm)
  );

  const toReceive = parties.filter(p => p.balance_type === 'Receive').reduce((sum, p) => sum + p.opening_balance, 0);
  const toPay = parties.filter(p => p.balance_type === 'Pay').reduce((sum, p) => sum + p.opening_balance, 0);

  return (
    <div className="bg-white rounded-3xl border border-surface-200 shadow-sm min-h-full flex flex-col relative overflow-hidden animate-fade-in duration-300">
      
      {/* HEADER & TOOLBAR */}
      <div className="px-8 py-6 border-b border-surface-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 z-10 bg-white">
        <div>
          <h2 className="text-2xl font-bold text-surface-900 flex items-center tracking-tight">
            <Users className="w-6 h-6 mr-2.5 text-brand-600" /> Parties & Customers
          </h2>
          <p className="text-sm text-surface-500 mt-1 font-medium">Manage your clients, suppliers, and their balances.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-72 group">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 group-focus-within:text-brand-500 transition-colors" />
            <input type="text" placeholder="Search name or phone..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium" />
          </div>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center px-5 py-2.5 text-sm font-bold text-white bg-surface-900 rounded-xl shadow-sm hover:bg-brand-600 hover:-translate-y-0.5 transition-all shrink-0">
            <Plus className="w-4 h-4 mr-1.5" /> Add Party
          </button>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 bg-surface-50/50 border-b border-surface-100">
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Total to Receive</p>
            <h3 className="text-2xl font-black text-surface-900 tracking-tight">₹ {toReceive.toFixed(2)}</h3>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shadow-inner"><TrendingUp className="w-6 h-6"/></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">Total to Pay</p>
            <h3 className="text-2xl font-black text-surface-900 tracking-tight">₹ {toPay.toFixed(2)}</h3>
          </div>
          <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 shadow-inner"><TrendingDown className="w-6 h-6"/></div>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="flex-1 overflow-auto bg-white">
        {filteredParties.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-surface-400 animate-fade-in">
            <div className="w-16 h-16 bg-surface-50 rounded-full flex items-center justify-center mb-4 border border-surface-100">
              <Users className="w-8 h-8 text-surface-300" />
            </div>
            <p className="font-medium text-surface-500">No parties found.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-surface-50/90 backdrop-blur-md border-b border-surface-200 text-[10px] font-bold text-surface-500 uppercase z-10 tracking-wider">
              <tr>
                <th className="px-8 py-4">Party Name</th>
                <th className="px-8 py-4">Contact</th>
                <th className="px-8 py-4">Type</th>
                <th className="px-8 py-4">Balance</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {filteredParties.map((party) => (
                <tr key={party.id} className="hover:bg-brand-50/30 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="font-bold text-surface-900 capitalize text-sm">{party.name}</div>
                    {party.gst_number && <div className="text-[10px] font-bold text-surface-400 mt-1 uppercase tracking-wider">GST: {party.gst_number}</div>}
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center text-sm text-surface-600 font-medium">
                      <Phone className="w-3.5 h-3.5 mr-2 text-surface-400" /> {party.phone || 'N/A'}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-md uppercase tracking-wider ${party.party_type === 'Customer' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-purple-50 text-purple-700 border border-purple-100'}`}>
                      {party.party_type}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className={`font-bold text-sm ${party.opening_balance === 0 ? 'text-surface-400' : party.balance_type === 'Receive' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      ₹ {party.opening_balance.toFixed(2)}
                      {party.opening_balance > 0 && <span className="text-[10px] ml-1.5 uppercase font-bold">{party.balance_type === 'Receive' ? '(Dr)' : '(Cr)'}</span>}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-surface-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                      <button className="p-2 text-surface-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* --- ADD PARTY MODAL (Glassmorphism) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-900/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl flex flex-col animate-scale-in border border-surface-100 overflow-hidden">
            
            <div className="px-8 py-5 border-b border-surface-100 flex justify-between items-center bg-surface-50/50">
              <h3 className="font-bold text-lg text-surface-900 tracking-tight">Add New Party</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-surface-400 hover:bg-surface-200 hover:text-surface-700 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-8 space-y-5">
              <div>
                <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Party Name <span className="text-red-500">*</span></label>
                <input type="text" className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium text-surface-900" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Ramesh Traders" />
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Phone Number</label>
                  <input type="text" className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium text-surface-900" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="10-digit number" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Party Type</label>
                  <select className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium text-surface-900" value={formData.partyType} onChange={e => setFormData({...formData, partyType: e.target.value})}>
                    <option value="Customer">Customer</option>
                    <option value="Supplier">Supplier</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">GST Number (Optional)</label>
                <input type="text" className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl outline-none uppercase focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium text-surface-900" value={formData.gstNumber} onChange={e => setFormData({...formData, gstNumber: e.target.value})} placeholder="27XXXXX..." />
              </div>
              
              <div className="border-t border-surface-100 pt-6 grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Opening Balance (₹)</label>
                  <input type="number" className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium text-surface-900" value={formData.openingBalance} onChange={e => setFormData({...formData, openingBalance: e.target.value})} placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">To Pay or Receive?</label>
                  <select className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium text-surface-900" value={formData.balanceType} onChange={e => setFormData({...formData, balanceType: e.target.value})}>
                    <option value="Receive">To Receive</option>
                    <option value="Pay">To Pay</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="px-8 py-5 border-t border-surface-100 bg-surface-50 flex gap-3">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 bg-white border border-surface-200 text-surface-700 rounded-xl font-bold hover:bg-surface-100 transition-colors">Cancel</button>
              <button onClick={handleSaveParty} className="flex-1 px-4 py-2.5 bg-brand-600 text-white rounded-xl font-bold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">Save Party</button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}