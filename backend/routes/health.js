const express = require('express');
const router = express.Router();

// Simple health check that doesn't require database
router.get('/', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Hospital Management API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

module.exports = router;
