import { useState, useEffect } from 'react';
import { Trash2, Plus, ArrowLeft, FileText, IndianRupee, Eye, Printer, X } from 'lucide-react';
import { THANK_YOU_MESSAGES } from '../utils/messages';
import { InvoiceTemplate } from '../components/templates/InvoiceTemplate';
import { PrintPreviewModal } from '../components/PrintPreviewModal';

export function CreateInvoice({ companyId, onBack }: { companyId: string, onBack: () => void }) {
  const [invoiceNo, setInvoiceNo] = useState('1');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [partyName, setPartyName] = useState('');
  const [phone, setPhone] = useState('');
  const [stateOfSupply, setStateOfSupply] = useState('Maharashtra');
  const [notes, setNotes] = useState('');
  const [companyDetails, setCompanyDetails] = useState<any>(null);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [partiesList, setPartiesList] = useState<any[]>([]);
  const [suggestedNotes, setSuggestedNotes] = useState<string[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  
  const [items, setItems] = useState([{ id: 1, name: '', qty: 1, price: 0, discount: 0, taxRate: 0, amount: 0 }]);
  
  const [globalDiscount, setGlobalDiscount] = useState<any>(0);
  const [roundOff, setRoundOff] = useState<any>(0);
  const [amountReceived, setAmountReceived] = useState<any>(0);
  const [accountId, setAccountId] = useState(''); 
  
  const [showPreview, setShowPreview] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      // 🐛 FIX: Updated to use the new paginated API signature!
      const resItems = await window.electronAPI.getItems({
        companyId: Number(companyId),
        page: 1,
        limit: 5000, // Fetch a large batch so the dropdown has all available items
        searchTerm: ''
      });
      if (resItems.success && resItems.data) setInventoryItems(resItems.data);

      const resNo = await window.electronAPI.getNextInvoiceNo(Number(companyId));
      if (resNo.success) setInvoiceNo(resNo.nextNo);

      const resParties = await window.electronAPI.getParties(Number(companyId));
      if (resParties.success && resParties.data) setPartiesList(resParties.data);

      const resSettings = await window.electronAPI.getCompanySettings(Number(companyId));
      if (resSettings.success) setSettings(resSettings.settings);

      const resAccounts = await window.electronAPI.getAccounts(Number(companyId));
      if (resAccounts.success && resAccounts.data) {
        setAccounts(resAccounts.data);
        if (resAccounts.data.length > 0) setAccountId(resAccounts.data[0].id.toString());
      }
      // Inside useEffect's fetchInitialData:
      const resCompany = await window.electronAPI.getCompany(Number(companyId));
      if (resCompany.success && resCompany.data) setCompanyDetails(resCompany.data);
    };
    fetchInitialData();

    const shuffled = [...THANK_YOU_MESSAGES].sort(() => 0.5 - Math.random());
    setSuggestedNotes(shuffled.slice(0, 5));
  }, [companyId]);

  const calculateRowAmount = (qty: number, price: number, discount: number, taxRate: number) => {
    const base = (qty || 0) * (price || 0);
    const afterDiscount = base - (discount || 0);
    return afterDiscount + (afterDiscount * ((taxRate || 0) / 100));
  };

  const handleItemChange = (id: number, field: string, value: string | number) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const up = { ...item, [field]: value };
        up.amount = calculateRowAmount(Number(up.qty), Number(up.price), Number(up.discount), Number(up.taxRate));
        return up;
      }
      return item;
    }));
  };

  const handleSmartNameChange = (id: number, newName: string) => {
    const foundItem = inventoryItems.find(i => i.item_name?.toLowerCase() === (newName || '').toLowerCase());
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const up = { ...item, name: newName };
        if (foundItem) {
          up.price = foundItem.sale_price; 
          up.taxRate = foundItem.tax_rate;
        }
        up.amount = calculateRowAmount(Number(up.qty), Number(up.price), Number(up.discount), Number(up.taxRate));
        return up;
      }
      return item;
    }));
  };

  const handlePartySelect = (selectedName: string) => {
    setPartyName(selectedName);
    const foundParty = partiesList.find(p => p.name?.toLowerCase() === (selectedName || '').toLowerCase());
    if (foundParty) setPhone(foundParty.phone || '');
  };

  const addRow = () => setItems([...items, { id: Date.now(), name: '', qty: 1, price: 0, discount: 0, taxRate: 0, amount: 0 }]);
  const removeRow = (id: number) => { if (items.length > 1) setItems(items.filter(item => item.id !== id)); };

  const subTotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalTax = items.reduce((sum, item) => sum + (((item.qty || 0) * (item.price || 0) - (item.discount || 0)) * ((item.taxRate || 0) / 100)), 0);
  const totalQty = items.reduce((sum, item) => sum + Number(item.qty || 0), 0);
  const grandTotal = subTotal - Number(globalDiscount || 0) + Number(roundOff || 0);
  const balanceDue = grandTotal - Number(amountReceived || 0);

  const handleSaveInvoice = async () => {
    if (!partyName) return alert("Please enter a Party Name!");
    const validItems = items.filter(i => i.name.trim() !== '');
    if (validItems.length === 0) return alert("Please add at least one item!");

    for (const item of validItems) {
      const stockItem = inventoryItems.find(i => i.item_name.toLowerCase() === item.name.toLowerCase());
      if (!stockItem) return alert(`Error: "${item.name}" does not exist in your inventory.`);
      if (stockItem.item_type === 'Product' && Number(item.qty) > stockItem.current_stock) {
        return alert(`Not enough stock for ${item.name}! You have ${stockItem.current_stock} available.`);
      }
    }

    const payload = {
      companyId: Number(companyId),
      invoiceNo, date, partyName, phone, stateOfSupply,
      subTotal, globalDiscount: Number(globalDiscount || 0), totalTax, roundOff: Number(roundOff || 0), grandTotal,
      amountReceived: Number(amountReceived || 0), 
      accountId: Number(accountId), 
      paymentType: accounts.find(a => a.id.toString() === accountId)?.account_name || 'Cash', 
      balanceDue, notes, items: validItems 
    };

    const res = await window.electronAPI.addInvoice(payload);
    if (res.success) {
      setIsSaved(true);
      setShowPreview(true);
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* HEADER */}
      <div className="bg-white px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0 shadow-sm z-10">
        <div className="flex items-center">
          <button onClick={onBack} className="mr-4 p-2 hover:bg-slate-100 rounded-full transition-colors"><ArrowLeft className="w-5 h-5 text-slate-600" /></button>
          <h1 className="text-xl font-bold text-slate-800 flex items-center"><FileText className="w-5 h-5 mr-2 text-emerald-600" /> Sale Invoice</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          
          <div className="p-6 border-b border-slate-200 bg-slate-50/50 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Bill To (Customer)</label>
                <div className="flex gap-2">
                  <input type="text" list="parties-list" placeholder="Search or add party name..." className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none font-medium" value={partyName} onChange={(e) => handlePartySelect(e.target.value)} />
                  <datalist id="parties-list">{partiesList.filter(p => p.party_type === 'Customer' || p.party_type === 'Both').map(party => <option key={party.id} value={party.name}>{party.phone}</option>)}</datalist>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Phone Number</label>
                <input type="text" placeholder="e.g. 9876543210" className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none" value={phone} onChange={(e) => setPhone(e.target.value)}/>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Invoice No.</label>
                  <input type="text" className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none font-semibold text-slate-700 bg-slate-50" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Date</label>
                  <input type="date" className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
              </div>
              <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">State of Supply</label>
                 <select className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none bg-white" value={stateOfSupply} onChange={(e) => setStateOfSupply(e.target.value)}>
                   <option>Maharashtra</option><option>Gujarat</option><option>Delhi</option>
                 </select>
              </div>
            </div>
          </div>

          <div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800 text-white text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 w-12 text-center">#</th>
                  <th className="px-4 py-3">Item Name</th><th className="px-4 py-3 w-24">Qty</th><th className="px-4 py-3 w-32">Price/Unit</th>
                  <th className="px-4 py-3 w-28">Discount</th><th className="px-4 py-3 w-28">Tax %</th><th className="px-4 py-3 w-36 text-right">Amount</th><th className="px-4 py-3 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-4 py-2 text-center text-slate-400 text-sm font-medium">{index + 1}</td>
                    <td className="px-4 py-2"><input type="text" list="sale-inventory-list" placeholder="Select item..." className="w-full px-2 py-1.5 border border-transparent hover:border-slate-300 focus:border-blue-500 rounded outline-none" value={item.name} onChange={(e) => handleSmartNameChange(item.id, e.target.value)} /></td>
                    <td className="px-4 py-2"><input type="number" min="1" className="w-full px-2 py-1.5 border border-slate-200 rounded outline-none focus:border-blue-500 text-center" value={item.qty || ''} onChange={(e) => handleItemChange(item.id, 'qty', e.target.value)} /></td>
                    <td className="px-4 py-2"><input type="number" className="w-full px-2 py-1.5 border border-slate-200 rounded outline-none focus:border-blue-500 text-right" value={item.price || ''} onChange={(e) => handleItemChange(item.id, 'price', e.target.value)} /></td>
                    <td className="px-4 py-2"><div className="relative"><span className="absolute left-2 top-1.5 text-slate-400 text-sm">₹</span><input type="number" className="w-full pl-6 pr-2 py-1.5 border border-slate-200 rounded outline-none focus:border-blue-500" value={item.discount || ''} onChange={(e) => handleItemChange(item.id, 'discount', e.target.value)} /></div></td>
                    <td className="px-4 py-2">
                      <select className="w-full px-2 py-1.5 border border-slate-200 rounded outline-none focus:border-blue-500 bg-white" value={item.taxRate} onChange={(e) => handleItemChange(item.id, 'taxRate', e.target.value)}>
                        <option value="0">None</option><option value="5">GST@5%</option><option value="12">GST@12%</option><option value="18">GST@18%</option><option value="28">GST@28%</option>
                      </select>
                    </td>
                    <td className="px-4 py-2 text-right font-bold text-slate-700">₹{item.amount.toFixed(2)}</td>
                    <td className="px-4 py-2 text-center"><button onClick={() => removeRow(item.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="Remove row"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <datalist id="sale-inventory-list">{inventoryItems.map(invItem => <option key={invItem.id} value={invItem.item_name}>Stock: {invItem.item_type === 'Service' ? 'N/A' : invItem.current_stock}</option>)}</datalist>
            <div className="p-4 border-t border-slate-200 bg-slate-50/50"><button onClick={addRow} className="flex items-center text-blue-600 hover:text-blue-700 font-semibold text-sm px-3 py-1.5 hover:bg-blue-50 rounded-lg"><Plus className="w-4 h-4 mr-1" /> Add Row</button></div>
          </div>

          <div className="p-6 bg-white border-t border-slate-200 flex flex-col lg:flex-row gap-8">
            <div className="flex-1 space-y-4">
               <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Notes</label>
                 <textarea rows={3} className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Thanks for your business!"></textarea>
                 <div className="flex flex-wrap gap-2 mt-2">
                  {suggestedNotes.map((msg, idx) => (
                    <span key={idx} onClick={() => setNotes(prev => prev ? prev + '\n' + msg : msg)} className="px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded cursor-pointer hover:bg-blue-100">+ {msg}</span>
                  ))}
                </div>
               </div>
            </div>
            <div className="w-full lg:w-96 space-y-3">
               <div className="flex justify-between items-center text-slate-600 font-medium"><span>Subtotal ({totalQty} Items)</span><span>₹{subTotal.toFixed(2)}</span></div>
               <div className="flex justify-between items-center text-slate-600 font-medium pb-3 border-b border-slate-100">
                 <span>Discount</span><input type="number" className="w-24 px-2 py-1 border border-slate-200 rounded outline-none text-right" value={globalDiscount || ''} onChange={(e) => setGlobalDiscount(e.target.value as any)} placeholder="₹ 0" />
               </div>
               <div className="flex justify-between items-center text-slate-600 font-medium"><span>Total Tax</span><span>₹{totalTax.toFixed(2)}</span></div>
               <div className="flex justify-between items-center text-slate-600 font-medium">
                 <span>Round Off</span><input type="number" step="0.01" className="w-20 px-2 py-1 border border-slate-200 rounded outline-none text-right" value={roundOff || ''} onChange={(e) => setRoundOff(e.target.value as any)} placeholder="0.00" />
               </div>
               <div className="flex justify-between items-center text-2xl font-bold text-blue-700 pt-3 border-t border-slate-200"><span>Total</span><span>₹{grandTotal.toFixed(2)}</span></div>
               <div className="mt-6 pt-4 border-t border-slate-200">
                 <div className="flex gap-4 mb-3">
                   <div className="flex-1">
                     <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Amount Received</label>
                     <div className="relative">
                       <IndianRupee className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                       <input type="number" className="w-full pl-9 pr-3 py-2 border border-emerald-300 bg-emerald-50 text-emerald-800 rounded-lg outline-none font-bold focus:ring-2 focus:ring-emerald-500" value={amountReceived || ''} onChange={(e) => setAmountReceived(e.target.value as any)} />
                     </div>
                   </div>
                   <div className="flex-1">
                     <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Deposit To</label>
                     <select className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none bg-white font-medium" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                       {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.account_name}</option>)}
                     </select>
                   </div>
                 </div>
                 <div className="flex justify-between items-center text-sm font-bold text-slate-600">
                   <span>Balance Due:</span><span className={balanceDue > 0 ? 'text-red-500' : 'text-slate-600'}>₹{balanceDue.toFixed(2)}</span>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white px-6 py-4 border-t border-slate-200 flex justify-between items-center shrink-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button onClick={() => setShowPreview(true)} className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors flex items-center"><Eye className="w-4 h-4 mr-2" /> Preview</button>
        <button onClick={handleSaveInvoice} className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center">Save Sale Invoice</button>
      </div>

      {showPreview && (
       <PrintPreviewModal 
  isOpen={showPreview} 
  onClose={() => {
    setShowPreview(false);
    if (isSaved) onBack();
  }} 
  settings={settings}
  invoiceData={{
    type: 'Sale',
    billNo: invoiceNo, 
    date, 
    partyName, 
    phone, 
    stateOfSupply,
    companyDetails,
    items: items.filter(i => i.name.trim() !== ''),
    subTotal, 
    globalDiscount: Number(globalDiscount || 0), 
    totalTax, 
    roundOff: Number(roundOff || 0), 
    grandTotal,
    paidAmount: Number(amountReceived || 0), 
    balanceDue, 
    notes
  }} 
/>
      )}
    </div>
  );
}