// src/electron.d.ts

export {}; // Ensures this file is treated as a module by TypeScript

// ==========================================
// 1. AUTHENTICATION & COMPANY API
// ==========================================
export interface IAuthAPI {
  // Auth
  loginUser: (data: { 
    username: string; 
    password: string 
  }) => Promise<{ 
    success: boolean; 
    user?: { id: number; username: string }; 
    message?: string 
  }>;
  
  registerUser: (data: { 
    username: string; 
    password: string;
    email: string;
    contact: string;
  }) => Promise<{ 
    success: boolean; 
    userId?: number; 
    message?: string 
  }>;

  // Companies
  getCompanies: (userId: number) => Promise<{ 
    success: boolean; 
    data?: any[]; 
    message?: string 
  }>;
  
  addCompany: (data: {
    userId: number;
    businessName: string;
    businessType: string;
    gstNumber?: string;
    phone?: string;
    email?: string;
    address?: string;
  }) => Promise<{ 
    success: boolean; 
    id?: number; 
    message?: string 
  }>;
  
  deleteCompany: (companyId: number) => Promise<{ 
    success: boolean; 
    message?: string 
  }>;
  // Add this to your interface
updateCompany: (data: any) => Promise<{ success: boolean; message?: string }>;
// Add inside IAuthAPI
getCompany: (companyId: number | string) => Promise<{ success: boolean; data?: any; message?: string }>;

addInvoice: (data: any) => Promise<{ success: boolean; id?: number; message?: string }>;
// Inside export interface IAuthAPI { ... }

getDashboardStats: (data: { 
  companyId: number | string; 
  summaryRange?: string; 
  timeRange?: string 
}) => Promise<any>;// Add inside IAuthAPI:
getInvoices: (params: { companyId: number; page?: number; limit?: number; searchTerm?: string }) => Promise<any>;
// --- PURCHASE TYPES ---
addPurchase: (data: any) => Promise<{ success: boolean; id?: number; message?: string }>;
getPurchases: (params: { companyId: number; page?: number; limit?: number; searchTerm?: string }) => Promise<any>;
// --- INVENTORY TYPES ---
// --- INVENTORY TYPES ---
getUnits: () => Promise<{ success: boolean; data?: any[]; message?: string }>;
saveItem: (data: any) => Promise<{ success: boolean; id?: number; message?: string }>;
// Inside your IAuthAPI interface, update getItems:
getItems: (params: { 
    companyId: number | string; 
    page?: number; 
    limit?: number; 
    searchTerm?: string 
}) => Promise<{ 
    success: boolean; 
    data?: any[]; 
    total?: number; 
    totalPages?: number; 
    message?: string 
}>;
deleteItem: (id: number) => Promise<{ success: boolean; message?: string }>;
// Add to your interface:
getNextInvoiceNo: (companyId: number | string) => Promise<{ success: boolean; nextNo: string }>;
// --- PARTIES TYPES ---
addParty: (data: any) => Promise<{ success: boolean; id?: number; message?: string }>;
getParties: (companyId: number | string) => Promise<{ success: boolean; data?: any[]; message?: string }>;
// --- TEMPLATE SETTINGS TYPES ---
getCompanySettings: (companyId: number | string) => Promise<{ success: boolean; settings?: any; message?: string }>;
updateCompanySettings: (data: any) => Promise<{ success: boolean; message?: string }>;
getAccounts: (companyId: number | string) => Promise<{ success: boolean; data?: any[]; message?: string }>;
addAccount: (data: any) => Promise<{ success: boolean; message?: string }>;
transferBalance: (data: any) => Promise<{ success: boolean; message?: string }>;
getInvoiceDetails: (id: number) => Promise<{ success: boolean; data?: any; message?: string }>;
getPurchaseDetails: (id: number) => Promise<{ success: boolean; data?: any; message?: string }>;
deleteInvoice: (id: number) => Promise<{ success: boolean; message?: string }>;
deletePurchase: (id: number) => Promise<{ success: boolean; message?: string }>;
getActivityLogs: (companyId: number | string, limit?: number) => Promise<{ success: boolean; data?: any[]; message?: string }>;
logActivity: (data: { companyId: number | string; userName: string; actionType: string; module: string; description: string }) => Promise<{ success: boolean }>;
getInventoryStats: (companyId: number | string) => Promise<{ success: boolean; stats?: any; message?: string }>;
recordInvoicePayment: (data: { 
    invoiceId: number; 
    companyId: number; 
    paymentAmount: number;
    accountId?: number; 
  }) => Promise<{ success: boolean; message?: string }>;
  // in electron.d.ts
  getSystemAlerts: (companyId: number | string) => Promise<{ success: boolean; data?: any[]; message?: string }>;
sendWhatsappOtp: (data: { contact: string, otp: string }) => Promise<{ success: boolean; message?: string }>;
backupDatabase: () => Promise<{ success: boolean; message?: string }>;
  getInvoicePayments: (invoiceId: number) => Promise<{ success: boolean; data?: any[]; message?: string }>;
  getAccountStatement: (accountId: number) => Promise<{ success: boolean; data?: any[]; message?: string }>;

  editInvoice: (data: any) => Promise<any>;
    editPurchase: (data: any) => Promise<any>;
}

// ==========================================
// 2. INVENTORY API (VAHI)
// ==========================================
export interface IVahiAPI {
  getInventory: () => Promise<any[]>;
  addItem: (item: { name: string; price: number; stock: number }) => Promise<any>;
  // Add this to your IAuthAPI interface:
}

// ==========================================
// 3. GLOBAL WINDOW MERGE
// ==========================================
declare global {
  interface Window {
    electronAPI: IAuthAPI;
    vahiAPI: IVahiAPI;
  }
}