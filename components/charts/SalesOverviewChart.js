"use client";

import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';

const SalesOverviewChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <XAxis 
          dataKey="month" 
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: 'hsl(var(--bc) / 0.6)' }}
        />
        <YAxis 
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: 'hsl(var(--bc) / 0.6)' }}
        />
        <Line 
          type="monotone" 
          dataKey="sales" 
          stroke="hsl(var(--p))"
          strokeWidth={3}
          dot={{ fill: 'hsl(var(--p))', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: 'hsl(var(--p))', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default SalesOverviewChart;
