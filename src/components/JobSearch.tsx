import React, { useState, useEffect } from 'react';
import { Filter, X } from 'lucide-react';
import SearchBar from './ui/search-bar';
import { Button } from './ui/button';
import { getApiUrl, getDefaultHeaders } from '@/utils/apiConfig';

interface Job {
  _id: string;
  title: string;
  department: string;
  location: string;
  status: string;
}

interface JobSearchProps {
  onSearchResults: (jobs: Job[]) => void;
  className?: string;
}

const JobSearch: React.FC<JobSearchProps> = ({ onSearchResults, className = '' }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [departments, setDepartments] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  
  // Filter states
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  
  // Load unique departments and locations for filters
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const response = await fetch(getApiUrl('/api/jobs'));
        if (!response.ok) {
          throw new Error('Failed to fetch jobs');
        }
        
        const jobs = await response.json();
        
        // Extract unique departments and locations
        const uniqueDepartments = [...new Set(jobs.map((job: Job) => job.department))] as string[];
        const uniqueLocations = [...new Set(jobs.map((job: Job) => job.location))] as string[];
        
        setDepartments(uniqueDepartments);
        setLocations(uniqueLocations);
      } catch (error) {
        console.error('Error fetching filter options:', error);
      }
    };
    
    fetchFilterOptions();
  }, []);
  
  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);
    await performSearch(searchQuery);
  };
  
  const performSearch = async (searchQuery: string = query) => {
    setIsLoading(true);
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (selectedDepartment) params.append('department', selectedDepartment);
      if (selectedLocation) params.append('location', selectedLocation);
      if (selectedStatus) params.append('status', selectedStatus);
      
      const response = await fetch(getApiUrl(`/api/search/jobs?${params.toString()}`));
      
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      const results = await response.json();
      onSearchResults(results);
    } catch (error) {
      console.error('Error searching jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const getSuggestions = async (prefix: string): Promise<string[]> => {
    if (prefix.length < 2) return [];
    
    try {
      const response = await fetch(getApiUrl(`/api/search/suggestions/jobs?prefix=${encodeURIComponent(prefix)}`));
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
    setSelectedDepartment('');
    setSelectedLocation('');
    setSelectedStatus('');
    performSearch();
  };
  
  const hasActiveFilters = selectedDepartment || selectedLocation || selectedStatus;
  
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center space-x-2">
        <SearchBar
          placeholder="Search for jobs..."
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
              <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <select
                id="department"
                value={selectedDepartment}
                onChange={(e) => {
                  setSelectedDepartment(e.target.value);
                  handleFilterChange();
                }}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <select
                id="location"
                value={selectedLocation}
                onChange={(e) => {
                  setSelectedLocation(e.target.value);
                  handleFilterChange();
                }}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">All Locations</option>
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  handleFilterChange();
                }}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
              </select>
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

export default JobSearch;
