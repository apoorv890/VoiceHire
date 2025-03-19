import React, { useState } from 'react';
import { Filter, X, Sliders } from 'lucide-react';
import SearchBar from './ui/search-bar';
import { Button } from './ui/button';

interface Candidate {
  _id: string;
  name: string;
  email: string;
  atsScore: number;
  matchExplanation: string;
  resumeUrl: string;
  callScheduled: boolean;
  scheduledAt: string | null;
}

interface CandidateSearchProps {
  jobId?: string;
  onSearchResults: (candidates: Candidate[]) => void;
  className?: string;
}

const CandidateSearch: React.FC<CandidateSearchProps> = ({ 
  jobId, 
  onSearchResults, 
  className = '' 
}) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [minScore, setMinScore] = useState<string>('');
  const [maxScore, setMaxScore] = useState<string>('');
  const [useSemanticSearch, setUseSemanticSearch] = useState(false);
  
  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);
    await performSearch(searchQuery);
  };
  
  const performSearch = async (searchQuery: string = query) => {
    setIsLoading(true);
    
    try {
      if (useSemanticSearch) {
        // Use semantic search API
        const response = await fetch('http://localhost:5000/api/search/semantic', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: searchQuery,
            collection: 'candidates',
            limit: 20
          }),
        });
        
        if (!response.ok) {
          throw new Error('Semantic search failed');
        }
        
        const results = await response.json();
        onSearchResults(results);
      } else {
        // Use regular search API
        const params = new URLSearchParams();
        if (searchQuery) params.append('query', searchQuery);
        if (jobId) params.append('jobId', jobId);
        if (minScore) params.append('minScore', minScore);
        if (maxScore) params.append('maxScore', maxScore);
        
        const response = await fetch(`http://localhost:5000/api/search/candidates?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Search failed');
        }
        
        const results = await response.json();
        onSearchResults(results);
      }
    } catch (error) {
      console.error('Error searching candidates:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const getSuggestions = async (prefix: string): Promise<string[]> => {
    if (prefix.length < 2) return [];
    
    try {
      const params = new URLSearchParams();
      params.append('prefix', prefix);
      if (jobId) params.append('jobId', jobId);
      
      const response = await fetch(`http://localhost:5000/api/search/suggestions/candidates?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      return [];
    }
  };
  
  const handleFilterChange = async () => {
    await performSearch();
  };
  
  const clearFilters = () => {
    setMinScore('');
    setMaxScore('');
    setUseSemanticSearch(false);
    performSearch();
  };
  
  const hasActiveFilters = minScore || maxScore || useSemanticSearch;
  
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center space-x-2">
        <SearchBar
          placeholder="Search for candidates..."
          onSearch={handleSearch}
          getSuggestions={getSuggestions}
          className="flex-1"
        />
        
        <Button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2 ${showFilters ? 'bg-blue-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          aria-label="Toggle filters"
        >
          <Filter className="h-5 w-5" />
        </Button>
        
        {hasActiveFilters && (
          <Button
            type="button"
            onClick={clearFilters}
            className="p-2 bg-red-100 text-red-600 hover:bg-red-200"
            aria-label="Clear filters"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>
      
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-md border border-gray-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="minScore" className="block text-sm font-medium text-gray-700 mb-1">
                Minimum ATS Score
              </label>
              <input
                id="minScore"
                type="number"
                min="0"
                max="100"
                value={minScore}
                onChange={(e) => {
                  setMinScore(e.target.value);
                  handleFilterChange();
                }}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label htmlFor="maxScore" className="block text-sm font-medium text-gray-700 mb-1">
                Maximum ATS Score
              </label>
              <input
                id="maxScore"
                type="number"
                min="0"
                max="100"
                value={maxScore}
                onChange={(e) => {
                  setMaxScore(e.target.value);
                  handleFilterChange();
                }}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div className="flex items-end">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useSemanticSearch}
                  onChange={(e) => {
                    setUseSemanticSearch(e.target.checked);
                    handleFilterChange();
                  }}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <span className="text-sm font-medium text-gray-700 flex items-center">
                  <Sliders className="h-4 w-4 mr-1" />
                  Use AI Semantic Search
                </span>
              </label>
            </div>
          </div>
        </div>
      )}
      
      {isLoading && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
};

export default CandidateSearch;
