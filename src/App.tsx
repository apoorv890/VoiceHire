import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect, createContext, useContext } from 'react';
import JobsList from './components/JobsList';
import CreateJob from './components/CreateJob';
import JobDetails from './components/JobDetails';
import Navigation from './components/Navigation';
import LiveKitPage from './components/LiveKitPage';
import SearchPage from './pages/SearchPage';
import AuthPage from './pages/AuthPage';

// Create authentication context
interface AuthContextType {
  isAuthenticated: boolean;
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  setIsAuthenticated: () => {},
  logout: () => {},
});

// Custom hook to use auth context
export const useAuth = () => useContext(AuthContext);

// Protected route component
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    // Redirect to auth page if not authenticated
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    // Trigger storage event for multi-tab support
    window.dispatchEvent(new Event('storage'));
  };
  
  useEffect(() => {
    // Check if user is authenticated on component mount
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
    
    // Set up event listener for storage changes (for multi-tab support)
    const handleStorageChange = () => {
      const token = localStorage.getItem('token');
      setIsAuthenticated(!!token);
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, logout }}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          {isAuthenticated && <Navigation />}
          <div className={isAuthenticated ? "container mx-auto px-4 py-8" : ""}>
            <Routes>
              {/* Public route */}
              <Route path="/auth" element={
                isAuthenticated ? <Navigate to="/" replace /> : <AuthPage />
              } />
              
              {/* Protected routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <JobsList />
                </ProtectedRoute>
              } />
              <Route path="/create-job" element={
                <ProtectedRoute>
                  <CreateJob />
                </ProtectedRoute>
              } />
              <Route path="/jobs/:id" element={
                <ProtectedRoute>
                  <JobDetails />
                </ProtectedRoute>
              } />
              <Route path="/audio-conference" element={
                <ProtectedRoute>
                  <LiveKitPage />
                </ProtectedRoute>
              } />
              <Route path="/search" element={
                <ProtectedRoute>
                  <SearchPage />
                </ProtectedRoute>
              } />
              
              {/* Redirect any unknown routes to home or auth page based on authentication status */}
              <Route path="*" element={
                isAuthenticated ? <Navigate to="/" replace /> : <Navigate to="/auth" replace />
              } />
            </Routes>
          </div>
        </div>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;