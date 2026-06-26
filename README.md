# CRM Lite

## Project Overview

CRM Lite is a full-stack Customer Relationship Management (CRM) application developed using **Django REST Framework** and **React**. The system helps organizations manage customers, leads, opportunities, follow-ups, and sales representatives through a secure role-based authentication system.

### Core Features

- JWT Authentication
- Role-Based Authorization
- Customer Management
- Lead Management
- Opportunity Tracking
- Follow-up Management
- Dashboard & Analytics
- REST API Architecture
- PostgreSQL Database

---

# Technology Stack

## Backend
- Python
- Django
- Django REST Framework
- PostgreSQL
- Simple JWT

## Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- Axios

## Development Tools
- Git
- Docker
- npm
- pip

---

# Setup Instructions

## Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL
- Git

## Clone Repository

```bash
git clone <repository-url>
cd Project
```

## Backend Setup

```bash
cd backend

python -m venv .venv

# macOS/Linux
source .venv/bin/activate

# Windows
.venv\Scripts\activate

pip install -r requirements.txt
```

## Configure Database

Create a PostgreSQL database and configure your environment variables.

Example:

```env
DB_NAME=crm
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
```

## Apply Migrations

```bash
python manage.py migrate
```

## Create Admin Account

```bash
python manage.py createsuperuser
```

Verify the account:

```bash
python manage.py shell
```

```python
from django.contrib.auth import get_user_model

User = get_user_model()

for user in User.objects.all():
    print(user.email, user.role, user.is_staff, user.is_superuser)
```

If the role is not ADMIN:

```python
admin = User.objects.get(email="admin@example.com")
admin.role = "ADMIN"
admin.is_staff = True
admin.is_superuser = True
admin.save()
```

## Create Sales Representative

```bash
python manage.py shell
```

```python
from django.contrib.auth import get_user_model

User = get_user_model()

sales = User.objects.create_user(
    username="sales",
    email="sales@example.com",
    password="Sales@123"
)

sales.role = "SALES_REP"
sales.is_staff = False
sales.is_superuser = False
sales.save()
```

## Start Backend

```bash
python manage.py runserver
```

Backend:

```
http://127.0.0.1:8000
```

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```
http://localhost:5173
```

---

# Folder Structure

```text
Project
├── backend
│   ├── authentication
│   ├── users
│   ├── crm
│   ├── config
│   ├── manage.py
│   └── requirements.txt
├── frontend
│   ├── src
│   │   ├── components
│   │   ├── pages
│   │   ├── hooks
│   │   ├── services
│   │   └── routes
│   └── package.json
└── README.md
```

---

# Architecture Overview

```text
               React Frontend
                      │
              REST API (JWT)
                      │
         Django REST Framework
                      │
        Business Logic & Services
                      │
             PostgreSQL Database
```

Authentication Flow

```text
User Login
    │
JWT Access Token
    │
Protected API Request
    │
Role Verification
    │
Requested Resource
```

---

# Design Decisions

- Django REST Framework is used for a modular REST API.
- React and Vite provide a fast SPA frontend.
- PostgreSQL stores relational business data.
- JWT enables stateless authentication.
- Role-based authorization separates administrator and sales representative access.
- Backend and frontend are decoupled for easier maintenance.

---

# Assumptions

- PostgreSQL is installed and running.
- Python and Node.js are installed.
- Environment variables are configured correctly.
- Database migrations have been executed.
- User roles are assigned correctly after account creation.

---

# Future Improvements

- Email notifications
- Calendar integration
- Audit logging
- CSV/Excel import & export
- Advanced analytics dashboard
- File attachment support
- Docker Compose
- CI/CD pipeline
- Automated testing
- Multi-tenant architecture

---

# Useful Commands

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py shell
python manage.py collectstatic
npm install
npm run dev
```

---

# License

This project is intended for educational and demonstration purposes.
