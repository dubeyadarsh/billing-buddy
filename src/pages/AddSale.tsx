import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, Trash2, FileText, Save, Printer, UserPlus, Check } from 'lucide-react';
import { PrintPreviewModal } from '../components/PrintPreviewModal';

// 1. Define Props and Party Interface
interface AddSaleProps {
  companyDetails: { id: string; name: string; gstin: string };
}

interface Party {
  id: string;
  name: string;
  phone: string;
  gstin?: string;
}

// Simulated Database of existing customers
const mockParties: Party[] = [
  { id: 'p1', name: 'Acme Corp', phone: '9876543210', gstin: '27AADCB2230M1Z2' },
  { id: 'p2', name: 'Stark Industries', phone: '9123456789' },
  { id: 'p3', name: 'Wayne Enterprises', phone: '9988776655', gstin: '07BBDCB2230M1Z1' }
];

export const AddSale: React.FC<AddSaleProps> = ({ companyDetails }) => {
  // Core Invoice State
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState([{ id: 1, name: '', qty: 1, rate: 0, taxPercent: 18, amount: 0 }]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // --- NEW: Smart Party Selection State ---
  const [parties, setParties] = useState<Party[]>(mockParties);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [partySearchQuery, setPartySearchQuery] = useState('');
  const [isPartyDropdownOpen, setIsPartyDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsPartyDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredParties = parties.filter(p => p.name.toLowerCase().includes(partySearchQuery.toLowerCase()));
  const exactMatchExists = parties.some(p => p.name.toLowerCase() === partySearchQuery.toLowerCase());

  const handleSelectParty = (party: Party) => {
    setSelectedParty(party);
    setPartySearchQuery(party.name);
    setIsPartyDropdownOpen(false);
  };

  const handleAddNewParty = () => {
    if (!partySearchQuery.trim()) return;
    const newParty: Party = {
      id: `p_${Date.now()}`,
      name: partySearchQuery,
      phone: '' // In a real app, this might open a quick modal to ask for phone/GST
    };
    setParties([...parties, newParty]);
    handleSelectParty(newParty);
  };
  // ----------------------------------------

  // Item Logic
  const addRow = () => setItems([...items, { id: Date.now(), name: '', qty: 1, rate: 0, taxPercent: 18, amount: 0 }]);
  const removeRow = (id: number) => items.length > 1 && setItems(items.filter(item => item.id !== id));
  
  const updateItem = (id: number, field: string, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        const base = updatedItem.qty * updatedItem.rate;
        const taxAmount = base * (updatedItem.taxPercent / 100);
        updatedItem.amount = base + taxAmount;
        return updatedItem;
      }
      return item;
    }));
  };

  // Math
  const subTotal = items.reduce((sum, item) => sum + (item.qty * item.rate), 0);
  const totalTax = items.reduce((sum, item) => sum + ((item.qty * item.rate) * (item.taxPercent / 100)), 0);
  const grandTotal = subTotal + totalTax;

  // Bundle for Modal
  const invoiceData = {
    companyDetails, // <--- Passing the actual business details here
    customer: selectedParty, // <--- Passing the full party object
    customerName: selectedParty ? selectedParty.name : partySearchQuery, // Fallback for pure cash sales
    invoiceDate,
    items,
    subTotal,
    totalTax,
    grandTotal
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 relative">
      
      {/* Header */}
      <div className="flex items-center justify-between p-6 bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
            <FileText className="w-6 h-6" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Invoice</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Billing as: {companyDetails.name}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsPreviewOpen(true)}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium"
          >
            <Printer className="w-4 h-4" /> Print Preview
          </button>
          <button className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium shadow-sm shadow-blue-200">
            <Save className="w-4 h-4" /> Save Invoice
          </button>
        </div>
      </div>

      {/* Main Form */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
          
          {/* Party & Date Section */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6">
            
            {/* THE SMART PARTY COMBOBOX */}
            <div className="flex-1 relative" ref={dropdownRef}>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Billed To (Customer / Party)</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search customer or enter new name..." 
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-sm font-medium text-slate-900"
                  value={partySearchQuery}
                  onChange={(e) => {
                    setPartySearchQuery(e.target.value);
                    setSelectedParty(null); // Clear selection if they start typing
                    setIsPartyDropdownOpen(true);
                  }}
                  onFocus={() => setIsPartyDropdownOpen(true)}
                />
                {selectedParty && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-emerald-100 text-emerald-700 p-1 rounded-md">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>

              {/* The Dropdown Menu */}
              {isPartyDropdownOpen && partySearchQuery.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                  {filteredParties.map(party => (
                    <button
                      key={party.id}
                      onClick={() => handleSelectParty(party)}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 flex justify-between items-center"
                    >
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{party.name}</p>
                        {party.phone && <p className="text-xs text-slate-500 mt-0.5">{party.phone}</p>}
                      </div>
                      {selectedParty?.id === party.id && <Check className="w-4 h-4 text-blue-600" />}
                    </button>
                  ))}

                  {/* Add New Party Trigger */}
                  {!exactMatchExists && (
                    <button
                      onClick={handleAddNewParty}
                      className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 flex items-center gap-2 transition-colors"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span className="font-semibold text-sm">Add "{partySearchQuery}" as new party</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="w-full md:w-48">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Invoice Date</label>
              <input 
                type="date" 
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-sm font-medium text-slate-900"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
              />
            </div>
          </div>

          {/* ... Item Table Section (SAME AS BEFORE) ... */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              {/* Keep the exact same <thead> and <tbody> mapping from the previous response */}
               <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-4 w-12 text-center">#</th>
                  <th className="p-4">Item Details</th>
                  <th className="p-4 w-24">Qty</th>
                  <th className="p-4 w-32">Rate (₹)</th>
                  <th className="p-4 w-28">GST %</th>
                  <th className="p-4 w-40 text-right">Amount (₹)</th>
                  <th className="p-4 w-16 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-4 text-center text-slate-400 font-medium text-sm">{index + 1}</td>
                    <td className="p-4">
                      <input 
                        type="text" 
                        placeholder="Item name or scan barcode" 
                        className="w-full bg-transparent border-none outline-none focus:ring-0 placeholder:text-slate-300 font-medium text-slate-900 text-sm"
                        value={item.name}
                        onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                      />
                    </td>
                    <td className="p-4">
                      <input 
                        type="number" 
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:border-blue-500 outline-none text-sm text-slate-900 font-medium"
                        value={item.qty || ''}
                        onChange={(e) => updateItem(item.id, 'qty', parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td className="p-4">
                      <input 
                        type="number" 
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:border-blue-500 outline-none text-sm text-slate-900 font-medium"
                        value={item.rate || ''}
                        onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td className="p-4">
                      <select 
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:border-blue-500 outline-none text-sm text-slate-900 font-medium"
                        value={item.taxPercent}
                        onChange={(e) => updateItem(item.id, 'taxPercent', parseFloat(e.target.value))}
                      >
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                        <option value="18">18%</option>
                        <option value="28">28%</option>
                      </select>
                    </td>
                    <td className="p-4 text-right font-bold text-slate-800">
                      ₹{item.amount.toFixed(2)}
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => removeRow(item.id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-3 border-t border-slate-100">
              <button onClick={addRow} className="flex items-center gap-2 px-4 py-2 text-blue-600 font-semibold text-sm hover:bg-blue-50 rounded-xl transition-all">
                <Plus className="w-4 h-4" strokeWidth={2.5} /> Add Another Line
              </button>
            </div>
          </div>

          {/* Calculations Footer */}
          <div className="flex justify-end">
            <div className="w-full md:w-80 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex justify-between text-slate-600 font-medium text-sm">
                <span>Subtotal:</span>
                <span>₹{subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600 font-medium text-sm pb-4 border-b border-slate-100">
                <span>Total GST:</span>
                <span>₹{totalTax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-black text-slate-900">
                <span>Total:</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      <PrintPreviewModal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} invoiceData={invoiceData} />
    </div>
  );
};