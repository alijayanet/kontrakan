const bcrypt = require('bcryptjs');
const db = require('../config/database');

class AuthController {
    // Show login form
    static loginForm(req, res) {
        if (req.session.user) {
            return res.redirect('/');
        }
        res.render('auth/login', {
            title: 'Login Admin',
            error: req.query.error,
            layout: false // Disable layout for login page
        });
    }

    // Process login
    static async login(req, res) {
        const { username, password } = req.body;

        try {
            // Get admin user from database
            db.get('SELECT * FROM admin_users WHERE username = ?', [username], async (err, user) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.redirect('/login?error=Terjadi kesalahan sistem');
                }

                if (!user) {
                    return res.redirect('/login?error=Username atau password salah');
                }

                // Check password
                const isValid = await bcrypt.compare(password, user.password);
                if (!isValid) {
                    return res.redirect('/login?error=Username atau password salah');
                }

                // Set session
                req.session.user = {
                    id: user.id,
                    username: user.username,
                    name: user.name
                };

                res.redirect('/');
            });
        } catch (error) {
            console.error('Login error:', error);
            res.redirect('/login?error=Terjadi kesalahan sistem');
        }
    }

    // Logout
    static logout(req, res) {
        req.session.destroy((err) => {
            if (err) {
                console.error('Logout error:', err);
            }
            res.redirect('/login');
        });
    }

    // Show profile form
    static profileForm(req, res) {
        const userId = req.session.user.id;
        db.get('SELECT id, username, name FROM admin_users WHERE id = ?', [userId], (err, user) => {
            if (err || !user) {
                return res.status(500).render('error', {
                    title: 'Error',
                    message: 'Gagal mengambil data profil'
                });
            }
            res.render('auth/profile', {
                title: 'Pengaturan Akun',
                user,
                success: req.query.success,
                error: req.query.error
            });
        });
    }

    // Update profile
    static async updateProfile(req, res) {
        const userId = req.session.user.id;
        const { username, name, current_password, new_password } = req.body;

        try {
            // Get current user to verify password
            db.get('SELECT * FROM admin_users WHERE id = ?', [userId], async (err, user) => {
                if (err || !user) {
                    return res.redirect('/profile?error=User tidak ditemukan');
                }

                // Verify current password
                const isValid = await bcrypt.compare(current_password, user.password);
                if (!isValid) {
                    return res.redirect('/profile?error=Password saat ini salah');
                }

                let updateSql = 'UPDATE admin_users SET username = ?, name = ?, created_at = CURRENT_TIMESTAMP';
                let params = [username, name];

                if (new_password && new_password.trim() !== '') {
                    const hashedNewPassword = await bcrypt.hash(new_password, 10);
                    updateSql += ', password = ?';
                    params.push(hashedNewPassword);
                }

                updateSql += ' WHERE id = ?';
                params.push(userId);

                db.run(updateSql, params, (err) => {
                    if (err) {
                        console.error('Update profile error:', err);
                        return res.redirect('/profile?error=Gagal memperbarui profil (Username mungkin sudah digunakan)');
                    }

                    // Update session
                    req.session.user.username = username;
                    req.session.user.name = name;

                    res.redirect('/profile?success=Profil berhasil diperbarui');
                });
            });
        } catch (error) {
            console.error('Update profile error:', error);
            res.redirect('/profile?error=Terjadi kesalahan sistem');
        }
    }

    // Middleware to check if user is authenticated
    static requireAuth(req, res, next) {
        if (req.session.user) {
            next();
        } else {
            res.redirect('/login');
        }
    }

    // Initialize default admin user
    static async initializeAdmin() {
        const defaultUsername = process.env.ADMIN_USERNAME || 'admin';
        const defaultPassword = process.env.ADMIN_PASSWORD || 'admin123';
        const defaultName = 'Administrator';

        try {
            // Check if admin already exists
            db.get('SELECT id FROM admin_users WHERE username = ?', [defaultUsername], async (err, row) => {
                if (err) {
                    console.error('Error checking admin user:', err);
                    return;
                }

                if (!row) {
                    // Hash password
                    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

                    // Insert default admin
                    db.run(
                        'INSERT INTO admin_users (username, password, name) VALUES (?, ?, ?)',
                        [defaultUsername, hashedPassword, defaultName],
                        (err) => {
                            if (err) {
                                console.error('Error creating default admin:', err);
                            } else {
                                console.log('Default admin user created successfully');
                                console.log(`Username: ${defaultUsername}`);
                                console.log(`Password: ${defaultPassword}`);
                            }
                        }
                    );
                }
            });
        } catch (error) {
            console.error('Error initializing admin:', error);
        }
    }
}

module.exports = AuthController;