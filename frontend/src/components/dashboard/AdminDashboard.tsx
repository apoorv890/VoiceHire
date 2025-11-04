import { useEffect, useState } from 'react';
import { Briefcase, Users, TrendingUp, Calendar } from 'lucide-react';
import MetricCard from './MetricCard';
import RecentActivity from './RecentActivity';
import JobStatusChart from './JobStatusChart';

interface DashboardStats {
  totalJobs: number;
  activeJobs: number;
  totalCandidates: number;
  interviewsScheduled: number;
  recentJobs: Array<{
    _id: string;
    title: string;
    department: string;
    status: string;
    candidateCount: number;
    createdAt: string;
  }>;
  jobsByStatus: {
    active: number;
    draft: number;
    closed: number;
  };
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalJobs: 0,
    activeJobs: 0,
    totalCandidates: 0,
    interviewsScheduled: 0,
    recentJobs: [],
    jobsByStatus: { active: 0, draft: 0, closed: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/dashboard/admin', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard stats');
        }
        
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchDashboardStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Recruiter Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's your recruitment overview</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Jobs"
          value={stats.totalJobs}
          icon={<Briefcase className="h-6 w-6" />}
          trend={stats.activeJobs > 0 ? `${stats.activeJobs} active` : 'No active jobs'}
          trendUp={stats.activeJobs > 0}
          color="blue"
        />
        
        <MetricCard
          title="Active Positions"
          value={stats.activeJobs}
          icon={<TrendingUp className="h-6 w-6" />}
          trend={`${stats.jobsByStatus.draft} drafts`}
          trendUp={true}
          color="green"
        />
        
        <MetricCard
          title="Total Candidates"
          value={stats.totalCandidates}
          icon={<Users className="h-6 w-6" />}
          trend="All applications"
          trendUp={true}
          color="purple"
        />
        
        <MetricCard
          title="Interviews Scheduled"
          value={stats.interviewsScheduled}
          icon={<Calendar className="h-6 w-6" />}
          trend="This month"
          trendUp={true}
          color="orange"
        />
      </div>

      {/* Job Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <JobStatusChart jobsByStatus={stats.jobsByStatus} />
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Quick Stats</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-600 rounded-full mr-3"></div>
                <span className="text-gray-700 font-medium">Active Jobs</span>
              </div>
              <span className="text-2xl font-bold text-green-600">{stats.jobsByStatus.active}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-600 rounded-full mr-3"></div>
                <span className="text-gray-700 font-medium">Draft Jobs</span>
              </div>
              <span className="text-2xl font-bold text-yellow-600">{stats.jobsByStatus.draft}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-600 rounded-full mr-3"></div>
                <span className="text-gray-700 font-medium">Closed Jobs</span>
              </div>
              <span className="text-2xl font-bold text-red-600">{stats.jobsByStatus.closed}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <RecentActivity jobs={stats.recentJobs} isAdmin={true} />
    </div>
  );
};

export default AdminDashboard;
