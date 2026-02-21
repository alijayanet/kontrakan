const whatsappClient = require('../utils/whatsapp');
const path = require('path');
const fs = require('fs');

class WhatsAppController {
    static async showQR(req, res) {
        const waStatus = whatsappClient.getStatus();
        res.render('settings/whatsapp', {
            title: 'WhatsApp Gateway',
            waStatus
        });
    }

    static async getStatus(req, res) {
        res.json(whatsappClient.getStatus());
    }

    static async disconnect(req, res) {
        try {
            await whatsappClient.clearSession();
            // Re-initialize to get a new QR code
            whatsappClient.initialize();
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async testMessage(req, res) {
        const { phone, message } = req.body;
        try {
            await whatsappClient.sendMessage(phone, message);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = WhatsAppController;
