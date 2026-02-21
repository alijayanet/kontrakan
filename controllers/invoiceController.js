const Invoice = require('../models/Invoice');
const Lease = require('../models/Lease');
const whatsappClient = require('../utils/whatsapp');

class InvoiceController {
    static index(req, res) {
        Invoice.getAll((err, invoices) => {
            if (err) {
                console.error('Error fetching invoices:', err);
                return res.status(500).render('error', {
                    title: 'Error',
                    message: 'Failed to fetch invoices'
                });
            }
            res.render('invoices/index', {
                title: 'Manage Invoices',
                invoices
            });
        });
    }

    static createForm(req, res) {
        Lease.getActiveLeases((err, leases) => {
            if (err) {
                console.error('Error fetching leases:', err);
                return res.status(500).render('error', {
                    title: 'Error',
                    message: 'Failed to fetch leases'
                });
            }
            res.render('invoices/create', {
                title: 'Create New Invoice',
                leases
            });
        });
    }

    static create(req, res) {
        const invoiceData = {
            lease_id: parseInt(req.body.lease_id),
            amount: parseFloat(req.body.amount),
            extra_charges: parseFloat(req.body.extra_charges) || 0,
            due_date: req.body.due_date,
            payment_status: req.body.payment_status || 'unpaid',
            notif_sent_count: 0
        };

        Invoice.create(invoiceData, (err, invoice) => {
            if (err) {
                console.error('Error creating invoice:', err);
                return res.status(500).render('error', {
                    title: 'Error',
                    message: 'Failed to create invoice'
                });
            }
            res.redirect('/invoices');
        });
    }

    static editForm(req, res) {
        const invoiceId = req.params.id;
        Promise.all([
            new Promise((resolve, reject) => {
                Invoice.getById(invoiceId, (err, invoice) => {
                    if (err) reject(err);
                    else resolve(invoice);
                });
            }),
            new Promise((resolve, reject) => {
                Lease.getActiveLeases((err, leases) => {
                    if (err) reject(err);
                    else resolve(leases);
                });
            })
        ])
            .then(([invoice, leases]) => {
                if (!invoice) {
                    return res.status(404).render('error', {
                        title: 'Not Found',
                        message: 'Invoice not found',
                        layout: false // Disable layout for error page
                    });
                }
                res.render('invoices/edit', {
                    title: 'Edit Invoice',
                    invoice,
                    leases
                });
            })
            .catch(err => {
                console.error('Error loading invoice edit form:', err);
                res.status(500).render('error', {
                    title: 'Error',
                    message: 'Failed to load invoice edit form',
                    layout: false // Disable layout for error page
                });
            });
    }

    static update(req, res) {
        const invoiceId = req.params.id;
        const invoiceData = {
            lease_id: parseInt(req.body.lease_id),
            amount: parseFloat(req.body.amount),
            extra_charges: parseFloat(req.body.extra_charges) || 0,
            due_date: req.body.due_date,
            payment_status: req.body.payment_status
        };

        Invoice.update(invoiceId, invoiceData, (err, invoice) => {
            if (err) {
                console.error('Error updating invoice:', err);
                return res.status(500).render('error', {
                    title: 'Error',
                    message: 'Failed to update invoice'
                });
            }
            res.redirect('/invoices');
        });
    }

    static delete(req, res) {
        const invoiceId = req.params.id;
        Invoice.delete(invoiceId, (err, changes) => {
            if (err) {
                console.error('Error deleting invoice:', err);
                return res.status(500).render('error', {
                    title: 'Error',
                    message: 'Failed to delete invoice'
                });
            }
            res.redirect('/invoices');
        });
    }

    static show(req, res) {
        const invoiceId = req.params.id;
        Invoice.getById(invoiceId, (err, invoice) => {
            if (err || !invoice) {
                return res.status(404).render('error', {
                    title: 'Not Found',
                    message: 'Invoice not found'
                });
            }
            res.render('invoices/show', {
                title: `Invoice #${invoice.id}`,
                invoice
            });
        });
    }

    static markAsPaid(req, res) {
        const invoiceId = req.params.id;
        Invoice.getById(invoiceId, (err, invoice) => {
            if (err || !invoice) {
                return res.status(404).render('error', {
                    title: 'Not Found',
                    message: 'Invoice not found'
                });
            }

            Invoice.update(invoiceId, { ...invoice, payment_status: 'paid' }, (err, updatedInvoice) => {
                if (err) {
                    console.error('Error updating invoice:', err);
                    return res.status(500).render('error', {
                        title: 'Error',
                        message: 'Failed to mark invoice as paid'
                    });
                }
                res.redirect('/invoices');
            });
        });
    }

    static getUnpaidInvoices(req, res) {
        try {
            Invoice.getUnpaidInvoices((err, invoices) => {
                if (err) {
                    console.error('Error fetching unpaid invoices:', err);
                    return res.status(500).render('error', {
                        title: 'Error',
                        message: 'Failed to fetch unpaid invoices',
                        layout: false // Disable layout for error page
                    });
                }

                console.log('Debug - Unpaid invoices:', invoices);
                console.log('Debug - Number of invoices:', invoices ? invoices.length : 0);

                try {
                    res.render('invoices/unpaid', {
                        title: 'Unpaid Invoices',
                        invoices
                    });
                } catch (renderErr) {
                    console.error('Error rendering unpaid view:', renderErr);
                    return res.status(500).render('error', {
                        title: 'Error',
                        message: 'Failed to render unpaid invoices page',
                        layout: false // Disable layout for error page
                    });
                }
            });
        } catch (err) {
            console.error('Error in getUnpaidInvoices:', err);
            return res.status(500).render('error', {
                title: 'Error',
                message: 'Internal server error',
                layout: false // Disable layout for error page
            });
        }
    }

    static getOverdueInvoices(req, res) {
        Invoice.getOverdueInvoices((err, invoices) => {
            if (err) {
                console.error('Error fetching overdue invoices:', err);
                return res.status(500).render('error', {
                    title: 'Error',
                    message: 'Failed to fetch overdue invoices',
                    layout: false // Disable layout for error page
                });
            }
            res.render('invoices/overdue', {
                title: 'Overdue Invoices',
                invoices
            });
        });
    }

    static async sendWhatsApp(req, res) {
        const invoiceId = req.params.id;
        Invoice.getById(invoiceId, async (err, invoice) => {
            if (err || !invoice) {
                return res.status(404).json({ success: false, message: 'Invoice not found' });
            }

            try {
                const totalAmount = invoice.amount + (invoice.extra_charges || 0);
                const messageType = invoice.payment_status === 'overdue' ? 'overdue' : 'reminder';

                await whatsappClient.sendReminder(
                    invoice.whatsapp_number,
                    invoice.tenant_name,
                    invoice.room_number,
                    totalAmount,
                    invoice.due_date,
                    messageType
                );

                // Increment notification count
                Invoice.incrementNotifCount(invoiceId, () => { });

                res.json({ success: true, message: 'WhatsApp message sent successfully' });
            } catch (error) {
                console.error('WA Send Error:', error);
                res.status(500).json({ success: false, message: error.message });
            }
        });
    }
}

module.exports = InvoiceController;