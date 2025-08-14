const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../database/connection');
const { verifyToken, checkRole } = require('../middleware/auth');

const router = express.Router();

// Get all users (Admin only)
router.get('/', verifyToken, checkRole('admin'), async (req, res) => {
    try {
        const { role, search, page = 1, limit = 10 } = req.query;
        
        let query = `
            SELECT id, email, username, role, first_name, last_name, phone, address, 
                   id_card_number, is_active, created_at, updated_at
            FROM users
            WHERE 1=1
        `;
        const queryParams = [];
        let paramIndex = 1;

        if (role) {
            query += ` AND role = $${paramIndex}`;
            queryParams.push(role);
            paramIndex++;
        }

        if (search) {
            query += ` AND (first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
            queryParams.push(`%${search}%`);
            paramIndex++;
        }

        query += ` ORDER BY created_at DESC`;

        // Add pagination
        const offset = (page - 1) * limit;
        query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        queryParams.push(limit, offset);

        const result = await pool.query(query, queryParams);

        // Get total count
        let countQuery = 'SELECT COUNT(*) FROM users WHERE 1=1';
        const countParams = [];
        let countParamIndex = 1;

        if (role) {
            countQuery += ` AND role = $${countParamIndex}`;
            countParams.push(role);
            countParamIndex++;
        }

        if (search) {
            countQuery += ` AND (first_name ILIKE $${countParamIndex} OR last_name ILIKE $${countParamIndex} OR email ILIKE $${countParamIndex})`;
            countParams.push(`%${search}%`);
        }

        const countResult = await pool.query(countQuery, countParams);
        const totalUsers = parseInt(countResult.rows[0].count);

        res.json({
            users: result.rows,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalUsers / limit),
                totalUsers,
                limit: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: 'Server error while fetching users' });
    }
});

// Get user by ID
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Check permissions
        if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const result = await pool.query(`
            SELECT id, email, username, role, first_name, last_name, phone, address, 
                   id_card_number, is_active, created_at, updated_at
            FROM users WHERE id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = result.rows[0];

        // Get additional info based on role
        let additionalInfo = {};
        if (user.role === 'doctor') {
            const doctorResult = await pool.query(
                'SELECT * FROM doctors WHERE user_id = $1',
                [id]
            );
            additionalInfo.doctor = doctorResult.rows[0];
        } else if (user.role === 'patient') {
            const patientResult = await pool.query(
                'SELECT * FROM patients WHERE user_id = $1',
                [id]
            );
            additionalInfo.patient = patientResult.rows[0];
        }

        res.json({
            user: { ...user, ...additionalInfo }
        });

    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Server error while fetching user' });
    }
});

// Update user
router.put('/:id', verifyToken, [
    body('firstName').optional().notEmpty().trim(),
    body('lastName').optional().notEmpty().trim(),
    body('phone').optional().trim(),
    body('address').optional().trim(),
    body('idCardNumber').optional().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { id } = req.params;
        const { firstName, lastName, phone, address, idCardNumber } = req.body;

        // Check permissions
        if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const result = await pool.query(`
            UPDATE users 
            SET first_name = COALESCE($1, first_name),
                last_name = COALESCE($2, last_name),
                phone = COALESCE($3, phone),
                address = COALESCE($4, address),
                id_card_number = COALESCE($5, id_card_number),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $6
            RETURNING id, email, username, role, first_name, last_name, phone, address, id_card_number, updated_at
        `, [firstName, lastName, phone, address, idCardNumber, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            message: 'User updated successfully',
            user: result.rows[0]
        });

    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ message: 'Server error while updating user' });
    }
});

// Toggle user status (Admin only)
router.patch('/:id/toggle-status', verifyToken, checkRole('admin'), async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            UPDATE users 
            SET is_active = NOT is_active,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING id, email, first_name, last_name, is_active
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = result.rows[0];
        res.json({
            message: `User ${user.is_active ? 'activated' : 'deactivated'} successfully`,
            user
        });

    } catch (error) {
        console.error('Toggle user status error:', error);
        res.status(500).json({ message: 'Server error while updating user status' });
    }
});

// Delete user (Admin only)
router.delete('/:id', verifyToken, checkRole('admin'), async (req, res) => {
    try {
        const { id } = req.params;

        // Check if user exists
        const userResult = await pool.query(
            'SELECT id, first_name, last_name FROM users WHERE id = $1',
            [id]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Delete user (cascading will handle related records)
        await pool.query('DELETE FROM users WHERE id = $1', [id]);

        res.json({
            message: 'User deleted successfully',
            deletedUser: userResult.rows[0]
        });

    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Server error while deleting user' });
    }
});

module.exports = router;
