"use client";

import { LineChart, Line, ResponsiveContainer } from 'recharts';

const MiniLineChart = ({ data, color = 'hsl(var(--p))' }) => {
  return (
    <ResponsiveContainer width="100%" height={60}>
      <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke={color}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default MiniLineChart;
