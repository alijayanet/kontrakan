const db = require('../config/database');
const moment = require('moment');

class Lease {
    static getAll(callback) {
        const sql = `
            SELECT l.*, r.room_number, t.name as tenant_name, t.whatsapp_number
            FROM leases l
            JOIN rooms r ON l.room_id = r.id
            JOIN tenants t ON l.tenant_id = t.id
            ORDER BY l.start_date DESC
        `;
        db.all(sql, [], callback);
    }

    static getById(id, callback) {
        const sql = `
            SELECT l.*, r.room_number, r.type as room_type, r.price_per_month, t.name as tenant_name, t.whatsapp_number
            FROM leases l
            JOIN rooms r ON l.room_id = r.id
            JOIN tenants t ON l.tenant_id = t.id
            WHERE l.id = ?
        `;
        db.get(sql, [id], callback);
    }

    static create(data, callback) {
        const sql = 'INSERT INTO leases (room_id, tenant_id, start_date, due_date, base_price, rental_type, status) VALUES (?, ?, ?, ?, ?, ?, ?)';
        const params = [data.room_id, data.tenant_id, data.start_date, data.due_date, data.base_price, data.rental_type || 'monthly', data.status || 'active'];
        db.run(sql, params, function(err) {
            if (err) {
                callback(err, null);
            } else {
                callback(null, { id: this.lastID, ...data });
            }
        });
    }

    static update(id, data, callback) {
        const sql = 'UPDATE leases SET room_id = ?, tenant_id = ?, start_date = ?, due_date = ?, base_price = ?, rental_type = ?, status = ? WHERE id = ?';
        const params = [data.room_id, data.tenant_id, data.start_date, data.due_date, data.base_price, data.rental_type || 'monthly', data.status, id];
        db.run(sql, params, function(err) {
            if (err) {
                callback(err, null);
            } else {
                callback(null, { id, ...data });
            }
        });
    }

    static delete(id, callback) {
        const sql = 'DELETE FROM leases WHERE id = ?';
        db.run(sql, [id], function(err) {
            callback(err, this.changes);
        });
    }

    static getActiveLeases(callback) {
        const sql = `
            SELECT l.*, r.room_number, t.name as tenant_name, t.whatsapp_number
            FROM leases l
            JOIN rooms r ON l.room_id = r.id
            JOIN tenants t ON l.tenant_id = t.id
            WHERE l.status = 'active'
            ORDER BY r.room_number
        `;
        db.all(sql, [], callback);
    }

    static getLeaseByRoomId(roomId, callback) {
        const sql = `
            SELECT l.*, r.room_number, t.name as tenant_name, t.whatsapp_number
            FROM leases l
            JOIN rooms r ON l.room_id = r.id
            JOIN tenants t ON l.tenant_id = t.id
            WHERE l.room_id = ? AND l.status = 'active'
        `;
        db.get(sql, [roomId], callback);
    }

    static calculateProRataAmount(startDate, endDate, monthlyPrice) {
        // Calculate pro-rata amount for partial month
        const start = moment(startDate);
        const end = moment(endDate);
        const daysInMonth = start.daysInMonth();
        const daysOccupied = end.diff(start, 'days') + 1;
        
        return (monthlyPrice / daysInMonth) * daysOccupied;
    }

    static getExpiringLeases(days = 7, callback) {
        const sql = `
            SELECT l.*, r.room_number, t.name as tenant_name, t.whatsapp_number
            FROM leases l
            JOIN rooms r ON l.room_id = r.id
            JOIN tenants t ON l.tenant_id = t.id
            WHERE l.status = 'active' 
            AND l.due_date <= date('now', '+${days} days')
            AND l.due_date >= date('now')
            ORDER BY l.due_date
        `;
        db.all(sql, [], callback);
    }

    static getOverdueLeases(callback) {
        const sql = `
            SELECT l.*, r.room_number, t.name as tenant_name, t.whatsapp_number
            FROM leases l
            JOIN rooms r ON l.room_id = r.id
            JOIN tenants t ON l.tenant_id = t.id
            WHERE l.status = 'active' 
            AND l.due_date < date('now')
            ORDER BY l.due_date
        `;
        db.all(sql, [], callback);
    }
}

module.exports = Lease;