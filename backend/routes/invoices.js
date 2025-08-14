const express = require('express');
const pool = require('../database/connection');
const { verifyToken, checkRole } = require('../middleware/auth');

const router = express.Router();

// Get all invoices
router.get('/', verifyToken, async (req, res) => {
    try {
        const { patientId, status, page = 1, limit = 20 } = req.query;
        const userRole = req.user.role;
        
        let query = `
            SELECT 
                i.*,
                p.id as patient_id,
                pu.first_name as patient_first_name,
                pu.last_name as patient_last_name,
                a.appointment_date,
                a.appointment_time
            FROM invoices i
            JOIN patients p ON i.patient_id = p.id
            JOIN users pu ON p.user_id = pu.id
            JOIN appointments a ON i.appointment_id = a.id
            WHERE 1=1
        `;
        const queryParams = [];
        let paramIndex = 1;

        // Role-based filtering
        if (userRole === 'patient') {
            const patientResult = await pool.query(
                'SELECT id FROM patients WHERE user_id = $1',
                [req.user.id]
            );
            if (patientResult.rows.length > 0) {
                query += ` AND i.patient_id = $${paramIndex}`;
                queryParams.push(patientResult.rows[0].id);
                paramIndex++;
            }
        }

        if (patientId && userRole !== 'patient') {
            query += ` AND i.patient_id = $${paramIndex}`;
            queryParams.push(patientId);
            paramIndex++;
        }

        if (status) {
            query += ` AND i.payment_status = $${paramIndex}`;
            queryParams.push(status);
            paramIndex++;
        }

        query += ` ORDER BY i.created_at DESC`;

        // Add pagination
        const offset = (page - 1) * limit;
        query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        queryParams.push(limit, offset);

        const result = await pool.query(query, queryParams);

        res.json({ invoices: result.rows });

    } catch (error) {
        console.error('Get invoices error:', error);
        res.status(500).json({ message: 'Server error while fetching invoices' });
    }
});

// Get invoice by ID
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            SELECT 
                i.*,
                p.id as patient_id,
                pu.first_name as patient_first_name,
                pu.last_name as patient_last_name,
                pu.phone as patient_phone,
                pu.address as patient_address,
                pu.id_card_number as patient_id_card,
                a.appointment_date,
                a.appointment_time,
                d.specialization,
                du.first_name as doctor_first_name,
                du.last_name as doctor_last_name
            FROM invoices i
            JOIN patients p ON i.patient_id = p.id
            JOIN users pu ON p.user_id = pu.id
            JOIN appointments a ON i.appointment_id = a.id
            JOIN doctors d ON a.doctor_id = d.id
            JOIN users du ON d.user_id = du.id
            WHERE i.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        res.json({ invoice: result.rows[0] });

    } catch (error) {
        console.error('Get invoice error:', error);
        res.status(500).json({ message: 'Server error while fetching invoice' });
    }
});

module.exports = router;
