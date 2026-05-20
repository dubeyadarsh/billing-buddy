import React from 'react';

export const TemplateReceipt = ({ data, settings }: { data: any, settings: any }) => {
  const primaryColor = settings?.primary_color || '#2563EB';

  return (
    // Half-page (A5) size for receipts
    <div className="w-[210mm] min-h-[148mm] bg-white p-12 text-slate-900 mx-auto shadow-sm border border-slate-200 font-sans relative overflow-hidden">
      
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-64 h-64 opacity-5 rounded-bl-full" style={{ backgroundColor: primaryColor }}></div>

      {/* Header */}
      <div className="flex justify-between border-b-2 pb-6 mb-8" style={{ borderColor: primaryColor }}>
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase" style={{ color: primaryColor }}>Payment Receipt</h1>
          <p className="text-slate-500 font-bold mt-2">Receipt No: {data.receiptId}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-xl text-slate-800">{data.companyName || 'Your Company'}</p>
          <p className="text-slate-500 font-medium mt-1">Date: {data.date}</p>
        </div>
      </div>

      {/* Primary Info */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-8 flex justify-between items-center">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Received From</p>
          <p className="text-2xl font-bold text-slate-800">{data.partyName}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Amount Received</p>
          <p className="text-4xl font-black text-emerald-600">₹ {data.amount.toFixed(2)}</p>
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Payment Details</p>
          <table className="w-full text-sm">
            <tbody>
              <tr><td className="py-2 text-slate-500 font-medium">Payment Mode:</td><td className="py-2 font-bold text-slate-800 text-right">{data.mode}</td></tr>
              {data.accountName && <tr><td className="py-2 text-slate-500 font-medium">Deposited To:</td><td className="py-2 font-bold text-slate-800 text-right">{data.accountName}</td></tr>}
              <tr><td className="py-2 text-slate-500 font-medium">Applied Against:</td><td className="py-2 font-bold text-blue-600 text-right">{data.invoiceRef}</td></tr>
            </tbody>
          </table>
        </div>
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Notes / Remarks</p>
          <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 min-h-[80px]">
            {data.notes || "Thank you for your payment."}
          </p>
        </div>
      </div>

      {/* Footer Signature */}
      <div className="mt-16 pt-8 border-t border-slate-200 flex justify-between items-end">
        <p className="text-xs text-slate-400 font-medium">This is a computer-generated receipt.</p>
        <div className="text-center">
          <div className="w-48 border-b-2 border-slate-300 mb-2"></div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Authorized Signatory</p>
        </div>
      </div>
    </div>
  );
};