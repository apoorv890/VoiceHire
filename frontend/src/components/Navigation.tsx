import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Briefcase, Plus, Search, X, Menu, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import UnifiedSearch from './UnifiedSearch';
import { useAuth } from '../hooks/useAuth';

interface Job {
  _id: string;
  title: string;
  department: string;
  location: string;
  status: string;
}

interface Candidate {
  _id: string;
  name: string;
  email: string;
  atsScore: number;
  jobId: {
    _id: string;
    title: string;
    department: string;
  };
}

const Navigation = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [showSearch, setShowSearch] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const isAdmin = user?.role === 'admin';

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  const handleJobSelect = useCallback((job: Job) => {
    navigate(`/jobs/${job._id}`);
  }, [navigate]);

  const handleCandidateSelect = useCallback((candidate: Candidate) => {
    navigate(`/jobs/${candidate.jobId._id}`);
  }, [navigate]);

  // Handle logout
  const handleLogout = useCallback(() => {
    logout();
    navigate('/auth');
  }, [logout, navigate]);

  return (
    <nav className={`bg-white backdrop-blur-sm sticky top-0 z-50 transition-all duration-300 ${
      scrolled ? 'shadow-lg bg-white/90' : 'shadow-md'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2 group">
            <Briefcase className="h-6 w-6 text-blue-600 transition-transform duration-300 group-hover:scale-110" />
            <span className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">VoiceHire</span>
          </Link>
          
          {/* Mobile menu and search toggle */}
          <div className="flex items-center space-x-2 md:hidden">
            <Button 
              onClick={() => setShowSearch(!showSearch)} 
              className="p-2 bg-transparent hover:bg-blue-50 text-blue-600 rounded-full transition-colors duration-200"
              aria-label={showSearch ? "Close search" : "Open search"}
            >
              {showSearch ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
            </Button>
            <Button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 bg-transparent hover:bg-blue-50 text-blue-600 rounded-full transition-colors duration-200"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Desktop search */}
          <div className="hidden md:block md:w-1/3 lg:w-2/5">
            <UnifiedSearch 
              onJobSelect={handleJobSelect}
              onCandidateSelect={handleCandidateSelect}
            />
          </div>
          
          <div className="hidden md:flex items-center space-x-3">
            <Link to="/">
              <Button className="bg-transparent hover:bg-blue-50 text-blue-700 rounded-lg px-4 py-2 transition-all duration-200 hover:shadow-sm">Dashboard</Button>
            </Link>
            <Link to="/jobs">
              <Button className="bg-transparent hover:bg-blue-50 text-blue-700 rounded-lg px-4 py-2 transition-all duration-200 hover:shadow-sm">Jobs</Button>
            </Link>

            {isAdmin && (
              <Link to="/create-job">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 transition-all duration-200 hover:shadow-md flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Create Job</span>
                </Button>
              </Link>
            )}
            <Button 
              onClick={handleLogout}
              className="bg-red-50 hover:bg-red-100 text-red-600 rounded-lg px-4 py-2 transition-all duration-200 hover:shadow-sm flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
        
        {/* Mobile search expanded */}
        {showSearch && (
          <div className="md:hidden py-3 pb-4 animate-fadeIn">
            <UnifiedSearch 
              onJobSelect={(job) => {
                handleJobSelect(job);
                setShowSearch(false);
              }}
              onCandidateSelect={(candidate) => {
                handleCandidateSelect(candidate);
                setShowSearch(false);
              }}
              autoFocus={true}
            />
          </div>
        )}

        {/* Mobile menu expanded */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 pb-4 border-t border-gray-100 animate-slideDown">
            <div className="flex flex-col space-y-2">
              <Link 
                to="/" 
                className="px-4 py-2 text-blue-700 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link 
                to="/jobs" 
                className="px-4 py-2 text-blue-700 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                Jobs
              </Link>

              {isAdmin && (
                <Link 
                  to="/create-job" 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg transition-colors duration-200 flex items-center space-x-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Job</span>
                </Link>
              )}
              <button 
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 flex items-center space-x-2"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
