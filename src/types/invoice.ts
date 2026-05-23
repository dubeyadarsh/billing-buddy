export interface InvoiceData {
  type?: 'Sale' | 'Purchase';
  billNo: string;
  date: string;
  partyName: string;
  phone?: string;
  stateOfSupply?: string;
  companyDetails: any; // Contains business_name, logo_base64, address, gst_number, etc.
  items: Array<{ 
    id: number | string; 
    name: string; 
    qty: number; 
    price: number; 
    discount: number; 
    taxRate: number; 
    amount: number;
    serialNo?: string;  // From frontend live state
    serial_no?: string; // From backend DB state
  }>;
  subTotal: number;
  globalDiscount: number;
  totalTax: number;
  roundOff: number;
  grandTotal: number;
  paidAmount: number;
  balanceDue: number;
  notes: string;
}