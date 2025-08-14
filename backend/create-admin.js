// Create admin user directly
const bcrypt = require('bcryptjs');

async function createTestUsers() {
    // Generate proper bcrypt hash for 'admin123'
    const adminPassword = await bcrypt.hash('admin123', 12);
    const receptionistPassword = await bcrypt.hash('receptionist123', 12);
    
    console.log('=== GENERATED PASSWORD HASHES ===');
    console.log('Admin password hash (for admin123):', adminPassword);
    console.log('Receptionist password hash (for receptionist123):', receptionistPassword);
    
    console.log('\n=== LOGIN CREDENTIALS ===');
    console.log('Admin: admin@hospital.com / admin123');
    console.log('Receptionist: receptionist@hospital.com / receptionist123');
    
    // Test verification
    const adminTest = await bcrypt.compare('admin123', adminPassword);
    const receptionistTest = await bcrypt.compare('receptionist123', receptionistPassword);
    
    console.log('\n=== VERIFICATION TESTS ===');
    console.log('Admin hash valid:', adminTest);
    console.log('Receptionist hash valid:', receptionistTest);
}

createTestUsers().catch(console.error);
