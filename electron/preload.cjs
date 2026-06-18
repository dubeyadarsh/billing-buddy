const { contextBridge, ipcRenderer } = require('electron');

// Expose Authentication API
contextBridge.exposeInMainWorld('electronAPI', {
    registerUser: (userData) => ipcRenderer.invoke('register-user', userData),
    loginUser: (userData) => ipcRenderer.invoke('login-user', userData),
    // Add inside contextBridge.exposeInMainWorld('electronAPI', { ... })
getCompanies: (userId) => ipcRenderer.invoke('get-companies', userId),
addCompany: (data) => ipcRenderer.invoke('add-company', data),
deleteCompany: (companyId) => ipcRenderer.invoke('delete-company', companyId),
// Add this under deleteCompany:
updateCompany: (data) => ipcRenderer.invoke('update-company', data),
// Add under your other company endpoints:
getCompany: (companyId) => ipcRenderer.invoke('get-company', companyId),
// Add this inside contextBridge:
addInvoice: (data) => ipcRenderer.invoke('add-invoice', data),
getDashboardStats: (data) => ipcRenderer.invoke('get-dashboard-stats', data),
// Add inside contextBridge:
// Change these lines:
getInvoices: (params) => ipcRenderer.invoke('get-invoices', params),
getPurchases: (params) => ipcRenderer.invoke('get-purchases', params),
// Add these inside the contextBridge:
addPurchase: (data) => ipcRenderer.invoke('add-purchase', data),
// --- INVENTORY ENDPOINTS ---
// --- INVENTORY ENDPOINTS ---
getUnits: () => ipcRenderer.invoke('get-units'),
saveItem: (data) => ipcRenderer.invoke('save-item', data),
// Update this line:
getItems: (params) => ipcRenderer.invoke('get-items', params),
deleteItem: (id) => ipcRenderer.invoke('delete-item', id),
// Add inside contextBridge:
getNextInvoiceNo: (companyId) => ipcRenderer.invoke('get-next-invoice-no', companyId),
// --- PARTIES ENDPOINTS ---
addParty: (data) => ipcRenderer.invoke('add-party', data),
getParties: (companyId) => ipcRenderer.invoke('get-parties', companyId),
// --- TEMPLATE SETTINGS ENDPOINTS ---
getCompanySettings: (companyId) => ipcRenderer.invoke('get-company-settings', companyId),
updateCompanySettings: (data) => ipcRenderer.invoke('update-company-settings', data),
getAccounts: (companyId) => ipcRenderer.invoke('get-accounts', companyId),
addAccount: (data) => ipcRenderer.invoke('add-account', data),
transferBalance: (data) => ipcRenderer.invoke('transfer-balance', data),
getInvoiceDetails: (id) => ipcRenderer.invoke('get-invoice-details', id),
getPurchaseDetails: (id) => ipcRenderer.invoke('get-purchase-details', id),
deleteInvoice: (id) => ipcRenderer.invoke('delete-invoice', id),
deletePurchase: (id) => ipcRenderer.invoke('delete-purchase', id),
getActivityLogs: (companyId, limit) => ipcRenderer.invoke('get-activity-logs', companyId, limit),
logActivity: (data) => ipcRenderer.invoke('log-activity', data),
getInventoryStats: (companyId) => ipcRenderer.invoke('get-inventory-stats', companyId),
recordInvoicePayment: (data) => ipcRenderer.invoke('record-invoice-payment', data),
// in preload.cjs
  getSystemAlerts: (companyId) => ipcRenderer.invoke('get-system-alerts', companyId),
  sendWhatsappOtp: (data) => ipcRenderer.invoke('send-whatsapp-otp', data),
backupDatabase: () => ipcRenderer.invoke('backup-database'),
getInvoicePayments: (id) => ipcRenderer.invoke('get-invoice-payments', id),
getAccountStatement: (accountId) => ipcRenderer.invoke('get-account-statement', accountId),

editInvoice: (data) => ipcRenderer.invoke('edit-invoice', data),
editPurchase: (data) => ipcRenderer.invoke('edit-purchase', data),
});

// Expose Inventory API
contextBridge.exposeInMainWorld('vahiAPI', {
    getInventory: () => ipcRenderer.invoke('get-inventory'),
    addItem: (itemData) => ipcRenderer.invoke('add-item', itemData)
    
});