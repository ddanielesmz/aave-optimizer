"use client";

import React from 'react';

// Simple placeholder card for Net Worth Trend with a "Coming Soon" preview area
export default function NetWorthTrendCard() {

  return (
    <div className="card bg-base-100 rounded-2xl border border-base-300 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-[1px] p-6 flex flex-col justify-between min-h-[200px] relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base-content font-semibold tracking-tight">Net Worth Trend</h3>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center gap-4 w-full">
        <div className="alert bg-base-200/60 border-base-300 text-base-content/80 text-sm w-full">
          <span>Coming soon: interactive net worth chart with time ranges and tooltips.</span>
        </div>

        <div className="border border-dashed border-base-300 rounded-xl py-10 flex flex-col items-center justify-center text-base-content/50 text-sm w-full">
          <svg className="w-10 h-10 text-base-content/30" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3v18h18M7 15l3-3 4 4 5-6" />
          </svg>
          <div className="mt-2">Net worth chart preview</div>
        </div>
      </div>

      {/* Footer removed to avoid empty whitespace */}
    </div>
  );
}


