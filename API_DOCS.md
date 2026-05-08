# ETHARA API Documentation

Base URL: `/api`

## Authentication (`/api/auth`)

| Endpoint | Method | Access | Description | Parameters (Body) |
| :--- | :---: | :--- | :--- | :--- |
| `/register` | POST | Public | Register a new user | `name`, `email`, `password`, `role` |
| `/login` | POST | Public | Authenticate a user | `email`, `password` |
| `/profile` | GET | Private | Get logged-in user profile | None |
| `/profile` | PUT | Private | Update user profile | `name`, `email` |
| `/password`| PUT | Private | Change password | `currentPassword`, `newPassword` |
| `/avatar` | POST | Private | Upload user avatar | `avatar` (FormData file) |
| `/users` | GET | Admin | Get all users | None |
| `/users/:id/role`| PUT | Admin | Update a user's role | `role` |

## Projects (`/api/projects`)

| Endpoint | Method | Access | Description | Parameters (Body) |
| :--- | :---: | :--- | :--- | :--- |
| `/` | GET | Private | Get all projects | None |
| `/` | POST | Admin | Create a new project | `name`, `description`, `dueDate`, `members` |
| `/:id` | GET | Private | Get project by ID | None |
| `/:id` | PUT | Admin | Update project | `name`, `description`, `status`, `dueDate` |
| `/:id` | DELETE| Admin | Delete project | None |

## Tasks (`/api/tasks`)

| Endpoint | Method | Access | Description | Parameters (Body) |
| :--- | :---: | :--- | :--- | :--- |
| `/` | GET | Private | Get tasks (filter by `projectId`) | None |
| `/` | POST | Admin | Create task | `title`, `description`, `priority`, `dueDate`, `project`, `assignedTo` |
| `/:id/status`| PUT | Private | Update task status | `status` |
| `/:id/comments`| POST | Private | Add comment to task | `text` |
| `/:id/attachments`| POST | Private | Upload file to task | `file` (FormData) |
| `/:id` | PUT | Admin | Update full task | All task fields |
| `/:id` | DELETE| Admin | Delete task | None |

## Activities (`/api/activities`)

| Endpoint | Method | Access | Description |
| :--- | :---: | :--- | :--- |
| `/` | GET | Private | Get recent activity log |
