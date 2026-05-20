import { useState, useEffect } from 'react';
import { Wallet, Landmark, Plus, ArrowRightLeft, X, History, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export function CashBank({ companyId }: { companyId: string }) {
  const [accounts, setAccounts] = useState<any[]>([]);
  
  // Modals
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  
  // Passbook State
  const [activeAccount, setActiveAccount] = useState<any>(null);
  const [statement, setStatement] = useState<any[]>([]);

  // Forms
  const [accountForm, setAccountForm] = useState({ accountName: '', accountType: 'Bank', openingBalance: '' });
  const [transferForm, setTransferForm] = useState({ fromAccountId: '', toAccountId: '', amount: '', notes: '' });

  const fetchAccounts = async () => {
    const res = await window.electronAPI.getAccounts(Number(companyId));
    const safeData = res.data || []; 
    if (res.success) {
      setAccounts(safeData);
      if (safeData.length > 1 && !transferForm.fromAccountId) {
        setTransferForm(prev => ({ ...prev, fromAccountId: safeData[0].id.toString(), toAccountId: safeData[1].id.toString() }));
      }
    }
  };

  useEffect(() => { fetchAccounts(); }, [companyId]);

  const handleSaveAccount = async () => {
    if (!accountForm.accountName) return alert("Account Name required!");
    const res = await window.electronAPI.addAccount({
      companyId: Number(companyId),
      accountName: accountForm.accountName,
      accountType: accountForm.accountType,
      openingBalance: Number(accountForm.openingBalance || 0)
    });
    if (res.success) {
      setIsAccountModalOpen(false);
      setAccountForm({ accountName: '', accountType: 'Bank', openingBalance: '' });
      fetchAccounts();
    }
  };

  const handleTransfer = async () => {
    if (transferForm.fromAccountId === transferForm.toAccountId) return alert("Cannot transfer to the same account!");
    if (!transferForm.amount || Number(transferForm.amount) <= 0) return alert("Enter a valid amount!");
    
    const res = await window.electronAPI.transferBalance({
      companyId: Number(companyId),
      fromAccountId: Number(transferForm.fromAccountId),
      toAccountId: Number(transferForm.toAccountId),
      amount: Number(transferForm.amount),
      notes: transferForm.notes
    });

    if (res.success) {
      setIsTransferModalOpen(false);
      setTransferForm({ ...transferForm, amount: '', notes: '' });
      fetchAccounts();
    }
  };

  const openStatement = async (account: any) => {
    setActiveAccount(account);
    const res = await window.electronAPI.getAccountStatement(account.id);
    if(res.success && res.data) {
        setStatement(res.data);
    }
  };

  return (
    <div className="bg-slate-50 min-h-full p-6 animate-fade-in duration-300 relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center tracking-tight">
            <Landmark className="w-6 h-6 mr-2.5 text-blue-600" /> Cash & Bank
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Manage accounts and record internal transfers.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setIsTransferModalOpen(true)} className="flex items-center px-4 py-2.5 text-sm font-bold bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 shadow-sm transition-all">
            <ArrowRightLeft className="w-4 h-4 mr-2 text-slate-400" /> Transfer Money
          </button>
          <button onClick={() => setIsAccountModalOpen(true)} className="flex items-center px-4 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl shadow-sm hover:bg-blue-700 hover:-translate-y-0.5 transition-all">
            <Plus className="w-4 h-4 mr-1.5" /> Add Account
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map(acc => (
          <div key={acc.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-300 transition-colors">
            <div className={`absolute top-0 right-0 w-24 h-24 transform translate-x-8 -translate-y-8 rounded-full opacity-10 ${acc.account_type === 'Cash' ? 'bg-emerald-500' : 'bg-blue-500'} group-hover:scale-110 transition-transform duration-500`}></div>
            
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-3 border ${acc.account_type === 'Cash' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                    {acc.account_type === 'Cash' ? <Wallet className="w-5 h-5" /> : <Landmark className="w-5 h-5" />}
                </div>
                <div>
                    <h3 className="font-bold text-slate-800">{acc.account_name}</h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{acc.account_type} Account</span>
                </div>
              </div>
            </div>
            
            <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Available Balance</p>
            <p className={`text-3xl font-black mb-6 ${acc.current_balance < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              ₹ {acc.current_balance.toLocaleString('en-IN', {minimumFractionDigits: 2})}
            </p>

            <button onClick={() => openStatement(acc)} className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-sm rounded-xl border border-slate-200 transition-colors">
                <History className="w-4 h-4" /> View Statement
            </button>
          </div>
        ))}
      </div>

      {/* --- ADD ACCOUNT MODAL --- */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl flex flex-col animate-scale-in border border-slate-100">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-lg text-slate-900 tracking-tight">Add Bank / Cash Account</h3>
              <button onClick={() => setIsAccountModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Account Name</label>
                <input type="text" value={accountForm.accountName} onChange={e => setAccountForm({...accountForm, accountName: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium" placeholder="e.g. HDFC Current Account" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Type</label>
                  <select value={accountForm.accountType} onChange={e => setAccountForm({...accountForm, accountType: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 font-medium">
                    <option value="Bank">Bank Account</option>
                    <option value="Cash">Cash Account</option>
                    <option value="E-Wallet">E-Wallet</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Opening Bal (₹)</label>
                  <input type="number" value={accountForm.openingBalance} onChange={e => setAccountForm({...accountForm, openingBalance: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium" placeholder="0.00" />
                </div>
              </div>
            </div>
            <div className="px-6 py-5 border-t border-slate-100 bg-slate-50 flex gap-3">
              <button onClick={() => setIsAccountModalOpen(false)} className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-100">Cancel</button>
              <button onClick={handleSaveAccount} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-sm hover:bg-blue-700">Save Account</button>
            </div>
          </div>
        </div>
      )}

      {/* --- TRANSFER MODAL --- */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl flex flex-col animate-scale-in border border-slate-100">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-lg text-slate-900 tracking-tight">Transfer Money</h3>
              <button onClick={() => setIsTransferModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              
              <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">From</label>
                    <select value={transferForm.fromAccountId} onChange={e => setTransferForm({...transferForm, fromAccountId: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold text-sm text-slate-700">
                        {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.account_name}</option>)}
                    </select>
                  </div>
                  <ArrowRightLeft className="w-6 h-6 text-slate-300 shrink-0 mt-6" />
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">To</label>
                    <select value={transferForm.toAccountId} onChange={e => setTransferForm({...transferForm, toAccountId: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold text-sm text-slate-700">
                        {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.account_name}</option>)}
                    </select>
                  </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Transfer Amount (₹)</label>
                <input type="number" value={transferForm.amount} onChange={e => setTransferForm({...transferForm, amount: e.target.value})} className="w-full px-4 py-3 bg-white border border-blue-200 text-blue-700 rounded-xl text-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-black shadow-inner" placeholder="0.00" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Notes</label>
                <input type="text" value={transferForm.notes} onChange={e => setTransferForm({...transferForm, notes: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium" placeholder="e.g. Cash deposit to Bank" />
              </div>

            </div>
            <div className="px-6 py-5 border-t border-slate-100 bg-slate-50 flex gap-3">
              <button onClick={() => setIsTransferModalOpen(false)} className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-100">Cancel</button>
              <button onClick={handleTransfer} className="flex-1 px-4 py-2.5 bg-slate-900 text-white rounded-xl font-bold shadow-sm hover:bg-slate-800">Confirm Transfer</button>
            </div>
          </div>
        </div>
      )}

      {/* --- STATEMENT / PASSBOOK DRAWER --- */}
      {activeAccount && (
          <div className="absolute inset-0 z-40 bg-white animate-fade-in flex flex-col">
              <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                  <div>
                    <button onClick={() => setActiveAccount(null)} className="text-sm font-bold text-slate-500 hover:text-slate-900 mb-2 flex items-center transition-colors">← Back to Accounts</button>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{activeAccount.account_name} Statement</h2>
                  </div>
                  <div className="text-right">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Closing Balance</p>
                      <p className={`text-2xl font-black ${activeAccount.current_balance < 0 ? 'text-rose-600' : 'text-slate-900'}`}>₹ {activeAccount.current_balance.toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
                  </div>
              </div>

              <div className="flex-1 overflow-auto bg-white p-8">
                  {statement.length === 0 ? (
                      <div className="text-center py-20 text-slate-400">
                          <History className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                          <p className="font-medium text-slate-500">No transactions recorded for this account yet.</p>
                      </div>
                  ) : (
                      <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-white border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider z-10">
                            <tr>
                                <th className="py-3 pr-4">Date</th>
                                <th className="py-3 px-4">Transaction Details</th>
                                <th className="py-3 px-4 text-right">Money In</th>
                                <th className="py-3 pl-4 text-right">Money Out</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {statement.map((txn, i) => (
                                <tr key={i} className="hover:bg-slate-50 transition-colors">
                                    <td className="py-4 pr-4 text-sm font-semibold text-slate-500 whitespace-nowrap">
                                        {new Date(txn.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${txn.amount_in > 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                                {txn.amount_in > 0 ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">{txn.type}</p>
                                                <p className="text-xs font-medium text-slate-500">{txn.ref} • {txn.notes || 'No remarks'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 text-right font-bold text-emerald-600">
                                        {txn.amount_in > 0 ? `+ ₹${txn.amount_in.toFixed(2)}` : '-'}
                                    </td>
                                    <td className="py-4 pl-4 text-right font-bold text-rose-600">
                                        {txn.amount_out > 0 ? `- ₹${txn.amount_out.toFixed(2)}` : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                      </table>
                  )}
              </div>
          </div>
      )}

    </div>
  );
}