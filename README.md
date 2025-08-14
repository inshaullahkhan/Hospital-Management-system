<<<<<<< HEAD
# Hospital Management System

A comprehensive full-stack Hospital Management System built with Vue.js, Node.js, and PostgreSQL.

## 🏥 Features

### Multi-Role Access System
- **Admin**: Complete system management, user management, reports
- **Receptionist**: Patient registration, appointment scheduling, invoice management
- **Doctor**: View appointments, manage patient records, add medical notes
- **Patient**: View appointments, medical records, and invoices

### Core Functionality
- ✅ Role-based authentication and authorization
- ✅ Patient registration and management
- ✅ Doctor profiles with specializations and schedules
- ✅ Appointment scheduling and management
- ✅ Medical records and lab results
- ✅ Invoice generation and payment tracking
- ✅ Responsive, mobile-friendly interface
- ✅ Real-time dashboard with statistics
- ✅ Search and filtering capabilities

## 🚀 Technology Stack

### Frontend
- **Vue.js 3** - Progressive JavaScript framework
- **Vuetify 3** - Material Design component framework
- **Pinia** - State management
- **Vue Router** - Client-side routing
- **Axios** - HTTP client
- **Vite** - Build tool and dev server

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn package manager

## 🛠️ Installation & Setup

### 1. Clone the Repository
\`\`\`bash
git clone <repository-url>
cd hospital-management-system
\`\`\`

### 2. Install Dependencies
\`\`\`bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
\`\`\`

### 3. Database Setup
1. Create a PostgreSQL database named \`hospital_management\`
2. Run the schema script:
\`\`\`bash
psql -U postgres -d hospital_management -f backend/database/schema.sql
\`\`\`

### 4. Environment Configuration
Create a \`.env\` file in the backend directory:
\`\`\`env
NODE_ENV=development
PORT=3001
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hospital_management
DB_USER=postgres
DB_PASSWORD=your_database_password
\`\`\`

### 5. Start the Application
\`\`\`bash
# From the root directory, start both frontend and backend
npm run dev

# Or start them separately:
# Backend (runs on http://localhost:3001)
npm run server

# Frontend (runs on http://localhost:5173)
npm run client
\`\`\`

## 👥 Default Login Credentials

### Admin Account
- **Email**: admin@hospital.com
- **Password**: admin123

### Demo Accounts
Additional demo accounts can be created through the admin panel after logging in.

## 📱 User Interface

### Dashboard Features
- **Admin Dashboard**: System overview, user management, reports
- **Receptionist Dashboard**: Today's appointments, quick patient/appointment creation
- **Doctor Dashboard**: Personal appointments, patient management
- **Patient Dashboard**: Upcoming appointments, medical records, invoices

### Key Pages
- **Login Page**: Secure authentication with role-based access
- **Appointments**: Schedule, view, and manage appointments
- **Patients**: Patient registration and record management
- **Doctors**: Doctor profiles, schedules, and specializations
- **Invoices**: Billing and payment management
- **Reports**: Analytics and data export

## 🔐 Security Features

- JWT-based authentication
- Role-based access control
- Password hashing with bcrypt
- Input validation and sanitization
- SQL injection prevention
- CORS protection

## 📊 Database Schema

### Core Tables
- **users**: User accounts for all roles
- **doctors**: Doctor-specific information
- **patients**: Patient-specific information
- **appointments**: Appointment scheduling
- **medical_records**: Patient medical history
- **invoices**: Billing and payments
- **lab_tests**: Laboratory test results

## 🎯 API Endpoints

### Authentication
- \`POST /api/auth/login\` - User login
- \`GET /api/auth/profile\` - Get user profile
- \`PUT /api/auth/change-password\` - Change password

### Users Management
- \`GET /api/users\` - List users (Admin only)
- \`POST /api/users\` - Create user (Admin only)
- \`PUT /api/users/:id\` - Update user
- \`DELETE /api/users/:id\` - Delete user (Admin only)

### Appointments
- \`GET /api/appointments\` - List appointments
- \`POST /api/appointments\` - Create appointment
- \`PUT /api/appointments/:id\` - Update appointment

### Doctors & Patients
- \`GET /api/doctors\` - List doctors
- \`POST /api/doctors\` - Create doctor
- \`GET /api/patients\` - List patients
- \`POST /api/patients\` - Create patient

## 🧪 Testing

\`\`\`bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
\`\`\`

## 📦 Deployment

### Production Build
\`\`\`bash
# Build frontend for production
cd frontend
npm run build

# Start backend in production mode
cd backend
NODE_ENV=production npm start
\`\`\`

### Environment Variables for Production
- Set \`NODE_ENV=production\`
- Use secure JWT secret
- Configure production database
- Set up HTTPS
- Configure CORS for production domains

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (\`git checkout -b feature/new-feature\`)
3. Commit your changes (\`git commit -am 'Add new feature'\`)
4. Push to the branch (\`git push origin feature/new-feature\`)
5. Create a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Contact the development team

## 🔄 Version History

- **v1.0.0** - Initial release with core functionality
- Role-based authentication
- Patient and appointment management
- Basic reporting features

## ���� Future Enhancements

- [ ] Email notifications for appointments
- [ ] SMS reminders
- [ ] Advanced reporting and analytics
- [ ] Mobile app development
- [ ] Integration with external lab systems
- [ ] Telemedicine features
- [ ] Multi-language support
- [ ] Advanced search and filtering
- [ ] Backup and data export tools
=======
# Hospital-Management-system

This repository was initialized by Builder.io.

## Getting Started

Welcome to your new repository! You can now start building your project.
>>>>>>> origin/main
