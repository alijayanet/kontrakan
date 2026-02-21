const express = require('express');
const router = express.Router();

// Controllers
const DashboardController = require('../controllers/dashboardController');
const RoomController = require('../controllers/roomController');
const TenantController = require('../controllers/tenantController');
const LeaseController = require('../controllers/leaseController');
const InvoiceController = require('../controllers/invoiceController');
const AuthController = require('../controllers/authController');
const BoardingHouseController = require('../controllers/boardingHouseController');
const ExpenseController = require('../controllers/expenseController');
const WhatsAppController = require('../controllers/whatsappController');

// Auth Routes
router.get('/login', AuthController.loginForm);
router.post('/login', AuthController.login);
router.get('/logout', AuthController.logout);
router.get('/profile', AuthController.requireAuth, AuthController.profileForm);
router.post('/profile', AuthController.requireAuth, AuthController.updateProfile);

// Protected routes
router.use(AuthController.requireAuth);

// Dashboard
router.get('/', DashboardController.index);

// Rooms Routes
router.get('/rooms', RoomController.index);
router.get('/rooms/create', RoomController.createForm);
router.post('/rooms', RoomController.create);
router.get('/rooms/:id/edit', RoomController.editForm);
router.put('/rooms/:id', RoomController.update);
router.delete('/rooms/:id', RoomController.delete);
router.get('/rooms/:id', RoomController.show);

// Tenants Routes
router.get('/tenants', TenantController.index);
router.get('/tenants/create', TenantController.createForm);
router.post('/tenants', TenantController.create);
router.get('/tenants/:id/edit', TenantController.editForm);
router.put('/tenants/:id', TenantController.update);
router.delete('/tenants/:id', TenantController.delete);
router.get('/tenants/:id', TenantController.show);

// Leases Routes
router.get('/leases', LeaseController.index);
router.get('/leases/create', LeaseController.createForm);
router.post('/leases', LeaseController.create);
router.get('/leases/:id', LeaseController.show);
router.get('/leases/:id/edit', LeaseController.editForm);
router.put('/leases/:id', LeaseController.update);
router.delete('/leases/:id', LeaseController.delete);
router.post('/leases/:id/checkout', LeaseController.checkOut);

// Invoices Routes
router.get('/invoices', InvoiceController.index);
router.get('/invoices/create', InvoiceController.createForm);
router.post('/invoices', InvoiceController.create);
router.get('/invoices/:id/edit', InvoiceController.editForm);
router.put('/invoices/:id', InvoiceController.update);
router.delete('/invoices/:id', InvoiceController.delete);
router.get('/invoices/:id', InvoiceController.show);
router.post('/invoices/:id/pay', InvoiceController.markAsPaid);
router.post('/invoices/:id/whatsapp', InvoiceController.sendWhatsApp);
router.get('/invoices/unpaid', InvoiceController.getUnpaidInvoices);
router.get('/invoices/overdue', InvoiceController.getOverdueInvoices);

// Boarding House Routes
router.get('/boarding-house', BoardingHouseController.index);
router.get('/boarding-house/create', BoardingHouseController.createForm);
router.post('/boarding-house', BoardingHouseController.create);
router.get('/boarding-house/:id/edit', BoardingHouseController.editForm);
router.put('/boarding-house/:id', BoardingHouseController.update);
router.delete('/boarding-house/:id', BoardingHouseController.delete);

// Expense Routes
router.get('/expenses', ExpenseController.index);
router.post('/expenses', ExpenseController.store);
router.delete('/expenses/:id', ExpenseController.delete);

// WhatsApp Gateway Routes
router.get('/settings/whatsapp', WhatsAppController.showQR);
router.get('/settings/whatsapp/status', WhatsAppController.getStatus);
router.post('/settings/whatsapp/disconnect', WhatsAppController.disconnect);
router.post('/settings/whatsapp/test', WhatsAppController.testMessage);

module.exports = router;