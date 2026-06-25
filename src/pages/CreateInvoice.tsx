import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Plus, Trash2, Eye, Save } from 'lucide-react';
import { PrintPreviewModal } from '../components/PrintPreviewModal';
import { INDIAN_STATES, THANK_YOU_MESSAGES } from '../utils/messages';

export function CreateInvoice({ companyId, onBack, editData }: { companyId: string, onBack: () => void, editData?: any }) {
const [invoiceNo, setInvoiceNo] = useState(`INV-${Date.now()}`);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [partyName, setPartyName] = useState('');
  const [phone, setPhone] = useState('');
  const [stateOfSupply, setStateOfSupply] = useState('');
  const [notes, setNotes] = useState('');
  
  const [amountReceived, setAmountReceived] = useState(0);
  const [accountId, setAccountId] = useState<number | ''>('');
  
  const [companyDetails, setCompanyDetails] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [partiesList, setPartiesList] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [suggestedNotes, setSuggestedNotes] = useState<string[]>([]);
  
  const [isQuotation, setIsQuotation] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const [items, setItems] = useState([
    { id: Date.now(), name: '', qty: 1, price: 0, discount: 0, taxRate: 0, amount: 0, serialNo: '', warranty: '' }
  ]);

  useEffect(() => {
    const fetchMasterData = async () => {
      if (!companyId) return;
      const compRes = await window.electronAPI.getCompany(companyId);
      if (compRes?.success) setCompanyDetails(compRes.data || null);

      const setRes = await window.electronAPI.getCompanySettings(companyId);
      if (setRes?.success) setSettings(setRes.settings || null);

const invNoRes = await window.electronAPI.getNextInvoiceNo(companyId);
      if (invNoRes?.success && !editData) {
        const nextId = invNoRes.nextNo || Date.now();
        setInvoiceNo(`INV-${nextId}`);
      }
      const partiesRes = await window.electronAPI.getParties(companyId);
      if (partiesRes?.success) setPartiesList(partiesRes.data || []); 

      const itemsRes = await window.electronAPI.getItems({ companyId, limit: 5000 });
      if (itemsRes?.success) setInventoryItems(itemsRes.data || []);

      const accRes = await window.electronAPI.getAccounts(companyId);
      if (accRes?.success) {
        setAccounts(accRes.data || []);
        if (accRes.data && accRes.data.length > 0 && !editData) setAccountId(accRes.data[0].id);
      }
    };
    fetchMasterData();
    if (THANK_YOU_MESSAGES) setSuggestedNotes([...THANK_YOU_MESSAGES].sort(() => 0.5 - Math.random()).slice(0, 5));
  }, [companyId]);

  useEffect(() => {
    if (editData) {
      setInvoiceNo(editData.billNo);
      setDate(editData.date);
      setPartyName(editData.partyName);
      setPhone(editData.phone || '');
      setStateOfSupply(editData.stateOfSupply || '');
      setNotes(editData.notes || '');
      setItems(editData.items && editData.items.length > 0 ? editData.items : [{ id: Date.now(), name: '', qty: 1, price: 0, discount: 0, taxRate: 0, amount: 0, serialNo: '', warranty: '' }]);
      setAmountReceived(editData.paidAmount || 0);
      setIsQuotation(false); 
    }
  }, [editData]);

  const handlePartyChange = (name: string) => {
    setPartyName(name);
    const party = partiesList.find(p => p.name === name);
    if (party && party.phone) setPhone(party.phone);
  };

  const updateItem = (index: number, field: string, value: string | number) => {
    setItems(prevItems => {
      const updatedItems = [...prevItems];
      const item = { ...updatedItems[index], [field]: value };
      
      if (field === 'name') {
        const matchedItem = inventoryItems.find(i => i.item_name === value);
        if (matchedItem) {
          item.price = matchedItem.sale_price || 0;
          item.taxRate = matchedItem.tax_rate || 0;
        }
      }

      if (field === 'serialNo') {
        const serials = String(value).split('\n').filter(s => s.trim() !== '');
        item.qty = serials.length > 0 ? serials.length : 1; 
      }
      
      const qty = Number(item.qty) || 0;
      const price = Number(item.price) || 0;
      const discount = Number(item.discount) || 0;
      const taxRate = Number(item.taxRate) || 0;
      const baseAmt = (qty * price) - discount;
      item.amount = baseAmt + (baseAmt * (taxRate / 100));
      
      updatedItems[index] = item;
      return updatedItems;
    });
  };

  const addItem = () => setItems([...items, { id: Date.now(), name: '', qty: 1, price: 0, discount: 0, taxRate: 0, amount: 0, serialNo: '', warranty: '' }]);
  const removeItem = (index: number) => { if (items.length > 1) setItems(items.filter((_, i) => i !== index)); };

  const handleBarcodeScan = (e: React.KeyboardEvent<HTMLTextAreaElement>, index: number) => {
    if (e.key === 'Enter') {
      setItems(prevItems => {
        const updatedItems = [...prevItems];
        let currentItem = { ...updatedItems[index] };
        
        const serials = currentItem.serialNo.split('\n').filter(s => s.trim() !== '');
        const latestCode = serials[serials.length - 1];

        if (latestCode && serials.length === 1) {
          const matchedItem = inventoryItems.find(i => i.item_code === latestCode);
          if (matchedItem) {
            currentItem.name = matchedItem.item_name;
            currentItem.price = matchedItem.sale_price || 0;
            currentItem.taxRate = matchedItem.tax_rate || 0;
            
            const qty = Number(currentItem.qty) || 1;
            const baseAmt = (qty * Number(currentItem.price)) - Number(currentItem.discount);
            currentItem.amount = baseAmt + (baseAmt * (Number(currentItem.taxRate) / 100));
          }
        }

        updatedItems[index] = currentItem;
        return updatedItems;
      });
    }
  };

  const totals = useMemo(() => {
    let subTotal = 0, totalDiscount = 0, totalTax = 0;
    items.forEach(item => {
      const itemTotal = (Number(item.qty) || 0) * (Number(item.price) || 0);
      const itemDiscount = Number(item.discount) || 0;
      const amountAfterDiscount = itemTotal - itemDiscount;
      const itemTax = amountAfterDiscount * ((Number(item.taxRate) || 0) / 100);
      subTotal += itemTotal; totalDiscount += itemDiscount; totalTax += itemTax;
    });
    const totalBeforeRound = (subTotal - totalDiscount) + totalTax;
    const grandTotal = Math.round(totalBeforeRound);
    const roundOff = grandTotal - totalBeforeRound;
    const balanceDue = grandTotal - (Number(amountReceived) || 0);
    return { subTotal, totalDiscount, totalTax, roundOff, grandTotal, balanceDue };
  }, [items, amountReceived]);

  const handleSaveInvoice = async () => {
    if (isQuotation) { setShowPreview(true); return; }
    if (!partyName) return alert("Please enter a Customer Name!");
    const validItems = items.filter(i => i.name.trim() !== '');
    if (validItems.length === 0) return alert("Please add at least one item!");

    const data = {
      id: editData?.id,
      companyId: Number(companyId), invoiceNo, date, partyName, phone, stateOfSupply, notes, items: validItems, 
      subTotal: totals.subTotal, globalDiscount: totals.totalDiscount, totalTax: totals.totalTax, 
      roundOff: totals.roundOff, grandTotal: totals.grandTotal, amountReceived, 
      accountId, paymentType: accounts.find(a => a.id === accountId)?.account_name || 'Cash',
      balanceDue: totals.balanceDue,
      editReason: 'Edited bill details'
    };

    let res;
    if (editData) {
        res = await window.electronAPI.editInvoice(data);
    } else {
        res = await window.electronAPI.addInvoice(data);
    }

    if (res.success) {
      setIsSaved(true);
      setShowPreview(true);
    } else alert("Error saving invoice: " + res.message);
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <datalist id="parties-list">{partiesList.map((p, i) => <option key={i} value={p.name} />)}</datalist>
      <datalist id="items-list">{inventoryItems.map((item, i) => <option key={i} value={item.item_name} />)}</datalist>

      <div className="bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><ArrowLeft className="w-5 h-5 text-slate-600" /></button>
          <h1 className="text-xl font-bold text-slate-800">{editData ? 'Edit Sale Invoice' : 'Create Sale Invoice'}</h1>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Customer Name</label>
              <input type="text" list="parties-list" className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500" placeholder="Search or Type Name" value={partyName} onChange={(e) => handlePartyChange(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Phone Number</label>
              <input type="text" className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500" placeholder="10-digit number" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">State of Supply</label>
              <select className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none bg-white" value={stateOfSupply} onChange={(e) => setStateOfSupply(e.target.value)}>
                <option value="" disabled>Select State</option>
                {INDIAN_STATES.map((state) => <option key={state} value={state}>{state}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Invoice Number</label>
              <input type="text" className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 bg-slate-50" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Invoice Date</label>
              <input type="date" className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-10 text-center">#</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider min-w-[200px]">Item Name</th>
                    <th className="py-3 px-4 text-xs font-bold text-blue-600 uppercase tracking-wider w-40">Serial / Barcode</th>
                    <th className="py-3 px-4 text-xs font-bold text-blue-600 uppercase tracking-wider w-32">Warranty</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-24 text-center">Qty</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-32 text-right">Rate</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-28 text-right">Disc.</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-24 text-center">Tax %</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-32 text-right">Amount</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-2 px-4 text-center text-slate-400">{index + 1}</td>
                      <td className="py-2 px-4"><input type="text" list="items-list" placeholder="Search Item" className="w-full px-3 py-2 border border-transparent hover:border-slate-200 focus:border-blue-500 rounded-lg outline-none bg-transparent focus:bg-white" value={item.name} onChange={(e) => updateItem(index, 'name', e.target.value)} /></td>
                      <td className="py-2 px-4 align-top">
                        <textarea 
                          rows={item.serialNo ? item.serialNo.split('\n').length : 1}
                          placeholder="Scan Barcodes" 
                          className="barcode-input w-full px-3 py-2 border border-blue-200 focus:border-blue-500 rounded-lg outline-none bg-blue-50/50 resize-none overflow-hidden block" 
                          style={{ minHeight: '42px' }}
                          value={item.serialNo} 
                          onChange={(e) => updateItem(index, 'serialNo', e.target.value)} 
                          onKeyDown={(e) => handleBarcodeScan(e, index)} 
                        />
                      </td>                      
                      <td className="py-2 px-4"><input type="text" placeholder="e.g. 6 Months" className="w-full px-3 py-2 border border-transparent hover:border-slate-200 focus:border-blue-500 rounded-lg outline-none bg-transparent focus:bg-white" value={item.warranty || ''} onChange={(e) => updateItem(index, 'warranty', e.target.value)} /></td>
                      <td className="py-2 px-4"><input type="number" min="1" className="w-full px-3 py-2 border border-transparent hover:border-slate-200 focus:border-blue-500 rounded-lg outline-none text-center bg-transparent focus:bg-white" value={item.qty || ''} onChange={(e) => updateItem(index, 'qty', e.target.value)} /></td>
                      <td className="py-2 px-4"><input type="number" min="0" className="w-full px-3 py-2 border border-transparent hover:border-slate-200 focus:border-blue-500 rounded-lg outline-none text-right bg-transparent focus:bg-white" value={item.price || ''} onChange={(e) => updateItem(index, 'price', e.target.value)} /></td>
                      <td className="py-2 px-4"><input type="number" min="0" className="w-full px-3 py-2 border border-transparent hover:border-slate-200 focus:border-blue-500 rounded-lg outline-none text-right bg-transparent focus:bg-white" value={item.discount || ''} onChange={(e) => updateItem(index, 'discount', e.target.value)} /></td>
                      <td className="py-2 px-4">
                        <select className="w-full px-2 py-2 border border-transparent hover:border-slate-200 focus:border-blue-500 rounded-lg outline-none bg-transparent focus:bg-white" value={item.taxRate} onChange={(e) => updateItem(index, 'taxRate', e.target.value)}>
                          <option value="0">0%</option><option value="5">5%</option><option value="12">12%</option><option value="18">18%</option><option value="28">28%</option>
                        </select>
                      </td>
                      <td className="py-2 px-4 text-right font-bold text-slate-700">₹{item.amount.toFixed(2)}</td>
                      <td className="py-2 px-4 text-center"><button onClick={() => removeItem(index)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200">
              <button onClick={addItem} className="flex items-center text-sm font-bold text-blue-600 hover:text-blue-700"><Plus className="w-4 h-4 mr-1" /> Add Row</button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Invoice Notes</label>
              <textarea rows={3} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500 resize-none" placeholder="Add terms, bank details, or thank you notes..." value={notes} onChange={(e) => setNotes(e.target.value)} />
              <div className="flex flex-wrap gap-2 mt-2">
                {suggestedNotes.map((msg, idx) => (
                  <span key={idx} onClick={() => setNotes(prev => prev ? prev + '\n' + msg : msg)} className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded cursor-pointer hover:bg-slate-200 border border-slate-200">+ {msg}</span>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
               <div className="space-y-3">
                 <div className="flex justify-between text-sm text-slate-600"><span>Sub Total</span><span className="font-medium">₹{totals.subTotal.toFixed(2)}</span></div>
                 <div className="flex justify-between text-sm text-slate-600"><span>Discount</span><span className="font-medium text-red-500">- ₹{totals.totalDiscount.toFixed(2)}</span></div>
                 <div className="flex justify-between text-sm text-slate-600"><span>Total Tax</span><span className="font-medium">₹{totals.totalTax.toFixed(2)}</span></div>
                 <div className="flex justify-between text-sm text-slate-600"><span>Round Off</span><span className="font-medium">{totals.roundOff > 0 ? '+' : ''}₹{totals.roundOff.toFixed(2)}</span></div>
                 <div className="pt-3 border-t border-slate-200 flex justify-between items-center"><span className="font-bold text-slate-800">Grand Total</span><span className="text-2xl font-black text-blue-600">₹{totals.grandTotal.toFixed(2)}</span></div>
                 
                 <div className="pt-3 flex items-center justify-between gap-4">
                    <select className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-500 bg-slate-50" value={accountId} onChange={(e) => setAccountId(Number(e.target.value))}>
                      <option value="" disabled>Select Account</option>
                      {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.account_name}</option>)}
                    </select>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-700 text-sm">Amount Received</span>
                      <input type="number" className="w-28 px-3 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-right font-bold text-blue-600 bg-blue-50/50" value={amountReceived === 0 ? '' : amountReceived} onChange={(e) => setAmountReceived(Number(e.target.value))} placeholder="0.00" />
                    </div>
                 </div>
                 
                 <div className="pt-3 border-t border-slate-200 flex justify-between font-bold text-sm">
                    <span className="text-slate-800">Balance Due</span>
                    <span className={totals.balanceDue > 0 ? 'text-red-500' : 'text-emerald-500'}>{totals.balanceDue > 0 ? `₹${totals.balanceDue.toFixed(2)}` : 'PAID'}</span>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white px-6 py-4 border-t border-slate-200 flex justify-between items-center shrink-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {!editData && (
          <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-bold mr-4 select-none">
            <input 
              type="checkbox" className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
              checked={isQuotation} onChange={(e) => setIsQuotation(e.target.checked)}
            />
            Generate as Quotation
          </label>
        )}
        
        <div className="flex gap-4 ml-auto">
          <button onClick={() => setShowPreview(true)} className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors flex items-center"><Eye className="w-4 h-4 mr-2" /> Preview</button>
          <button onClick={handleSaveInvoice} className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center"><Save className="w-4 h-4 mr-2" /> {isQuotation ? 'Preview Quotation' : (editData ? 'Update Invoice' : 'Save Sale Invoice')}</button>
        </div>
      </div>

      {showPreview && (
       <PrintPreviewModal 
          isOpen={showPreview} 
          onClose={() => { setShowPreview(false); if (isSaved) onBack(); }} 
          settings={settings}
          invoiceData={{
            isQuotation, type: 'Sale', billNo: invoiceNo, date, partyName, phone, stateOfSupply, companyDetails, items, 
            subTotal: totals.subTotal, globalDiscount: totals.totalDiscount, totalTax: totals.totalTax, 
            roundOff: totals.roundOff, grandTotal: totals.grandTotal, paidAmount: amountReceived, 
            balanceDue: totals.balanceDue, notes 
          }}
        />
      )}
    </div>
  );
}