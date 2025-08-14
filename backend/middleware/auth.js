const jwt = require('jsonwebtoken');
const pool = require('../database/connection');

// Verify JWT token
const verifyToken = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from database
        const result = await pool.query(
            'SELECT id, email, username, role, first_name, last_name, is_active FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid token. User not found.' });
        }

        const user = result.rows[0];
        
        if (!user.is_active) {
            return res.status(401).json({ message: 'Account is deactivated.' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(401).json({ message: 'Invalid token.' });
    }
};

// Check user role
const checkRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Access denied. Please login.' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: 'Access denied. Insufficient permissions.',
                requiredRoles: allowedRoles,
                userRole: req.user.role
            });
        }

        next();
    };
};

// Check if user can access specific resource
const checkResourceAccess = (resourceType) => {
    return async (req, res, next) => {
        try {
            const { user } = req;
            const resourceId = req.params.id;

            // Admin can access everything
            if (user.role === 'admin') {
                return next();
            }

            // Doctor can only access their own data and their patients
            if (user.role === 'doctor' && resourceType === 'patient') {
                const result = await pool.query(`
                    SELECT a.id FROM appointments a
                    JOIN doctors d ON a.doctor_id = d.id
                    WHERE d.user_id = $1 AND a.patient_id = $2
                `, [user.id, resourceId]);

                if (result.rows.length === 0) {
                    return res.status(403).json({ message: 'Access denied to this patient.' });
                }
            }

            // Patient can only access their own data
            if (user.role === 'patient' && resourceType === 'patient') {
                const result = await pool.query(
                    'SELECT id FROM patients WHERE user_id = $1 AND id = $2',
                    [user.id, resourceId]
                );

                if (result.rows.length === 0) {
                    return res.status(403).json({ message: 'Access denied to this resource.' });
                }
            }

            next();
        } catch (error) {
            console.error('Resource access check error:', error);
            res.status(500).json({ message: 'Server error while checking access.' });
        }
    };
};

module.exports = {
    verifyToken,
    checkRole,
    checkResourceAccess
};
