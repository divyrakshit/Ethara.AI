========================================================================
🌌 VANGUARD TASK MANAGER (AETHER TASKS)
========================================================================

A feature-rich, high-performance, and visually stunning web application for 
project creation, team collaboration, and task management. Outfitted with 
robust role-based access controls, a dynamic Kanban workflow board, and 
real-time dashboard analytics.

Built using Next.js 16 (App Router), TypeScript, Prisma ORM, PostgreSQL (on Railway),
and styled with Premium Vanilla CSS (CSS Modules, custom CSS custom properties, 
and micro-animations) to achieve a modern, cohesive glassmorphic theme.

------------------------------------------------------------------------
✨ FEATURES
------------------------------------------------------------------------

* 🔐 Custom Authentication: Secure signup and login with hashed passwords via bcryptjs.
  Session management handled using encrypted JWTs stored in HttpOnly cookie stores.
* 📂 Project Workspace: Admin and member workspaces. Creating a project automatically
  designates the creator as the ADMIN of that project workspace.
* 👥 Team Management: Project admins can invite new members by email, designate their
  roles (ADMIN or MEMBER), and remove members.
* 📋 Dynamic Kanban Board: Organizes project tasks into lists by status (Todo, In Progress,
  Under Review, Done).
* ⚡ Task Management: Create tasks, assign priorities (Low, Medium, High), set due dates,
  add detailed descriptions, and select statuses to instantly update.
* 📊 Analytics Dashboard: Tracks key performance metrics: total active tasks, pending
  reviews, completed work, and overdue tasks with urgent alert highlights.

------------------------------------------------------------------------
🌐 DEPLOYMENT DETAILS
------------------------------------------------------------------------

* Live App URL: https://etharaai-production-af7a.up.railway.app
* Database: PostgreSQL (Managed on Railway)
* Deployment Platform: Railway (calm-sparkle project)

------------------------------------------------------------------------
🛠️ ARCHITECTURE & TECH STACK
------------------------------------------------------------------------

* Framework: Next.js 16 (App Router)
* Database & ORM: Prisma ORM with PostgreSQL (Production) / SQLite (Local)
* Styling: Vanilla CSS (CSS Modules) implementing a rich dark theme with glassmorphic elements
* Authentication: Custom JSON Web Tokens (jsonwebtoken) with route protection in Next.js Middleware

------------------------------------------------------------------------
📁 PROJECT STRUCTURE
------------------------------------------------------------------------

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
│   │   ├── login/            # Login page
│   │   ├── signup/           # Signup page
│   │   ├── dashboard/        # Analytics Panel & Projects List
│   │   ├── projects/[id]/    # Project Board & Team Settings
│   │   ├── globals.css       # Styling theme and variables
│   │   ├── layout.tsx        # Shell layout structure
│   │   └── page.tsx          # Root redirection middleware
│   ├── components/           # Modular component elements
│   ├── lib/                  # Database clients & authentication helpers
│   ├── middleware.ts         # Secure route protection (Middleware)
│   └── styles/               # Component-scoped CSS modules

------------------------------------------------------------------------
🚀 LOCAL DEVELOPMENT SETUP
------------------------------------------------------------------------

1. Prerequisites:
   Ensure you have Node.js (v18+) and npm installed.

2. Install Dependencies:
   npm install

3. Environment Variables:
   Create a .env file in the root directory:
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="vanguard-tasks-super-secret-key-change-in-prod"

4. Run DB Migrations:
   npx prisma migrate dev --name init

5. Start the Development Server:
   npm run dev

Open http://localhost:3000 in your web browser.

------------------------------------------------------------------------
🛠️ VERIFICATION & TESTING CHECKLIST
------------------------------------------------------------------------

1. Sign Up: Register two new users with emails.
2. Create Project: Log in as Admin. Click "New Project" on the dashboard. Add a title.
3. Invite Members: In the project page settings sidebar, invite another user by email.
4. Create Tasks: Create tasks on the board. Assign them to members and set priority.
5. Kanban Updates: Drag/update task statuses between Todo, In Progress, Under Review, Done.
6. Access Control: Verify members cannot delete projects or remove admins.
