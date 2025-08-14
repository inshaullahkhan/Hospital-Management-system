const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const pool = require('../database/connection');
const { verifyToken, checkRole } = require('../middleware/auth');

const router = express.Router();

// Get all doctors
router.get('/', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                d.id,
                u.first_name,
                u.last_name,
                u.email,
                u.phone,
                d.specialization,
                d.working_hours_start,
                d.working_hours_end,
                d.consultation_fee,
                d.experience_summary,
                u.is_active
            FROM doctors d
            JOIN users u ON d.user_id = u.id
            WHERE u.is_active = true
            ORDER BY u.first_name, u.last_name
        `);

        res.json({ doctors: result.rows });

    } catch (error) {
        console.error('Get doctors error:', error);
        res.status(500).json({ message: 'Server error while fetching doctors' });
    }
});

// Create new doctor (Admin/Receptionist only)
router.post('/', verifyToken, checkRole('admin', 'receptionist'), [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('firstName').notEmpty().trim(),
    body('lastName').notEmpty().trim(),
    body('specialization').notEmpty().trim(),
    body('consultationFee').isNumeric(),
    body('workingHoursStart').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('workingHoursEnd').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
], async (req, res) => {
    const client = await pool.connect();
    
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
            firstName,
            lastName,
            phone,
            address,
            idCardNumber,
            specialization,
            consultationFee,
            workingHoursStart,
            workingHoursEnd,
            experienceSummary
        } = req.body;

        await client.query('BEGIN');

        // Check if email exists
        const existingUser = await client.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const userResult = await client.query(`
            INSERT INTO users (email, username, password, role, first_name, last_name, phone, address, id_card_number)
            VALUES ($1, $2, $3, 'doctor', $4, $5, $6, $7, $8)
            RETURNING id
        `, [email, username, hashedPassword, firstName, lastName, phone, address, idCardNumber]);

        const userId = userResult.rows[0].id;

        // Create doctor record
        const doctorResult = await client.query(`
            INSERT INTO doctors (user_id, specialization, working_hours_start, working_hours_end, consultation_fee, experience_summary)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
        `, [userId, specialization, workingHoursStart, workingHoursEnd, consultationFee, experienceSummary]);

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Doctor created successfully',
            doctor: {
                id: doctorResult.rows[0].id,
                userId,
                firstName,
                lastName,
                email,
                specialization,
                consultationFee
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Create doctor error:', error);
        res.status(500).json({ message: 'Server error while creating doctor' });
    } finally {
        client.release();
    }
});

// Get doctor by ID
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            SELECT 
                d.*,
                u.first_name,
                u.last_name,
                u.email,
                u.phone,
                u.address,
                u.id_card_number,
                u.is_active
            FROM doctors d
            JOIN users u ON d.user_id = u.id
            WHERE d.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        // Get doctor's holidays
        const holidaysResult = await pool.query(
            'SELECT * FROM doctor_holidays WHERE doctor_id = $1 ORDER BY holiday_date',
            [id]
        );

        res.json({
            doctor: {
                ...result.rows[0],
                holidays: holidaysResult.rows
            }
        });

    } catch (error) {
        console.error('Get doctor error:', error);
        res.status(500).json({ message: 'Server error while fetching doctor' });
    }
});

// Update doctor
router.put('/:id', verifyToken, checkRole('admin', 'receptionist'), [
    body('specialization').optional().notEmpty().trim(),
    body('consultationFee').optional().isNumeric(),
    body('workingHoursStart').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('workingHoursEnd').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('experienceSummary').optional().trim()
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
        const {
            specialization,
            consultationFee,
            workingHoursStart,
            workingHoursEnd,
            experienceSummary
        } = req.body;

        const result = await pool.query(`
            UPDATE doctors 
            SET specialization = COALESCE($1, specialization),
                consultation_fee = COALESCE($2, consultation_fee),
                working_hours_start = COALESCE($3, working_hours_start),
                working_hours_end = COALESCE($4, working_hours_end),
                experience_summary = COALESCE($5, experience_summary),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $6
            RETURNING *
        `, [specialization, consultationFee, workingHoursStart, workingHoursEnd, experienceSummary, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        res.json({
            message: 'Doctor updated successfully',
            doctor: result.rows[0]
        });

    } catch (error) {
        console.error('Update doctor error:', error);
        res.status(500).json({ message: 'Server error while updating doctor' });
    }
});

// Add doctor holiday
router.post('/:id/holidays', verifyToken, checkRole('admin', 'receptionist'), [
    body('holidayDate').isISO8601().toDate(),
    body('reason').optional().trim()
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
        const { holidayDate, reason } = req.body;

        const result = await pool.query(`
            INSERT INTO doctor_holidays (doctor_id, holiday_date, reason)
            VALUES ($1, $2, $3)
            RETURNING *
        `, [id, holidayDate, reason]);

        res.status(201).json({
            message: 'Holiday added successfully',
            holiday: result.rows[0]
        });

    } catch (error) {
        console.error('Add doctor holiday error:', error);
        res.status(500).json({ message: 'Server error while adding holiday' });
    }
});

// Delete doctor holiday
router.delete('/:id/holidays/:holidayId', verifyToken, checkRole('admin', 'receptionist'), async (req, res) => {
    try {
        const { id, holidayId } = req.params;

        const result = await pool.query(
            'DELETE FROM doctor_holidays WHERE id = $1 AND doctor_id = $2 RETURNING *',
            [holidayId, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Holiday not found' });
        }

        res.json({
            message: 'Holiday removed successfully',
            holiday: result.rows[0]
        });

    } catch (error) {
        console.error('Delete doctor holiday error:', error);
        res.status(500).json({ message: 'Server error while deleting holiday' });
    }
});

module.exports = router;
