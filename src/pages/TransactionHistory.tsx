import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Search, ArrowDownLeft, ArrowUpRight, Eye, Printer, Trash2, X, History, 
  Landmark, CreditCard, IndianRupee, Receipt, FileText, ChevronLeft, ChevronRight, Edit 
} from 'lucide-react';
import { PrintPreviewModal } from '../components/PrintPreviewModal';
import { TemplateReceipt } from '../components/templates/TemplateReceipt';

export function TransactionHistory({ 
  companyId, 
  onEditTransaction 
}: { 
  companyId: string, 
  onEditTransaction?: (data: any) => void 
}) {
  const [activeTab, setActiveTab] = useState<'sales' | 'purchases'>('sales');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [settings, setSettings] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [companyDetails, setCompanyDetails] = useState<any>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItemsCount, setTotalItemsCount] = useState(0);
  const itemsPerPage = 8;

  // Invoice Preview State
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  // Receipt Preview State
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  // Ledger History State
  const [showLedger, setShowLedger] = useState(false);
  const [ledgerPayments, setLedgerPayments] = useState<any[]>([]);
  const [activeLedgerRef, setActiveLedgerRef] = useState('');

  // Record Payment State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState<any>(null);
  const [paymentForm, setPaymentForm] = useState({ amount: '', paymentMode: 'UPI', accountId: '', notes: '' });

  const fetchTransactions = async () => {
    const params = {
      companyId: Number(companyId),
      page: currentPage,
      limit: itemsPerPage,
      searchTerm: searchTerm
    };

    if (activeTab === 'sales') {
      const res = await window.electronAPI.getInvoices(params);
      if (res.success) {
        setTransactions(res.data || []);
        setTotalItemsCount(res.total || 0);
      }
    } else {
      const res = await window.electronAPI.getPurchases(params);
      if (res.success) {
        setTransactions(res.data || []);
        setTotalItemsCount(res.total || 0);
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTransactions();
    }, 200);
    return () => clearTimeout(timer);
  }, [companyId, activeTab, currentPage, searchTerm]);

  useEffect(() => {
    const fetchAuxData = async () => {
      const resSettings = await window.electronAPI.getCompanySettings(Number(companyId));
      if (resSettings.success) setSettings(resSettings.settings);
      
      const resAccounts = await window.electronAPI.getAccounts(Number(companyId));
      if (resAccounts.success && resAccounts.data) setAccounts(resAccounts.data);
      
      const resCompany = await window.electronAPI.getCompany(Number(companyId));
      if (resCompany.success && resCompany.data) setCompanyDetails(resCompany.data);
    };
    fetchAuxData();
  }, [companyId]);

  // Reset pagination when search term or tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab]);

  const totalPages = Math.ceil(totalItemsCount / itemsPerPage) || 1;
  const startEntry = totalItemsCount === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endEntry = Math.min(currentPage * itemsPerPage, totalItemsCount);

  const handleViewOrPrint = async (id: number, action: 'view' | 'print') => {
    let res = activeTab === 'sales' 
      ? await window.electronAPI.getInvoiceDetails(id) 
      : await window.electronAPI.getPurchaseDetails(id);
      
    if (res?.success && res.data) {
      const tx = res.data;
      setPreviewData({
        id: tx.id,
        type: activeTab === 'sales' ? 'Sale' : 'Purchase',
        companyDetails: companyDetails,
        billNo: tx.invoice_no || tx.bill_no,
        date: tx.invoice_date || tx.bill_date,
        partyName: tx.party_name, 
        phone: tx.phone, 
        stateOfSupply: tx.state_of_supply,
        items: tx.items.map((i: any) => ({ 
           id: Date.now() + Math.random(), 
           name: i.item_name, 
           qty: i.qty, 
           price: i.price, 
           discount: i.discount, 
           taxRate: i.tax_rate, 
           amount: i.amount, 
           serialNo: i.serial_no || '', 
           warranty: i.warranty || '' 
        })),
        subTotal: tx.subtotal, 
        globalDiscount: tx.global_discount, 
        totalTax: tx.total_tax, 
        roundOff: tx.round_off,
        grandTotal: tx.grand_total, 
        paidAmount: tx.amount_received || tx.amount_paid || 0,
        balanceDue: tx.balance_due, 
        notes: tx.notes,
      });
      setShowPreview(true);
      if (action === 'print') setTimeout(() => window.print(), 300);
    } else {
      alert("Failed to load details.");
    }
  };

  const handleViewLedger = async (tx: any, refNo: string) => {
    if(activeTab === 'purchases') return alert("Payment Ledger currently available for Sales Invoices.");
    const res = await window.electronAPI.getInvoicePayments(tx.id);
    if(res.success && res.data) {
      setLedgerPayments(res.data);
      setActiveLedgerRef(refNo);
      setActiveInvoice(tx);
      setShowLedger(true);
    }
  };

  const handlePrintReceipt = (payment: any) => {
    setReceiptData({
      receiptId: `REC-${payment.id.toString().padStart(4, '0')}`,
      companyName: companyDetails?.business_name || 'Your Company',
      date: new Date(payment.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      partyName: activeInvoice?.party_name || 'Customer',
      amount: payment.amount,
      mode: payment.payment_mode,
      accountName: payment.account_name,
      invoiceRef: activeLedgerRef,
      notes: payment.notes
    });
    setShowReceiptPreview(true);
  };

  const handleDelete = async (id: number, refNo: string) => {
    if (!window.confirm(`Permanently delete ${refNo}? This reverts stock and bank balances.`)) return;
    const res = activeTab === 'sales' 
      ? await window.electronAPI.deleteInvoice(id) 
      : await window.electronAPI.deletePurchase(id);
      
    if (res.success) {
      fetchTransactions();
    } else {
      alert(res.message || "Failed to delete.");
    }
  };

  const openPaymentModal = (tx: any) => {
    if(activeTab === 'purchases') return alert("Recording payments currently available for Sales Invoices.");
    setActiveInvoice(tx);
    setPaymentForm({
      amount: tx.live_balance_due.toString(),
      paymentMode: 'UPI',
      accountId: accounts.length > 0 ? accounts[0].id.toString() : '',
      notes: 'Clearance payment'
    });
    setShowPaymentModal(true);
  };

  const submitPayment = async () => {
    const payAmount = Number(paymentForm.amount);
    if (payAmount <= 0) return alert("Please enter a valid amount greater than 0");
    if (payAmount > activeInvoice.live_balance_due) return alert("Payment cannot exceed the balance due!");
    
    const payload = { 
      invoiceId: activeInvoice.id, 
      companyId: Number(companyId), 
      paymentAmount: payAmount, 
      paymentMode: paymentForm.paymentMode, 
      accountId: paymentForm.accountId ? Number(paymentForm.accountId) : undefined, 
      notes: paymentForm.notes 
    };
    
    const res = await window.electronAPI.recordInvoicePayment(payload);
    if (res.success) { 
      setShowPaymentModal(false); 
      fetchTransactions(); 
    } else { 
      alert(res.message); 
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-surface-200 shadow-sm min-h-full flex flex-col animate-fade-in duration-300">
      
      {/* Header */}
      <div className="px-8 py-6 border-b border-surface-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 z-10 bg-white">
        <div>
          <h2 className="text-2xl font-bold text-surface-900 tracking-tight">Transaction History</h2>
          <p className="text-sm text-surface-500 mt-1 font-medium">Review original invoices and issue payment receipts.</p>
        </div>
        <div className="flex bg-surface-100 p-1.5 rounded-xl border border-surface-200 w-full md:w-auto">
          <button 
            onClick={() => setActiveTab('sales')} 
            className={`flex-1 md:w-32 flex items-center justify-center py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'sales' ? 'bg-white shadow-sm text-brand-600' : 'text-surface-500 hover:text-surface-800'}`}
          >
            <ArrowUpRight className="w-4 h-4 mr-1.5" /> Sales
          </button>
          <button 
            onClick={() => setActiveTab('purchases')} 
            className={`flex-1 md:w-32 flex items-center justify-center py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'purchases' ? 'bg-white shadow-sm text-brand-600' : 'text-surface-500 hover:text-surface-800'}`}
          >
            <ArrowDownLeft className="w-4 h-4 mr-1.5" /> Purchases
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-8 py-4 flex justify-between items-center bg-surface-50/50 border-b border-surface-100">
        <div className="relative w-72 group">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 group-focus-within:text-brand-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search by party or bill no..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full pl-10 pr-4 py-2 bg-white border border-surface-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium" 
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="flex-1 overflow-auto">
        {transactions.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-surface-400 animate-fade-in">
            <div className="w-16 h-16 bg-surface-50 rounded-full flex items-center justify-center mb-4 border border-surface-100">
              <FileText className="w-8 h-8 text-surface-300" />
            </div>
            <p className="font-medium text-surface-500">No {activeTab} transactions found.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="sticky top-0 bg-surface-50/90 backdrop-blur-md border-b border-surface-200 text-[10px] font-bold text-surface-500 uppercase tracking-wider z-10">
              <tr>
                <th className="px-8 py-4">Date</th>
                <th className="px-8 py-4">Ref No.</th>
                <th className="px-8 py-4">Party Name</th>
                <th className="px-8 py-4">Total Amount</th>
                <th className="px-8 py-4">Balance Due</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {transactions.map((tx) => {
                const refNo = tx.invoice_no || tx.bill_no; 
                const txDate = tx.invoice_date || tx.bill_date;
                const paidAmount = activeTab === 'sales' ? (tx.amount_received + (tx.total_paid_later || 0)) : (tx.amount_received || tx.amount_paid || 0); 
                const currentBalance = activeTab === 'sales' ? tx.live_balance_due : tx.balance_due;
                
                return (
                  <tr key={tx.id} className="hover:bg-brand-50/30 transition-colors group">
                    <td className="px-8 py-5 text-sm font-semibold text-surface-500">
                      {txDate ? new Date(txDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                    </td>
                    <td className="px-8 py-5 text-sm font-bold text-surface-900 tracking-tight">
                      {refNo}
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-sm font-bold text-surface-900 capitalize">
                        {tx.party_name}
                      </div>
                      {tx.phone && (
                        <div className="text-[10px] font-bold text-surface-400 mt-1 uppercase tracking-wider">
                          Ph: {tx.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-5 text-sm font-bold text-surface-800">
                      ₹ {tx.grand_total?.toFixed(2)}
                    </td> 
                    <td className="px-8 py-5 text-sm font-bold">
                      {currentBalance > 0 ? (
                        <span className="text-red-600">₹ {currentBalance?.toFixed(2)}</span>
                      ) : (
                        <span className="text-surface-400">₹ 0.00</span>
                      )}
                    </td>
                    <td className="px-8 py-5">
                      {currentBalance <= 0 ? (
                        <span className="px-2.5 py-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md uppercase tracking-wider">PAID</span>
                      ) : paidAmount > 0 ? (
                        <span className="px-2.5 py-1 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100 rounded-md uppercase tracking-wider">PARTIAL</span>
                      ) : (
                        <span className="px-2.5 py-1 text-[10px] font-bold bg-red-50 text-red-700 border border-red-100 rounded-md uppercase tracking-wider">UNPAID</span>
                      )}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        
                        {currentBalance > 0 && activeTab === 'sales' && (
                          <button 
                            onClick={() => openPaymentModal(tx)} 
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200 bg-white shadow-sm" 
                            title="Record Payment"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                        )}
                        
                        <div className="w-px h-6 bg-surface-200 mx-1"></div>
                        
                        <button 
                          onClick={() => handleViewOrPrint(tx.id, 'view')} 
                          className="p-2 text-surface-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" 
                          title="View Original Invoice"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        <button 
                          onClick={() => handleViewLedger(tx, refNo)} 
                          className="p-2 text-surface-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                          title="Payment History & Receipts"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        
                        <button 
                          onClick={() => handleDelete(tx.id, refNo)} 
                          className="p-2 text-surface-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      {totalItemsCount > 0 && (
        <div className="px-8 py-4 border-t border-surface-100 bg-white flex justify-between items-center mt-auto shrink-0 z-10">
          <p className="text-sm font-medium text-surface-400">
            Showing <span className="text-surface-700 font-bold">{startEntry}</span> to <span className="text-surface-700 font-bold">{endEntry}</span> of <span className="text-surface-700 font-bold">{totalItemsCount}</span> transactions
          </p>
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
              disabled={currentPage === 1} 
              className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-all ${currentPage === 1 ? 'border-surface-100 text-surface-300 cursor-not-allowed bg-surface-50/50' : 'border-surface-200 text-surface-600 hover:bg-surface-50 shadow-sm hover:text-brand-600'}`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
              disabled={currentPage === totalPages} 
              className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-all ${currentPage === totalPages ? 'border-surface-100 text-surface-300 cursor-not-allowed bg-surface-50/50' : 'border-surface-200 text-surface-600 hover:bg-surface-50 shadow-sm hover:text-brand-600'}`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Ledger Modal */}
      {showLedger && createPortal(
        <div className="fixed inset-0 z-[9999] bg-surface-900/60 backdrop-blur-sm flex justify-center items-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-scale-in border border-surface-200">
            <div className="px-6 py-5 border-b border-surface-100 bg-surface-50/50 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-surface-900 tracking-tight">Payment Ledger</h2>
                <p className="text-xs text-surface-500 font-medium">Original Invoice: {activeLedgerRef}</p>
              </div>
              <button onClick={() => setShowLedger(false)} className="p-2 bg-white border border-surface-200 text-surface-500 hover:bg-surface-100 hover:text-surface-800 rounded-full transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {ledgerPayments.length === 0 ? (
                <div className="text-center py-10 text-surface-400">
                  <History className="w-10 h-10 mx-auto mb-3 text-surface-300" />
                  <p className="font-medium">No payments recorded yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {ledgerPayments.map((payment, i) => (
                    <div key={i} className="flex justify-between items-center p-4 border border-surface-200 rounded-2xl bg-white shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shrink-0 border border-emerald-100">
                          <Landmark className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-surface-900">{payment.payment_mode}</p>
                          <p className="text-xs text-surface-500 mt-0.5">
                            {new Date(payment.payment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} • Dep: {payment.account_name || 'Cash'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-black text-emerald-600 tracking-tight">+ ₹ {payment.amount.toFixed(2)}</span>
                        <button 
                          onClick={() => handlePrintReceipt(payment)} 
                          className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-colors border border-blue-200" 
                          title="Print Payment Receipt"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>, document.body
      )}

      {/* Invoice Preview Modal with Edit Integration */}
      {previewData && (
        <PrintPreviewModal 
          isOpen={showPreview} 
          onClose={() => setShowPreview(false)} 
          invoiceData={previewData}
          settings={settings}
          onEdit={onEditTransaction ? () => {
             setShowPreview(false);
             onEditTransaction(previewData);
          } : undefined}
        />
      )}

      {/* Receipt Preview Modal */}
      {showReceiptPreview && receiptData && createPortal(
        <div className="fixed inset-0 z-[9999] bg-surface-900/60 backdrop-blur-sm flex justify-center p-4 md:p-8 animate-fade-in print:p-0 print:bg-white print:backdrop-blur-none">
          <div className="bg-white w-full max-w-4xl h-full rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-scale-in border border-surface-200 print:border-none print:shadow-none print:rounded-none">
            <div className="px-8 py-5 border-b border-surface-100 bg-surface-50/50 flex justify-between items-center print:hidden">
              <h2 className="text-xl font-bold text-surface-900 tracking-tight">Payment Receipt Preview</h2>
              <div className="flex space-x-3">
                <button 
                  onClick={() => window.print()} 
                  className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-sm hover:bg-blue-700 hover:-translate-y-0.5 transition-all flex items-center"
                >
                  <Printer className="w-4 h-4 mr-2" /> Print Receipt
                </button>
                <button 
                  onClick={() => setShowReceiptPreview(false)} 
                  className="p-2.5 bg-white border border-surface-200 text-surface-500 hover:bg-surface-100 hover:text-surface-800 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-surface-100/50 p-8 flex justify-center print:bg-white print:p-0">
              <div className="shadow-xl print:shadow-none transition-all duration-300">
                <TemplateReceipt settings={settings} data={receiptData} />
              </div>
            </div>
          </div>
        </div>, document.body
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && activeInvoice && createPortal(
        <div className="fixed inset-0 z-[9999] bg-surface-900/60 backdrop-blur-sm flex justify-center items-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-scale-in border border-surface-200">
            <div className="px-6 py-5 border-b border-surface-100 bg-surface-50/50 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-surface-900 tracking-tight">Record Payment</h2>
                <p className="text-xs text-surface-500 font-medium">Inv #{activeInvoice.invoice_no} • {activeInvoice.party_name}</p>
              </div>
              <button 
                onClick={() => setShowPaymentModal(false)} 
                className="p-2 bg-white border border-surface-200 text-surface-500 hover:bg-surface-100 hover:text-surface-800 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex justify-between items-center">
                <span className="text-sm font-bold text-rose-700">Total Due Remaining</span>
                <span className="text-xl font-black text-rose-700">₹ {activeInvoice.live_balance_due.toFixed(2)}</span>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Amount Paying Now</label>
                <div className="relative">
                  <IndianRupee className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600" />
                  <input 
                    type="number" 
                    value={paymentForm.amount} 
                    onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})} 
                    className="w-full pl-9 pr-4 py-3 bg-white border border-emerald-200 rounded-xl text-lg outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold text-surface-900 shadow-sm transition-all" 
                    placeholder="0.00" 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Payment Mode</label>
                  <select 
                    value={paymentForm.paymentMode} 
                    onChange={(e) => setPaymentForm({...paymentForm, paymentMode: e.target.value})} 
                    className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-brand-500/20 font-medium text-surface-900"
                  >
                    <option>UPI</option>
                    <option>Cash</option>
                    <option>Bank Transfer</option>
                    <option>Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Deposit To</label>
                  <select 
                    value={paymentForm.accountId} 
                    onChange={(e) => setPaymentForm({...paymentForm, accountId: e.target.value})} 
                    className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-brand-500/20 font-medium text-surface-900"
                  >
                    {accounts.length === 0 && <option value="">No Accounts Setup</option>}
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.account_name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Notes</label>
                <input 
                  type="text" 
                  value={paymentForm.notes} 
                  onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})} 
                  className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-brand-500/20 font-medium text-surface-900" 
                  placeholder="e.g. Cleared pending dues" 
                />
              </div>
            </div>
            <div className="px-6 py-5 border-t border-surface-100 bg-surface-50 flex gap-3">
              <button 
                onClick={() => setShowPaymentModal(false)} 
                className="flex-1 px-4 py-2.5 bg-white border border-surface-200 text-surface-700 rounded-xl font-bold hover:bg-surface-100 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={submitPayment} 
                className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold shadow-sm hover:bg-emerald-700 hover:-translate-y-0.5 transition-all"
              >
                Submit Payment
              </button>
            </div>
          </div>
        </div>, document.body
      )}

    </div>
  );
}