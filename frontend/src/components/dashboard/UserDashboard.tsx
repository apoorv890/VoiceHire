import { useEffect, useState } from 'react';
import { Briefcase, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import MetricCard from './MetricCard';
import RecentActivity from './RecentActivity';
import ApplicationStatus from './ApplicationStatus';

interface UserDashboardStats {
  totalApplications: number;
  activeApplications: number;
  interviewsScheduled: number;
  avgMatchScore: number;
  recentApplications: Array<{
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
  }>;
  applicationsByStatus: {
    pending: number;
    interviewed: number;
    rejected: number;
  };
}

const UserDashboard = () => {
  const [stats, setStats] = useState<UserDashboardStats>({
    totalApplications: 0,
    activeApplications: 0,
    interviewsScheduled: 0,
    avgMatchScore: 0,
    recentApplications: [],
    applicationsByStatus: { pending: 0, interviewed: 0, rejected: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/dashboard/user', {
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
        <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
        <p className="text-gray-600 mt-2">Track your job applications and interview progress</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Applications"
          value={stats.totalApplications}
          icon={<Briefcase className="h-6 w-6" />}
          trend={`${stats.activeApplications} active`}
          trendUp={stats.activeApplications > 0}
          color="blue"
        />
        
        <MetricCard
          title="Interviews Scheduled"
          value={stats.interviewsScheduled}
          icon={<Clock className="h-6 w-6" />}
          trend="Upcoming"
          trendUp={true}
          color="green"
        />
        
        <MetricCard
          title="Average Match Score"
          value={`${stats.avgMatchScore}%`}
          icon={<TrendingUp className="h-6 w-6" />}
          trend="Compatibility"
          trendUp={stats.avgMatchScore >= 70}
          color="purple"
        />
        
        <MetricCard
          title="Applications Reviewed"
          value={stats.applicationsByStatus.interviewed}
          icon={<CheckCircle className="h-6 w-6" />}
          trend="This month"
          trendUp={true}
          color="orange"
        />
      </div>

      {/* Application Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <ApplicationStatus applicationsByStatus={stats.applicationsByStatus} />
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Application Status</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-600 rounded-full mr-3"></div>
                <span className="text-gray-700 font-medium">Pending Review</span>
              </div>
              <span className="text-2xl font-bold text-blue-600">{stats.applicationsByStatus.pending}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-600 rounded-full mr-3"></div>
                <span className="text-gray-700 font-medium">Interviewed</span>
              </div>
              <span className="text-2xl font-bold text-green-600">{stats.applicationsByStatus.interviewed}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-600 rounded-full mr-3"></div>
                <span className="text-gray-700 font-medium">Not Selected</span>
              </div>
              <span className="text-2xl font-bold text-gray-600">{stats.applicationsByStatus.rejected}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Applications */}
      <RecentActivity applications={stats.recentApplications} isAdmin={false} />
    </div>
  );
};

export default UserDashboard;
