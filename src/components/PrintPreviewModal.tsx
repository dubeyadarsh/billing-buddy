import React, { useState } from 'react';
import { createPortal } from 'react-dom'; // <-- 1. Import createPortal
import { X, Printer, LayoutTemplate } from 'lucide-react';
import { InvoiceTemplate } from './templates/InvoiceTemplate';
import { TemplateModern } from './templates/TemplateModern';
import { TemplateThermal } from './templates/TemplateThermal';
import type { InvoiceData } from '../types/invoice';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceData: InvoiceData;
  settings: any;
}

export const PrintPreviewModal: React.FC<PrintModalProps> = ({ isOpen, onClose, invoiceData, settings }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<'standard' | 'modern' | 'thermal'>('standard');

  if (!isOpen) return null;

  // 2. Assign the modal JSX to a variable
  const modalContent = (
    // Changed z-[150] to z-[9999] for absolute safety
    <div className="fixed inset-0 z-[9999] flex bg-slate-900/60 backdrop-blur-sm print:bg-white print:backdrop-blur-none animate-in fade-in">
      
      {/* Sidebar Controls */}
      <div className="w-80 bg-white h-full shadow-2xl flex flex-col print:hidden z-10">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">Print Preview</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 bg-white rounded-full border border-slate-200 shadow-sm"><X className="w-4 h-4"/></button>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center mb-4">
            <LayoutTemplate className="w-4 h-4 mr-2" /> Select Template
          </label>
          <div className="space-y-3">
            <button 
              onClick={() => setSelectedTemplate('standard')}
              className={`w-full p-4 border rounded-xl text-left transition-all ${selectedTemplate === 'standard' ? 'border-blue-500 bg-blue-50 shadow-md ring-1 ring-blue-500' : 'border-slate-200 hover:border-blue-300 bg-white'}`}
            >
              <h3 className="font-bold text-slate-900">Standard Professional</h3>
              <p className="text-xs text-slate-500 mt-1">Clean, balanced, corporate look.</p>
            </button>
            <button 
              onClick={() => setSelectedTemplate('modern')}
              className={`w-full p-4 border rounded-xl text-left transition-all ${selectedTemplate === 'modern' ? 'border-blue-500 bg-blue-50 shadow-md ring-1 ring-blue-500' : 'border-slate-200 hover:border-blue-300 bg-white'}`}
            >
              <h3 className="font-bold text-slate-900">Modern Creative</h3>
              <p className="text-xs text-slate-500 mt-1">Bold colors, design-forward A4.</p>
            </button>
            <button 
              onClick={() => setSelectedTemplate('thermal')}
              className={`w-full p-4 border rounded-xl text-left transition-all ${selectedTemplate === 'thermal' ? 'border-blue-500 bg-blue-50 shadow-md ring-1 ring-blue-500' : 'border-slate-200 hover:border-blue-300 bg-white'}`}
            >
              <h3 className="font-bold text-slate-900">Thermal POS (3-inch)</h3>
              <p className="text-xs text-slate-500 mt-1">For retail receipt printers.</p>
            </button>
          </div>
        </div>
        <div className="p-6 border-t border-slate-200 bg-slate-50">
          <button onClick={() => window.print()} className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 shadow-sm transition-all hover:-translate-y-0.5">
            <Printer className="w-5 h-5" /> Print / Save PDF
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 overflow-y-auto p-12 flex items-start justify-center print:p-0 print:m-0 print:overflow-visible bg-slate-200/50">
        <div className="shadow-2xl print:shadow-none transition-all duration-300">
          {selectedTemplate === 'standard' && <InvoiceTemplate type={invoiceData.type || 'Sale'} data={invoiceData} settings={settings} />}
          {selectedTemplate === 'modern' && <TemplateModern data={invoiceData} settings={settings} />}
          {selectedTemplate === 'thermal' && <TemplateThermal data={invoiceData} settings={settings} />}
        </div>
      </div>
    </div>
  );

  // 3. Return the content attached to document.body
  return createPortal(modalContent, document.body);
};