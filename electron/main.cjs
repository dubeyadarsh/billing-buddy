const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs'); 
const db = require('./db/database.cjs'); // Your SQLite instance
const { setupAutoUpdater } = require('./updater.cjs');
let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'), 
            nodeIntegration: false,
            contextIsolation: true,
            zoomFactor: 0.8
        }
    });

    // Load React App
// Load React App - NEW LOGIC FOR EXE
    if (app.isPackaged) {
        // In the .exe, load the built HTML file from Vite's dist folder
mainWindow.loadFile(path.join(__dirname, '../dist', 'index.html'));
    } else {
        // In development, load the Vite server
        mainWindow.loadURL('http://localhost:5173');
    }}

// Internal Helper Function for logging
const logActivity = (companyId, userName, actionType, module, description) => {
    try {
        db.prepare(`
            INSERT INTO activity_logs (company_id, user_name, action_type, module, description) 
            VALUES (?, ?, ?, ?, ?)
        `).run(companyId, userName, actionType, module, description);
    } catch (error) {
        console.error("Failed to log activity:", error);
    }
};

app.whenReady().then(() => {
    createWindow();
setupAutoUpdater();
    // ==========================================
    // 1. AUTHENTICATION HANDLERS
    // ==========================================
    ipcMain.handle('register-user', async (event, { username, password, email, contact }) => {
        try {
            const hash = bcrypt.hashSync(password, 10);
            const stmt = db.prepare('INSERT INTO users (username, password_hash, email, contact) VALUES (?, ?, ?, ?)');
            const info = stmt.run(username, hash, email, contact);
            return { success: true, userId: info.lastInsertRowid };
        } catch (error) {
            return { success: false, message: "Username or Email already exists." };
        }
    });

    ipcMain.handle('login-user', async (event, { username, password }) => {
        try {
            const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
            const user = stmt.get(username);
            if (!user) return { success: false, message: "User not found." };

            const isValid = bcrypt.compareSync(password, user.password_hash);
            if (isValid) return { success: true, user: { id: user.id, username: user.username } };
            return { success: false, message: "Invalid password." };
        } catch (error) {
            return { success: false, message: "Database error occurred." };
        }
    });

    ipcMain.handle('send-whatsapp-otp', async (event, { contact, otp }) => {
        try {
            const accessToken = "##YOUR_ACCESS_TOKEN##";
                 const phoneId = "##YOUR_PHONE_NUMBER_ID##"; 
            
            let formattedContact = contact.replace(/\D/g, '');
            if (formattedContact.length === 10) formattedContact = `91${formattedContact}`;
            console.log("Formatted Contact:", formattedContact);
            const url = `https://graph.facebook.com/v19.0/${phoneId}/messages`;
            const payload = {
                messaging_product: "whatsapp",
                to: formattedContact,
                type: "template",
               template: {
                    name: "auth_billing_buddy", 
                    // 1. Changed to "en" to match your Meta dashboard exactly
                    language: { code: "en" }, 
                    components: [
                        { 
                            type: "body", 
                            parameters: [
                                // 2. Must be "text" type for the API, even if it's a number in the UI
                                { type: "text", text: otp.toString() } 
                            ] 
                        },
                    
                    ]
}
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            console.log("WhatsApp API Response:", data);
            if (data.error) return { success: false, message: data.error.message };
            return { success: true };
        } catch (error) {
            return { success: false, message: "Network error while sending OTP." };
        }
    });

    // ==========================================
    // 2. COMPANY / WORKSPACE HANDLERS
    // ==========================================
    ipcMain.handle('get-companies', async (event, userId) => {
        try {
            return { success: true, data: db.prepare('SELECT * FROM companies WHERE user_id = ? ORDER BY created_at DESC').all(userId) };
        } catch (error) {
            return { success: false, message: "Failed to fetch companies." };
        }
    });

    ipcMain.handle('get-company', async (event, companyId) => {
        try {
            return { success: true, data: db.prepare('SELECT * FROM companies WHERE id = ?').get(companyId) };
        } catch (error) {
            return { success: false, message: "Failed to fetch company details." };
        }
    });

    ipcMain.handle('add-company', async (event, data) => {
        try {
            const info = db.prepare(`
                INSERT INTO companies (
                    user_id, business_name, business_type, logo_base64, gst_number, 
                    state, pincode, phone, email, address, bank_name, account_no, ifsc_code, upi_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
                data.userId, data.businessName, data.businessType, data.logoBase64 || null, data.gstNumber,
                data.state, data.pincode, data.phone, data.email, data.address, 
                data.bankName, data.accountNo, data.ifscCode, data.upiId
            );
            return { success: true, id: info.lastInsertRowid };
        } catch (error) {
            return { success: false, message: "Failed to add company." };
        }
    });

    ipcMain.handle('update-company', async (event, data) => {
        try {
            db.prepare(`
                UPDATE companies SET 
                    business_name=?, business_type=?, logo_base64=?, gst_number=?, 
                    state=?, pincode=?, phone=?, email=?, address=?, 
                    bank_name=?, account_no=?, ifsc_code=?, upi_id=?
                WHERE id=? AND user_id=?
            `).run(
                data.businessName, data.businessType, data.logoBase64 || null, data.gstNumber,
                data.state, data.pincode, data.phone, data.email, data.address,
                data.bankName, data.accountNo, data.ifscCode, data.upiId,
                data.id, data.userId
            );
            return { success: true };
        } catch (error) {
            return { success: false, message: "Failed to update company." };
        }
    });

    ipcMain.handle('delete-company', async (event, companyId) => {
        try {
            db.prepare('DELETE FROM companies WHERE id = ?').run(companyId);
            return { success: true };
        } catch (error) {
            return { success: false, message: "Failed to delete company." };
        }
    });

    // ==========================================
    // 3. SETTINGS & UNITS
    // ==========================================
    ipcMain.handle('get-company-settings', async (event, companyId) => {
        try {
            let settings = db.prepare('SELECT * FROM company_settings WHERE company_id = ?').get(companyId);
            if (!settings) {
                settings = {
                    company_id: companyId, theme_name: 'Modern', primary_color: '#2563EB',
                    font_family: 'Inter, sans-serif', spacing: 'normal',
                    show_tax_column: 1, show_discount_column: 1, show_notes: 1,
                    custom_terms: 'Goods once sold will not be taken back.', show_bank_details: 0
                };
            }
            return { success: true, settings };
        } catch (error) {
            return { success: false, message: "Failed to fetch settings." };
        }
    });

    ipcMain.handle('update-company-settings', async (event, data) => {
        try {
            db.prepare(`
                INSERT INTO company_settings (
                    company_id, theme_name, primary_color, font_family, spacing, 
                    show_tax_column, show_discount_column, show_notes, custom_terms,
                    show_bank_details, bank_details_text
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(company_id) DO UPDATE SET 
                    theme_name=excluded.theme_name, primary_color=excluded.primary_color,
                    font_family=excluded.font_family, spacing=excluded.spacing,
                    show_tax_column=excluded.show_tax_column, show_discount_column=excluded.show_discount_column,
                    show_notes=excluded.show_notes, custom_terms=excluded.custom_terms,
                    show_bank_details=excluded.show_bank_details, bank_details_text=excluded.bank_details_text
            `).run(
                data.companyId, data.themeName, data.primaryColor, data.fontFamily, data.spacing,
                data.showTax ? 1 : 0, data.showDiscount ? 1 : 0, data.showNotes ? 1 : 0, data.customTerms,
                data.showBankDetails ? 1 : 0, data.bankDetailsText || ""
            );
            return { success: true };
        } catch (error) {
            return { success: false, message: "Failed to save settings." };
        }
    });

    ipcMain.handle('get-units', async () => {
        try {
            return { success: true, data: db.prepare('SELECT * FROM units ORDER BY name ASC').all() };
        } catch (error) {
            return { success: false, message: "Failed to fetch units" };
        }
    });

    // ==========================================
  

    // ==========================================
    // 5. PARTIES (CUSTOMERS / SUPPLIERS)
    // ==========================================
    ipcMain.handle('add-party', async (event, data) => {
        try {
            const info = db.prepare(`
                INSERT INTO parties (
                    company_id, name, phone, email, gst_number, 
                    billing_address, party_type, opening_balance, balance_type
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
                data.companyId, data.name, data.phone || "", data.email || "", data.gstNumber || "",
                data.billingAddress || "", data.partyType || "Customer", 
                data.openingBalance || 0, data.balanceType || "Receive"
            );
            return { success: true, id: info.lastInsertRowid };
        } catch (error) {
            return { success: false, message: "Failed to save party." };
        }
    });

    ipcMain.handle('get-parties', async (event, companyId) => {
        try {
            return { success: true, data: db.prepare('SELECT * FROM parties WHERE company_id = ? ORDER BY name ASC').all(companyId) };
        } catch (error) {
            return { success: false, message: "Failed to fetch parties" };
        }
    });

    // ==========================================
    // 6. INVENTORY
    // ==========================================
    ipcMain.handle('save-item', async (event, data) => {
        try {
            if (data.id) {
                db.prepare(`
                    UPDATE items SET 
                        item_name = ?, item_code = ?, item_type = ?, sale_price = ?, 
                        purchase_price = ?, tax_rate = ?, opening_stock = ?, 
                        current_stock = ?, unit = ?
                    WHERE id = ? AND company_id = ?
                `).run(
                    data.itemName, data.itemCode || "", data.itemType || "Product", data.salePrice || 0,
                    data.purchasePrice || 0, data.taxRate || 0, data.openingStock || 0, 
                    data.openingStock || 0, data.unit || 'PCS', data.id, data.companyId
                );
                return { success: true, message: "Item updated!" };
            } else {
                const info = db.prepare(`
                    INSERT INTO items (
                        company_id, item_name, item_code, item_type, sale_price, purchase_price, 
                        tax_rate, opening_stock, current_stock, unit
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).run(
                    data.companyId, data.itemName, data.itemCode || "", data.itemType || "Product", 
                    data.salePrice || 0, data.purchasePrice || 0, data.taxRate || 0, 
                    data.openingStock || 0, data.openingStock || 0, data.unit || 'PCS'
                );
                return { success: true, id: info.lastInsertRowid };
            }
        } catch (error) {
            return { success: false, message: "Failed to save item." };
        }
    });

    ipcMain.handle('get-items', async (event, params) => {
        try {
            const page = params.page || 1;
            const limit = params.limit || 8;
            const searchTerm = params.searchTerm || '';
            const offset = (page - 1) * limit;

            const totalItems = db.prepare(`SELECT COUNT(*) as total FROM items WHERE company_id = ? AND (item_name LIKE ? OR item_code LIKE ?)`).get(params.companyId, `%${searchTerm}%`, `%${searchTerm}%`).total;
            const items = db.prepare(`SELECT * FROM items WHERE company_id = ? AND (item_name LIKE ? OR item_code LIKE ?) ORDER BY item_name ASC LIMIT ? OFFSET ?`).all(params.companyId, `%${searchTerm}%`, `%${searchTerm}%`, limit, offset);

            return { success: true, data: items, total: totalItems, totalPages: Math.ceil(totalItems / limit) };
        } catch (error) {
            return { success: false, message: "Failed to fetch items" };
        }
    });

    ipcMain.handle('delete-item', async (event, id) => {
        try {
            db.prepare('DELETE FROM items WHERE id = ?').run(id);
            return { success: true };
        } catch (error) {
            return { success: false, message: "Failed to delete item" };
        }
    });

    // ==========================================
    // 7. INVOICES (SALES)
    // ==========================================
    ipcMain.handle('get-next-invoice-no', async (event, companyId) => {
        try {
            const lastInvoice = db.prepare(`SELECT invoice_no FROM invoices WHERE company_id = ? ORDER BY id DESC LIMIT 1`).get(companyId);
            let nextNo = "1";
            if (lastInvoice && lastInvoice.invoice_no) {
                const match = lastInvoice.invoice_no.match(/\d+$/);
                if (match) {
                    const numStr = match[0];
                    const prefix = lastInvoice.invoice_no.substring(0, lastInvoice.invoice_no.length - numStr.length);
                    nextNo = prefix + (parseInt(numStr, 10) + 1).toString().padStart(numStr.length, '0');
                } else {
                    nextNo = lastInvoice.invoice_no + "-1";
                }
            }
            return { success: true, nextNo };
        } catch (error) {
            return { success: true, nextNo: "1" };
        }
    });

    ipcMain.handle('add-invoice', async (event, data) => {
        try {
            const transaction = db.transaction(() => {
                const info = db.prepare(`
                    INSERT INTO invoices (
                        company_id, invoice_no, invoice_date, party_name, phone, state_of_supply,
                        subtotal, global_discount, total_tax, round_off, grand_total,
                        amount_received, payment_type, balance_due, notes
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).run(
                    data.companyId, data.invoiceNo, data.date, data.partyName, data.phone, data.stateOfSupply,
                    data.subTotal, data.globalDiscount, data.totalTax, data.roundOff, data.grandTotal,
                    data.amountReceived, data.paymentType, data.balanceDue, data.notes || ""
                );
                const newInvoiceId = info.lastInsertRowid;

                const insertItem = db.prepare(`INSERT INTO invoice_items (invoice_id, item_name, qty, price, discount, tax_rate, amount) VALUES (?, ?, ?, ?, ?, ?, ?)`);
                const updateStock = db.prepare(`UPDATE items SET current_stock = current_stock - ? WHERE item_name = ? AND company_id = ? AND item_type = 'Product'`);
                
                for (const item of data.items) {
                    insertItem.run(newInvoiceId, item.name, item.qty, item.price, item.discount, item.taxRate, item.amount);
                    updateStock.run(item.qty, item.name, data.companyId);
                }

                if (data.amountReceived > 0 && data.accountId) {
                    db.prepare(`UPDATE cash_bank_accounts SET current_balance = current_balance + ? WHERE id = ? AND company_id = ?`).run(data.amountReceived, data.accountId, data.companyId);
                }
                
                logActivity(data.companyId, "System User", 'CREATED', 'INVOICE', `Generated Sale Invoice #${data.invoiceNo} for ${data.partyName}`);
                return newInvoiceId;
            });
            return { success: true, id: transaction() };
        } catch (error) {
            return { success: false, message: "Failed to save invoice." };
        }
    });

    ipcMain.handle('get-invoices', async (event, companyId) => {
        try {
            const invoices = db.prepare(`
                SELECT i.*, 
                       IFNULL(SUM(pr.amount), 0) as total_paid_later,
                       (i.grand_total - i.amount_received - IFNULL(SUM(pr.amount), 0)) as live_balance_due
                FROM invoices i
                LEFT JOIN payment_receipts pr ON i.id = pr.invoice_id
                WHERE i.company_id = ? 
                GROUP BY i.id
                ORDER BY i.created_at DESC
            `).all(companyId);
            return { success: true, data: invoices };
        } catch (error) {
            return { success: false, message: "Failed to fetch invoices." };
        }
    });

    ipcMain.handle('get-invoice-details', async (event, id) => {
        try {
            const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
            const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(id);
            return { success: true, data: { ...invoice, items } };
        } catch (error) {
            return { success: false, message: "Failed to fetch invoice details" };
        }
    });

    ipcMain.handle('delete-invoice', async (event, id) => {
        try {
            db.transaction(() => {
                const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
                if (!invoice) return;
                const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(id);
                
                const updateStock = db.prepare(`UPDATE items SET current_stock = current_stock + ? WHERE item_name = ? AND company_id = ? AND item_type = 'Product'`);
                for (const item of items) { updateStock.run(item.qty, item.item_name, invoice.company_id); }

                if (invoice.amount_received > 0 && invoice.payment_type) {
                    const account = db.prepare('SELECT id FROM cash_bank_accounts WHERE account_name = ? AND company_id = ?').get(invoice.payment_type, invoice.company_id);
                    if (account) { db.prepare('UPDATE cash_bank_accounts SET current_balance = current_balance - ? WHERE id = ?').run(invoice.amount_received, account.id); }
                }

                db.prepare('DELETE FROM invoice_items WHERE invoice_id = ?').run(id);
                db.prepare('DELETE FROM payment_receipts WHERE invoice_id = ?').run(id); // Clean up ledger
                db.prepare('DELETE FROM invoices WHERE id = ?').run(id);
            })();
            return { success: true };
        } catch (error) {
            return { success: false, message: "Failed to delete invoice" };
        }
    });

    // ==========================================
    // 8. PURCHASES
    // ==========================================
    ipcMain.handle('add-purchase', async (event, data) => {
        try {
            db.transaction(() => {
                let systemNotes = []; 

                for (const item of data.items) {
                    const currentItem = db.prepare(`SELECT current_stock, purchase_price FROM items WHERE company_id = ? AND item_name = ?`).get(data.companyId, item.name);
                    let newAvg = Number(item.price);
                    
                    if (currentItem) {
                        if (currentItem.current_stock > 0) {
                            newAvg = ((currentItem.current_stock * currentItem.purchase_price) + (Number(item.qty) * newAvg)) / (currentItem.current_stock + Number(item.qty));
                            newAvg = Math.round(newAvg * 100) / 100;
                            if (currentItem.purchase_price !== newAvg) systemNotes.push(`Averaged price for ${item.name} to ₹${newAvg}`);
                        }
                        db.prepare(`UPDATE items SET current_stock = current_stock + ?, purchase_price = ? WHERE company_id = ? AND item_name = ?`).run(Number(item.qty), newAvg, data.companyId, item.name);
                    }
                }

                let finalNotes = data.notes || '';
                if (systemNotes.length > 0) finalNotes += (finalNotes ? '\n\n' : '') + '--- System Notes ---\n' + systemNotes.join('\n');

                db.prepare(`
                    INSERT INTO purchases (
                        company_id, bill_no, bill_date, party_name, phone, state_of_supply,
                        sub_total, global_discount, total_tax, round_off, grand_total,
                        amount_paid, account_id, payment_type, balance_due, notes
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).run(
                    data.companyId, data.billNo, data.date, data.partyName, data.phone, data.stateOfSupply,
                    data.subTotal, data.globalDiscount, data.totalTax, data.roundOff, data.grandTotal,
                    data.amountPaid, data.accountId, data.paymentType, data.balanceDue, finalNotes
                );

                if (data.amountPaid > 0 && data.accountId) {
                    db.prepare(`UPDATE cash_bank_accounts SET current_balance = current_balance - ? WHERE id = ? AND company_id = ?`).run(data.amountPaid, data.accountId, data.companyId);
                }
                
                logActivity(data.companyId, "System User", 'CREATED', 'PURCHASE', `Recorded Purchase Bill #${data.billNo} from ${data.partyName}`);
            })();
            return { success: true };
        } catch (error) {
            return { success: false, message: "Failed to save purchase bill" };
        }
    });

    ipcMain.handle('get-purchases', async (event, companyId) => {
        try {
            return { success: true, data: db.prepare(`SELECT id, company_id, bill_no AS invoice_no, bill_date AS invoice_date, party_name, phone, grand_total, amount_paid AS amount_received, balance_due FROM purchases WHERE company_id = ? ORDER BY created_at DESC`).all(companyId) };
        } catch (error) {
            return { success: false };
        }
    });

    ipcMain.handle('get-purchase-details', async (event, id) => {
        try {
            const purchase = db.prepare('SELECT * FROM purchases WHERE id = ?').get(id);
            const items = db.prepare('SELECT * FROM purchase_items WHERE purchase_id = ?').all(id);
            return { success: true, data: { ...purchase, items } };
        } catch (error) {
            return { success: false, message: "Failed to fetch purchase details" };
        }
    });

    ipcMain.handle('delete-purchase', async (event, id) => {
        try {
            db.transaction(() => {
                const purchase = db.prepare('SELECT * FROM purchases WHERE id = ?').get(id);
                if (!purchase) return;
                const items = db.prepare('SELECT * FROM purchase_items WHERE purchase_id = ?').all(id);
                
                const updateStock = db.prepare(`UPDATE items SET current_stock = current_stock - ? WHERE item_name = ? AND company_id = ? AND item_type = 'Product'`);
                for (const item of items) { updateStock.run(item.qty, item.item_name, purchase.company_id); }

                if (purchase.amount_paid > 0 && purchase.payment_type) {
                    const account = db.prepare('SELECT id FROM cash_bank_accounts WHERE account_name = ? AND company_id = ?').get(purchase.payment_type, purchase.company_id);
                    if (account) { db.prepare('UPDATE cash_bank_accounts SET current_balance = current_balance + ? WHERE id = ?').run(purchase.amount_paid, account.id); }
                }

                db.prepare('DELETE FROM purchase_items WHERE purchase_id = ?').run(id);
                db.prepare('DELETE FROM purchases WHERE id = ?').run(id);
            })();
            return { success: true };
        } catch (error) {
            return { success: false, message: "Failed to delete purchase" };
        }
    });

    // ==========================================
    // 9. STRICT LEDGER & PAYMENTS
    // ==========================================
    ipcMain.handle('record-invoice-payment', async (event, data) => {
        try {
            db.transaction(() => {
                db.prepare(`
                    INSERT INTO payment_receipts (company_id, invoice_id, account_id, amount, payment_mode, payment_date, notes)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `).run(
                    data.companyId, data.invoiceId, data.accountId || null, 
                    data.paymentAmount, data.paymentMode || 'System', 
                    new Date().toISOString().split('T')[0], data.notes || ""
                );

                if (data.accountId) {
                    db.prepare(`UPDATE cash_bank_accounts SET current_balance = current_balance + ? WHERE id = ? AND company_id = ?`).run(data.paymentAmount, data.accountId, data.companyId);
                }

                const invoice = db.prepare('SELECT invoice_no, party_name FROM invoices WHERE id = ?').get(data.invoiceId);
                if(invoice) {
                    logActivity(data.companyId, "System", 'PAYMENT', 'INVOICE', `Received ₹${data.paymentAmount} via ${data.paymentMode || 'Cash'} from ${invoice.party_name} for Inv #${invoice.invoice_no}`);
                }
            })();
            return { success: true };
        } catch (error) {
            console.error("Payment Error:", error);
            return { success: false, message: "Failed to process payment." };
        }
    });

    ipcMain.handle('get-invoice-payments', async (event, invoiceId) => {
        try {
            const payments = db.prepare(`
                SELECT pr.*, cba.account_name 
                FROM payment_receipts pr
                LEFT JOIN cash_bank_accounts cba ON pr.account_id = cba.id
                WHERE pr.invoice_id = ? ORDER BY pr.payment_date DESC, pr.created_at DESC
            `).all(invoiceId);
            return { success: true, data: payments };
        } catch (error) {
            return { success: false, message: "Failed to load payment history." };
        }
    });

    // ==========================================
    // 10. DASHBOARD & ANALYTICS
    // ==========================================
    ipcMain.handle('get-dashboard-stats', async (event, filters) => {
        try {
            const companyId = filters.companyId;
            const timeRange = filters.timeRange || 'All Time';
            let startDate = '1970-01-01'; 
            const today = new Date();
            
            const formatDate = (date) => {
                const d = new Date(date);
                let month = '' + (d.getMonth() + 1), day = '' + d.getDate();
                if (month.length < 2) month = '0' + month;
                if (day.length < 2) day = '0' + day;
                return [d.getFullYear(), month, day].join('-');
            };

            if (timeRange === 'Today') startDate = formatDate(today);
            else if (timeRange === 'This Week') startDate = formatDate(new Date(today.setDate(today.getDate() - today.getDay())));
            else if (timeRange === 'This Month') startDate = formatDate(new Date(today.getFullYear(), today.getMonth(), 1));
            else if (timeRange === 'This Year') startDate = formatDate(new Date(today.getFullYear(), 0, 1));

            const collected = db.prepare(`SELECT SUM(grand_total) as total FROM invoices WHERE company_id = ? AND invoice_date >= ?`).get(companyId, startDate).total || 0;
            const toPay = db.prepare(`SELECT SUM(grand_total) as total FROM purchases WHERE company_id = ? AND bill_date >= ?`).get(companyId, startDate).total || 0;
            
            // DYNAMIC BALANCE FIX FOR DASHBOARD
            const invoiceDueRaw = db.prepare(`
                SELECT SUM(
                    i.grand_total - i.amount_received - 
                    IFNULL((SELECT SUM(amount) FROM payment_receipts WHERE invoice_id = i.id), 0)
                ) as total 
                FROM invoices i 
                WHERE i.company_id = ? AND i.invoice_date >= ?
            `).get(companyId, startDate);
            const invoiceDue = invoiceDueRaw.total || 0;
            
            const partyReceive = db.prepare(`SELECT SUM(opening_balance) as total FROM parties WHERE company_id = ? AND balance_type = 'Receive'`).get(companyId).total || 0;
            const due = invoiceDue + partyReceive;

            let balance = 0;
            try { balance = db.prepare(`SELECT SUM(current_balance) as total FROM cash_bank_accounts WHERE company_id = ?`).get(companyId).total || 0; } catch (e) {}

            let limitClause = (timeRange === 'Today' || timeRange === 'This Week') ? 'LIMIT 7' : 'LIMIT 30';
            const chartRaw = db.prepare(`SELECT invoice_date, SUM(grand_total) as sales FROM invoices WHERE company_id = ? AND invoice_date >= ? GROUP BY invoice_date ORDER BY invoice_date DESC ${limitClause}`).all(companyId, startDate);
            
            const chartData = chartRaw.map(row => ({
                name: new Date(row.invoice_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
                sales: row.sales
            })).reverse(); 

            return { success: true, stats: { collected, toPay, due, balance }, chartData };
        } catch (error) {
            return { success: false, message: "Failed to load dashboard stats" };
        }
    });

    ipcMain.handle('get-inventory-stats', async (event, companyId) => {
        try {
            const totalItems = db.prepare(`SELECT COUNT(*) as count FROM items WHERE company_id = ?`).get(companyId).count;
            const lowStock = db.prepare(`SELECT COUNT(*) as count FROM items WHERE company_id = ? AND item_type = 'Product' AND current_stock <= 5`).get(companyId).count;
            const services = db.prepare(`SELECT COUNT(*) as count FROM items WHERE company_id = ? AND item_type = 'Service'`).get(companyId).count;
            const valueRaw = db.prepare(`SELECT SUM(current_stock * purchase_price) as value FROM items WHERE company_id = ? AND item_type = 'Product'`).get(companyId);
            return { success: true, stats: { totalItems, lowStock, services, inventoryValue: valueRaw.value || 0 } };
        } catch (error) {
            return { success: false, message: "Failed to fetch inventory stats" };
        }
    });

    // ==========================================
    // 11. LOGS & ALERTS
    // ==========================================
    ipcMain.handle('get-activity-logs', async (event, companyId, limit = 50) => {
        try {
            return { success: true, data: db.prepare(`SELECT * FROM activity_logs WHERE company_id = ? ORDER BY created_at DESC LIMIT ?`).all(companyId, limit) };
        } catch (error) {
            return { success: false, message: "Failed to fetch logs" };
        }
    });

    ipcMain.handle('log-activity', async (event, data) => {
        logActivity(data.companyId, data.userName, data.actionType, data.module, data.description);
        return { success: true };
    });

    ipcMain.handle('get-system-alerts', async (event, companyId) => {
        const notifications = [];
        const nowIso = new Date().toISOString();

        try {
            const lowStock = db.prepare(`SELECT id, item_name, current_stock, unit FROM items WHERE company_id = ? AND item_type = 'Product' AND current_stock <= 5`).all(companyId);
            lowStock.forEach(item => notifications.push({ id: `stock-${item.id}`, description: `Inventory Alert: ${item.item_name} is down to ${item.current_stock} ${item.unit}.`, module: 'INVENTORY', action_type: 'WARNING', created_at: nowIso }));
        } catch (e) {}

        try {
            // Check original invoices and subtract recorded payments dynamically for alerts
            const invoices = db.prepare(`
                SELECT i.id, i.invoice_no, i.party_name, i.created_at,
                       (i.grand_total - i.amount_received - IFNULL(SUM(pr.amount), 0)) as live_balance_due
                FROM invoices i
                LEFT JOIN payment_receipts pr ON i.id = pr.invoice_id
                WHERE i.company_id = ? AND i.created_at <= date('now', '-30 days')
                GROUP BY i.id
                HAVING live_balance_due > 0
            `).all(companyId);

            invoices.forEach(inv => notifications.push({ id: `overdue-${inv.id}`, invoice_id: inv.id, balance_due: inv.live_balance_due, description: `Payment Overdue: ${inv.party_name} owes ₹${inv.live_balance_due} for Invoice #${inv.invoice_no}.`, module: 'INVOICE', action_type: 'OVERDUE', created_at: inv.created_at }));
        } catch (e) {}

        return { success: true, data: notifications };
    });

    // ==========================================
    // 12. BACKUP
    // ==========================================
    ipcMain.handle('backup-database', async () => {
        try {
            const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
                title: 'Backup Database',
                defaultPath: `BillingBuddy_Backup_${new Date().toISOString().split('T')[0]}.sqlite`,
                filters: [{ name: 'SQLite Database', extensions: ['sqlite'] }]
            });
            if (canceled || !filePath) return { success: false, message: 'Cancelled' };

            const dbPath = path.join(app.getPath('userData'), 'vyapar_clone.db');
            fs.copyFileSync(dbPath, filePath);
            return { success: true, message: 'Backup saved successfully!' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    });
// ==========================================
    // 4. CASH & BANK HANDLERS
    // ==========================================
    ipcMain.handle('get-accounts', async (event, companyId) => {
        try {
            let accounts = db.prepare('SELECT * FROM cash_bank_accounts WHERE company_id = ? ORDER BY account_type ASC, account_name ASC').all(companyId);
            if (accounts.length === 0) {
                db.prepare(`INSERT INTO cash_bank_accounts (company_id, account_name, account_type, opening_balance, current_balance) VALUES (?, 'Cash', 'Cash', 0, 0)`).run(companyId);
                accounts = db.prepare('SELECT * FROM cash_bank_accounts WHERE company_id = ?').all(companyId);
            }
            return { success: true, data: accounts };
        } catch (error) {
            return { success: false, message: "Failed to fetch accounts" };
        }
    });

    ipcMain.handle('add-account', async (event, data) => {
        try {
            db.prepare(`
                INSERT INTO cash_bank_accounts (company_id, account_name, account_type, opening_balance, current_balance) 
                VALUES (?, ?, ?, ?, ?)
            `).run(data.companyId, data.accountName, data.accountType, data.openingBalance, data.openingBalance);
            return { success: true };
        } catch (error) {
            return { success: false, message: "Failed to create account" };
        }
    });

    ipcMain.handle('transfer-balance', async (event, data) => {
        try {
            db.transaction(() => {
                // Deduct from sender
                db.prepare(`UPDATE cash_bank_accounts SET current_balance = current_balance - ? WHERE id = ?`).run(data.amount, data.fromAccountId);
                // Add to receiver
                db.prepare(`UPDATE cash_bank_accounts SET current_balance = current_balance + ? WHERE id = ?`).run(data.amount, data.toAccountId);
                
                // Log the transfer
                db.prepare(`
                    INSERT INTO bank_transfers (company_id, from_account_id, to_account_id, amount, transfer_date, notes)
                    VALUES (?, ?, ?, ?, ?, ?)
                `).run(data.companyId, data.fromAccountId, data.toAccountId, data.amount, new Date().toISOString().split('T')[0], data.notes || "Manual Transfer");
                
                // Activity Log
                logActivity(data.companyId, "System", 'CREATED', 'BANK', `Transferred ₹${data.amount} between accounts`);
            })();
            return { success: true };
        } catch (error) {
            return { success: false, message: "Transfer failed" };
        }
    });

    // NEW: Generate Bank Passbook/Statement
    ipcMain.handle('get-account-statement', async (event, accountId) => {
        try {
            // Combine Sales In (payment_receipts), Purchases Out (purchases), and Transfers In/Out
            const statement = db.prepare(`
                SELECT 'Payment In' as type, amount as amount_in, 0 as amount_out, payment_date as date, notes, 'Sale Inv' as ref 
                FROM payment_receipts WHERE account_id = ?
                
                UNION ALL
                
                SELECT 'Payment Out' as type, 0 as amount_in, amount_paid as amount_out, bill_date as date, notes, 'Purchase Bill' as ref 
                FROM purchases WHERE account_id = ? AND amount_paid > 0
                
                UNION ALL
                
                SELECT 'Transfer Out' as type, 0 as amount_in, amount as amount_out, transfer_date as date, notes, 'Transfer' as ref 
                FROM bank_transfers WHERE from_account_id = ?
                
                UNION ALL
                
                SELECT 'Transfer In' as type, amount as amount_in, 0 as amount_out, transfer_date as date, notes, 'Transfer' as ref 
                FROM bank_transfers WHERE to_account_id = ?
                
                ORDER BY date DESC
            `).all(accountId, accountId, accountId, accountId);
            
            return { success: true, data: statement };
        } catch (error) {
            console.error(error);
            return { success: false, message: "Failed to load statement." };
        }
    });
}); // Ends app.whenReady()

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});