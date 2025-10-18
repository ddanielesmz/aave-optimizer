"use client";

import EarningReportsChart from "@/components/charts/EarningReportsChart";

const EarningReportsCard = ({ data }) => {
  return (
    <div className="card bg-base-100 shadow-lg rounded-2xl hover:shadow-xl transition-shadow duration-300">
      <div className="card-body p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-base-content">Earning Reports</h3>
          <div className="text-sm text-base-content/60">This Week</div>
        </div>
        
        <div className="mb-4">
          <div className="text-2xl font-bold text-base-content">$12,500</div>
          <div className="text-sm text-success flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            +8.2% from last week
          </div>
        </div>
        
        <EarningReportsChart data={data} />
      </div>
    </div>
  );
};

export default EarningReportsCard;
