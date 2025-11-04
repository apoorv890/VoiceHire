# VoiceHire - Complete Project Documentation

> **Last Updated:** October 30, 2025  
> **Status:** ✅ Production Ready

---

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Recent Updates & Bug Fixes](#recent-updates--bug-fixes)
4. [Features](#features)
5. [Installation & Setup](#installation--setup)
6. [API Documentation](#api-documentation)
7. [Security](#security)
8. [Best Practices](#best-practices)

---

## 🎯 Project Overview

**VoiceHire** is a modern AI-powered recruitment platform that streamlines the hiring process with intelligent resume screening, automated candidate matching, and voice-based interviews.

### Tech Stack

**Frontend:**
- React 18 + TypeScript
- React Router v6
- Tailwind CSS
- Vite (Build tool)
- LiveKit (Voice interviews)

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Groq AI (Resume analysis)
- Multer (File uploads)

---

## 🏗️ Architecture

### Project Structure

```
VoiceHire/
├── frontend/                    # React TypeScript Application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── dashboard/      # Dashboard components
│   │   │   │   ├── AdminDashboard.tsx
│   │   │   │   ├── UserDashboard.tsx
│   │   │   │   ├── MetricCard.tsx
│   │   │   │   ├── JobStatusChart.tsx
│   │   │   │   ├── ApplicationStatus.tsx
│   │   │   │   └── RecentActivity.tsx
│   │   │   ├── livekit/        # Interview components
│   │   │   ├── ui/             # UI primitives
│   │   │   ├── Navigation.tsx
│   │   │   ├── JobsList.tsx
│   │   │   ├── CreateJob.tsx
│   │   │   ├── JobDetails.tsx
│   │   │   └── UnifiedSearch.tsx
│   │   ├── pages/              # Page components
│   │   │   ├── Dashboard.tsx   # Role-based dashboard
│   │   │   ├── AuthPage.tsx
│   │   │   └── SearchPage.tsx
│   │   ├── context/            # React Context
│   │   │   └── AuthContext.tsx
│   │   ├── hooks/              # Custom hooks
│   │   │   └── useAuth.ts
│   │   ├── types/              # TypeScript types
│   │   │   └── index.ts
│   │   ├── App.tsx             # Main app with routing
│   │   └── main.tsx            # Entry point
│   └── package.json
│
├── backend/                     # Node.js Express Server
│   ├── server/
│   │   ├── app.js              # Application entry
│   │   ├── config/
│   │   │   └── database.js     # MongoDB connection
│   │   ├── controllers/        # Business logic (Class-based)
│   │   │   ├── JobController.class.js
│   │   │   ├── CandidateController.class.js
│   │   │   └── SearchController.class.js
│   │   ├── models/             # Mongoose models
│   │   │   ├── User.js
│   │   │   ├── Job.js
│   │   │   └── Candidate.js
│   │   ├── routes/             # API routes
│   │   │   ├── auth.js
│   │   │   ├── jobRoutes.js
│   │   │   ├── candidateRoutes.js
│   │   │   ├── searchRoutes.js
│   │   │   └── dashboardRoutes.js
│   │   ├── middleware/         # Custom middleware
│   │   │   └── auth.js
│   │   └── utils/              # Utilities
│   │       └── searchUtils.js
│   ├── agent/                  # AI interview agent
│   ├── uploads/                # Resume storage
│   └── package.json
│
└── PROJECT_DOCUMENTATION.md    # This file
```

### Design Patterns

1. **MVC Pattern** - Backend architecture
2. **Provider Pattern** - AuthProvider for state management
3. **Custom Hooks Pattern** - Reusable logic (useAuth)
4. **Higher-Order Component** - ProtectedRoute wrapper
5. **Singleton Pattern** - Controller instances
6. **Repository Pattern** - Models abstract database

---

## 🔄 Recent Updates & Bug Fixes

### ✅ Dashboard Implementation (Latest)

**Date:** October 30, 2025

#### Features Added:
1. **Role-Based Dashboards**
   - **Admin Dashboard**: Job management metrics, candidate analytics
   - **User Dashboard**: Application tracking, interview status

2. **Real-Time Metrics**
   - Auto-refresh every 30 seconds
   - Live data from MongoDB
   - No hardcoded values

3. **Dashboard Components Created:**
   - `AdminDashboard.tsx` - Recruiter overview
   - `UserDashboard.tsx` - Candidate overview
   - `MetricCard.tsx` - Reusable metric display
   - `JobStatusChart.tsx` - Job distribution visualization
   - `ApplicationStatus.tsx` - Application progress
   - `RecentActivity.tsx` - Recent jobs/applications

4. **Backend API Endpoints:**
   - `GET /api/dashboard/admin` - Admin statistics
   - `GET /api/dashboard/user` - User statistics

5. **Access Control:**
   - Resume upload restricted to admins only
   - Candidate panel restricted to admins only
   - Interview scheduling admin-only

#### Admin Dashboard Metrics:
- Total Jobs
- Active Positions
- Total Candidates
- Interviews Scheduled
- Job Distribution Chart
- Recent Job Postings

#### User Dashboard Metrics:
- Total Applications
- Interviews Scheduled
- Average Match Score
- Applications Reviewed
- Application Progress Chart
- Recent Applications

### ✅ Infinite Loop Bug Fix (Critical)

**Issue:** "Maximum update depth exceeded" error causing application crashes

**Root Causes Identified:**
1. `ProtectedRoute` was passing location state causing re-renders
2. `AuthPage` was checking both localStorage and AuthContext
3. Circular dependencies between route guards and authentication

**Solutions Implemented:**

1. **App.tsx Changes:**
   ```typescript
   // BEFORE (Caused infinite loop)
   <Route path="/auth" element={
     isAuthenticated ? <Navigate to="/" replace /> : <AuthPage />
   } />
   
   // AFTER (Fixed)
   <Route path="/auth" element={<AuthPage />} />
   ```

2. **ProtectedRoute Simplified:**
   ```typescript
   // Removed location state passing
   const ProtectedRoute = ({ children, adminOnly = false }) => {
     const { isAuthenticated, user } = useAuth();
     
     if (!isAuthenticated) {
       return <Navigate to="/auth" replace />;
     }
     
     if (adminOnly && user?.role !== 'admin') {
       return <Navigate to="/" replace />;
     }
     
     return <>{children}</>;
   };
   ```

3. **AuthPage Refactored:**
   ```typescript
   // Use AuthContext instead of localStorage
   const { isAuthenticated, setIsAuthenticated, setUser } = useAuth();
   
   useEffect(() => {
     if (isAuthenticated) {
       navigate('/', { replace: true });
     }
   }, [isAuthenticated, navigate]);
   
   // After login, update context (navigation happens automatically)
   setIsAuthenticated(true);
   setUser(data.user);
   ```

**Result:** ✅ No more infinite loops, clean authentication flow

### ✅ Navigation Updates

1. Added "Dashboard" as home page
2. Separated "Jobs" link for job listings
3. Updated mobile menu
4. Consistent routing across app

---

## 🎨 Features

### 1. **Authentication & Authorization**
- JWT-based authentication
- Role-based access control (Admin/User)
- Secure password hashing with bcrypt
- Protected routes on frontend and backend
- Multi-tab session synchronization

### 2. **Job Management** (Admin Only)
- Create job postings
- Edit job details
- Delete jobs
- View all candidates per job
- Job status management (active/draft/closed)

### 3. **Resume Processing** (Admin Only)
- Upload multiple resumes (up to 5 at once)
- AI-powered resume analysis using Groq
- Automatic candidate matching
- ATS score calculation
- Match explanation generation

### 4. **Candidate Management** (Admin Only)
- View all candidates
- Sort by name or match score
- Schedule voice interviews
- Track interview status

### 5. **Dashboard Analytics**
- **Admin View:**
  - Total jobs, active positions
  - Total candidates, interviews scheduled
  - Job distribution charts
  - Recent job postings with candidate counts
  
- **User View:**
  - Total applications, interview status
  - Average match score
  - Application progress tracking
  - Recent applications with match scores

### 6. **Search Functionality**
- Unified search (jobs + candidates)
- Type-ahead suggestions
- Real-time search results
- Filter by department, location, status

### 7. **Voice Interviews** (Admin Only)
- LiveKit integration
- Real-time voice communication
- Interview scheduling
- Interview room management

### 8. **Responsive Design**
- Mobile-friendly interface
- Adaptive layouts
- Touch-optimized controls
- Modern UI with Tailwind CSS

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v18+)
- MongoDB (local or Atlas)
- npm or yarn

### Environment Variables

**Backend (.env):**
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
GROQ_API_KEY=your_groq_api_key
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
LIVEKIT_URL=your_livekit_server_url
```

### Installation Steps

1. **Clone Repository:**
   ```bash
   git clone <repository-url>
   cd VoiceHire
   ```

2. **Install Backend Dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies:**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Start Backend Server:**
   ```bash
   cd backend
   npm run dev
   # Runs on http://localhost:5000
   ```

5. **Start Frontend Server:**
   ```bash
   cd frontend
   npm run dev
   # Runs on http://localhost:3001
   ```

6. **Access Application:**
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:5000

---

## 📡 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "role": "admin" | "user"
}

Response: 201 Created
{
  "message": "User registered successfully",
  "token": "jwt_token",
  "user": { "id", "fullName", "email", "role" }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}

Response: 200 OK
{
  "message": "Login successful",
  "token": "jwt_token",
  "user": { "id", "fullName", "email", "role" }
}
```

### Job Endpoints

#### Get All Jobs (Public)
```http
GET /api/jobs

Response: 200 OK
[
  {
    "_id": "job_id",
    "title": "Software Engineer",
    "company": "Tech Corp",
    "department": "Engineering",
    "location": "Remote",
    "description": "...",
    "requirements": "...",
    "status": "active",
    "createdAt": "2025-10-30T00:00:00.000Z"
  }
]
```

#### Create Job (Admin Only)
```http
POST /api/jobs
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Software Engineer",
  "company": "Tech Corp",
  "department": "Engineering",
  "location": "Remote",
  "description": "Job description",
  "requirements": "Job requirements",
  "status": "active"
}

Response: 201 Created
```

#### Update Job (Admin Only)
```http
PUT /api/jobs/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "status": "closed"
}

Response: 200 OK
```

#### Delete Job (Admin Only)
```http
DELETE /api/jobs/:id
Authorization: Bearer <token>

Response: 200 OK
{
  "message": "Job deleted successfully"
}
```

### Candidate Endpoints

#### Upload Resumes (Admin Only)
```http
POST /api/jobs/:id/candidates/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

resumes: [file1.pdf, file2.pdf, ...]

Response: 200 OK
{
  "total": 2,
  "processed": 2,
  "failed": 0,
  "candidates": [...]
}
```

#### Get Candidates for Job
```http
GET /api/jobs/:id/candidates
Authorization: Bearer <token>

Response: 200 OK
[
  {
    "_id": "candidate_id",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "atsScore": 85,
    "matchExplanation": "...",
    "resumeUrl": "...",
    "interviewScheduled": false,
    "jobId": "job_id"
  }
]
```

#### Schedule Interview (Admin Only)
```http
POST /api/candidates/:id/schedule
Authorization: Bearer <token>
Content-Type: application/json

{
  "interviewDate": "2025-11-01T10:00:00.000Z"
}

Response: 200 OK
```

### Dashboard Endpoints

#### Admin Dashboard Stats
```http
GET /api/dashboard/admin
Authorization: Bearer <token>

Response: 200 OK
{
  "totalJobs": 10,
  "activeJobs": 5,
  "totalCandidates": 50,
  "interviewsScheduled": 8,
  "jobsByStatus": {
    "active": 5,
    "draft": 3,
    "closed": 2
  },
  "recentJobs": [...]
}
```

#### User Dashboard Stats
```http
GET /api/dashboard/user
Authorization: Bearer <token>

Response: 200 OK
{
  "totalApplications": 5,
  "activeApplications": 3,
  "interviewsScheduled": 2,
  "avgMatchScore": 78,
  "applicationsByStatus": {
    "pending": 3,
    "interviewed": 2,
    "rejected": 0
  },
  "recentApplications": [...]
}
```

### Search Endpoints

#### Unified Search
```http
GET /api/unified-search?query=engineer

Response: 200 OK
{
  "jobs": [...],
  "candidates": [...]
}
```

---

## 🔐 Security

### Authentication Flow
1. User registers/logs in
2. Server generates JWT token
3. Token stored in localStorage
4. Token sent in Authorization header for protected routes
5. Server validates token and extracts user info
6. Access granted/denied based on role

### Middleware Protection

**authenticate** - Verifies JWT token
```javascript
router.get('/protected', authenticate, handler);
```

**requireAdmin** - Ensures user is admin
```javascript
router.post('/admin-only', authenticate, requireAdmin, handler);
```

**requireAuth** - Ensures user is authenticated
```javascript
router.get('/user-data', requireAuth, handler);
```

### Password Security
- Passwords hashed with bcrypt (10 salt rounds)
- Never stored in plain text
- Secure comparison during login

### CORS Configuration
- Configured for development (localhost)
- Should be restricted in production

---

## 📚 Best Practices Implemented

### Frontend
1. ✅ **TypeScript** - Type safety throughout
2. ✅ **Component Composition** - Reusable components
3. ✅ **Custom Hooks** - Logic extraction (useAuth)
4. ✅ **Context API** - Global state management
5. ✅ **Protected Routes** - Route-level security
6. ✅ **Error Handling** - Try-catch blocks
7. ✅ **Loading States** - User feedback
8. ✅ **Responsive Design** - Mobile-first approach

### Backend
1. ✅ **MVC Architecture** - Separation of concerns
2. ✅ **Class-Based Controllers** - Organized logic
3. ✅ **Middleware Pattern** - Reusable auth logic
4. ✅ **Error Handling** - Centralized error responses
5. ✅ **Input Validation** - Data sanitization
6. ✅ **Async/Await** - Clean asynchronous code
7. ✅ **Environment Variables** - Secure configuration
8. ✅ **Mongoose Models** - Schema validation

### Code Quality
1. ✅ **DRY Principle** - No code duplication
2. ✅ **Single Responsibility** - Each component/function has one job
3. ✅ **Consistent Naming** - Clear, descriptive names
4. ✅ **Clean Code** - Readable and maintainable
5. ✅ **Documentation** - Comprehensive docs

---

## 🎯 User Flows

### Admin (Recruiter) Flow
1. Register as "Recruiter" (admin role)
2. Login with credentials
3. View dashboard with job metrics
4. Create new job posting
5. Upload candidate resumes (up to 5 at once)
6. AI analyzes resumes and calculates match scores
7. View candidates sorted by match score
8. Schedule voice interviews
9. Track hiring progress on dashboard

### User (Candidate) Flow
1. Register as "Candidate" (user role)
2. Login with credentials
3. View dashboard with application metrics
4. Browse available jobs
5. View job details
6. Track application status
7. See interview schedules
8. Monitor match scores

---

## 🎨 UI/UX Features

### Color Scheme (Maintained Consistently)
- **Primary Blue** (`blue-600`) - Actions, branding
- **Success Green** (`green-600`) - Active, success states
- **Warning Yellow** (`yellow-600`) - Drafts, warnings
- **Danger Red** (`red-600`) - Closed, errors
- **Info Purple** (`purple-600`) - Analytics, scores
- **Accent Orange** (`orange-600`) - Scheduled items

### Design Elements
- Clean, modern interface
- Smooth transitions and animations
- Intuitive navigation
- Visual feedback for actions
- Loading states for async operations
- Error messages with helpful context
- Responsive grid layouts
- Card-based design
- Progress bars and charts

---

## 🔧 Troubleshooting

### Common Issues

**Issue:** Port already in use
```bash
# Find process using port
netstat -ano | findstr :5000
# Kill process
taskkill /F /PID <process_id>
```

**Issue:** MongoDB connection failed
- Check MongoDB is running
- Verify connection string in .env
- Ensure network access (MongoDB Atlas)

**Issue:** Frontend not loading
- Clear browser cache
- Check console for errors
- Verify backend is running
- Check CORS configuration

**Issue:** Authentication not working
- Verify JWT_SECRET is set
- Check token in localStorage
- Ensure middleware is applied to routes

---

## 📈 Future Enhancements

### Planned Features
1. **Email Notifications** - Automated emails for status updates
2. **Advanced Analytics** - Detailed hiring metrics
3. **Video Interviews** - Add video to voice interviews
4. **Application Tracking** - Detailed candidate journey
5. **Team Collaboration** - Multiple recruiters per job
6. **Calendar Integration** - Sync with Google/Outlook
7. **Resume Templates** - Help candidates create better resumes
8. **Skills Assessment** - Automated technical tests
9. **Referral System** - Employee referral tracking
10. **Mobile App** - Native iOS/Android apps

### Technical Improvements
1. **Unit Testing** - Jest + React Testing Library
2. **E2E Testing** - Playwright/Cypress
3. **API Documentation** - Swagger/OpenAPI
4. **Performance Optimization** - Code splitting, lazy loading
5. **Caching** - Redis for frequently accessed data
6. **Logging** - Winston for structured logging
7. **Monitoring** - Application performance monitoring
8. **CI/CD Pipeline** - Automated deployment
9. **Docker** - Containerization
10. **Kubernetes** - Orchestration for scaling

---

## 📝 Changelog

### v2.0.0 (October 30, 2025)
- ✅ Added role-based dashboards
- ✅ Fixed infinite loop authentication bug
- ✅ Implemented real-time metrics
- ✅ Added dashboard API endpoints
- ✅ Restricted resume upload to admins
- ✅ Updated navigation structure
- ✅ Improved authentication flow

### v1.0.0 (Previous)
- ✅ Initial release
- ✅ MVC architecture implementation
- ✅ Role-based access control
- ✅ AI resume processing
- ✅ Voice interview integration
- ✅ Search functionality
- ✅ Job management system

---

## 👥 Contributing

### Development Workflow
1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request
5. Code review
6. Merge to main

### Code Standards
- Follow existing patterns
- Write TypeScript for type safety
- Add comments for complex logic
- Update documentation
- Test before committing

---

## 📄 License

This project is proprietary and confidential.

---

## 🙏 Acknowledgments

- **Groq AI** - Resume analysis
- **LiveKit** - Voice interview infrastructure
- **MongoDB Atlas** - Cloud database
- **Tailwind CSS** - UI framework
- **React Team** - Frontend framework

---

## 📞 Support

For issues or questions:
1. Check this documentation
2. Review error logs
3. Check browser console
4. Verify environment variables
5. Ensure all services are running

---

**VoiceHire - Revolutionizing Recruitment with AI** 🚀

*Last Updated: October 30, 2025*
