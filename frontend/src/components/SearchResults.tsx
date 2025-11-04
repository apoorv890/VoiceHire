import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, User, ChevronRight } from 'lucide-react';

interface BadgeProps {
  variant?: 'default' | 'outline' | 'destructive' | 'success';
  className?: string;
  children: React.ReactNode;
}

const Badge: React.FC<BadgeProps> = ({ 
  variant = 'default', 
  className = '', 
  children 
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'default':
        return 'bg-blue-500 text-white';
      case 'outline':
        return 'bg-white text-gray-700 border border-gray-300';
      case 'destructive':
        return 'bg-red-500 text-white';
      case 'success':
        return 'bg-green-500 text-white';
      default:
        return 'bg-blue-500 text-white';
    }
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getVariantClasses()} ${className}`}>
      {children}
    </span>
  );
};

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

interface SearchResultsProps {
  jobs: Job[];
  candidates: Candidate[];
  onJobSelect?: (job: Job) => void;
  onCandidateSelect?: (candidate: Candidate) => void;
  showEmptyMessage?: boolean;
  query?: string;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  jobs,
  candidates,
  onJobSelect,
  onCandidateSelect,
  showEmptyMessage = true,
  query = ''
}) => {
  const hasResults = jobs.length > 0 || candidates.length > 0;

  if (!hasResults && showEmptyMessage) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">No results found for "{query}"</p>
        <p className="text-sm text-gray-400 mt-2">Try adjusting your search terms</p>
      </div>
    );
  }

  const handleJobClick = (job: Job) => {
    if (onJobSelect) {
      onJobSelect(job);
    }
  };

  const handleCandidateClick = (candidate: Candidate) => {
    if (onCandidateSelect) {
      onCandidateSelect(candidate);
    }
  };

  return (
    <div className="divide-y divide-gray-200">
      {jobs.length > 0 && (
        <div>
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center text-sm font-medium text-gray-700">
              <Briefcase className="h-4 w-4 mr-2" />
              <span>Jobs</span>
              <Badge variant="outline" className="ml-2 bg-blue-50">
                {jobs.length}
              </Badge>
            </div>
          </div>
          <ul>
            {jobs.map((job) => (
              <li key={job._id} className="border-b border-gray-100 last:border-b-0">
                <Link 
                  to={`/jobs/${job._id}`}
                  className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                  onClick={() => handleJobClick(job)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{job.title}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        {job.department} • {job.location}
                      </div>
                      <div className="mt-1">
                        <Badge 
                          variant={job.status === 'active' ? 'default' : job.status === 'closed' ? 'destructive' : 'outline'}
                          className="text-xs"
                        >
                          {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {candidates.length > 0 && (
        <div>
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center text-sm font-medium text-gray-700">
              <User className="h-4 w-4 mr-2" />
              <span>Candidates</span>
              <Badge variant="outline" className="ml-2 bg-green-50">
                {candidates.length}
              </Badge>
            </div>
          </div>
          <ul>
            {candidates.map((candidate) => (
              <li key={candidate._id} className="border-b border-gray-100 last:border-b-0">
                <Link 
                  to={`/jobs/${candidate.jobId?._id}`}
                  className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                  onClick={() => handleCandidateClick(candidate)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{candidate.name}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        {candidate.email}
                      </div>
                      <div className="flex items-center mt-1">
                        <Badge 
                          variant={candidate.atsScore >= 80 ? 'success' : candidate.atsScore >= 60 ? 'default' : 'outline'}
                          className="text-xs"
                        >
                          Match: {candidate.atsScore}%
                        </Badge>
                        {candidate.jobId && (
                          <span className="text-xs text-gray-400 ml-2">
                            Applied for: {candidate.jobId.title}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchResults;
