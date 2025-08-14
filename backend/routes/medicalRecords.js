const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../database/connection');
const { verifyToken, checkRole } = require('../middleware/auth');

const router = express.Router();

// Create medical record (Doctor only)
router.post('/', verifyToken, checkRole('doctor'), [
    body('appointmentId').isInt(),
    body('patientId').isInt(),
    body('diagnosis').optional().trim(),
    body('treatment').optional().trim(),
    body('medications').optional().trim(),
    body('labResults').optional().trim(),
    body('doctorNotes').optional().trim()
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
            appointmentId,
            patientId,
            diagnosis,
            treatment,
            medications,
            labResults,
            doctorNotes
        } = req.body;

        // Get doctor ID
        const doctorResult = await pool.query(
            'SELECT id FROM doctors WHERE user_id = $1',
            [req.user.id]
        );

        if (doctorResult.rows.length === 0) {
            return res.status(403).json({ message: 'Doctor profile not found' });
        }

        const doctorId = doctorResult.rows[0].id;

        const result = await pool.query(`
            INSERT INTO medical_records (appointment_id, patient_id, doctor_id, diagnosis, treatment, medications, lab_results, doctor_notes)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `, [appointmentId, patientId, doctorId, diagnosis, treatment, medications, labResults, doctorNotes]);

        // Update appointment status to completed
        await pool.query(
            'UPDATE appointments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            ['completed', appointmentId]
        );

        res.status(201).json({
            message: 'Medical record created successfully',
            medicalRecord: result.rows[0]
        });

    } catch (error) {
        console.error('Create medical record error:', error);
        res.status(500).json({ message: 'Server error while creating medical record' });
    }
});

module.exports = router;
