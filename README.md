# 🌌 Vanguard Task Manager

A feature-rich, high-performance, and visually stunning web application for project creation, team collaboration, and task management. Outfitted with robust role-based access controls, a dynamic Kanban workflow board, and real-time dashboard analytics.

Built using **Next.js 16 (App Router)**, **TypeScript**, **Prisma ORM**, **SQLite/PostgreSQL**, and styled with **Premium Vanilla CSS** (CSS Modules, custom CSS custom properties, and micro-animations) to achieve a modern, cohesive glassmorphic theme.

---

## ✨ Features

- 🔐 **Custom Authentication**: Secure signup and login with hashed passwords via `bcryptjs`. Session management handled using encrypted JWTs stored in `HttpOnly` cookie stores.
- 📂 **Project Workspace**: Admin and member workspaces. Creating a project automatically designates the creator as the `ADMIN` of that project workspace.
- 👥 **Team Management**: Project admins can invite new members by email, designate their roles (`ADMIN` or `MEMBER`), and remove members.
- 📋 **Dynamic Kanban Board**: Organizes project tasks into lists by status (`Todo`, `In Progress`, `Under Review`, `Done`).
- ⚡ **Task Management**: Create tasks, assign priorities (`Low`, `Medium`, `High`), set due dates, add detailed descriptions, and drag-and-drop or select statuses to instantly update.
- 📊 **Analytics Dashboard**: Tracks key performance metrics: total active tasks, pending reviews, completed work, and overdue tasks with urgent alert highlights.

---

## 🛠️ Architecture & Tech Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/) (Server Components & Client components, REST API Route Handlers)
- **Database & ORM**: [Prisma ORM](https://www.prisma.io/) with [SQLite](https://www.sqlite.org/) (local development) and simple transition to [PostgreSQL](https://www.postgresql.org/) (production)
- **Styling**: Vanilla CSS (CSS Modules) implementing a rich dark theme (`globals.css`) with glassmorphic elements, modern typography (Inter/Outfit), and sleek interactions
- **Authentication**: Custom JSON Web Tokens (`jsonwebtoken`) with route protection in Next.js Middleware

---

## 📁 Project Structure

```
project-task-manager/
├── prisma/
│   ├── schema.prisma         # Database schemas & relationships
│   └── dev.db                # SQLite database (Git-ignored)
├── src/
│   ├── app/
│   │   ├── api/              # REST API Endpoints
│   │   │   ├── auth/         # signup, login, logout, me
│   │   │   ├── projects/     # CRUD projects & members
│   │   │   └── tasks/        # CRUD tasks & status updates
│   │   ├── login/            # Login view page
│   │   ├── signup/           # Signup view page
│   │   ├── dashboard/        # Analytics Panel & Projects List
│   │   ├── projects/[id]/    # Project Board & Team Settings
│   │   ├── globals.css       # Styling theme and variables
│   │   ├── layout.tsx        # Shell layout structure
│   │   └── page.tsx          # Root redirection middleware
│   ├── components/           # Modular component elements
│   ├── lib/                  # Database clients & authentication helpers
│   ├── middleware.ts         # Secure route protection (Middleware)
│   └── styles/               # Component-scoped CSS modules
```

---

## 🚀 Local Development Setup

To run the application locally, follow these steps:

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) (v18+ recommended) and `npm` installed.

### 2. Install Dependencies
Clone the repository and run:
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory:
```env
# Database connection URL (for SQLite local development)
DATABASE_URL="file:./dev.db"

# Secret key for signing JWT tokens (use a long random string in production)
JWT_SECRET="vanguard-tasks-super-secret-key-change-in-prod"
```

### 4. Run DB Migrations
Prisma will set up the local SQLite database automatically:
```bash
npx prisma migrate dev --name init
```

### 5. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 🌐 Railway Deployment Guide

To deploy this application to [Railway](https://railway.app/) and connect it to a production-ready **PostgreSQL** database:

### 1. Provision a PostgreSQL Database on Railway
1. Log in to your Railway account.
2. Click **New Project** -> **Provision PostgreSQL**.

### 2. Switch Prisma from SQLite to PostgreSQL
Since SQLite is file-based and Railway container disks are ephemeral, you must configure the project to use PostgreSQL for production:
1. Open [prisma/schema.prisma](file:///C:/Users/divyr/.gemini/antigravity/scratch/project-task-manager/prisma/schema.prisma) and change the database provider:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Re-generate the Prisma Client:
   ```bash
   npx prisma generate
   ```

### 3. Deploy to Railway
1. Connect your GitHub repository containing the project.
2. Under the service's **Variables** tab on Railway, define:
   - `DATABASE_URL`: Set to the connection URL provided by your Railway PostgreSQL database instance (e.g., `postgresql://postgres:password@host:port/dbname`).
   - `JWT_SECRET`: A secure, randomly-generated secret key string.
   - `NODE_ENV`: `production`
3. Railway will automatically detect the Next.js app, install dependencies, build, and deploy.
4. Add a Custom Domain in Railway under service settings to expose your live endpoint.

---

## 🛠️ Verification & Testing Checklists

To test the application locally or in staging:
1. **Sign Up**: Register two new users with emails (e.g., `alice@vanguard.com` and `bob@vanguard.com`).
2. **Create Project**: Log in as Alice. Click **New Project** on the dashboard. Add a title and description. Alice is designated project admin.
3. **Invite Members**: In the project page settings sidebar, invite Bob by typing `bob@vanguard.com` and selecting the `MEMBER` role.
4. **Create Tasks**: Create tasks on the board. Assign them to Bob, set high/medium/low priority, and select a due date.
5. **Kanban Updates**: Log in as Bob. Navigate to the project page. Drag tasks between `Todo`, `In Progress`, `Under Review`, and `Done` states, or click status buttons to update them.
6. **Access Control Checks**: Verify Bob (Member) cannot rename or delete the project, and cannot remove Alice (Admin) from the member list.
