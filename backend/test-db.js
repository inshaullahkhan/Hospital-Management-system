const pool = require('./database/connection');
const bcrypt = require('bcryptjs');

async function testDatabase() {
    try {
        console.log('🔌 Testing database connection...');
        
        // Test basic connection
        const testQuery = await pool.query('SELECT NOW()');
        console.log('✅ Database connected successfully');
        console.log('📅 Current time:', testQuery.rows[0].now);
        
        // Test if users table exists
        const tableCheck = await pool.query(`
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'users'
        `);
        
        if (tableCheck.rows.length === 0) {
            console.log('❌ Users table does not exist');
            console.log('💡 You need to run the schema.sql file to create tables');
            return;
        }
        
        console.log('✅ Users table exists');
        
        // Check for admin user
        const adminCheck = await pool.query('SELECT * FROM users WHERE email = $1', ['admin@hospital.com']);
        
        if (adminCheck.rows.length === 0) {
            console.log('⚠️ Admin user does not exist, creating...');
            
            const hashedPassword = await bcrypt.hash('admin123', 12);
            await pool.query(`
                INSERT INTO users (email, username, password, role, first_name, last_name, phone, is_active)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, ['admin@hospital.com', 'admin', hashedPassword, 'admin', 'System', 'Administrator', '+1234567890', true]);
            
            console.log('✅ Admin user created successfully');
        } else {
            console.log('✅ Admin user exists');
            const admin = adminCheck.rows[0];
            console.log(`📧 Email: ${admin.email}`);
            console.log(`👤 Role: ${admin.role}`);
            console.log(`🔐 Active: ${admin.is_active}`);
            
            // Test password
            const passwordTest = await bcrypt.compare('admin123', admin.password);
            console.log(`🔑 Password 'admin123' valid: ${passwordTest}`);
        }
        
        console.log('\n🎯 LOGIN CREDENTIALS:');
        console.log('Email: admin@hospital.com');
        console.log('Password: admin123');
        
    } catch (error) {
        console.error('❌ Database test failed:', error);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('💡 Make sure PostgreSQL is running and accessible');
        } else if (error.code === '3D000') {
            console.log('💡 Database "hospital_management" does not exist');
        } else if (error.code === '28P01') {
            console.log('💡 Check database credentials in .env file');
        }
    }
}

testDatabase();
