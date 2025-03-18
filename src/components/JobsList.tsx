import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface Job {
  _id: string;
  title: string;
  department: string;
  location: string;
  status: string;
}

const JobsList = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Job Postings</h1>
      
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md">
          {jobs.map((job) => (
            <Link
              key={job._id}
              to={`/jobs/${job._id}`}
              className="block border-b last:border-b-0 hover:bg-gray-50 transition-colors"
            >
              <div className="p-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{job.title}</h2>
                  <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                    <span>{job.department}</span>
                    <span>•</span>
                    <span>{job.location}</span>
                    <span>•</span>
                    <span className={`capitalize ${
                      job.status === 'active' ? 'text-green-600' :
                      job.status === 'draft' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {job.status}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </Link>
          ))}
          {jobs.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              No job postings found. Create your first job posting!
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default JobsList;