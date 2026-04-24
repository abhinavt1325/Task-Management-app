# Task Management Application

A robust backend REST API for task management built using FastAPI and PostgreSQL. This application provides user authentication and complete CRUD (Create, Read, Update, Delete) operations for tasks.

## Features

- **User Authentication:** 
  - Register new users
  - Login with JWT based authentication
  - Verify authentication status
- **Task Management (Protected Routes):**
  - Create new tasks
  - View all tasks for the authenticated user
  - View specific task details
  - Update existing tasks
  - Delete tasks
- **Database:** PostgreSQL integration via SQLAlchemy ORM
- **Database Migrations:** Managed using Alembic

## Tech Stack

- **Framework:** [FastAPI](https://fastapi.tiangolo.com/)
- **Database:** PostgreSQL
- **ORM:** SQLAlchemy
- **Migrations:** Alembic
- **Server:** Uvicorn

## Project Structure

```text
├── main.py                 # FastAPI application entry point
├── alembic.ini             # Alembic configuration
├── migrations/             # Database migration scripts
├── requirements.txt        # Python dependencies
└── src/
    ├── tasks/              # Task management module (routes, controllers, models, dtos)
    ├── user/               # User authentication module (routes, controllers, models, dtos)
    └── utils/              # Utility functions, database configuration, and settings
```

## Setup & Installation

### Prerequisites

- Python 3.8+
- PostgreSQL database

### 1. Clone & Set Up Virtual Environment

```bash
# Create a virtual environment
python -m venv env

# Activate the virtual environment
# On Windows:
env\Scripts\activate
# On macOS/Linux:
source env/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Environment Variables

Create a `.env` file in the root directory and configure the following variables:

```env
DB_CONNECTION=postgresql://<user>:<password>@<host>:<port>/<dbname>
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
EXP_TIME=30 # Token expiration time
```

### 4. Database Migrations

Run Alembic to apply database migrations and create the necessary tables:

```bash
alembic upgrade head
```

### 5. Run the Application

Start the development server using Uvicorn:

```bash
uvicorn main:app --reload
```

The application will be accessible at `http://127.0.0.1:8000`.

## API Documentation

FastAPI automatically generates interactive API documentation. Once the server is running, you can access:

- **Swagger UI:** `http://127.0.0.1:8000/docs`
- **ReDoc:** `http://127.0.0.1:8000/redoc`
