
const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

// 1. Find the safe "AppData" folder for the user's OS
// On Windows: C:\Users\<User>\AppData\Roaming\<YourAppName>
const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'vyapar_clone.db');

// 2. Initialize the database connection
// The 'verbose' option prints all SQL queries to your terminal for easy debugging
const db = new Database(dbPath, { verbose: console.log });

// Inside electron/db/database.cjs
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        contact TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);
// Inside electron/db/database.cjs
// Inside electron/db/database.cjs
db.exec(`
    CREATE TABLE IF NOT EXISTS companies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        business_name TEXT NOT NULL,
        business_type TEXT,
        logo_base64 TEXT,       -- Store small logos as text
        gst_number TEXT,
        state TEXT,             -- Crucial for GST calculations
        pincode TEXT,
        phone TEXT,
        email TEXT,
        address TEXT,
        bank_name TEXT,         -- Bank Details for Invoices
        account_no TEXT,
        ifsc_code TEXT,
        upi_id TEXT,            -- For QR Code generation later
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
`);

// Inside electron/db/database.cjs

db.exec(`
    -- TABLE FOR THE MAIN INVOICE DETAILS
    CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id INTEGER NOT NULL,
        invoice_no TEXT NOT NULL,
        invoice_date TEXT NOT NULL,
        party_name TEXT,
        phone TEXT,
        state_of_supply TEXT,
        subtotal REAL,
        global_discount REAL,
        total_tax REAL,
        round_off REAL,
        grand_total REAL,
        amount_received REAL,
        payment_type TEXT,
        balance_due REAL,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    );

    -- TABLE FOR THE INDIVIDUAL ITEMS IN THAT INVOICE
    CREATE TABLE IF NOT EXISTS invoice_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_id INTEGER NOT NULL,
        item_name TEXT NOT NULL,
        qty REAL,
        price REAL,
        discount REAL,
        tax_rate REAL,
        amount REAL,
        FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    );
`);
db.exec(`
    -- TABLE FOR MAIN PURCHASE BILLS
    CREATE TABLE IF NOT EXISTS purchases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id INTEGER NOT NULL,
        bill_no TEXT NOT NULL,
        bill_date TEXT NOT NULL,
        party_name TEXT,
        phone TEXT,
        state_of_supply TEXT,
        subtotal REAL,
        global_discount REAL,
        total_tax REAL,
        round_off REAL,
        grand_total REAL,
        amount_paid REAL,
        payment_type TEXT,
        balance_due REAL,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    );

    -- TABLE FOR ITEMS INSIDE A PURCHASE BILL
    CREATE TABLE IF NOT EXISTS purchase_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        purchase_id INTEGER NOT NULL,
        item_name TEXT NOT NULL,
        qty REAL,
        price REAL,
        discount REAL,
        tax_rate REAL,
        amount REAL,
        FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE
    );
`);
db.exec(`
    -- TABLE FOR INVENTORY ITEMS
    CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id INTEGER NOT NULL,
        item_name TEXT NOT NULL,
        item_code TEXT,
        sale_price REAL DEFAULT 0,
        purchase_price REAL DEFAULT 0,
        tax_rate REAL DEFAULT 0,
        opening_stock REAL DEFAULT 0,
        current_stock REAL DEFAULT 0,
        unit TEXT DEFAULT 'PCS',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    );
`);
db.exec(`
    -- TABLE FOR PARTIES (CUSTOMERS & SUPPLIERS)
    CREATE TABLE IF NOT EXISTS parties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        gst_number TEXT,
        billing_address TEXT,
        party_type TEXT DEFAULT 'Customer', -- 'Customer' or 'Supplier'
        opening_balance REAL DEFAULT 0,
        balance_type TEXT DEFAULT 'Receive', -- 'Receive' or 'Pay'
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    );
`);
db.exec(`
    -- TABLE FOR COMPANY TEMPLATE SETTINGS
    CREATE TABLE IF NOT EXISTS company_settings (
        company_id INTEGER PRIMARY KEY,
        theme_name TEXT DEFAULT 'Modern',
        primary_color TEXT DEFAULT '#2563EB',
        font_family TEXT DEFAULT 'Inter, sans-serif',
        spacing TEXT DEFAULT 'normal', -- 'compact', 'normal', 'relaxed'
        show_tax_column BOOLEAN DEFAULT 1,
        show_discount_column BOOLEAN DEFAULT 1,
        show_notes BOOLEAN DEFAULT 1,
        custom_terms TEXT DEFAULT 'Goods once sold will not be taken back.',
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    );
`);
try {
    // Safely add the item_type column if it doesn't exist yet
    db.exec(`ALTER TABLE items ADD COLUMN item_type TEXT DEFAULT 'Product'`);
} catch (e) { /* Column already exists, ignore error */ }

// Create Units table and seed defaults
db.exec(`
    CREATE TABLE IF NOT EXISTS units (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL
    );
    INSERT OR IGNORE INTO units (name) VALUES ('PCS'), ('KG'), ('BOX'), ('MTR'), ('LTR'), ('HOURS'), ('DAYS'), ('SERVICE');
`);
// --- DATABASE UPGRADES ---
try {
    // 1. Create Cash & Bank Table
    db.exec(`
        CREATE TABLE IF NOT EXISTS cash_bank_accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER NOT NULL,
            account_name TEXT NOT NULL,
            account_type TEXT DEFAULT 'Bank', 
            opening_balance REAL DEFAULT 0,
            current_balance REAL DEFAULT 0,
            FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
        );
    `);

    // 2. Add Bank Details to Company Settings
    db.exec(`ALTER TABLE company_settings ADD COLUMN show_bank_details BOOLEAN DEFAULT 0;`);
    db.exec(`ALTER TABLE company_settings ADD COLUMN bank_details_text TEXT DEFAULT '';`);
} catch (e) {
    // Columns might already exist, ignore safely
}
// --- 1. ADD THIS TO YOUR DATABASE UPGRADES BLOCK ---
try {
    db.exec(`
        CREATE TABLE IF NOT EXISTS activity_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER,
            user_name TEXT DEFAULT 'System',
            action_type TEXT NOT NULL, -- e.g., 'CREATED', 'UPDATED', 'DELETED'
            module TEXT NOT NULL,      -- e.g., 'INVOICE', 'INVENTORY', 'PARTY', 'COMPANY'
            description TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
        );
    `);
} catch (e) { console.log("Logs table exists"); }

// --- QUICK DATABASE PATCH ---
// This safely adds the missing columns to your existing users table
try {
    const tableInfo = db.prepare("PRAGMA table_info(users)").all();
    const columnNames = tableInfo.map(col => col.name);

    if (!columnNames.includes('email')) {
        db.prepare("ALTER TABLE users ADD COLUMN email TEXT").run();
        console.log("✅ Added 'email' column to users table");
    }
    if (!columnNames.includes('contact')) {
        db.prepare("ALTER TABLE users ADD COLUMN contact TEXT").run();
        console.log("✅ Added 'contact' column to users table");
    }
    if (!columnNames.includes('gstin')) {
        db.prepare("ALTER TABLE users ADD COLUMN gstin TEXT").run();
        console.log("✅ Added 'gstin' column to users table");
    }
} catch (err) {
    console.error("Migration error:", err);
}
// ----------------------------
// Add this right underneath the CREATE TABLE IF NOT EXISTS invoices (...) block
db.exec(`
    CREATE TABLE IF NOT EXISTS payment_receipts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id INTEGER NOT NULL,
        invoice_id INTEGER NOT NULL,
        account_id INTEGER,
        amount REAL NOT NULL,
        payment_mode TEXT,
        payment_date DATE NOT NULL,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    );
`);
// Add this under your payment_receipts table
db.exec(`
    CREATE TABLE IF NOT EXISTS bank_transfers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id INTEGER NOT NULL,
        from_account_id INTEGER NOT NULL,
        to_account_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        transfer_date DATE NOT NULL,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (from_account_id) REFERENCES cash_bank_accounts(id) ON DELETE CASCADE,
        FOREIGN KEY (to_account_id) REFERENCES cash_bank_accounts(id) ON DELETE CASCADE
    );
`);
try {
    // Add columns if they don't exist yet
    db.exec(`ALTER TABLE invoice_items ADD COLUMN serial_no TEXT DEFAULT '';`);
    db.exec(`ALTER TABLE purchase_items ADD COLUMN serial_no TEXT DEFAULT '';`);
} catch (err) {
    // Ignore error if column already exists
}
try { db.exec(`ALTER TABLE purchases ADD COLUMN account_id INTEGER;`); } catch(e) {}
// -----------------------------------
console.log("Database initialized at:", dbPath);

// Export it so your other files can use it
module.exports = db;