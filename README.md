# CodeBit Backend

CodeBit Backend is the server-side API for the CodeBit coding platform. It handles authentication, problem management, code execution, submissions, contests, AI assistant support, admin features, and video/editorial management.

## Tech Stack

- Node.js
- Express.js
- MongoDB + Mongoose
- Redis
- JWT Authentication
- Cookie-based sessions
- Judge0 API for code execution
- Cloudinary for video/profile image uploads
- Vercel deployment

## Features

- User registration and login
- JWT authentication using HTTP-only cookies
- Logout with Redis token blocklist
- Problem CRUD for admins
- Run and submit code using Judge0
- Track solved problems and submissions
- User profile and profile image management
- Contest creation and leaderboard support
- Editorial video upload support with Cloudinary
- Admin user management
- AI assistant API integration

## Folder Structure

```txt
src/
├── config/
├── Controllers/
├── Middleware/
├── Models/
├── Routes/
├── Utils/
└── index.js
