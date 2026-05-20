import { useState, useEffect } from 'react';
import { Palette, Type, Maximize, Layout, Save, CheckCircle, Landmark, Database, Download } from 'lucide-react';
import { InvoiceTemplate } from '../components/templates/InvoiceTemplate';
import type { InvoiceData } from '../types/invoice';

// Using the updated, strictly-typed InvoiceData interface
const MOCK_DATA: InvoiceData = {
  type: 'Sale',
  billNo: "INV-001",
  date: new Date().toISOString().split('T')[0],
  partyName: "Acme Corp",
  phone: "9876543210",
  stateOfSupply: "Maharashtra",
  companyDetails: {
    business_name: "Your Company Name",
    gst_number: "27XXXXX1234X1ZX",
    address: "123 Business Road, Tech Park\nMumbai, Maharashtra",
    phone: "+91 98765 43210",
    email: "contact@yourcompany.com"
  },
  items: [
    { id: 1, name: "Premium Widget", qty: 2, price: 1500, discount: 100, taxRate: 18, amount: 3304 },
    { id: 2, name: "Service Installation", qty: 1, price: 500, discount: 0, taxRate: 18, amount: 590 }
  ],
  subTotal: 3500,
  globalDiscount: 0,
  totalTax: 612,
  roundOff: 0,
  grandTotal: 3894,
  paidAmount: 0,
  balanceDue: 3894,
  notes: "Thank you for doing business with us!"
};

export function CustomTemplateSettings({ companyId }: { companyId: string }) {
  const [settings, setSettings] = useState({
    theme_name: 'Modern',
    primary_color: '#2563EB',
    font_family: 'Inter, sans-serif',
    spacing: 'normal',
    show_tax_column: 1,
    show_discount_column: 1,
    show_notes: 1,
    custom_terms: 'Goods once sold will not be taken back.',
    show_bank_details: 0,
    bank_details_text: ''
  });
  
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const res = await window.electronAPI.getCompanySettings(Number(companyId));
      if (res.success && res.settings) {
        setSettings(res.settings);
      }
    };
    fetchSettings();
  }, [companyId]);

  const handleSave = async () => {
    const payload = {
      companyId: Number(companyId),
      themeName: settings.theme_name,
      primaryColor: settings.primary_color,
      fontFamily: settings.font_family,
      spacing: settings.spacing,
      showTax: settings.show_tax_column === 1,
      showDiscount: settings.show_discount_column === 1,
      showNotes: settings.show_notes === 1,
      customTerms: settings.custom_terms,
      showBankDetails: settings.show_bank_details === 1,
      bankDetailsText: settings.bank_details_text
    };
    
    const res = await window.electronAPI.updateCompanySettings(payload);
    if (res.success) {
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } else {
      alert("Failed to save settings");
    }
  };

  const handleReset = async () => {
    if(window.confirm("Are you sure you want to reset all template settings to default?")) {
      const defaults = {
        themeName: 'Modern', 
        primaryColor: '#2563EB', 
        fontFamily: 'Inter, sans-serif', 
        spacing: 'normal',
        showTax: true, 
        showDiscount: true, 
        showNotes: true,
        customTerms: 'Goods once sold will not be taken back.',
        showBankDetails: false, 
        bankDetailsText: ''
      };
      
      const res = await window.electronAPI.updateCompanySettings({ companyId: Number(companyId), ...defaults });
      if (res.success) {
        setSettings({
          theme_name: 'Modern', 
          primary_color: '#2563EB', 
          font_family: 'Inter, sans-serif', 
          spacing: 'normal',
          show_tax_column: 1, 
          show_discount_column: 1, 
          show_notes: 1,
          custom_terms: 'Goods once sold will not be taken back.',
          show_bank_details: 0, 
          bank_details_text: ''
        });
        alert("Settings reset successfully!");
      }
    }
  };

  const handleBackup = async () => {
    const res = await window.electronAPI.backupDatabase();
    if(res.success) {
      alert(res.message);
    }
  };

  return (
    <div className="flex h-full bg-slate-50 overflow-hidden">
      
      {/* LEFT PANE */}
      <div className="w-1/3 min-w-[350px] max-w-[400px] bg-white border-r border-slate-200 flex flex-col h-full shadow-lg z-10 overflow-y-auto">
        <div className="p-6 border-b border-slate-200 bg-slate-50 sticky top-0 z-10 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Settings</h2>
            <p className="text-xs text-slate-500">Invoice & App Preferences</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleReset} className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-lg transition-colors border border-slate-200 shadow-sm">
              Reset
            </button>
            <button onClick={handleSave} className={`flex items-center px-4 py-2 rounded-lg font-bold text-sm transition-colors shadow-sm ${isSaved ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
              {isSaved ? <CheckCircle className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              {isSaved ? 'Saved!' : 'Save'}
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center mb-3"><Palette className="w-4 h-4 mr-2"/> Brand Color</h3>
            <div className="flex gap-3">
              {['#2563EB', '#16A34A', '#DC2626', '#9333EA', '#0F172A'].map(color => (
                <button 
                  key={color} 
                  onClick={() => setSettings({...settings, primary_color: color})}
                  className={`w-8 h-8 rounded-full border-2 ${settings.primary_color === color ? 'border-slate-800 scale-110' : 'border-transparent hover:scale-110'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
              <input type="color" value={settings.primary_color} onChange={(e) => setSettings({...settings, primary_color: e.target.value})} className="w-8 h-8 p-0 border-0 rounded cursor-pointer" />
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center mb-3"><Type className="w-4 h-4 mr-2"/> Font Family</h3>
            <select className="w-full p-2.5 border border-slate-300 rounded-lg outline-none font-medium text-slate-700" value={settings.font_family} onChange={(e) => setSettings({...settings, font_family: e.target.value})}>
              <option value="Inter, sans-serif">Inter (Modern & Clean)</option>
              <option value="Georgia, serif">Georgia (Classic & Formal)</option>
              <option value="'Courier New', monospace">Courier (Typewriter / Retail)</option>
            </select>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center mb-3"><Maximize className="w-4 h-4 mr-2"/> Layout Spacing</h3>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              {['compact', 'normal', 'relaxed'].map(space => (
                <button 
                  key={space} 
                  onClick={() => setSettings({...settings, spacing: space})}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md capitalize transition-colors ${settings.spacing === space ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  {space}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center mb-3"><Layout className="w-4 h-4 mr-2"/> Visible Fields</h3>
            <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-semibold text-slate-700">Show Tax Column</span>
                <input type="checkbox" checked={settings.show_tax_column === 1} onChange={(e) => setSettings({...settings, show_tax_column: e.target.checked ? 1 : 0})} className="w-4 h-4 text-blue-600 rounded" />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-semibold text-slate-700">Show Discount Column</span>
                <input type="checkbox" checked={settings.show_discount_column === 1} onChange={(e) => setSettings({...settings, show_discount_column: e.target.checked ? 1 : 0})} className="w-4 h-4 text-blue-600 rounded" />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-semibold text-slate-700">Show Internal Notes</span>
                <input type="checkbox" checked={settings.show_notes === 1} onChange={(e) => setSettings({...settings, show_notes: e.target.checked ? 1 : 0})} className="w-4 h-4 text-blue-600 rounded" />
              </label>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center mb-3"><Landmark className="w-4 h-4 mr-2"/> Bank Details on Invoice</h3>
            <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <label className="flex items-center justify-between cursor-pointer mb-2">
                <span className="text-sm font-semibold text-slate-700">Display Bank Details</span>
                <input type="checkbox" checked={settings.show_bank_details === 1} onChange={(e) => setSettings({...settings, show_bank_details: e.target.checked ? 1 : 0})} className="w-4 h-4 text-blue-600 rounded" />
              </label>
              {settings.show_bank_details === 1 && (
                <textarea 
                  rows={4} 
                  className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:border-blue-500 text-sm font-medium" 
                  placeholder="Bank: HDFC Bank&#10;A/C No: 1234567890&#10;IFSC: HDFC0001234"
                  value={settings.bank_details_text || ''} 
                  onChange={(e) => setSettings({...settings, bank_details_text: e.target.value})}
                ></textarea>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Terms & Conditions</h3>
            <textarea 
              rows={4} 
              className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:border-blue-500 text-sm font-medium text-slate-600"
              value={settings.custom_terms || ''}
              onChange={(e) => setSettings({...settings, custom_terms: e.target.value})}
            ></textarea>
          </div>

          {/* BACKUP SECTION */}
          <div className="pt-6 border-t border-slate-200">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center mb-3"><Database className="w-4 h-4 mr-2"/> Data Management</h3>
            <div className="bg-slate-800 p-5 rounded-2xl text-white shadow-md relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-slate-700 rounded-full opacity-50 pointer-events-none"></div>
                <h4 className="font-bold text-sm mb-1">Local Backup</h4>
                <p className="text-xs text-slate-300 mb-4 font-medium leading-relaxed">Save a secure copy of your entire database file to your hard drive.</p>
                <button onClick={handleBackup} className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-sm transition-colors flex items-center justify-center">
                    <Download className="w-4 h-4 mr-2" /> Backup Database (.sqlite)
                </button>
            </div>
          </div>
          
        </div>
      </div>

      {/* RIGHT PANE */}
      <div className="flex-1 bg-slate-200 overflow-y-auto p-8 flex justify-center items-start">
        <div className="shadow-2xl scale-95 transform origin-top transition-all duration-300">
          <InvoiceTemplate type="Sale" data={MOCK_DATA} settings={settings} />
        </div>
      </div>

    </div>
  );
}