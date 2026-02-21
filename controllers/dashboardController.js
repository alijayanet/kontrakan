const Room = require('../models/Room');
const Lease = require('../models/Lease');
const Invoice = require('../models/Invoice');

class DashboardController {
    static index(req, res) {
        // Get all statistics in parallel
        Promise.all([
            new Promise((resolve, reject) => {
                Room.getStatistics((err, stats) => {
                    if (err) reject(err);
                    else resolve(stats);
                });
            }),
            new Promise((resolve, reject) => {
                Invoice.getStatistics((err, stats) => {
                    if (err) reject(err);
                    else resolve(stats);
                });
            }),
            new Promise((resolve, reject) => {
                Room.getOccupiedRooms((err, rooms) => {
                    if (err) reject(err);
                    else resolve(rooms);
                });
            }),
            new Promise((resolve, reject) => {
                Lease.getExpiringLeases(7, (err, leases) => {
                    if (err) reject(err);
                    else resolve(leases);
                });
            }),

        ])
        .then(([roomStats, invoiceStats, occupiedRooms, expiringLeases]) => {
            res.render('dashboard', {
                title: 'Dashboard',
                roomStats,
                invoiceStats,
                occupiedRooms,
                expiringLeases
            });
        })
        .catch(err => {
            console.error('Error loading dashboard:', err);
            res.status(500).render('error', {
                title: 'Error',
                message: 'Failed to load dashboard',
                layout: false // Disable layout for error page
            });
        });
    }
}

module.exports = DashboardController;