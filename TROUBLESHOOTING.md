# Hospital Management System - Troubleshooting

## Common Issues and Solutions

### 1. Login Failed Error

#### Symptoms
- "Login failed" message appears when trying to log in
- Admin credentials not working

#### Solutions

**Check Backend Server**
```bash
# Check if backend is running
ps aux | grep node

# If not running, start it:
cd backend && npm run dev
```

**Verify Database Connection**
```bash
# Test database connection
node backend/test-db.js
```

**Reset Admin Password**
```bash
# If database exists but admin user has issues:
node backend/create-admin.js
```

### 2. Database Connection Issues

#### Symptoms
- "Database connection error" messages
- ECONNREFUSED errors

#### Solutions

**Check PostgreSQL Service**
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL if not running
sudo systemctl start postgresql
```

**Verify Database Exists**
```sql
-- Connect to PostgreSQL and check:
\l
-- Should show 'hospital_management' database
```

**Create Database if Missing**
```bash
# Create database
createdb -U postgres hospital_management

# Run schema
psql -U postgres -d hospital_management -f backend/database/schema.sql
```

### 3. Frontend API Connection Issues

#### Symptoms
- Network errors in browser console
- API calls failing

#### Solutions

**Check API Base URL**
- Frontend should use `/api` (relative URL)
- Backend should be running on port 3001
- Proxy should be configured correctly

**Verify CORS Settings**
- Backend has CORS enabled for localhost:5173
- Check browser network tab for CORS errors

### 4. Missing Dependencies

#### Symptoms
- Module not found errors
- Build failures

#### Solutions

```bash
# Reinstall all dependencies
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 5. Port Conflicts

#### Symptoms
- "Port already in use" errors
- Services not starting

#### Solutions

```bash
# Check what's using the ports
lsof -i :3001  # Backend
lsof -i :5173  # Frontend

# Kill processes if needed
pkill -f "node.*server"
pkill -f "vite"
```

## Default Login Credentials

After fixing any database issues, use these credentials:

- **Email**: admin@hospital.com
- **Password**: admin123

## Environment Variables

Make sure your `backend/.env` file has:

```env
NODE_ENV=development
PORT=3001
JWT_SECRET=hospital_management_jwt_secret_key_2024
JWT_EXPIRES_IN=24h

DB_HOST=localhost
DB_PORT=5432
DB_NAME=hospital_management
DB_USER=postgres
DB_PASSWORD=password
```

## Quick Reset

If everything is broken, try this complete reset:

```bash
# 1. Stop all services
pkill -f "node"

# 2. Drop and recreate database
dropdb -U postgres hospital_management
createdb -U postgres hospital_management

# 3. Run schema
psql -U postgres -d hospital_management -f backend/database/schema.sql

# 4. Test database
node backend/test-db.js

# 5. Start services
cd backend && npm run dev &
cd frontend && npm run dev
```

## Getting Help

If you're still having issues:

1. Check the browser console for JavaScript errors
2. Check the backend console for server errors  
3. Verify all services are running on correct ports
4. Make sure PostgreSQL is installed and running
5. Check that all dependencies are installed

The admin user should be automatically created when you first try to log in with admin@hospital.com.
