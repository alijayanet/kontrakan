const db = require('../config/database');
const moment = require('moment');

class ExpenseController {
    // List all expenses
    static index(req, res) {
        db.all('SELECT * FROM expenses ORDER BY date DESC, created_at DESC', [], (err, rows) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Internal Server Error');
            }

            // Calculate total expenses for summary
            const total = rows.reduce((sum, item) => sum + item.amount, 0);

            res.render('expenses/index', {
                title: 'Catatan Pengeluaran',
                expenses: rows,
                total,
                moment,
                success: req.query.success,
                error: req.query.error
            });
        });
    }

    // Add new expense
    static store(req, res) {
        const { category, amount, description, date } = req.body;

        db.run(
            'INSERT INTO expenses (category, amount, description, date) VALUES (?, ?, ?, ?)',
            [category, amount, description, date],
            (err) => {
                if (err) {
                    console.error(err);
                    return res.redirect('/expenses?error=Gagal menyimpan pengeluaran');
                }
                res.redirect('/expenses?success=Pengeluaran berhasil dicatat');
            }
        );
    }

    // Delete expense
    static delete(req, res) {
        const { id } = req.params;
        db.run('DELETE FROM expenses WHERE id = ?', [id], (err) => {
            if (err) {
                console.error(err);
                return res.json({ success: false, message: 'Gagal menghapus data' });
            }
            res.json({ success: true });
        });
    }
}

module.exports = ExpenseController;
