# HR Portal Application

A modern HR portal application with authentication, job management, candidate tracking, and resume processing capabilities.

## Features

- **Authentication System**: Secure login and registration with JWT
- **Job Management**: Create, view, and manage job postings
- **Candidate Tracking**: Track candidates for each job posting
- **Resume Processing**: Upload and analyze resumes with AI
- **Search Functionality**: Unified search for jobs and candidates
- **Audio Conferencing**: Built-in audio conferencing capabilities

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
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```

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
