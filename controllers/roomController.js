const Room = require('../models/Room');

class RoomController {
    static index(req, res) {
        Room.getAll((err, rooms) => {
            if (err) {
                console.error('Error fetching rooms:', err);
                return res.status(500).render('error', {
                    title: 'Error',
                    message: 'Failed to fetch rooms',
                    layout: false // Disable layout for error page
                });
            }
            res.render('rooms/index', {
                title: 'Manage Rooms',
                rooms
            });
        });
    }

    static createForm(req, res) {
        res.render('rooms/create', {
            title: 'Add New Room'
        });
    }

    static create(req, res) {
        const roomData = {
            room_number: req.body.room_number,
            type: req.body.type,
            price_per_month: parseFloat(req.body.price_per_month),
            status: req.body.status || 'available',
            description: req.body.description
        };

        Room.create(roomData, (err, room) => {
            if (err) {
                console.error('Error creating room:', err);
                return res.status(500).render('error', {
                    title: 'Error',
                    message: 'Failed to create room',
                    layout: false // Disable layout for error page
                });
            }
            res.redirect('/rooms');
        });
    }

    static editForm(req, res) {
        const roomId = req.params.id;
        Room.getById(roomId, (err, room) => {
            if (err || !room) {
                return res.status(404).render('error', {
                    title: 'Not Found',
                    message: 'Room not found',
                    layout: false // Disable layout for error page
                });
            }
            res.render('rooms/edit', {
                title: 'Edit Room',
                room
            });
        });
    }

    static update(req, res) {
        const roomId = req.params.id;
        const roomData = {
            room_number: req.body.room_number,
            type: req.body.type,
            price_per_month: parseFloat(req.body.price_per_month),
            status: req.body.status,
            description: req.body.description
        };

        Room.update(roomId, roomData, (err, room) => {
            if (err) {
                console.error('Error updating room:', err);
                return res.status(500).render('error', {
                    title: 'Error',
                    message: 'Failed to update room',
                    layout: false // Disable layout for error page
                });
            }
            res.redirect('/rooms');
        });
    }

    static delete(req, res) {
        const roomId = req.params.id;
        Room.delete(roomId, (err, changes) => {
            if (err) {
                console.error('Error deleting room:', err);
                return res.status(500).render('error', {
                    title: 'Error',
                    message: 'Failed to delete room'
                });
            }
            res.redirect('/rooms');
        });
    }

    static show(req, res) {
        const roomId = req.params.id;
        Room.getById(roomId, (err, room) => {
            if (err || !room) {
                return res.status(404).render('error', {
                    title: 'Not Found',
                    message: 'Room not found'
                });
            }
            res.render('rooms/show', {
                title: `Room ${room.room_number}`,
                room
            });
        });
    }
}

module.exports = RoomController;