const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const pool = require('../database/connection');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Login
router.post('/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { email, password } = req.body;

        // Auto-create admin user if it doesn't exist and we're trying to login as admin
        if (email === 'admin@hospital.com') {
            const adminCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
            if (adminCheck.rows.length === 0) {
                const hashedPassword = await bcrypt.hash('admin123', 12);
                await pool.query(`
                    INSERT INTO users (email, username, password, role, first_name, last_name, phone, is_active)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                `, ['admin@hospital.com', 'admin', hashedPassword, 'admin', 'System', 'Administrator', '+1234567890', true]);
                console.log('✅ Admin user created automatically');
            }
        }

        // Find user
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1 AND is_active = true',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = result.rows[0];
        console.log(`🔐 Login attempt for: ${email}, Role: ${user.role}`);

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        console.log(`🔑 Password validation: ${isPasswordValid ? 'SUCCESS' : 'FAILED'}`);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT
        const token = jwt.sign(
            { 
                userId: user.id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        // Get additional user info based on role
        let additionalInfo = {};
        if (user.role === 'doctor') {
            const doctorResult = await pool.query(
                'SELECT * FROM doctors WHERE user_id = $1',
                [user.id]
            );
            additionalInfo.doctor = doctorResult.rows[0];
        } else if (user.role === 'patient') {
            const patientResult = await pool.query(
                'SELECT * FROM patients WHERE user_id = $1',
                [user.id]
            );
            additionalInfo.patient = patientResult.rows[0];
        }

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                role: user.role,
                firstName: user.first_name,
                lastName: user.last_name,
                phone: user.phone,
                ...additionalInfo
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Register (Admin only)
router.post('/register', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('role').isIn(['admin', 'receptionist', 'doctor', 'patient']),
    body('firstName').notEmpty().trim(),
    body('lastName').notEmpty().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const {
            email,
            username,
            password,
            role,
            firstName,
            lastName,
            phone,
            address,
            idCardNumber
        } = req.body;

        // Check if email exists
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Insert user
        const userResult = await pool.query(`
            INSERT INTO users (email, username, password, role, first_name, last_name, phone, address, id_card_number)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id, email, username, role, first_name, last_name, created_at
        `, [email, username, hashedPassword, role, firstName, lastName, phone, address, idCardNumber]);

        const newUser = userResult.rows[0];

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: newUser.id,
                email: newUser.email,
                username: newUser.username,
                role: newUser.role,
                firstName: newUser.first_name,
                lastName: newUser.last_name,
                createdAt: newUser.created_at
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// Change password
router.put('/change-password', verifyToken, [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 6 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        // Get current password
        const result = await pool.query(
            'SELECT password FROM users WHERE id = $1',
            [userId]
        );

        const user = result.rows[0];

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 12);

        // Update password
        await pool.query(
            'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [hashedNewPassword, userId]
        );

        res.json({ message: 'Password changed successfully' });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'Server error while changing password' });
    }
});

// Get current user profile
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await pool.query(`
            SELECT id, email, username, role, first_name, last_name, phone, address, id_card_number, created_at
            FROM users WHERE id = $1
        `, [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = result.rows[0];

        // Get additional info based on role
        let additionalInfo = {};
        if (user.role === 'doctor') {
            const doctorResult = await pool.query(
                'SELECT * FROM doctors WHERE user_id = $1',
                [userId]
            );
            additionalInfo.doctor = doctorResult.rows[0];
        } else if (user.role === 'patient') {
            const patientResult = await pool.query(
                'SELECT * FROM patients WHERE user_id = $1',
                [userId]
            );
            additionalInfo.patient = patientResult.rows[0];
        }

        res.json({
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                role: user.role,
                firstName: user.first_name,
                lastName: user.last_name,
                phone: user.phone,
                address: user.address,
                idCardNumber: user.id_card_number,
                createdAt: user.created_at,
                ...additionalInfo
            }
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Server error while fetching profile' });
    }
});

module.exports = router;
