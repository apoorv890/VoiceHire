# VoiceHire - AI-Powered HR Portal

A modern, full-stack HR portal application with AI-powered resume analysis, role-based access control, and real-time interview capabilities.

## Project Structure

```
VoiceHire/
├── frontend/          # React + TypeScript + Tailwind CSS
├── backend/           # Node.js + Express (MVC Architecture)
│   ├── server/        # Application code
│   └── agent/         # AI interview agent
└── README.md
```

## Features

- **Role-Based Access Control**: Two user personas (Admin & User)
  - **Admin**: Full access - create jobs, upload resumes, analyze candidates
  - **User**: Limited access - view and apply to jobs only
- **Authentication System**: Secure login and registration with JWT
- **Job Management**: Create, view, and manage job postings
- **Candidate Tracking**: Track candidates for each job posting
- **AI Resume Processing**: Upload and analyze resumes with Groq AI
- **Search Functionality**: Unified search for jobs and candidates
- **Audio Conferencing**: Built-in interview capabilities with LiveKit
- **MVC Architecture**: Clean, maintainable backend structure

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Authentication**: JWT
- **File Processing**: Multer, PDF Parse
- **AI Integration**: Groq AI for resume analysis
- **Real-time Communication**: LiveKit

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
GROQ_API_KEY=your_groq_api_key
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
EMAIL_SERVICE=your_email_service
EMAIL_USER=your_email_username
EMAIL_PASS=your_email_password
COMPANY_NAME=your_company_name
```

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/apoorv890/VoiceHire.git
   cd VoiceHire
   ```

2. Install dependencies for both frontend and backend:
   ```bash
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` in the backend folder
   - Update the values with your credentials

4. Start MongoDB:
   ```bash
   mongod --dbpath C:\data\db
   ```

5. Start the development servers:
   
   **Backend (Terminal 1):**
   ```bash
   cd backend
   npm run dev
   ```
   
   **Frontend (Terminal 2):**
   ```bash
   cd frontend
   npm run dev
   ```

6. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Project Structure

```
hr-portal/
├── server/
│   ├── index.js           # Express server setup
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   └── utils/             # Utility functions
├── src/
│   ├── components/        # React components
│   ├── pages/             # Page components
│   ├── lib/               # Utility functions
│   ├── App.tsx            # Main application component
│   └── index.css          # Global styles
├── public/                # Static assets
└── package.json           # Project dependencies
```

## Authentication Flow

1. User registers or logs in through the `/auth` page
2. Server validates credentials and returns a JWT token
3. Token is stored in localStorage and used for subsequent API requests
4. Protected routes check for valid token before rendering

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `GET /api/auth/me` - Get current user info (protected)

### Jobs
- `GET /api/jobs` - Get all jobs
- `POST /api/jobs` - Create a new job
- `GET /api/jobs/:id` - Get a specific job
- `PUT /api/jobs/:id` - Update a job
- `DELETE /api/jobs/:id` - Delete a job

### Candidates
- `GET /api/jobs/:id/candidates` - Get candidates for a job
- `POST /api/jobs/:id/candidates/upload` - Upload resumes for a job

### Search
- `GET /api/unified-search` - Search for jobs and candidates

## License

This project is licensed under the MIT License.
