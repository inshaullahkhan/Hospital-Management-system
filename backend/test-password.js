// Simple test to verify password hashing
const bcrypt = require('bcryptjs');

async function testPassword() {
    const password = 'admin123';
    const hash = await bcrypt.hash(password, 12);
    console.log('Password:', password);
    console.log('Generated hash:', hash);
    
    const isValid = await bcrypt.compare(password, hash);
    console.log('Verification:', isValid);
    
    // Test with the hash we're using in the database
    const dbHash = '$2a$12$LQv3c1yqBWVHxkd0LQ4YGOx/nw9M7j9ZL1G3jzY5R2KjmD6WQjxyu';
    const isDbValid = await bcrypt.compare(password, dbHash);
    console.log('DB hash verification:', isDbValid);
}

testPassword();
