"use client";

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';

const OrderStatsChart = ({ data }) => {
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
        <Bar 
          dataKey="orders" 
          fill="hsl(var(--p))"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default OrderStatsChart;
