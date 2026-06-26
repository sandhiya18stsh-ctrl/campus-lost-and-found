# Campus Lost & Found Network

A full-stack web application for managing lost and found items on campus. Built with React, FastAPI, and PostgreSQL.

## Features

- **Lost Item Reporting**: Students and staff can report lost items with detailed descriptions
- **Found Item Reporting**: Report found items to help return them to their owners
- **Smart Search & Filters**: Search and filter items by category, location, status, and keywords
- **Claim Management**: Submit claims for found items with verification workflow
- **Role-Based Access Control**: Different permissions for Students, Staff, and Admin users
- **Notification System**: Real-time notifications for claim updates and matches
- **Admin Dashboard**: Comprehensive admin panel for managing users, claims, and system stats
- **Responsive Design**: Modern, mobile-friendly interface built with React and Vite
- **API Documentation**: Automatic Swagger/OpenAPI documentation for all endpoints

## Tech Stack

### Frontend
- **React.js**: Modern JavaScript library for building user interfaces
- **Vite**: Fast build tool and dev server
- **React Router**: Client-side routing
- **Axios**: HTTP client for API communication

### Backend
- **FastAPI**: Modern Python web framework for building APIs
- **SQLAlchemy**: SQL toolkit and ORM
- **psycopg2**: PostgreSQL database adapter for Python
- **JWT Authentication**: Token-based authentication
- **Passlib**: Password hashing with bcrypt

### Database
- **PostgreSQL**: Open-source relational database
- **pgAdmin**: PostgreSQL GUI for database management

## Project Structure

```
campus-lost-found/
├── backend/                 # FastAPI backend application
│   ├── app/
│   │   ├── api/            # API route handlers
│   │   ├── core/           # Core configuration (security, database)
│   │   ├── models/         # SQLAlchemy ORM models
│   │   ├── schemas/        # Pydantic schemas for validation
│   │   └── services/       # Business logic services
│   ├── main.py            # FastAPI application entry point
│   ├── requirements.txt   # Python dependencies
│   └── .env.example       # Environment variables template
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable React components
│   │   ├── contexts/      # React context providers
│   │   ├── pages/         # Page components
│   │   ├── services/      # API service layer
│   │   ├── utils/         # Utility functions
│   │   └── styles/        # Global styles
│   ├── package.json      # Node.js dependencies
│   └── vite.config.js     # Vite configuration
├── database/              # PostgreSQL database scripts
│   ├── 00_master_setup.sql
│   ├── 01_create_database.sql
│   ├── 02_create_sequences.sql
│   ├── 03_create_tables.sql
│   ├── 04_create_constraints.sql
│   ├── 05_create_indexes.sql
│   ├── 06_create_triggers.sql
│   └── 07_insert_sample_data.sql
└── docs/                 # Documentation
    ├── DATABASE_SCHEMA.md
    ├── POSTGRESQL_SETUP.md
    └── DEPLOYMENT.md
```

## Prerequisites

### System Requirements
- Python 3.9 or higher
- Node.js 16 or higher
- PostgreSQL 12 or higher (PostgreSQL 15+ recommended)
- pgAdmin (optional, for GUI database management)

### Software Installation

1. **Python**: Download from [python.org](https://www.python.org/downloads/)
2. **Node.js**: Download from [nodejs.org](https://nodejs.org/)
3. **PostgreSQL**: Download from [PostgreSQL website](https://www.postgresql.org/download/)
4. **pgAdmin**: Download from [pgAdmin website](https://www.pgadmin.org/download/)

## Installation

### 1. Database Setup

Follow the detailed PostgreSQL setup guide in `docs/POSTGRESQL_SETUP.md` to:
- Install and configure PostgreSQL
- Create the database and user
- Run the SQL scripts to create tables, constraints, indexes, and triggers
- Insert sample data for testing

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env

# Edit .env with your database credentials
# DATABASE_URL=postgresql://campus_lost_found:password@localhost:5432/campus_lost_found
# SECRET_KEY=your-secret-key-here
# CORS_ORIGINS=http://localhost:5173
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
echo "VITE_API_URL=http://localhost:8000/api" > .env
```

## Running the Application

### Start the Backend

```bash
cd backend
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux

python main.py
```

The backend will start on `http://localhost:8000`

### Start the Frontend

```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:5173`

### Access the Application

- **Frontend**: http://localhost:5173
- **API Documentation**: http://localhost:8000/api/docs
- **Health Check**: http://localhost:8000/api/health

## Default Credentials

Sample data includes the following test users:

| Email | Password | Role |
|-------|----------|------|
| admin@campus.edu | password123 | ADMIN |
| student1@campus.edu | password123 | STUDENT |
| staff1@campus.edu | password123 | STAFF |

**Note**: Change these passwords in production!

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/me` - Update current user

### Lost Items
- `GET /api/lost-items/` - List lost items
- `POST /api/lost-items/` - Create lost item
- `GET /api/lost-items/{id}` - Get lost item details
- `PUT /api/lost-items/{id}` - Update lost item
- `DELETE /api/lost-items/{id}` - Delete lost item
- `POST /api/lost-items/{id}/images` - Add image to lost item

### Found Items
- `GET /api/found-items/` - List found items
- `POST /api/found-items/` - Create found item
- `GET /api/found-items/{id}` - Get found item details
- `PUT /api/found-items/{id}` - Update found item
- `DELETE /api/found-items/{id}` - Delete found item
- `POST /api/found-items/{id}/images` - Add image to found item

### Claims
- `GET /api/claims/` - List all claims (Admin/Staff)
- `GET /api/claims/my-claims` - List user's claims
- `POST /api/claims/` - Create claim
- `GET /api/claims/{id}` - Get claim details
- `PUT /api/claims/{id}` - Update claim
- `POST /api/claims/{id}/verify` - Verify claim (Admin/Staff)
- `POST /api/claims/{id}/complete` - Complete claim (Admin/Staff)

### Notifications
- `GET /api/notifications/` - List user notifications
- `GET /api/notifications/unread-count` - Get unread count
- `PUT /api/notifications/{id}` - Update notification
- `POST /api/notifications/mark-all-read` - Mark all as read
- `DELETE /api/notifications/{id}` - Delete notification

### Categories & Locations
- `GET /api/categories/` - List categories
- `POST /api/categories/` - Create category (Admin/Staff)
- `GET /api/locations/` - List locations
- `POST /api/locations/` - Create location (Admin/Staff)

### Users (Admin Only)
- `GET /api/users/` - List users
- `GET /api/users/{id}` - Get user details
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user

## User Roles

### Student
- Report lost items
- Report found items
- Search and browse items
- Submit claims for found items
- View notifications
- Manage profile

### Staff
- All Student permissions
- Verify claims
- Complete claims
- Create/manage categories and locations

### Admin
- All Staff permissions
- Manage users
- View system statistics
- Full access to admin dashboard

## Development

### Running Tests

```bash
# Backend tests (when implemented)
cd backend
pytest

# Frontend tests (when implemented)
cd frontend
npm test
```

### Code Style

- Backend: Follow PEP 8 Python style guide
- Frontend: Use ESLint configuration provided with Vite
- Commit messages: Use conventional commit format

### Adding New Features

1. **Database Changes**: Create migration scripts in `database/` directory
2. **Backend Changes**: 
   - Add models in `backend/app/models/`
   - Add schemas in `backend/app/schemas/`
   - Add API routes in `backend/app/api/`
3. **Frontend Changes**:
   - Add pages in `frontend/src/pages/`
   - Add components in `frontend/src/components/`
   - Update API service in `frontend/src/services/api.js`

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Verify connection string in `.env`
- Check that psycopg2 is installed correctly

### CORS Errors
- Verify `CORS_ORIGINS` in backend `.env` includes frontend URL
- Check that backend is running on correct port

### Build Errors
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear Python virtual environment and recreate: `rm -rf venv && python -m venv venv`

## Security Considerations

- Change default passwords in production
- Use strong JWT secret keys
- Enable HTTPS in production
- Implement rate limiting for API endpoints
- Regular security updates for dependencies
- Database encryption at rest
- Secure file upload handling

## Performance Optimization

- Database indexes on frequently queried columns
- Frontend code splitting with React.lazy()
- Image optimization and lazy loading
- API response caching where appropriate
- Database connection pooling
- CDN for static assets

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository or contact the development team.

## Acknowledgments

- Built with [FastAPI](https://fastapi.tiangolo.com/)
- Frontend built with [React](https://reactjs.org/) and [Vite](https://vitejs.dev/)
- Database powered by [PostgreSQL](https://www.postgresql.org/)
