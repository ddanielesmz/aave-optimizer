"use client";

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Legend } from 'recharts';

const EarningReportsChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <XAxis 
          dataKey="day" 
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: 'hsl(var(--bc) / 0.6)' }}
        />
        <YAxis 
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: 'hsl(var(--bc) / 0.6)' }}
        />
        <Legend />
        <Bar 
          dataKey="netProfit" 
          fill="hsl(var(--s))"
          radius={[4, 4, 0, 0]}
          name="Net Profit"
        />
        <Bar 
          dataKey="totalIncome" 
          fill="hsl(var(--p))"
          radius={[4, 4, 0, 0]}
          name="Total Income"
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default EarningReportsChart;
