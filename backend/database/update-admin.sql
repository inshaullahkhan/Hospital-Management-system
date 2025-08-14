-- Update admin user with correct password hash for 'admin123'
-- This hash was generated using bcrypt with 12 rounds

-- First, delete any existing admin user
DELETE FROM users WHERE email = 'admin@hospital.com';

-- Insert admin user with correct bcrypt hash for password 'admin123'
INSERT INTO users (email, username, password, role, first_name, last_name, phone, is_active) 
VALUES (
    'admin@hospital.com', 
    'admin', 
    '$2a$12$LQv3c1yqBWVHxkd0LQ4YGOx/nw9M7j9ZL1G3jzY5R2KjmD6WQjxyu', 
    'admin', 
    'System', 
    'Administrator', 
    '+1234567890',
    true
);

-- Also create a demo receptionist account
INSERT INTO users (email, username, password, role, first_name, last_name, phone, is_active) 
VALUES (
    'receptionist@hospital.com', 
    'receptionist', 
    '$2a$12$LQv3c1yqBWVHxkd0LQ4YGOx/nw9M7j9ZL1G3jzY5R2KjmD6WQjxyu', 
    'receptionist', 
    'Jane', 
    'Smith', 
    '+1234567891',
    true
) ON CONFLICT (email) DO NOTHING;

-- Create a demo doctor account
INSERT INTO users (email, username, password, role, first_name, last_name, phone, is_active) 
VALUES (
    'doctor@hospital.com', 
    'doctor', 
    '$2a$12$LQv3c1yqBWVHxkd0LQ4YGOx/nw9M7j9ZL1G3jzY5R2KjmD6WQjxyu', 
    'doctor', 
    'Dr. John', 
    'Doe', 
    '+1234567892',
    true
) ON CONFLICT (email) DO NOTHING;

-- Create doctor profile for the demo doctor
INSERT INTO doctors (user_id, specialization, working_hours_start, working_hours_end, consultation_fee, experience_summary)
SELECT id, 'General Medicine', '09:00:00', '17:00:00', 75.00, '10+ years of experience in general medicine'
FROM users WHERE email = 'doctor@hospital.com'
ON CONFLICT DO NOTHING;

-- Create a demo patient account  
INSERT INTO users (email, username, password, role, first_name, last_name, phone, is_active, id_card_number) 
VALUES (
    'patient@hospital.com', 
    'patient', 
    '$2a$12$LQv3c1yqBWVHxkd0LQ4YGOx/nw9M7j9ZL1G3jzY5R2KjmD6WQjxyu', 
    'patient', 
    'Mary', 
    'Johnson', 
    '+1234567893',
    true,
    'ID123456789'
) ON CONFLICT (email) DO NOTHING;

-- Create patient profile for the demo patient
INSERT INTO patients (user_id, date_of_birth, gender, emergency_contact_name, emergency_contact_phone)
SELECT id, '1990-05-15', 'female', 'John Johnson', '+1234567894'
FROM users WHERE email = 'patient@hospital.com'
ON CONFLICT DO NOTHING;
