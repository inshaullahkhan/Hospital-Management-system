const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../database/connection');
const { verifyToken, checkRole } = require('../middleware/auth');

const router = express.Router();

// Get all appointments
router.get('/', verifyToken, async (req, res) => {
    try {
        const { date, doctorId, patientId, status, page = 1, limit = 20 } = req.query;
        const userRole = req.user.role;
        
        let query = `
            SELECT 
                a.*,
                p.id as patient_id,
                pu.first_name as patient_first_name,
                pu.last_name as patient_last_name,
                pu.phone as patient_phone,
                pu.id_card_number as patient_id_card,
                d.id as doctor_id,
                d.specialization,
                du.first_name as doctor_first_name,
                du.last_name as doctor_last_name
            FROM appointments a
            JOIN patients p ON a.patient_id = p.id
            JOIN users pu ON p.user_id = pu.id
            JOIN doctors d ON a.doctor_id = d.id
            JOIN users du ON d.user_id = du.id
            WHERE 1=1
        `;
        const queryParams = [];
        let paramIndex = 1;

        // Role-based filtering
        if (userRole === 'doctor') {
            const doctorResult = await pool.query(
                'SELECT id FROM doctors WHERE user_id = $1',
                [req.user.id]
            );
            if (doctorResult.rows.length > 0) {
                query += ` AND a.doctor_id = $${paramIndex}`;
                queryParams.push(doctorResult.rows[0].id);
                paramIndex++;
            }
        } else if (userRole === 'patient') {
            const patientResult = await pool.query(
                'SELECT id FROM patients WHERE user_id = $1',
                [req.user.id]
            );
            if (patientResult.rows.length > 0) {
                query += ` AND a.patient_id = $${paramIndex}`;
                queryParams.push(patientResult.rows[0].id);
                paramIndex++;
            }
        }

        // Additional filters
        if (date) {
            query += ` AND a.appointment_date = $${paramIndex}`;
            queryParams.push(date);
            paramIndex++;
        }

        if (doctorId && userRole !== 'doctor') {
            query += ` AND a.doctor_id = $${paramIndex}`;
            queryParams.push(doctorId);
            paramIndex++;
        }

        if (patientId && userRole !== 'patient') {
            query += ` AND a.patient_id = $${paramIndex}`;
            queryParams.push(patientId);
            paramIndex++;
        }

        if (status) {
            query += ` AND a.status = $${paramIndex}`;
            queryParams.push(status);
            paramIndex++;
        }

        query += ` ORDER BY a.appointment_date DESC, a.appointment_time DESC`;

        // Add pagination
        const offset = (page - 1) * limit;
        query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        queryParams.push(limit, offset);

        const result = await pool.query(query, queryParams);

        res.json({ appointments: result.rows });

    } catch (error) {
        console.error('Get appointments error:', error);
        res.status(500).json({ message: 'Server error while fetching appointments' });
    }
});

// Create new appointment
router.post('/', verifyToken, checkRole('admin', 'receptionist'), [
    body('patientId').isInt(),
    body('doctorId').isInt(),
    body('appointmentDate').isISO8601().toDate(),
    body('appointmentTime').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('consultationFee').isNumeric()
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
            patientId,
            doctorId,
            appointmentDate,
            appointmentTime,
            consultationFee,
            notes
        } = req.body;

        // Check if doctor is available
        const conflictResult = await pool.query(`
            SELECT id FROM appointments 
            WHERE doctor_id = $1 AND appointment_date = $2 AND appointment_time = $3 AND status != 'cancelled'
        `, [doctorId, appointmentDate, appointmentTime]);

        if (conflictResult.rows.length > 0) {
            return res.status(400).json({ 
                message: 'Doctor is not available at this time slot' 
            });
        }

        // Check for doctor holidays
        const holidayResult = await pool.query(
            'SELECT id FROM doctor_holidays WHERE doctor_id = $1 AND holiday_date = $2',
            [doctorId, appointmentDate]
        );

        if (holidayResult.rows.length > 0) {
            return res.status(400).json({ 
                message: 'Doctor is on holiday on this date' 
            });
        }

        const result = await pool.query(`
            INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, consultation_fee, notes, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `, [patientId, doctorId, appointmentDate, appointmentTime, consultationFee, notes, req.user.id]);

        // Generate invoice
        const invoiceNumber = `INV-${Date.now()}-${result.rows[0].id}`;
        await pool.query(`
            INSERT INTO invoices (appointment_id, patient_id, invoice_number, consultation_fee, total_amount)
            VALUES ($1, $2, $3, $4, $4)
        `, [result.rows[0].id, patientId, invoiceNumber, consultationFee]);

        res.status(201).json({
            message: 'Appointment created successfully',
            appointment: result.rows[0]
        });

    } catch (error) {
        console.error('Create appointment error:', error);
        res.status(500).json({ message: 'Server error while creating appointment' });
    }
});

// Update appointment
router.put('/:id', verifyToken, checkRole('admin', 'receptionist', 'doctor'), [
    body('appointmentDate').optional().isISO8601().toDate(),
    body('appointmentTime').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('status').optional().isIn(['scheduled', 'completed', 'cancelled', 'no_show'])
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
        const { appointmentDate, appointmentTime, status, notes } = req.body;

        const result = await pool.query(`
            UPDATE appointments 
            SET appointment_date = COALESCE($1, appointment_date),
                appointment_time = COALESCE($2, appointment_time),
                status = COALESCE($3, status),
                notes = COALESCE($4, notes),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $5
            RETURNING *
        `, [appointmentDate, appointmentTime, status, notes, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        res.json({
            message: 'Appointment updated successfully',
            appointment: result.rows[0]
        });

    } catch (error) {
        console.error('Update appointment error:', error);
        res.status(500).json({ message: 'Server error while updating appointment' });
    }
});

module.exports = router;
