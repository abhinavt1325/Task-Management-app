# Full-Stack Task Management Application

A robust, modern full-stack application for managing daily tasks. It features a premium React frontend powered by a fast, secure FastAPI backend. The application provides complete user authentication and CRUD (Create, Read, Update, Delete) operations for tasks.

## Features

- **Modern Premium UI:** Beautiful, responsive React frontend with glassmorphism, subtle animations, and a dark SaaS theme.
- **User Authentication:** 
  - Register new users
  - Secure Login with JWT-based authentication
  - Protected routes and session persistence
- **Task Management:**
  - Create new tasks
  - View all tasks for the authenticated user
  - Mark tasks as complete/incomplete
  - Update and delete tasks instantly
- **Database:** PostgreSQL integration via SQLAlchemy ORM
- **Database Migrations:** Managed using Alembic

## Tech Stack

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite
- **Routing:** React Router DOM
- **HTTP Client:** Axios
- **Styling:** Vanilla CSS (Custom Design System)
- **Icons:** Lucide React

### Backend
- **Framework:** [FastAPI](https://fastapi.tiangolo.com/)
- **Database:** PostgreSQL
- **ORM:** SQLAlchemy
- **Migrations:** Alembic
- **Server:** Uvicorn
- **Security:** PyJWT & pwdlib (Argon2 hashing)

## Project Structure

```text
Task management App/
├── main.py                 # FastAPI application entry point
├── alembic.ini             # Alembic configuration
├── requirements.txt        # Python dependencies
├── src/                    # Backend Source
│   ├── tasks/              # Task management (routes, controllers, models)
│   ├── user/               # User authentication
│   └── utils/              # Utilities & DB config
└── frontend/               # React Frontend
    ├── package.json        # Node dependencies
    ├── vite.config.js      # Vite configuration
    └── src/
        ├── api.js          # Axios configuration with interceptors
        ├── AuthContext.jsx # Global auth state
        ├── App.jsx         # Routing & Protected Routes
        ├── Login.jsx       # Login Component
        ├── Register.jsx    # Signup Component
        ├── Dashboard.jsx   # Main workspace
        └── index.css       # Global design tokens
```

## Setup & Installation

### Prerequisites

- Python 3.8+
- Node.js 18+ & npm
- PostgreSQL database

### 1. Backend Setup

Open a terminal in the root directory.

```bash
# Create a virtual environment
python -m venv env

# Activate the virtual environment
# On Windows:
env\Scripts\activate
# On macOS/Linux:
source env/bin/activate

# Install Dependencies
pip install -r requirements.txt
```

#### Environment Variables

Create a `.env` file in the root directory and configure the following variables (if you haven't already):

```env
DB_CONNECTION=postgresql://<user>:<password>@<host>:<port>/<dbname>
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
EXP_TIME=30 # Token expiration time in minutes
```

#### Database Migrations & Run

```bash
# Run Alembic to apply database migrations
alembic upgrade head

# Start the FastAPI server (Runs on port 8000)
uvicorn main:app --reload --port 8000
```

### 2. Frontend Setup

Open a **new** terminal in the root directory.

```bash
# Navigate to the frontend directory
cd frontend

# Install Node dependencies
npm install

# Start the Vite development server
npm run dev
```

The React frontend will be accessible at `http://localhost:5173`. It will automatically connect to the FastAPI backend running on port 8000.

## API Documentation

FastAPI automatically generates interactive API documentation. Once the backend server is running, you can access:

- **Swagger UI:** `http://127.0.0.1:8000/docs`
- **ReDoc:** `http://127.0.0.1:8000/redoc`
