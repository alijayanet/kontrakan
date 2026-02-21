const db = require('../config/database');

class BoardingHouseController {
    // Show boarding house information
    static index(req, res) {
        db.get('SELECT * FROM boarding_houses ORDER BY id DESC LIMIT 1', (err, boardingHouse) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).render('error', {
                    title: 'Error',
                    message: 'Terjadi kesalahan saat mengambil data kontrakan',
                    layout: false // Disable layout for error page
                });
            }

            res.render('boarding_house/index', {
                title: 'Informasi Kontrakan',
                boardingHouse: boardingHouse
            });
        });
    }

    // Show create form
    static createForm(req, res) {
        // Check if boarding house already exists
        db.get('SELECT COUNT(*) as count FROM boarding_houses', (err, result) => {
            if (err) {
                console.error('Database error:', err);
                return res.render('error', {
                    title: 'Error',
                    message: 'Terjadi kesalahan saat memeriksa data kontrakan'
                });
            }

            if (result.count > 0) {
                return res.redirect('/boarding-house');
            }

            res.render('boarding_house/create', {
                title: 'Tambah Informasi Kontrakan'
            });
        });
    }

    // Create boarding house
    static create(req, res) {
        const { name, address, description, phone, email, admin_wa_number } = req.body;

        db.run(
            'INSERT INTO boarding_houses (name, address, description, phone, email, admin_wa_number) VALUES (?, ?, ?, ?, ?, ?)',
            [name, address, description, phone, email, admin_wa_number],
            (err) => {
                if (err) {
                    console.error('Detailed Database error during create:', err);
                    return res.render('boarding_house/create', {
                        title: 'Tambah Informasi Kontrakan',
                        error: 'Gagal menyimpan data kontrakan: ' + err.message
                    });
                }

                res.redirect('/boarding-house');
            }
        );
    }

    // Show edit form
    static editForm(req, res) {
        const { id } = req.params;

        db.get('SELECT * FROM boarding_houses WHERE id = ?', [id], (err, boardingHouse) => {
            if (err) {
                console.error('Database error:', err);
                return res.render('error', {
                    title: 'Error',
                    message: 'Terjadi kesalahan saat mengambil data kontrakan'
                });
            }

            if (!boardingHouse) {
                return res.render('error', {
                    title: 'Error',
                    message: 'Data kontrakan tidak ditemukan'
                });
            }

            res.render('boarding_house/edit', {
                title: 'Edit Informasi Kontrakan',
                boardingHouse: boardingHouse
            });
        });
    }

    // Update boarding house
    static update(req, res) {
        const { id } = req.params;
        const { name, address, description, phone, email, admin_wa_number } = req.body;

        db.run(
            'UPDATE boarding_houses SET name = ?, address = ?, description = ?, phone = ?, email = ?, admin_wa_number = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [name, address, description, phone, email, admin_wa_number, id],
            (err) => {
                if (err) {
                    console.error('Detailed Database error during update:', err);
                    return res.render('boarding_house/edit', {
                        title: 'Edit Informasi Kontrakan',
                        boardingHouse: { id, name, address, description, phone, email, admin_wa_number },
                        error: 'Gagal memperbarui data kontrakan: ' + err.message
                    });
                }

                res.redirect('/boarding-house');
            }
        );
    }

    // Delete boarding house
    static delete(req, res) {
        const { id } = req.params;

        db.run('DELETE FROM boarding_houses WHERE id = ?', [id], (err) => {
            if (err) {
                console.error('Database error:', err);
                return res.render('error', {
                    title: 'Error',
                    message: 'Gagal menghapus data kontrakan'
                });
            }

            res.redirect('/boarding-house');
        });
    }
}

module.exports = BoardingHouseController;