import { Link } from 'react-router-dom';
import { Briefcase, Calendar, Users, TrendingUp } from 'lucide-react';

interface Job {
  _id: string;
  title: string;
  department: string;
  status: string;
  candidateCount: number;
  createdAt: string;
}

interface Application {
  _id: string;
  jobId: {
    _id: string;
    title: string;
    department: string;
    company: string;
  };
  atsScore: number;
  interviewScheduled: boolean;
  createdAt: string;
}

interface RecentActivityProps {
  jobs?: Job[];
  applications?: Application[];
  isAdmin: boolean;
}

const RecentActivity = ({ jobs, applications, isAdmin }: RecentActivityProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (isAdmin && jobs) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Recent Job Postings</h2>
          <Link to="/" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            View all →
          </Link>
        </div>
        
        {jobs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Briefcase className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>No job postings yet</p>
            <Link to="/create-job" className="text-blue-600 hover:text-blue-700 text-sm mt-2 inline-block">
              Create your first job posting
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.slice(0, 5).map((job) => (
              <Link
                key={job._id}
                to={`/jobs/${job._id}`}
                className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <Briefcase className="h-5 w-5 text-blue-600 mr-2" />
                      <h3 className="font-semibold text-gray-900">{job.title}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{job.department}</p>
                    <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                      <div className="flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        <span>{job.candidateCount} candidates</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>{formatDate(job.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    job.status === 'active' ? 'bg-green-100 text-green-800' :
                    job.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (!isAdmin && applications) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">My Applications</h2>
          <Link to="/" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            View all →
          </Link>
        </div>
        
        {applications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Briefcase className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>No applications yet</p>
            <Link to="/" className="text-blue-600 hover:text-blue-700 text-sm mt-2 inline-block">
              Browse available jobs
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.slice(0, 5).map((application) => (
              <Link
                key={application._id}
                to={`/jobs/${application.jobId._id}`}
                className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <Briefcase className="h-5 w-5 text-blue-600 mr-2" />
                      <h3 className="font-semibold text-gray-900">{application.jobId.title}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{application.jobId.department} • {application.jobId.company}</p>
                    <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                      <div className="flex items-center">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        <span>{application.atsScore}% match</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>{formatDate(application.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    application.interviewScheduled ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {application.interviewScheduled ? 'Interview Scheduled' : 'Under Review'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default RecentActivity;
