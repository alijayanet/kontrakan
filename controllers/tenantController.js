const Tenant = require('../models/Tenant');

class TenantController {
    static normalizeWhatsAppNumber(input) {
        const raw = (input || '').toString().trim();
        let digits = raw.replace(/\D/g, '');
        if (!digits) return '';

        if (digits.startsWith('0')) {
            digits = '62' + digits.slice(1);
        } else if (digits.startsWith('8')) {
            digits = '62' + digits;
        }

        return digits;
    }

    static index(req, res) {
        Tenant.getAll((err, tenants) => {
            if (err) {
                console.error('Error fetching tenants:', err);
                return res.status(500).render('error', {
                    title: 'Error',
                    message: 'Failed to fetch tenants',
                    layout: false // Disable layout for error page
                });
            }
            res.render('tenants/index', {
                title: 'Manage Tenants',
                tenants
            });
        });
    }

    static createForm(req, res) {
        res.render('tenants/create', {
            title: 'Add New Tenant'
        });
    }

    static create(req, res) {
        const tenantData = {
            name: (req.body.name || '').toString().trim(),
            whatsapp_number: TenantController.normalizeWhatsAppNumber(req.body.whatsapp_number),
            identity_number: req.body.identity_number,
            emergency_contact: req.body.emergency_contact
        };

        if (!tenantData.name || !tenantData.whatsapp_number) {
            return res.status(400).render('error', {
                title: 'Error',
                message: 'Nama dan No WhatsApp wajib diisi'
            });
        }

        Tenant.create(tenantData, (err, tenant) => {
            if (err) {
                console.error('Error creating tenant:', err);
                return res.status(500).render('error', {
                    title: 'Error',
                    message: 'Failed to create tenant'
                });
            }
            res.redirect('/tenants');
        });
    }

    static editForm(req, res) {
        const tenantId = req.params.id;
        Tenant.getById(tenantId, (err, tenant) => {
            if (err || !tenant) {
                return res.status(404).render('error', {
                    title: 'Not Found',
                    message: 'Tenant not found',
                    layout: false // Disable layout for error page
                });
            }
            res.render('tenants/edit', {
                title: 'Edit Tenant',
                tenant
            });
        });
    }

    static update(req, res) {
        const tenantId = req.params.id;
        const tenantData = {
            name: (req.body.name || '').toString().trim(),
            whatsapp_number: TenantController.normalizeWhatsAppNumber(req.body.whatsapp_number),
            identity_number: req.body.identity_number,
            emergency_contact: req.body.emergency_contact
        };

        if (!tenantData.name || !tenantData.whatsapp_number) {
            return res.status(400).render('error', {
                title: 'Error',
                message: 'Nama dan No WhatsApp wajib diisi'
            });
        }

        Tenant.update(tenantId, tenantData, (err, tenant) => {
            if (err) {
                console.error('Error updating tenant:', err);
                return res.status(500).render('error', {
                    title: 'Error',
                    message: 'Failed to update tenant'
                });
            }
            res.redirect('/tenants');
        });
    }

    static delete(req, res) {
        const tenantId = req.params.id;
        Tenant.delete(tenantId, (err, changes) => {
            if (err) {
                console.error('Error deleting tenant:', err);
                return res.status(500).render('error', {
                    title: 'Error',
                    message: 'Failed to delete tenant'
                });
            }
            res.redirect('/tenants');
        });
    }

    static show(req, res) {
        const tenantId = req.params.id;
        Tenant.getById(tenantId, (err, tenant) => {
            if (err || !tenant) {
                return res.status(404).render('error', {
                    title: 'Not Found',
                    message: 'Tenant not found'
                });
            }
            res.render('tenants/show', {
                title: `Tenant ${tenant.name}`,
                tenant
            });
        });
    }
}

module.exports = TenantController;
