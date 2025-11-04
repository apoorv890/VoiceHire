interface ApplicationStatusProps {
  applicationsByStatus: {
    pending: number;
    interviewed: number;
    rejected: number;
  };
}

const ApplicationStatus = ({ applicationsByStatus }: ApplicationStatusProps) => {
  const total = applicationsByStatus.pending + applicationsByStatus.interviewed + applicationsByStatus.rejected;
  
  const getPercentage = (value: number) => {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  };

  const pendingPercentage = getPercentage(applicationsByStatus.pending);
  const interviewedPercentage = getPercentage(applicationsByStatus.interviewed);
  const rejectedPercentage = getPercentage(applicationsByStatus.rejected);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-6 text-gray-900">Application Progress</h2>
      
      <div className="space-y-6">
        {/* Pending Applications */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-600 rounded-full mr-2"></div>
              <span className="text-sm font-medium text-gray-700">Pending Review</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">{applicationsByStatus.pending} ({pendingPercentage}%)</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${pendingPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Interviewed Applications */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-600 rounded-full mr-2"></div>
              <span className="text-sm font-medium text-gray-700">Interviewed</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">{applicationsByStatus.interviewed} ({interviewedPercentage}%)</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-green-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${interviewedPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Rejected Applications */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gray-600 rounded-full mr-2"></div>
              <span className="text-sm font-medium text-gray-700">Not Selected</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">{applicationsByStatus.rejected} ({rejectedPercentage}%)</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gray-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${rejectedPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Total Applications</span>
          <span className="text-2xl font-bold text-gray-900">{total}</span>
        </div>
      </div>
    </div>
  );
};

export default ApplicationStatus;
