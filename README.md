# ETHARA - Comprehensive Project & Task Management

ETHARA is a full-stack, responsive web application designed for teams to easily manage projects, track tasks via a drag-and-drop Kanban board, and collaborate effectively.

## Features
- **Authentication**: JWT-based secure login and registration with Role-Based Access Control (Admin vs. Member).
- **Dashboard**: Real-time analytics, overdue task alerts, and an activity timeline.
- **Projects**: Track project progress, manage team members, and monitor deadlines.
- **Kanban Board**: Drag-and-drop tasks across custom columns with priority badges, comments, and file attachments.
- **User Profiles**: Manage your profile, upload custom avatars, and change passwords.
- **Theming**: Full dark mode/light mode support using Tailwind CSS variables.

## Tech Stack
- **Frontend**: React (Vite), TailwindCSS, Recharts, @hello-pangea/dnd.
- **Backend**: Node.js, Express, MongoDB (Mongoose), Socket.io.
- **Security**: Helmet, XSS-Clean, Express-Rate-Limit, Express-Validator, Bcrypt.

## Quick Start

### Prerequisites
- Node.js (v18+)
- MongoDB (local or Atlas)

### 1. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` directory:
```
PORT=5002
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```
Start the server:
```bash
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
```
Create a `.env` file in the `frontend` directory:
```
VITE_API_URL=http://localhost:5002/api
```
Start the development server:
```bash
npm run dev
```

## Deployment
- **Backend**: Ensure `NODE_ENV=production` is set. The `Procfile` is configured for platforms like Railway or Heroku (`web: node src/server.js`).
- **Frontend**: Connect the repository to Vercel. Ensure `VITE_API_URL` points to your deployed backend URL.

## Documentation
Please see [API_DOCS.md](./API_DOCS.md) for detailed backend API documentation.
