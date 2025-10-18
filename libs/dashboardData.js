// Hook per dati della dashboard - dati mock pronti per essere sostituiti con API reali
import { useState, useEffect } from 'react';

export const useDashboardData = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simula caricamento dati
    const timer = setTimeout(() => {
      setData({
        activeProjects: [
          { name: 'Website Redesign', progress: 75, color: 'bg-primary' },
          { name: 'Mobile App', progress: 60, color: 'bg-secondary' },
          { name: 'Brand Identity', progress: 90, color: 'bg-accent' },
          { name: 'E-commerce Platform', progress: 45, color: 'bg-info' }
        ],
        orderStats: [
          { day: 'Mon', orders: 120 },
          { day: 'Tue', orders: 150 },
          { day: 'Wed', orders: 180 },
          { day: 'Thu', orders: 200 },
          { day: 'Fri', orders: 160 },
          { day: 'Sat', orders: 140 },
          { day: 'Sun', orders: 100 }
        ],
        salesOverview: [
          { month: 'Jan', sales: 4000, change: 12.5 },
          { month: 'Feb', sales: 3000, change: -8.2 },
          { month: 'Mar', sales: 5000, change: 15.3 },
          { month: 'Apr', sales: 4500, change: 5.7 },
          { month: 'May', sales: 6000, change: 18.9 },
          { month: 'Jun', sales: 5500, change: 9.1 }
        ],
        subscribers: {
          current: 2847,
          target: 3000,
          growth: 12.5
        },
        profit: {
          current: 12500,
          previous: 11800,
          change: 5.9,
          trend: [1000, 1200, 1100, 1300, 1250, 1400, 1250]
        },
        sessions: {
          current: 45600,
          previous: 42000,
          change: 8.6,
          trend: [3000, 3500, 3200, 3800, 3600, 4000, 3800]
        },
        impressions: {
          current: 125000,
          previous: 118000,
          change: 5.9
        },
        expenses: {
          current: 8500,
          previous: 9200,
          change: -7.6
        },
        earningReports: [
          { day: 'Mon', netProfit: 1200, totalIncome: 1800 },
          { day: 'Tue', netProfit: 1500, totalIncome: 2200 },
          { day: 'Wed', netProfit: 1800, totalIncome: 2600 },
          { day: 'Thu', netProfit: 2000, totalIncome: 3000 },
          { day: 'Fri', netProfit: 1600, totalIncome: 2400 },
          { day: 'Sat', netProfit: 1400, totalIncome: 2100 },
          { day: 'Sun', netProfit: 1000, totalIncome: 1600 }
        ],
        upcomingWebinar: {
          title: 'Advanced DeFi Strategies',
          date: '2024-01-25',
          time: '14:00',
          attendees: 150,
          description: 'Learn advanced strategies for DeFi yield farming and liquidity provision.'
        }
      });
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return { data, loading };
};
