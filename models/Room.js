const db = require('../config/database');

class Room {
    static getAll(callback) {
        const sql = 'SELECT * FROM rooms ORDER BY room_number';
        db.all(sql, [], callback);
    }

    static getById(id, callback) {
        const sql = 'SELECT * FROM rooms WHERE id = ?';
        db.get(sql, [id], callback);
    }

    static create(data, callback) {
        const sql = 'INSERT INTO rooms (room_number, type, price_per_month, status, description) VALUES (?, ?, ?, ?, ?)';
        const params = [data.room_number, data.type, data.price_per_month, data.status || 'available', data.description];
        db.run(sql, params, function(err) {
            if (err) {
                callback(err, null);
            } else {
                callback(null, { id: this.lastID, ...data });
            }
        });
    }

    static update(id, data, callback) {
        Room.getById(id, (err, existing) => {
            if (err) {
                callback(err, null);
                return;
            }
            if (!existing) {
                callback(new Error('Room not found'), null);
                return;
            }

            const merged = {
                room_number: data.room_number !== undefined ? data.room_number : existing.room_number,
                type: data.type !== undefined ? data.type : existing.type,
                price_per_month: data.price_per_month !== undefined ? data.price_per_month : existing.price_per_month,
                status: data.status !== undefined ? data.status : existing.status,
                description: data.description !== undefined ? data.description : existing.description
            };

            const sql = 'UPDATE rooms SET room_number = ?, type = ?, price_per_month = ?, status = ?, description = ? WHERE id = ?';
            const params = [merged.room_number, merged.type, merged.price_per_month, merged.status, merged.description, id];
            db.run(sql, params, function (updateErr) {
                if (updateErr) {
                    callback(updateErr, null);
                } else {
                    callback(null, { id, ...merged });
                }
            });
        });
    }

    static delete(id, callback) {
        const sql = 'DELETE FROM rooms WHERE id = ?';
        db.run(sql, [id], function(err) {
            callback(err, this.changes);
        });
    }

    static getAvailableRooms(callback) {
        const sql = 'SELECT * FROM rooms WHERE status = "available" ORDER BY room_number';
        db.all(sql, [], callback);
    }

    static getOccupiedRooms(callback) {
        const sql = 'SELECT r.*, t.name as tenant_name FROM rooms r JOIN leases l ON r.id = l.room_id JOIN tenants t ON l.tenant_id = t.id WHERE r.status = "occupied" AND l.status = "active" ORDER BY r.room_number';
        db.all(sql, [], callback);
    }

    static getStatistics(callback) {
        const sql = `
            SELECT 
                COUNT(*) as total_rooms,
                COUNT(CASE WHEN status = 'available' THEN 1 END) as available_rooms,
                COUNT(CASE WHEN status = 'occupied' THEN 1 END) as occupied_rooms,
                COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance_rooms
            FROM rooms
        `;
        db.get(sql, [], callback);
    }
}

module.exports = Room;
