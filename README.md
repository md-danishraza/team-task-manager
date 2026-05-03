# Team Task Manager - Full Stack Project

A production-ready team collaboration platform with role-based access control, project management, and task tracking. Built with modern technologies and best practices.

#### Live

https://team-task-manager-ethara.netlify.app/

## ✨ Features

- 🔐 **Secure Authentication** - JWT with httpOnly cookies, bcrypt password hashing
- 👥 **Role-Based Access** - Admin/Member roles with project-level permissions
- 📋 **Project Management** - Create, update, delete projects with team members
- ✅ **Task Tracking** - Assign tasks, track status, set priorities and due dates
- 📊 **Dashboard Analytics** - Real-time metrics, overdue tasks, activity feed
- 📚 **API Documentation** - Interactive Swagger/OpenAPI documentation
- 🎯 **Smart Features** - Due date warnings, activity logging, search & filter

## 🛠️ Tech Stack

### Backend

- **Runtime**: Node.js with TypeScript (ES Modules)
- **Framework**: Express.js
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma with driver adapters
- **Auth**: JWT + bcrypt + httpOnly cookies
- **Validation**: Custom middleware with type safety
- **Documentation**: Swagger/OpenAPI 3.0

### Frontend

- **Framework**: React + Vite
- **Styling**: TailwindCSS
- **State**: Context API + Custom hooks
- **HTTP**: Axios with interceptors

## 📁 Project Structure

```
TeamTaskManager/
├── backend/
│ ├── src/
│ │ ├── config/ # DB, Swagger configs
│ │ ├── controllers/ # Business logic
│ │ ├── middleware/ # Auth, validation
│ │ ├── routes/ # API endpoints
│ │ ├── utils/ # Helpers (jwt, password)
│ │ └── index.ts # Server entry
│ ├── prisma/
│ │ └── schema.prisma # Database models
│ └── package.json
├── frontend/ # Coming soon
└── README.md
```

### 📚 API Documentation

Once the server is running, access interactive API docs:

- **Swagger UI**: http://localhost:5000/api-docs
- **OpenAPI JSON**: http://localhost:5000/api-docs.json

#### live

- **Swagger UI**: https://team-task-manager-server.onrender.com/api-docs
- **OpenAPI JSON**: https://team-task-manager-server.onrender.com/api-docs.json

Test with Swagger UI
Open http://localhost:5000/api-docs

Click "Authorize" (not needed as cookie is handled automatically)
Try any authenticated endpoint
Execute and see real responses

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database (Supabase recommended)
- npm or yarn package manager

### Environment Setup

#### Backend

1. **Clone the repository**

```bash
git clone https://github.com/md-danishraza/team-task-manager.git
cd team-task-manager
```

2. Install backend dependencies

```
bash
cd backend
npm install
```

3. Configure environment variables

```
bash
cp .env.example .env
```

4. Update .env with your values:

```
env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
JWT_SECRET="your-super-secret-key-min-32-chars"
NODE_ENV="development"
PORT=5000
FRONTEND_URL="http://localhost:5173"
```

5. Setup database

```
bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# (Optional) Open Prisma Studio
npx prisma studio
```

6. Run development server

```

bash
npm run dev
```

Your server will run at http://localhost:5000

#### Frontend

1. Install frontend dependencies

```
bash
cd frontend
npm install
```

2. Start the vite server

```
bash
npm run dev
```

Your react vite will run at http://localhost:5173

### 🔒 Security Features

- **Password Security**: bcrypt hashing with salt rounds (10 rounds)

- **Session Security**: JWT stored in httpOnly cookies (XSS protection)

- **CORS Protection**: Restricted to approved origins

- **SQL Injection** Prevention: Prisma ORM with parameterized queries

- **Input Validation**: Type-safe validation on all endpoints

- **Role-Based Access**: Database-level permission checks

### 📊 Database Schema

```
prisma
// Core models
User          - Authentication and global roles
Project       - Project details and metadata
ProjectMember - Many-to-many with project roles
Task          - Tasks with status, priority, assignments
ActivityLog   - Audit trail of all actions
```

### Key Relationships

- Users can be members of multiple projects

- Each project has admins and regular members

- Tasks belong to projects and can be assigned to users

- Activity log tracks all significant actions

### 📝 License

MIT License - feel free to use this project for learning or commercial purposes.

### 🙏 Acknowledgments

- Prisma - Amazing ORM experience

- Supabase - Great Postgres hosting

- Express.js - Minimalist web framework

- Swagger - API documentation

### 📧 Contact

For questions or support, please open an issue on GitHub.
