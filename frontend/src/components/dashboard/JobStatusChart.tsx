interface JobStatusChartProps {
  jobsByStatus: {
    active: number;
    draft: number;
    closed: number;
  };
}

const JobStatusChart = ({ jobsByStatus }: JobStatusChartProps) => {
  const total = jobsByStatus.active + jobsByStatus.draft + jobsByStatus.closed;
  
  const getPercentage = (value: number) => {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  };

  const activePercentage = getPercentage(jobsByStatus.active);
  const draftPercentage = getPercentage(jobsByStatus.draft);
  const closedPercentage = getPercentage(jobsByStatus.closed);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-6 text-gray-900">Job Distribution</h2>
      
      <div className="space-y-6">
        {/* Active Jobs */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-600 rounded-full mr-2"></div>
              <span className="text-sm font-medium text-gray-700">Active Jobs</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">{jobsByStatus.active} ({activePercentage}%)</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-green-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${activePercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Draft Jobs */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-600 rounded-full mr-2"></div>
              <span className="text-sm font-medium text-gray-700">Draft Jobs</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">{jobsByStatus.draft} ({draftPercentage}%)</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-yellow-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${draftPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Closed Jobs */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-600 rounded-full mr-2"></div>
              <span className="text-sm font-medium text-gray-700">Closed Jobs</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">{jobsByStatus.closed} ({closedPercentage}%)</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-red-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${closedPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Total Jobs</span>
          <span className="text-2xl font-bold text-gray-900">{total}</span>
        </div>
      </div>
    </div>
  );
};

export default JobStatusChart;
