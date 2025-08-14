// Simple test for authentication without database
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());

// Test login without database
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        console.log('Login attempt:', email);
        
        // Hardcoded admin for testing
        if (email === 'admin@hospital.com' && password === 'admin123') {
            const token = jwt.sign(
                { 
                    userId: 1,
                    email: 'admin@hospital.com',
                    role: 'admin'
                },
                'hospital_management_jwt_secret_key_2024',
                { expiresIn: '24h' }
            );

            res.json({
                message: 'Login successful',
                token,
                user: {
                    id: 1,
                    email: 'admin@hospital.com',
                    role: 'admin',
                    firstName: 'System',
                    lastName: 'Administrator'
                }
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Test server running' });
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Test server running on port ${PORT}`);
});
