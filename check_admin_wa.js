const db = require('./config/database');

db.get('SELECT admin_wa_number FROM boarding_houses LIMIT 1', (err, row) => {
    if (err) {
        console.error('Error fetching data:', err);
    } else if (row) {
        console.log('Current Admin WA Number in DB:', row.admin_wa_number);
    } else {
        console.log('No boarding house data found.');
    }
    db.close();
});
