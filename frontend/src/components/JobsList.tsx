import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Briefcase, MapPin, Building2, Plus, Filter } from 'lucide-react';
import { Button } from './ui/button';
import FilterPanel, { FilterConfig } from './FilterPanel';
import { useAuth } from '../hooks/useAuth';

interface Job {
  _id: string;
  title: string;
  department: string;
  location: string;
  status: string;
}

const JobsList = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<Record<string, any>>({
    status: '',
    department: '',
    location: '',
  });

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/jobs');
        if (!response.ok) {
          throw new Error('Failed to fetch jobs');
        }
        const data = await response.json();
        setJobs(data);
      } catch (error) {
        console.error('Error fetching jobs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  // Get unique departments and locations for filter options
  const filterOptions = useMemo(() => {
    const departments = Array.from(new Set(jobs.map(j => j.department).filter(Boolean)));
    const locations = Array.from(new Set(jobs.map(j => j.location).filter(Boolean)));
    
    return {
      departments: departments.map(d => ({ label: d, value: d })),
      locations: locations.map(l => ({ label: l, value: l })),
    };
  }, [jobs]);

  // Filter configuration
  const filterConfig: FilterConfig[] = [
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Draft', value: 'draft' },
        { label: 'Closed', value: 'closed' },
      ],
      value: filters.status,
    },
    {
      id: 'department',
      label: 'Department',
      type: 'select',
      options: filterOptions.departments,
      value: filters.department,
    },
    {
      id: 'location',
      label: 'Location',
      type: 'select',
      options: filterOptions.locations,
      value: filters.location,
    },
  ];

  // Apply filters to jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      if (filters.status && job.status !== filters.status) return false;
      if (filters.department && job.department !== filters.department) return false;
      if (filters.location && job.location !== filters.location) return false;
      return true;
    });
  }, [jobs, filters]);

  const handleFilterChange = useCallback((filterId: string, value: any) => {
    setFilters(prev => ({ ...prev, [filterId]: value }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      status: '',
      department: '',
      location: '',
    });
  }, []);

  const hasActiveFilters = Object.values(filters).some(v => v !== '' && v !== null && v !== undefined);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Job Openings</h1>
            <p className="text-gray-600">Discover exciting opportunities and find your perfect role</p>
          </div>
          <div className="flex items-center gap-3 relative">
            <Button 
              onClick={() => setFilterOpen(!filterOpen)}
              className={`bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg px-4 py-2 flex items-center gap-2 transition-all ${
                hasActiveFilters ? 'ring-2 ring-blue-500 border-blue-500' : ''
              }`}
            >
              <Filter className="h-4 w-4" />
              Filter
              {hasActiveFilters && (
                <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full ml-1">
                  {Object.values(filters).filter(v => v !== '' && v !== null).length}
                </span>
              )}
            </Button>
            
            <FilterPanel
              filters={filterConfig}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              isOpen={filterOpen}
              onClose={() => setFilterOpen(false)}
            />
            {isAdmin && (
              <Link to="/create-job">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 flex items-center gap-2 shadow-sm">
                  <Plus className="h-4 w-4" />
                  Post a Job
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading opportunities...</p>
          </div>
        </div>
      ) : filteredJobs.length === 0 && jobs.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12">
          <div className="text-center max-w-md mx-auto">
            <div className="bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Filter className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No jobs match your filters</h3>
            <p className="text-gray-600 mb-6">Try adjusting your filter criteria</p>
            <Button 
              onClick={handleClearFilters}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-3"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12">
          <div className="text-center max-w-md mx-auto">
            <div className="bg-blue-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Briefcase className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No job postings yet</h3>
            <p className="text-gray-600 mb-6">Get started by creating your first job posting</p>
            <Link to="/create-job">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-3 flex items-center gap-2 mx-auto">
                <Plus className="h-5 w-5" />
                Create Your First Job
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Bar */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-6 border border-blue-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-blue-600" />
                <span className="text-gray-700 font-medium">
                  {hasActiveFilters ? (
                    <>{filteredJobs.length} of {jobs.length} {jobs.length === 1 ? 'Position' : 'Positions'}</>
                  ) : (
                    <>{jobs.length} {jobs.length === 1 ? 'Position' : 'Positions'} Available</>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-600">
                  <span className="font-semibold text-green-600">{filteredJobs.filter(j => j.status === 'active').length}</span> Active
                </span>
                <span className="text-gray-600">
                  <span className="font-semibold text-yellow-600">{filteredJobs.filter(j => j.status === 'draft').length}</span> Draft
                </span>
              </div>
            </div>
          </div>

          {/* Jobs Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredJobs.map((job) => (
              <Link 
                key={job._id}
                to={`/jobs/${job._id}`}
                className="group"
              >
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all duration-300 p-6 h-full">
                  {/* Status Badge */}
                  <div className="flex items-start justify-between mb-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      job.status === 'active' 
                        ? 'bg-green-100 text-green-700 ring-1 ring-green-600/20' 
                        : job.status === 'closed' 
                        ? 'bg-red-100 text-red-700 ring-1 ring-red-600/20' 
                        : 'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-600/20'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                        job.status === 'active' ? 'bg-green-600' : 
                        job.status === 'closed' ? 'bg-red-600' : 'bg-yellow-600'
                      }`}></span>
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </span>
                    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-200" />
                  </div>

                  {/* Job Title */}
                  <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                    {job.title}
                  </h2>

                  {/* Job Details */}
                  <div className="space-y-2">
                    <div className="flex items-center text-gray-600">
                      <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-sm">{job.department}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-sm">{job.location}</span>
                    </div>
                  </div>

                  {/* Hover Effect Indicator */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <span className="text-sm text-blue-600 font-medium group-hover:underline">
                      View Details →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default JobsList;