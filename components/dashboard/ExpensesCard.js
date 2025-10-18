"use client";

const ExpensesCard = ({ data }) => {
  const isPositive = (data?.change || 0) > 0;
  
  return (
    <div className="card bg-base-100 shadow-lg rounded-2xl hover:shadow-xl transition-shadow duration-300">
      <div className="card-body p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-base-content">Expenses</h3>
          <div className={`text-sm flex items-center gap-1 ${isPositive ? 'text-success' : 'text-error'}`}>
            <svg className={`w-4 h-4 ${isPositive ? '' : 'rotate-180'}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            {isPositive ? '+' : ''}{data?.change}%
          </div>
        </div>
        
        <div className="mb-4">
          <div className="text-2xl font-bold text-base-content">
            ${data?.current?.toLocaleString()}
          </div>
          <div className="text-sm text-base-content/60">
            vs ${data?.previous?.toLocaleString()} last month
          </div>
        </div>
        
        <div className="flex items-center justify-center h-16">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-error to-warning flex items-center justify-center">
            <svg className="w-6 h-6 text-error-content" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpensesCard;
