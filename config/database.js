const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database connection
const db = new sqlite3.Database(path.join(__dirname, '..', 'database.sqlite'), (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database');
        initializeDatabase();
        // Expenses Table
        db.run(`
            CREATE TABLE IF NOT EXISTS expenses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category TEXT NOT NULL,
                amount INTEGER NOT NULL,
                description TEXT,
                date DATE NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) console.error('Error creating expenses table:', err);
            else console.log('Table expenses created successfully');
        });
    }
});

// Initialize database tables
function initializeDatabase() {
    const migrations = [
        `
        CREATE TABLE IF NOT EXISTS boarding_houses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            address TEXT NOT NULL,
            description TEXT,
            phone TEXT,
            email TEXT,
            admin_wa_number TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        `,
        `
        CREATE TABLE IF NOT EXISTS admin_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            name TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        `,
        `
        CREATE TABLE IF NOT EXISTS rooms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            room_number TEXT NOT NULL UNIQUE,
            type TEXT,
            price_per_month REAL NOT NULL,
            status TEXT DEFAULT 'available',
            description TEXT
        )
        `,
        `
        CREATE TABLE IF NOT EXISTS tenants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            whatsapp_number TEXT NOT NULL,
            identity_number TEXT,
            emergency_contact TEXT
        )
        `,
        `
        CREATE TABLE IF NOT EXISTS leases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            room_id INTEGER,
            tenant_id INTEGER,
            start_date DATE NOT NULL,
            due_date DATE NOT NULL,
            base_price REAL,
            rental_type TEXT DEFAULT 'monthly',
            status TEXT DEFAULT 'active',
            FOREIGN KEY (room_id) REFERENCES rooms(id),
            FOREIGN KEY (tenant_id) REFERENCES tenants(id)
        )
        `,
        `
        CREATE TABLE IF NOT EXISTS invoices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            lease_id INTEGER,
            amount REAL NOT NULL,
            extra_charges REAL DEFAULT 0,
            due_date DATE NOT NULL,
            payment_status TEXT DEFAULT 'unpaid',
            notif_sent_count INTEGER DEFAULT 0,
            FOREIGN KEY (lease_id) REFERENCES leases(id)
        )
        `
    ];

    migrations.forEach((sql, index) => {
        db.run(sql, (err) => {
            if (err) {
                console.error(`Error creating table ${index + 1}:`, err.message);
            } else {
                console.log(`Table ${index + 1} created successfully`);
            }
        });
    });

    // Add missing columns if any
    db.all("PRAGMA table_info(boarding_houses)", (err, rows) => {
        if (err) return;
        const hasAdminWa = rows.some(row => row.name === 'admin_wa_number');
        if (!hasAdminWa) {
            db.run("ALTER TABLE boarding_houses ADD COLUMN admin_wa_number TEXT", (err) => {
                if (err) console.error('Error adding admin_wa_number column:', err);
                else console.log('Column admin_wa_number added successfully');
            });
        }
    });

    db.all("PRAGMA table_info(leases)", (err, rows) => {
        if (err) return;
        const hasRentalType = rows.some(row => row.name === 'rental_type');
        if (!hasRentalType) {
            db.run("ALTER TABLE leases ADD COLUMN rental_type TEXT DEFAULT 'monthly'", (err) => {
                if (err) console.error('Error adding rental_type column:', err);
                else console.log('Column rental_type added successfully');
            });
        }
    });
}

module.exports = db;
