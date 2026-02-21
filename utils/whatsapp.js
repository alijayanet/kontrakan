const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, delay } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const db = require('../config/database');

class WhatsAppClient {
    constructor() {
        this.sock = null;
        this.authState = null;
        this.isConnected = false;
        this.qrCode = null;
        this.status = 'initializing'; // initializing, disconnected, qr_ready, connected
    }

    async initialize() {
        try {
            const authFolder = path.join(__dirname, '..', 'auth_info_baileys');
            if (!fs.existsSync(authFolder)) {
                fs.mkdirSync(authFolder, { recursive: true });
            }

            const { state, saveCreds } = await useMultiFileAuthState(authFolder);
            this.authState = state;

            this.sock = makeWASocket({
                auth: state,
                printQRInTerminal: false,
                browser: ['Kost Management', 'Chrome', '1.0.0'],
                syncFullHistory: false,
                logger: pino({ level: 'silent' })
            });

            this.sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update;

                if (qr) {
                    this.qrCode = qr;
                    this.status = 'qr_ready';
                    console.log('WhatsApp QR Code ready');
                }

                if (connection === 'close') {
                    this.isConnected = false;
                    const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
                    console.log('Connection closed due to', lastDisconnect.error, 'Reconnecting:', shouldReconnect);

                    if (lastDisconnect.error?.output?.statusCode === DisconnectReason.loggedOut) {
                        this.status = 'disconnected';
                        this.clearSession();
                    } else if (shouldReconnect) {
                        this.status = 'reconnecting';
                        setTimeout(() => this.initialize(), 3000);
                    }
                } else if (connection === 'open') {
                    this.isConnected = true;
                    this.qrCode = null;
                    this.status = 'connected';
                    console.log('WhatsApp connection opened');
                }
            });

            this.sock.ev.on('creds.update', saveCreds);

            // Listen for incoming messages for Admin interaction
            this.sock.ev.on('messages.upsert', async (m) => {
                if (m.type === 'notify') {
                    for (const msg of m.messages) {
                        if (!msg.key.fromMe && msg.message) {
                            await this.handleIncomingMessage(msg);
                        }
                    }
                }
            });

            return this.sock;
        } catch (error) {
            console.error('Error initializing WhatsApp client:', error);
            this.status = 'error';
        }
    }

    async getHouseData() {
        return new Promise((resolve) => {
            db.get('SELECT * FROM boarding_houses LIMIT 1', (err, row) => {
                if (err || !row) resolve({ name: 'Kost Manager', address: '', phone: '' });
                else resolve(row);
            });
        });
    }

    async formatMessage(body) {
        const house = await this.getHouseData();
        const header = `🏠 *${house.name.toUpperCase()}*\n`;
        const footer = `\n\n---\n*${house.name}*\n📍 ${house.address || ''}\n📞 ${house.phone || ''}`;
        return header + body + footer;
    }

    async handleIncomingMessage(msg) {
        const remoteJid = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;

        if (!text) return;

        // Fetch house data for admin phone and branding
        const house = await this.getHouseData();
        if (!house || !house.admin_wa_number) return;

        const adminPhone = house.admin_wa_number.replace(/\D/g, '');
        const sender = remoteJid.split('@')[0];

        if (sender === adminPhone) {
            // Admin commands
            const lowerText = text.toLowerCase();
            if (lowerText.startsWith('bayar ')) {
                const searchTerm = text.substring(6).trim();
                if (searchTerm) {
                    await this.processPaymentViaWA(remoteJid, searchTerm);
                }
            } else if (lowerText === 'menu') {
                const body = "*Kost Manager Admin Menu*\n\n" +
                    "Gunakan perintah berikut:\n" +
                    "- *bayar [ID/Kamar/Nama]* : Melunasi tagihan secara fleksibel\n" +
                    "- *tagihan* : Cek tagihan belum lunas\n" +
                    "- *status* : Cek status hunian";
                await this.sendMessageWithBranding(remoteJid, body);
            } else if (lowerText === 'tagihan') {
                await this.listUnpaidInvoices(remoteJid);
            } else if (lowerText === 'status') {
                await this.sendStatusSummary(remoteJid);
            }
        }
    }

    async sendStatusSummary(remoteJid) {
        const stats = await new Promise((resolve) => {
            const data = {};
            db.get('SELECT COUNT(*) as total FROM rooms', (err, row) => {
                data.totalRooms = row?.total || 0;
                db.get('SELECT COUNT(*) as occupied FROM rooms WHERE status = "occupied"', (err, row) => {
                    data.occupiedRooms = row?.occupied || 0;
                    db.get('SELECT SUM(amount + IFNULL(extra_charges, 0)) as unpaid FROM invoices WHERE payment_status != "paid"', (err, row) => {
                        data.unpaidAmount = row?.unpaid || 0;
                        db.get('SELECT COUNT(*) as count FROM invoices WHERE payment_status != "paid"', (err, row) => {
                            data.unpaidCount = row?.count || 0;
                            resolve(data);
                        });
                    });
                });
            });
        });

        const body = `📊 *STATISTIK HUNIAN*\n\n` +
            `- Total Kamar: ${stats.totalRooms}\n` +
            `- Terisi: ${stats.occupiedRooms} (${Math.round((stats.occupiedRooms / (stats.totalRooms || 1)) * 100)}%)\n` +
            `- Kosong: ${stats.totalRooms - stats.occupiedRooms}\n\n` +
            `💰 *FINANSIAL*\n` +
            `- Tagihan Tertunggak: ${stats.unpaidCount} invoice\n` +
            `- Total Piutang: *Rp ${stats.unpaidAmount.toLocaleString('id-ID')}*`;

        await this.sendMessageWithBranding(remoteJid, body);
    }
    async processPaymentViaWA(remoteJid, searchTerm) {
        // Search across ID, Room Number, or Tenant Name for UNPAID invoices
        const query = `
            SELECT i.*, r.room_number, t.name as tenant_name, t.phone as tenant_phone
            FROM invoices i 
            JOIN leases l ON i.lease_id = l.id 
            JOIN rooms r ON l.room_id = r.id 
            JOIN tenants t ON l.tenant_id = t.id 
            WHERE i.payment_status != 'paid' 
            AND (i.id = ? OR r.room_number LIKE ? OR t.name LIKE ?)
            ORDER BY i.due_date ASC
        `;

        const searchLike = `%${searchTerm}%`;
        db.all(query, [searchTerm, searchTerm, searchLike], async (err, rows) => {
            if (err) {
                return this.sendMessageWithBranding(remoteJid, "❌ Terjadi kesalahan saat mencari tagihan.");
            }

            if (!rows || rows.length === 0) {
                return this.sendMessageWithBranding(remoteJid, `❌ Tidak ditemukan tagihan belum lunas untuk: *${searchTerm}*`);
            }

            if (rows.length > 1) {
                let msg = `⚠️ Ditemukan *${rows.length}* tagihan yang cocok. Mohon gunakan ID spesifik:\n\n`;
                rows.forEach(row => {
                    msg += `📌 *ID ${row.id}* - Kamar ${row.room_number} (${row.tenant_name})\n`;
                });
                return this.sendMessageWithBranding(remoteJid, msg);
            }

            const invoice = rows[0];
            const invoiceId = invoice.id;

            // Mark as paid
            db.run('UPDATE invoices SET payment_status = "paid" WHERE id = ?', [invoiceId], async (err) => {
                if (err) {
                    return this.sendMessageWithBranding(remoteJid, `❌ Gagal memproses pelunasan untuk #${invoiceId}.`);
                }

                await this.sendMessageWithBranding(remoteJid, `✅ *Berhasil!* Tagihan untuk *${invoice.tenant_name}* (Kamar ${invoice.room_number}) telah ditandai LUNAS.`);

                // AUTOMATIC RECEIPT to Tenant
                if (invoice.tenant_phone) {
                    const receiptBody = `Halo, Kak *${invoice.tenant_name}*! 👋\n\n` +
                        `Terima kasih, pembayaran untuk sewa kamar *${invoice.room_number}* telah kami terima dan diverifikasi.\n\n` +
                        `📌 *BUKTI BAYAR DIGITAL*\n` +
                        `- No. Invoice: #${invoice.id}\n` +
                        `- Tanggal: ${new Date().toLocaleDateString('id-ID')}\n` +
                        `- Status: *LUNAS (Verified by System)*\n\n` +
                        `Semoga betah tinggal di sini! 🙏`;

                    await this.sendMessageWithBranding(invoice.tenant_phone, receiptBody);
                }
            });
        });
    }

    async listUnpaidInvoices(remoteJid) {
        db.all('SELECT i.*, r.room_number, t.name as tenant_name FROM invoices i JOIN leases l ON i.lease_id = l.id JOIN rooms r ON l.room_id = r.id JOIN tenants t ON l.tenant_id = t.id WHERE i.payment_status != "paid" ORDER BY i.due_date LIMIT 10', [], async (err, rows) => {
            if (err || !rows || rows.length === 0) {
                return this.sendMessageWithBranding(remoteJid, "✅ Tidak ada tagihan yang tertunggak.");
            }

            let body = "📋 *Daftar Tagihan Belum Lunas:*\n\n";
            rows.forEach(row => {
                body += `📌 *ID ${row.id}* - Kamar ${row.room_number}\n`;
                body += `👤 ${row.tenant_name}\n`;
                body += `💰 Rp ${(row.amount + (row.extra_charges || 0)).toLocaleString('id-ID')}\n`;
                body += `📅 Tempo: ${row.due_date}\n\n`;
            });
            body += "Ketik *bayar [ID]* untuk melunasi.";
            await this.sendMessageWithBranding(remoteJid, body);
        });
    }

    async clearSession() {
        const authFolder = path.join(__dirname, '..', 'auth_info_baileys');
        if (fs.existsSync(authFolder)) {
            fs.rmSync(authFolder, { recursive: true, force: true });
        }
        this.isConnected = false;
        this.authState = null;
        this.qrCode = null;
        this.status = 'disconnected';
    }

    async sendReminder(phoneNumber, tenantName, roomNumber, totalAmount, dueDate, messageType = 'reminder') {
        if (!this.isConnected || !this.sock) {
            throw new Error('WhatsApp client not connected');
        }

        try {
            const formattedNumber = phoneNumber.replace(/\D/g, '');
            const finalNumber = formattedNumber.startsWith('62') ? formattedNumber : '62' + formattedNumber.replace(/^0+/, '');
            const jid = `${finalNumber}@s.whatsapp.net`;

            let body;
            if (messageType === 'reminder') {
                body = `Halo, Kak ${tenantName}! 👋\n\n` +
                    `Sekadar mengingatkan bahwa masa sewa kamar *${roomNumber}* akan berakhir pada *${dueDate}*.\n\n` +
                    `Total Tagihan: *Rp ${totalAmount.toLocaleString('id-ID')}*\n\n` +
                    `Mohon segera melakukan pembayaran. Terima kasih!`;
            } else {
                body = `Halo, Kak ${tenantName}! 👋\n\n` +
                    `⚠️ *PERINGATAN PEMBAYARAN TERLAMBAT*\n\n` +
                    `Pembayaran sewa kamar *${roomNumber}* sudah melewati jatuh tempo pada *${dueDate}*.\n\n` +
                    `Total Tagihan: *Rp ${totalAmount.toLocaleString('id-ID')}*\n\n` +
                    `Mohon segera melakukan pembayaran agar terhindar dari pemutusan fasilitas. Terima kasih!`;
            }

            const brandedMsg = await this.formatMessage(body);
            const result = await this.sock.sendMessage(jid, { text: brandedMsg });
            return result;
        } catch (error) {
            console.error('Error sending WhatsApp message:', error);
            throw error;
        }
    }

    async sendMessageWithBranding(phoneNumber, body) {
        const brandedMsg = await this.formatMessage(body);
        return this.sendMessage(phoneNumber, brandedMsg);
    }

    async sendMessage(phoneNumber, message) {
        if (!this.isConnected || !this.sock) {
            console.log('Cannot send message, WA not connected');
            return;
        }

        try {
            const formattedNumber = phoneNumber.replace(/\D/g, '');
            const finalNumber = formattedNumber.startsWith('62') ? formattedNumber : '62' + formattedNumber.replace(/^0+/, '');
            const jid = finalNumber.includes('@s.whatsapp.net') ? finalNumber : `${finalNumber}@s.whatsapp.net`;

            const result = await this.sock.sendMessage(jid, { text: message });
            return result;
        } catch (error) {
            console.error('Error sending WhatsApp message:', error);
        }
    }

    getStatus() {
        return {
            connected: this.isConnected,
            status: this.status,
            qr: this.qrCode
        };
    }
}

const whatsappClient = new WhatsAppClient();
module.exports = whatsappClient;