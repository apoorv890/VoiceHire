import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Briefcase, Plus, Headphones, Search, X } from 'lucide-react';
import { Button } from './ui/button';
import UnifiedSearch from './UnifiedSearch';

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
  const [showSearch, setShowSearch] = useState(false);

  const handleJobSelect = (job: Job) => {
    navigate(`/jobs/${job._id}`);
  };

  const handleCandidateSelect = (candidate: Candidate) => {
    navigate(`/jobs/${candidate.jobId._id}`);
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Briefcase className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-semibold">HR Portal</span>
          </Link>
          
          {/* Mobile search toggle */}
          <div className="md:hidden">
            <Button 
              onClick={() => setShowSearch(!showSearch)} 
              className="p-2 bg-transparent hover:bg-gray-100 text-gray-800"
              aria-label={showSearch ? "Close search" : "Open search"}
            >
              {showSearch ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
            </Button>
          </div>
          
          {/* Desktop search */}
          <div className="hidden md:block md:w-1/3 lg:w-2/5">
            <UnifiedSearch 
              onJobSelect={handleJobSelect}
              onCandidateSelect={handleCandidateSelect}
            />
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/">
              <Button className="bg-transparent hover:bg-gray-100 text-gray-800">Jobs</Button>
            </Link>
            <Link to="/audio-conference">
              <Button className="bg-transparent hover:bg-gray-100 text-gray-800 flex items-center space-x-2">
                <Headphones className="h-4 w-4" />
                <span>Audio Conference</span>
              </Button>
            </Link>
            <Link to="/create-job">
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Create Job</span>
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Mobile search expanded */}
        {showSearch && (
          <div className="md:hidden py-3 pb-4">
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
      </div>
    </nav>
  );
}

export default Navigation