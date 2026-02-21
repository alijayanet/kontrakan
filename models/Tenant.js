const db = require('../config/database');

class Tenant {
    static getAll(callback) {
        const sql = 'SELECT * FROM tenants ORDER BY name';
        db.all(sql, [], callback);
    }

    static getById(id, callback) {
        const sql = 'SELECT * FROM tenants WHERE id = ?';
        db.get(sql, [id], callback);
    }

    static create(data, callback) {
        const sql = 'INSERT INTO tenants (name, whatsapp_number, identity_number, emergency_contact) VALUES (?, ?, ?, ?)';
        const params = [data.name, data.whatsapp_number, data.identity_number, data.emergency_contact];
        db.run(sql, params, function(err) {
            if (err) {
                callback(err, null);
            } else {
                callback(null, { id: this.lastID, ...data });
            }
        });
    }

    static update(id, data, callback) {
        const sql = 'UPDATE tenants SET name = ?, whatsapp_number = ?, identity_number = ?, emergency_contact = ? WHERE id = ?';
        const params = [data.name, data.whatsapp_number, data.identity_number, data.emergency_contact, id];
        db.run(sql, params, function(err) {
            if (err) {
                callback(err, null);
            } else {
                callback(null, { id, ...data });
            }
        });
    }

    static delete(id, callback) {
        const sql = 'DELETE FROM tenants WHERE id = ?';
        db.run(sql, [id], function(err) {
            callback(err, this.changes);
        });
    }

    static getByRoomId(roomId, callback) {
        const sql = `
            SELECT t.* 
            FROM tenants t 
            JOIN leases l ON t.id = l.tenant_id 
            WHERE l.room_id = ? AND l.status = 'active'
        `;
        db.get(sql, [roomId], callback);
    }

    static searchByName(name, callback) {
        const sql = 'SELECT * FROM tenants WHERE name LIKE ? ORDER BY name';
        db.all(sql, [`%${name}%`], callback);
    }
}

module.exports = Tenant;