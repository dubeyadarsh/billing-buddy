import React from 'react';
import type { InvoiceData } from '../../types/invoice';

export const TemplateThermal: React.FC<{ data: InvoiceData, settings?: any }> = ({ data, settings }) => {
  return (
    <div className="w-[80mm] bg-white p-4 text-black mx-auto font-mono text-sm border border-slate-200 shadow-sm print:shadow-none print:border-none print:m-0 print:p-2">
      
      {/* Store Header */}
      <div className="text-center mb-4 border-b border-dashed border-black pb-3">
         {/* DYNAMIC LOGO FOR POS */}
         {data.companyDetails?.logo_base64 && (
            <img src={data.companyDetails.logo_base64} alt="Logo" className="w-10 h-10 object-contain mx-auto mb-2 grayscale" />
         )}
        <h2 className="font-bold text-xl uppercase tracking-tight">
          {data.companyDetails?.business_name || 'MY STORE'}
        </h2>
        {data.companyDetails?.gst_number && (
          <p className="text-[11px] mt-1">GSTIN: {data.companyDetails.gst_number}</p>
        )}
        <p className="text-[11px] mt-1 font-bold border border-black inline-block px-2 py-0.5">
          {data.type === 'Purchase' ? 'PURCHASE RECORD' : 'TAX INVOICE'}
        </p>
      </div>

      {/* Invoice Meta & Party Details */}
      <div className="mb-4 text-xs">
        <div className="flex justify-between mb-1.5">
          <span>Date:</span>
          <span className="font-bold">{data.date}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span>Bill No:</span>
          <span className="font-bold">{data.billNo}</span>
        </div>
        
        <div className="border-t border-dotted border-slate-400 pt-2 mt-2">
          <p className="text-[10px] uppercase tracking-wider mb-0.5">Billed To:</p>
          <p className="font-bold text-sm">
            {data.partyName || 'Cash Customer'}
          </p>
          {data.phone && <p className="mt-0.5">Ph: {data.phone}</p>}
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-4">
        <div className="flex justify-between font-bold border-b border-black pb-1 mb-2 text-xs">
          <span className="w-[50%]">Item</span>
          <span className="w-[20%] text-center">Qty</span>
          <span className="w-[30%] text-right">Amt</span>
        </div>
        
        <div className="space-y-2">
          {data.items.map((item, i) => (
            <div key={i} className="flex justify-between text-xs items-start">
              <span className="w-[50%] pr-2 leading-tight break-words">
                {item.name || 'Unnamed Item'}
                {settings?.show_tax_column === 1 && item.taxRate > 0 && <span className="text-[9px] block text-slate-500">Tax: {item.taxRate}%</span>}
              </span>
              <span className="w-[20%] text-center">{item.qty}</span>
              <span className="w-[30%] text-right font-medium">
                {item.amount.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Financial Totals */}
      <div className="border-t border-dashed border-black pt-2 text-xs">
        <div className="flex justify-between mb-1">
          <span>Subtotal:</span>
          <span>{data.subTotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between mb-1">
          <span>GST/Tax:</span>
          <span>{data.totalTax.toFixed(2)}</span>
        </div>
        {data.globalDiscount > 0 && (
          <div className="flex justify-between mb-1 text-slate-700">
            <span>Discount:</span>
            <span>-{data.globalDiscount.toFixed(2)}</span>
          </div>
        )}
        {data.roundOff !== 0 && (
          <div className="flex justify-between mb-1 text-slate-700">
            <span>Round Off:</span>
            <span>{data.roundOff > 0 ? '+' : ''}{data.roundOff.toFixed(2)}</span>
          </div>
        )}
        
        <div className="flex justify-between font-bold text-lg mt-2 border-y border-black py-2">
          <span>TOTAL:</span>
          <span>₹{data.grandTotal.toFixed(2)}</span>
        </div>
      </div>

      {/* Notes & Bank Info (Thermal-friendly format) */}
      <div className="mt-4 text-[10px]">
        {settings?.show_notes === 1 && data.notes && (
          <div className="mb-2">
            <p className="font-bold border-b border-dotted border-slate-300 inline-block mb-1">Notes:</p>
            <p className="leading-tight whitespace-pre-wrap">{data.notes}</p>
          </div>
        )}
        
        {settings?.show_bank_details === 1 && settings?.bank_details_text && (
          <div className="mt-2 border border-slate-300 p-1.5 rounded">
            <p className="font-bold text-[9px] uppercase">Bank Details:</p>
            <p className="leading-tight whitespace-pre-wrap text-[9px]">{settings.bank_details_text}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center mt-6 pt-4 border-t border-dotted border-slate-400">
        <p className="text-xs font-bold">Thank you for visiting!</p>
        <p className="text-[9px] mt-1 text-slate-600">Powered by BillingBuddy</p>
      </div>
      
    </div>
  );
};