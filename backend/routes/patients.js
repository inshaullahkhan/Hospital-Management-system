const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const pool = require('../database/connection');
const { verifyToken, checkRole, checkResourceAccess } = require('../middleware/auth');

const router = express.Router();

// Get all patients (Admin/Receptionist only)
router.get('/', verifyToken, checkRole('admin', 'receptionist'), async (req, res) => {
    try {
        const { search, page = 1, limit = 10 } = req.query;
        
        let query = `
            SELECT 
                p.id,
                u.first_name,
                u.last_name,
                u.email,
                u.phone,
                u.address,
                u.id_card_number,
                p.date_of_birth,
                p.gender,
                p.emergency_contact_name,
                p.emergency_contact_phone,
                u.created_at,
                u.is_active
            FROM patients p
            JOIN users u ON p.user_id = u.id
            WHERE 1=1
        `;
        const queryParams = [];
        let paramIndex = 1;

        if (search) {
            query += ` AND (u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex} OR u.id_card_number ILIKE $${paramIndex})`;
            queryParams.push(`%${search}%`);
            paramIndex++;
        }

        query += ` ORDER BY u.created_at DESC`;

        // Add pagination
        const offset = (page - 1) * limit;
        query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        queryParams.push(limit, offset);

        const result = await pool.query(query, queryParams);

        // Get total count
        let countQuery = 'SELECT COUNT(*) FROM patients p JOIN users u ON p.user_id = u.id WHERE 1=1';
        const countParams = [];
        
        if (search) {
            countQuery += ' AND (u.first_name ILIKE $1 OR u.last_name ILIKE $1 OR u.email ILIKE $1 OR u.id_card_number ILIKE $1)';
            countParams.push(`%${search}%`);
        }

        const countResult = await pool.query(countQuery, countParams);
        const totalPatients = parseInt(countResult.rows[0].count);

        res.json({
            patients: result.rows,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalPatients / limit),
                totalPatients,
                limit: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Get patients error:', error);
        res.status(500).json({ message: 'Server error while fetching patients' });
    }
});

// Create new patient
router.post('/', verifyToken, checkRole('admin', 'receptionist'), [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('firstName').notEmpty().trim(),
    body('lastName').notEmpty().trim(),
    body('phone').notEmpty().trim(),
    body('idCardNumber').notEmpty().trim(),
    body('dateOfBirth').optional().isISO8601().toDate(),
    body('gender').optional().isIn(['male', 'female', 'other'])
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
            dateOfBirth,
            gender,
            emergencyContactName,
            emergencyContactPhone,
            medicalHistory,
            allergies
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
            VALUES ($1, $2, $3, 'patient', $4, $5, $6, $7, $8)
            RETURNING id
        `, [email, username, hashedPassword, firstName, lastName, phone, address, idCardNumber]);

        const userId = userResult.rows[0].id;

        // Create patient record
        const patientResult = await client.query(`
            INSERT INTO patients (user_id, date_of_birth, gender, emergency_contact_name, emergency_contact_phone, medical_history, allergies)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id
        `, [userId, dateOfBirth, gender, emergencyContactName, emergencyContactPhone, medicalHistory, allergies]);

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Patient created successfully',
            patient: {
                id: patientResult.rows[0].id,
                userId,
                firstName,
                lastName,
                email,
                phone,
                idCardNumber
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Create patient error:', error);
        res.status(500).json({ message: 'Server error while creating patient' });
    } finally {
        client.release();
    }
});

// Get patient by ID
router.get('/:id', verifyToken, checkResourceAccess('patient'), async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            SELECT 
                p.*,
                u.first_name,
                u.last_name,
                u.email,
                u.phone,
                u.address,
                u.id_card_number,
                u.is_active,
                u.created_at
            FROM patients p
            JOIN users u ON p.user_id = u.id
            WHERE p.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        // Get patient's recent appointments
        const appointmentsResult = await pool.query(`
            SELECT 
                a.*,
                d.specialization,
                du.first_name as doctor_first_name,
                du.last_name as doctor_last_name
            FROM appointments a
            JOIN doctors d ON a.doctor_id = d.id
            JOIN users du ON d.user_id = du.id
            WHERE a.patient_id = $1
            ORDER BY a.appointment_date DESC, a.appointment_time DESC
            LIMIT 10
        `, [id]);

        res.json({
            patient: {
                ...result.rows[0],
                recentAppointments: appointmentsResult.rows
            }
        });

    } catch (error) {
        console.error('Get patient error:', error);
        res.status(500).json({ message: 'Server error while fetching patient' });
    }
});

// Update patient
router.put('/:id', verifyToken, checkResourceAccess('patient'), [
    body('firstName').optional().notEmpty().trim(),
    body('lastName').optional().notEmpty().trim(),
    body('phone').optional().trim(),
    body('address').optional().trim(),
    body('dateOfBirth').optional().isISO8601().toDate(),
    body('gender').optional().isIn(['male', 'female', 'other'])
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

        const { id } = req.params;
        const {
            firstName,
            lastName,
            phone,
            address,
            dateOfBirth,
            gender,
            emergencyContactName,
            emergencyContactPhone,
            medicalHistory,
            allergies
        } = req.body;

        await client.query('BEGIN');

        // Update user info
        await client.query(`
            UPDATE users 
            SET first_name = COALESCE($1, first_name),
                last_name = COALESCE($2, last_name),
                phone = COALESCE($3, phone),
                address = COALESCE($4, address),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = (SELECT user_id FROM patients WHERE id = $5)
        `, [firstName, lastName, phone, address, id]);

        // Update patient-specific info
        const patientResult = await client.query(`
            UPDATE patients 
            SET date_of_birth = COALESCE($1, date_of_birth),
                gender = COALESCE($2, gender),
                emergency_contact_name = COALESCE($3, emergency_contact_name),
                emergency_contact_phone = COALESCE($4, emergency_contact_phone),
                medical_history = COALESCE($5, medical_history),
                allergies = COALESCE($6, allergies),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $7
            RETURNING *
        `, [dateOfBirth, gender, emergencyContactName, emergencyContactPhone, medicalHistory, allergies, id]);

        if (patientResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Patient not found' });
        }

        await client.query('COMMIT');

        res.json({
            message: 'Patient updated successfully',
            patient: patientResult.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Update patient error:', error);
        res.status(500).json({ message: 'Server error while updating patient' });
    } finally {
        client.release();
    }
});

// Get patient's appointments
router.get('/:id/appointments', verifyToken, checkResourceAccess('patient'), async (req, res) => {
    try {
        const { id } = req.params;
        const { status, startDate, endDate } = req.query;

        let query = `
            SELECT 
                a.*,
                d.specialization,
                du.first_name as doctor_first_name,
                du.last_name as doctor_last_name,
                du.phone as doctor_phone
            FROM appointments a
            JOIN doctors d ON a.doctor_id = d.id
            JOIN users du ON d.user_id = du.id
            WHERE a.patient_id = $1
        `;
        const queryParams = [id];
        let paramIndex = 2;

        if (status) {
            query += ` AND a.status = $${paramIndex}`;
            queryParams.push(status);
            paramIndex++;
        }

        if (startDate) {
            query += ` AND a.appointment_date >= $${paramIndex}`;
            queryParams.push(startDate);
            paramIndex++;
        }

        if (endDate) {
            query += ` AND a.appointment_date <= $${paramIndex}`;
            queryParams.push(endDate);
            paramIndex++;
        }

        query += ` ORDER BY a.appointment_date DESC, a.appointment_time DESC`;

        const result = await pool.query(query, queryParams);

        res.json({ appointments: result.rows });

    } catch (error) {
        console.error('Get patient appointments error:', error);
        res.status(500).json({ message: 'Server error while fetching appointments' });
    }
});

// Get patient's medical records
router.get('/:id/medical-records', verifyToken, checkResourceAccess('patient'), async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            SELECT 
                mr.*,
                a.appointment_date,
                a.appointment_time,
                d.specialization,
                du.first_name as doctor_first_name,
                du.last_name as doctor_last_name
            FROM medical_records mr
            JOIN appointments a ON mr.appointment_id = a.id
            JOIN doctors d ON mr.doctor_id = d.id
            JOIN users du ON d.user_id = du.id
            WHERE mr.patient_id = $1
            ORDER BY a.appointment_date DESC, a.appointment_time DESC
        `, [id]);

        res.json({ medicalRecords: result.rows });

    } catch (error) {
        console.error('Get patient medical records error:', error);
        res.status(500).json({ message: 'Server error while fetching medical records' });
    }
});

module.exports = router;
