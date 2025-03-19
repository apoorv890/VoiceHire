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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500 mb-4">No job postings found</p>
          <Link 
            to="/create-job" 
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Create a Job
          </Link>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {jobs.map((job) => (
              <li key={job._id}>
                <Link 
                  to={`/jobs/${job._id}`}
                  className="block hover:bg-gray-50 transition-colors p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-medium text-gray-900">{job.title}</h2>
                      <p className="text-sm text-gray-500 mt-1">{job.department} • {job.location}</p>
                      <div className="mt-2">
                        <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                          job.status === 'active' ? 'bg-green-100 text-green-800' : 
                          job.status === 'closed' ? 'bg-red-100 text-red-800' : 
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                        </span>
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

export default JobsList;