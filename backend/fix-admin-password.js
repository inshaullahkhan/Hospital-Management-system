const bcrypt = require('bcryptjs');
const pool = require('./database/connection');

async function fixAdminPassword() {
    try {
        // Hash the password 'admin123'
        const hashedPassword = await bcrypt.hash('admin123', 12);
        console.log('Generated password hash:', hashedPassword);
        
        // Check if admin user exists
        const existingAdmin = await pool.query(
            'SELECT id, email FROM users WHERE email = $1',
            ['admin@hospital.com']
        );
        
        if (existingAdmin.rows.length > 0) {
            // Update existing admin password
            await pool.query(
                'UPDATE users SET password = $1 WHERE email = $2',
                [hashedPassword, 'admin@hospital.com']
            );
            console.log('✅ Admin password updated successfully');
        } else {
            // Create admin user
            await pool.query(`
                INSERT INTO users (email, username, password, role, first_name, last_name, phone) 
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, ['admin@hospital.com', 'admin', hashedPassword, 'admin', 'System', 'Administrator', '+1234567890']);
            console.log('✅ Admin user created successfully');
        }
        
        // Test the password
        const user = await pool.query('SELECT * FROM users WHERE email = $1', ['admin@hospital.com']);
        const isPasswordValid = await bcrypt.compare('admin123', user.rows[0].password);
        console.log('✅ Password verification:', isPasswordValid ? 'SUCCESS' : 'FAILED');
        
        console.log('\n📋 Admin Login Credentials:');
        console.log('Email: admin@hospital.com');
        console.log('Password: admin123');
        
    } catch (error) {
        console.error('❌ Error fixing admin password:', error);
    } finally {
        process.exit(0);
    }
}

fixAdminPassword();
