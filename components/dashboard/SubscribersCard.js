"use client";

const SubscribersCard = ({ data }) => {
  const progress = (data?.current / data?.target) * 100 || 0;
  
  return (
    <div className="card bg-base-100 shadow-lg rounded-2xl hover:shadow-xl transition-shadow duration-300">
      <div className="card-body p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-base-content">Subscribers</h3>
          <div className="text-sm text-success flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            +{data?.growth}%
          </div>
        </div>
        
        <div className="mb-4">
          <div className="text-3xl font-bold text-base-content">
            {data?.current?.toLocaleString()}
          </div>
          <div className="text-sm text-base-content/60">
            Target: {data?.target?.toLocaleString()}
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-base-content/80">Progress</span>
            <span className="font-semibold text-base-content">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-base-200 rounded-full h-3">
            <div 
              className="h-3 rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscribersCard;
