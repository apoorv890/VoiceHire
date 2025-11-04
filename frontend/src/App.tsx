import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense, memo } from 'react';
import Navigation from './components/Navigation';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';

// Lazy load route components for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const JobsList = lazy(() => import('./components/JobsList'));
const CreateJob = lazy(() => import('./components/CreateJob'));
const JobDetails = lazy(() => import('./components/JobDetails'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));

// Protected route component
interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute = memo(({ children, adminOnly = false }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
});

// App Routes Component
const AppRoutes = () => {
  const { isAuthenticated } = useAuth();
  
  return (
    <div className="min-h-screen bg-gray-50">
      {isAuthenticated && <Navigation />}
      <div className={isAuthenticated ? "container mx-auto px-4 py-8" : ""}>
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          </div>
        }>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/jobs" element={
              <ProtectedRoute>
                <JobsList />
              </ProtectedRoute>
            } />
            <Route path="/create-job" element={
              <ProtectedRoute adminOnly={true}>
                <CreateJob />
              </ProtectedRoute>
            } />
            <Route path="/jobs/:id" element={
              <ProtectedRoute>
                <JobDetails />
              </ProtectedRoute>
            } />
            <Route path="/search" element={
              <ProtectedRoute>
                <SearchPage />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;