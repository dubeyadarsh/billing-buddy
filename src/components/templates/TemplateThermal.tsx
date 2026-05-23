import React from 'react';
import type { InvoiceData } from '../../types/invoice';

export const TemplateThermal: React.FC<{ data: InvoiceData, settings?: any }> = ({ data, settings }) => {
  return (
    <div className="w-[80mm] bg-white p-4 text-black mx-auto font-mono text-sm border border-slate-200 shadow-sm print:shadow-none print:border-none print:m-0 print:p-2">
      
      {/* Store Header */}
      <div className="text-center mb-4 border-b border-dashed border-black pb-3">
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

      {/* Bill Meta */}
      <div className="text-[11px] mb-3 leading-tight">
        <p>No: {data.billNo}</p>
        <p>Date: {data.date}</p>
        <p className="mt-1">To: {data.partyName || 'Cash'}</p>
      </div>

      {/* Items List */}
      <table className="w-full text-[11px] mb-3 border-y border-dashed border-black py-2 block">
        <thead className="w-full block pb-1 border-b border-black">
          <tr className="flex">
            <th className="text-left flex-1 font-normal">Item</th>
            <th className="text-right w-8 font-normal">Qty</th>
            <th className="text-right w-16 font-normal">Amt</th>
          </tr>
        </thead>
        <tbody className="w-full block pt-1">
          {data.items.map((item, idx) => (
            <tr key={idx} className="flex flex-wrap mb-1.5">
              <td className="text-left flex-1 break-words">
                {item.name}
                {(item.serialNo || item.serial_no) && (
                  <div className="text-[9px] text-slate-500 mt-0.5">S/N: {item.serialNo || item.serial_no}</div>
                )}
              </td>
              <td className="text-right w-8 align-top">{item.qty}</td>
              <td className="text-right w-16 align-top">{(item.amount || 0).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="text-[11px] text-right">
        <div className="flex justify-between mb-1">
          <span>SubTotal:</span>
          <span>{data.subTotal.toFixed(2)}</span>
        </div>
        {data.globalDiscount > 0 && (
          <div className="flex justify-between mb-1">
            <span>Discount:</span>
            <span>-{data.globalDiscount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between mb-1">
          <span>Tax:</span>
          <span>{data.totalTax.toFixed(2)}</span>
        </div>
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

      {/* Notes & Bank Info */}
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

      <div className="text-center mt-6 pt-4 border-t border-dashed border-black">
        <p className="text-[10px] font-bold">THANK YOU</p>
        <p className="text-[9px]">Visit Again</p>
      </div>
    </div>
  );
}