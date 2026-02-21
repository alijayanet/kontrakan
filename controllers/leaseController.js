const Lease = require('../models/Lease');
const Room = require('../models/Room');
const Tenant = require('../models/Tenant');
const Invoice = require('../models/Invoice');
const moment = require('moment');

class LeaseController {
    static index(req, res) {
        Lease.getAll((err, leases) => {
            if (err) {
                console.error('Error fetching leases:', err);
                return res.status(500).render('error', {
                    title: 'Error',
                    message: 'Failed to fetch leases',
                    layout: false // Disable layout for error page
                });
            }
            res.render('leases/index', {
                title: 'Manage Leases',
                leases
            });
        });
    }

    static show(req, res) {
        const leaseId = req.params.id;
        
        Lease.getById(leaseId, (err, lease) => {
            if (err) {
                console.error('Error fetching lease:', err);
                return res.status(500).render('error', {
                    title: 'Error',
                    message: 'Failed to fetch lease details',
                    layout: false // Disable layout for error page
                });
            }
            
            if (!lease) {
                return res.status(404).render('error', {
                    title: 'Not Found',
                    message: 'Lease not found',
                    layout: false // Disable layout for error page
                });
            }
            
            res.render('leases/show', {
                title: 'Lease Details',
                lease
            });
        });
    }

    static createForm(req, res) {
        Promise.all([
            new Promise((resolve, reject) => {
                Room.getAvailableRooms((err, rooms) => {
                    if (err) reject(err);
                    else resolve(rooms);
                });
            }),
            new Promise((resolve, reject) => {
                Tenant.getAll((err, tenants) => {
                    if (err) reject(err);
                    else resolve(tenants);
                });
            })
        ])
        .then(([rooms, tenants]) => {
            res.render('leases/create', {
                title: 'Create New Lease',
                rooms,
                tenants
            });
        })
        .catch(err => {
            console.error('Error loading lease form:', err);
            res.status(500).render('error', {
                title: 'Error',
                message: 'Failed to load lease form',
                layout: false // Disable layout for error page
            });
        });
    }

    static create(req, res) {
        const leaseData = {
            room_id: parseInt(req.body.room_id),
            tenant_id: parseInt(req.body.tenant_id),
            start_date: req.body.start_date,
            due_date: req.body.due_date,
            base_price: parseFloat(req.body.base_price),
            rental_type: req.body.rental_type || 'monthly',
            status: 'active'
        };

        // Check if room is available
        Room.getById(leaseData.room_id, (err, room) => {
            if (err || !room) {
                return res.status(404).render('error', {
                    title: 'Error',
                    message: 'Room not found'
                });
            }

            if (room.status !== 'available') {
                return res.status(400).render('error', {
                    title: 'Error',
                    message: 'Room is not available'
                });
            }

            // Create lease
            Lease.create(leaseData, (err, lease) => {
                if (err) {
                    console.error('Error creating lease:', err);
                    return res.status(500).render('error', {
                        title: 'Error',
                        message: 'Failed to create lease'
                    });
                }

                // Update room status to occupied
                Room.update(leaseData.room_id, { ...room, status: 'occupied' }, (err, updatedRoom) => {
                    if (err) {
                        console.error('Error updating room status:', err);
                    }
                    
                    // Create initial invoice
                    const invoiceData = {
                        lease_id: lease.id,
                        amount: leaseData.base_price,
                        due_date: leaseData.due_date,
                        payment_status: 'unpaid'
                    };

                    Invoice.create(invoiceData, (err, invoice) => {
                        if (err) {
                            console.error('Error creating invoice:', err);
                        }
                    });

                    res.redirect('/leases');
                });
            });
        });
    }

    static editForm(req, res) {
        const leaseId = req.params.id;
        Promise.all([
            new Promise((resolve, reject) => {
                Lease.getById(leaseId, (err, lease) => {
                    if (err) reject(err);
                    else resolve(lease);
                });
            }),
            new Promise((resolve, reject) => {
                Room.getAll((err, rooms) => {
                    if (err) reject(err);
                    else resolve(rooms);
                });
            }),
            new Promise((resolve, reject) => {
                Tenant.getAll((err, tenants) => {
                    if (err) reject(err);
                    else resolve(tenants);
                });
            })
        ])
        .then(([lease, rooms, tenants]) => {
            if (!lease) {
                return res.status(404).render('error', {
                    title: 'Not Found',
                    message: 'Lease not found'
                });
            }
            res.render('leases/edit', {
                title: 'Edit Lease',
                lease,
                rooms,
                tenants
            });
        })
        .catch(err => {
            console.error('Error loading lease edit form:', err);
            res.status(500).render('error', {
                title: 'Error',
                message: 'Failed to load lease edit form'
            });
        });
    }

    static update(req, res) {
        const leaseId = req.params.id;
        const leaseData = {
            room_id: parseInt(req.body.room_id),
            tenant_id: parseInt(req.body.tenant_id),
            start_date: req.body.start_date,
            due_date: req.body.due_date,
            base_price: parseFloat(req.body.base_price),
            status: req.body.status
        };

        Lease.update(leaseId, leaseData, (err, lease) => {
            if (err) {
                console.error('Error updating lease:', err);
                return res.status(500).render('error', {
                    title: 'Error',
                    message: 'Failed to update lease'
                });
            }
            res.redirect('/leases');
        });
    }

    static delete(req, res) {
        const leaseId = req.params.id;
        Lease.getById(leaseId, (err, lease) => {
            if (err || !lease) {
                return res.status(404).render('error', {
                    title: 'Not Found',
                    message: 'Lease not found'
                });
            }

            // Update room status back to available
            Room.getById(lease.room_id, (err, room) => {
                if (room) {
                    Room.update(lease.room_id, { ...room, status: 'available' }, (err, updatedRoom) => {
                        if (err) {
                            console.error('Error updating room status:', err);
                        }
                    });
                }
            });

            Lease.delete(leaseId, (err, changes) => {
                if (err) {
                    console.error('Error deleting lease:', err);
                    return res.status(500).render('error', {
                        title: 'Error',
                        message: 'Failed to delete lease'
                    });
                }
                res.redirect('/leases');
            });
        });
    }

    static checkOut(req, res) {
        const leaseId = req.params.id;
        const checkOutDate = req.body.check_out_date || moment().format('YYYY-MM-DD');
        
        Lease.getById(leaseId, (err, lease) => {
            if (err || !lease) {
                return res.status(404).render('error', {
                    title: 'Not Found',
                    message: 'Lease not found'
                });
            }

            // Update lease status to completed
            Lease.update(leaseId, { ...lease, status: 'completed' }, (err, updatedLease) => {
                if (err) {
                    console.error('Error updating lease:', err);
                    return res.status(500).render('error', {
                        title: 'Error',
                        message: 'Failed to check out'
                    });
                }

                // Update room status to available
                Room.update(lease.room_id, { status: 'available' }, (err, room) => {
                    if (err) {
                        console.error('Error updating room status:', err);
                    }
                });

                res.redirect('/leases');
            });
        });
    }
}

module.exports = LeaseController;