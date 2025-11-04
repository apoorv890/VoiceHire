# VoiceHire Backend - MVC Architecture

## Project Structure

```
backend/
├── server/
│   ├── app.js                 # Main application entry point
│   ├── config/                # Configuration files
│   │   └── database.js        # MongoDB connection
│   ├── controllers/           # Business logic
│   │   ├── jobController.js
│   │   ├── candidateController.js
│   │   └── searchController.js
│   ├── models/                # Data models (Mongoose schemas)
│   │   ├── User.js
│   │   ├── Job.js
│   │   └── Candidate.js
│   ├── routes/                # API routes
│   │   ├── auth.js
│   │   ├── jobRoutes.js
│   │   ├── candidateRoutes.js
│   │   └── searchRoutes.js
│   ├── middleware/            # Custom middleware
│   │   └── auth.js            # Authentication & authorization
│   └── utils/                 # Utility functions
│       └── searchUtils.js
├── agent/                     # AI interview agent
└── uploads/                   # Resume uploads storage
```

## MVC Architecture

### Models (M)
- **User.js**: User authentication and profile data
- **Job.js**: Job posting information
- **Candidate.js**: Candidate and resume data

### Views (V)
- Frontend handles all views (React components)
- Backend provides JSON API responses

### Controllers (C)
- **jobController.js**: Job CRUD operations
- **candidateController.js**: Candidate management and resume processing
- **searchController.js**: Search functionality

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user (protected)

### Jobs
- `GET /api/jobs` - Get all jobs (public)
- `GET /api/jobs/:id` - Get specific job (public)
- `POST /api/jobs` - Create job (admin only)
- `PUT /api/jobs/:id` - Update job (admin only)
- `DELETE /api/jobs/:id` - Delete job (admin only)

### Candidates
- `GET /api/candidates/job/:id` - Get candidates for a job
- `POST /api/candidates/job/:id/upload` - Upload resumes (admin only)
- `POST /api/candidates/:id/schedule` - Schedule interview (admin only)

### Search
- `GET /api/search/jobs` - Search jobs
- `GET /api/search/candidates` - Search candidates
- `GET /api/search/unified` - Unified search
- `GET /api/search/suggestions/jobs` - Job suggestions
- `GET /api/search/suggestions/candidates` - Candidate suggestions

## Role-Based Access Control

### Admin Role
- Create, update, delete jobs
- Upload and analyze resumes
- Schedule interviews
- Access all candidate data

### User Role
- View jobs
- Apply to jobs
- View own applications

## Environment Variables

Create a `.env` file in the backend directory:

```
MONGODB_URI=mongodb://localhost:27017/voicehire
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
GROQ_API_KEY=your_groq_api_key
LIVEKIT_API_KEY=your_livekit_key
LIVEKIT_API_SECRET=your_livekit_secret
PORT=5000
```

## Running the Backend

```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Production mode
npm start
```

## Key Features

1. **MVC Architecture**: Clean separation of concerns
2. **Role-Based Access**: Admin and User roles with different permissions
3. **AI Resume Analysis**: Groq AI integration for resume processing
4. **RESTful API**: Standard REST endpoints
5. **Authentication**: JWT-based authentication
6. **File Upload**: Multer for resume uploads
7. **Search**: Advanced search with text indexing
