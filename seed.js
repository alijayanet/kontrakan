const db = require('./config/database');
const Room = require('./models/Room');
const Tenant = require('./models/Tenant');
const Lease = require('./models/Lease');
const Invoice = require('./models/Invoice');

// Sample data
const sampleRooms = [
    { room_number: '101', type: 'Regular', price_per_month: 800000, status: 'available', description: 'Kamar standard dengan AC' },
    { room_number: '102', type: 'VIP', price_per_month: 1200000, status: 'available', description: 'Kamar VIP dengan fasilitas lengkap' },
    { room_number: '103', type: 'Regular', price_per_month: 800000, status: 'occupied', description: 'Kamar standard' },
    { room_number: '104', type: 'Deluxe', price_per_month: 1500000, status: 'available', description: 'Kamar deluxe dengan kamar mandi dalam' },
    { room_number: '201', type: 'Regular', price_per_month: 850000, status: 'occupied', description: 'Kamar lantai 2' }
];

const sampleTenants = [
    { name: 'Budi Santoso', whatsapp_number: '6281234567890', identity_number: '1234567890123456', emergency_contact: 'Ibu Sari - 081298765432' },
    { name: 'Ani Wijaya', whatsapp_number: '6281298765432', identity_number: '2345678901234567', emergency_contact: 'Ayah Joko - 081287654321' },
    { name: 'Citra Dewi', whatsapp_number: '6281287654321', identity_number: '3456789012345678', emergency_contact: 'Kakak Toni - 081276543210' }
];

// Insert sample data
function seedDatabase() {
    console.log('Seeding database with sample data...');
    
    // Insert rooms
    sampleRooms.forEach(room => {
        Room.create(room, (err, result) => {
            if (err) {
                console.error('Error creating room:', err);
            } else {
                console.log('Created room:', result.room_number);
            }
        });
    });
    
    // Insert tenants
    sampleTenants.forEach(tenant => {
        Tenant.create(tenant, (err, result) => {
            if (err) {
                console.error('Error creating tenant:', err);
            } else {
                console.log('Created tenant:', result.name);
            }
        });
    });
    
    // Create some sample leases after a delay
    setTimeout(() => {
        // Sample leases for occupied rooms
        const sampleLeases = [
            {
                room_id: 3, // room 103
                tenant_id: 1, // Budi Santoso
                start_date: '2024-01-01',
                due_date: '2024-12-31',
                base_price: 800000,
                status: 'active'
            },
            {
                room_id: 5, // room 201
                tenant_id: 2, // Ani Wijaya
                start_date: '2024-02-01',
                due_date: '2024-11-30',
                base_price: 850000,
                status: 'active'
            }
        ];
        
        sampleLeases.forEach(lease => {
            Lease.create(lease, (err, result) => {
                if (err) {
                    console.error('Error creating lease:', err);
                } else {
                    console.log('Created lease for room:', lease.room_id);
                    
                    // Create corresponding invoices
                    const invoice = {
                        lease_id: result.id,
                        amount: lease.base_price,
                        due_date: lease.due_date,
                        payment_status: 'unpaid'
                    };
                    
                    Invoice.create(invoice, (err, invoiceResult) => {
                        if (err) {
                            console.error('Error creating invoice:', err);
                        } else {
                            console.log('Created invoice for lease:', result.id);
                        }
                    });
                }
            });
        });
        
        // Update room statuses - need to get current room data first
        Room.getById(3, (err, room) => {
            if (room) {
                Room.update(3, { ...room, status: 'occupied' }, (err, result) => {
                    if (err) console.error('Error updating room status:', err);
                });
            }
        });
        
        Room.getById(5, (err, room) => {
            if (room) {
                Room.update(5, { ...room, status: 'occupied' }, (err, result) => {
                    if (err) console.error('Error updating room status:', err);
                });
            }
        });
        
    }, 2000);
    
    console.log('Seeding completed!');
}

// Run seeding
seedDatabase();