const db = require('../config/database');
const moment = require('moment');

class Invoice {
    static getAll(callback) {
        const sql = `
            SELECT i.*, l.room_id, r.room_number, t.name as tenant_name
            FROM invoices i
            JOIN leases l ON i.lease_id = l.id
            JOIN rooms r ON l.room_id = r.id
            JOIN tenants t ON l.tenant_id = t.id
            ORDER BY i.due_date DESC
        `;
        db.all(sql, [], callback);
    }

    static getById(id, callback) {
        const sql = `
            SELECT i.*, l.room_id, r.room_number, t.name as tenant_name, t.whatsapp_number
            FROM invoices i
            JOIN leases l ON i.lease_id = l.id
            JOIN rooms r ON l.room_id = r.id
            JOIN tenants t ON l.tenant_id = t.id
            WHERE i.id = ?
        `;
        db.get(sql, [id], callback);
    }

    static create(data, callback) {
        const sql = 'INSERT INTO invoices (lease_id, amount, extra_charges, due_date, payment_status, notif_sent_count) VALUES (?, ?, ?, ?, ?, ?)';
        const params = [data.lease_id, data.amount, data.extra_charges || 0, data.due_date, data.payment_status || 'unpaid', data.notif_sent_count || 0];
        db.run(sql, params, function(err) {
            if (err) {
                callback(err, null);
            } else {
                callback(null, { id: this.lastID, ...data });
            }
        });
    }

    static update(id, data, callback) {
        const sql = 'UPDATE invoices SET lease_id = ?, amount = ?, extra_charges = ?, due_date = ?, payment_status = ?, notif_sent_count = ? WHERE id = ?';
        const params = [data.lease_id, data.amount, data.extra_charges, data.due_date, data.payment_status, data.notif_sent_count, id];
        db.run(sql, params, function(err) {
            if (err) {
                callback(err, null);
            } else {
                callback(null, { id, ...data });
            }
        });
    }

    static delete(id, callback) {
        const sql = 'DELETE FROM invoices WHERE id = ?';
        db.run(sql, [id], function(err) {
            callback(err, this.changes);
        });
    }

    static getUnpaidInvoices(callback) {
        const sql = `
            SELECT i.*, l.room_id, r.room_number, t.name as tenant_name, t.whatsapp_number
            FROM invoices i
            JOIN leases l ON i.lease_id = l.id
            JOIN rooms r ON l.room_id = r.id
            JOIN tenants t ON l.tenant_id = t.id
            WHERE i.payment_status = 'unpaid'
            ORDER BY i.due_date
        `;
        console.log('Debug - SQL Query for unpaid invoices:', sql);
        db.all(sql, [], (err, rows) => {
            console.log('Debug - Query result:', err, rows);
            callback(err, rows);
        });
    }

    static getOverdueInvoices(callback) {
        const sql = `
            SELECT i.*, l.room_id, r.room_number, t.name as tenant_name, t.whatsapp_number
            FROM invoices i
            JOIN leases l ON i.lease_id = l.id
            JOIN rooms r ON l.room_id = r.id
            JOIN tenants t ON l.tenant_id = t.id
            WHERE i.payment_status = 'unpaid' AND i.due_date < date('now')
            ORDER BY i.due_date
        `;
        db.all(sql, [], callback);
    }

    static getInvoiceByLeaseId(leaseId, callback) {
        const sql = `
            SELECT i.*, l.room_id, r.room_number, t.name as tenant_name
            FROM invoices i
            JOIN leases l ON i.lease_id = l.id
            JOIN rooms r ON l.room_id = r.id
            JOIN tenants t ON l.tenant_id = t.id
            WHERE i.lease_id = ?
            ORDER BY i.due_date DESC
            LIMIT 1
        `;
        db.get(sql, [leaseId], callback);
    }

    static incrementNotificationCount(id, callback) {
        const sql = 'UPDATE invoices SET notif_sent_count = notif_sent_count + 1 WHERE id = ?';
        db.run(sql, [id], function(err) {
            callback(err, this.changes);
        });
    }

    static getStatistics(callback) {
        const sql = `
            SELECT 
                COUNT(*) as total_invoices,
                COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_invoices,
                COUNT(CASE WHEN payment_status = 'unpaid' THEN 1 END) as unpaid_invoices,
                COUNT(CASE WHEN payment_status = 'unpaid' AND due_date < date('now') THEN 1 END) as overdue_invoices,
                SUM(CASE WHEN payment_status = 'paid' THEN amount + extra_charges ELSE 0 END) as total_received,
                SUM(CASE WHEN payment_status = 'unpaid' THEN amount + extra_charges ELSE 0 END) as total_pending
            FROM invoices
        `;
        db.get(sql, [], callback);
    }

    static generateInvoiceForLease(leaseId, callback) {
        // This would be called to generate a new invoice for a lease
        // Implementation would depend on business logic for billing cycles
        callback(null, null);
    }
}

module.exports = Invoice;