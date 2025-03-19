import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import SearchResults from './SearchResults';

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

interface UnifiedSearchProps {
  onJobSelect?: (job: Job) => void;
  onCandidateSelect?: (candidate: Candidate) => void;
  className?: string;
  autoFocus?: boolean;
}

const UnifiedSearch: React.FC<UnifiedSearchProps> = ({
  onJobSelect,
  onCandidateSelect,
  className = '',
  autoFocus = false
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ jobs: Job[], candidates: Candidate[] }>({ jobs: [], candidates: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [query]);

  // Perform search when debounced query changes
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults({ jobs: [], candidates: [] });
      return;
    }

    const performSearch = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`http://localhost:5000/api/unified-search?query=${encodeURIComponent(debouncedQuery)}`);
        
        if (!response.ok) {
          throw new Error('Search failed');
        }
        
        const data = await response.json();
        setResults(data);
        setShowResults(true);
      } catch (error) {
        console.error('Error performing unified search:', error);
        setResults({ jobs: [], candidates: [] });
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (e.target.value.length === 0) {
      setResults({ jobs: [], candidates: [] });
      setShowResults(false);
    }
  };

  const handleJobClick = (job: Job) => {
    if (onJobSelect) {
      onJobSelect(job);
    }
    setShowResults(false);
  };

  const handleCandidateClick = (candidate: Candidate) => {
    if (onCandidateSelect) {
      onCandidateSelect(candidate);
    }
    setShowResults(false);
  };

  const clearSearch = () => {
    setQuery('');
    setResults({ jobs: [], candidates: [] });
    setShowResults(false);
  };

  const hasResults = results.jobs.length > 0 || results.candidates.length > 0;

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Search jobs or candidates..."
          className="w-full px-4 py-2 pl-10 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          autoFocus={autoFocus}
          onFocus={() => query.length >= 2 && hasResults && setShowResults(true)}
        />
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        
        {query && (
          <button 
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        
        {isLoading && (
          <div className="absolute inset-y-0 right-10 flex items-center pr-3">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        )}
      </div>

      {showResults && hasResults && (
        <div className="absolute z-50 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-96 overflow-auto">
          <SearchResults 
            jobs={results.jobs}
            candidates={results.candidates}
            onJobSelect={handleJobClick}
            onCandidateSelect={handleCandidateClick}
            query={query}
          />
        </div>
      )}
    </div>
  );
};

export default UnifiedSearch;
