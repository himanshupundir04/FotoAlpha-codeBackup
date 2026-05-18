import React from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Link } from "react-router-dom";
import { formatCurrency } from "../../../services/dashboardService";

const generateDummyData = () => {
  const days = [];
  for (let i = 1; i <= 30; i++) {
    days.push({
      day: `May ${i}`,
      value: Math.floor(Math.random() * 8000) + 1000,
    });
  }
  return days;
};

const EarningsOverviewChart = ({ totalEarnings }) => {
  const data = generateDummyData();

  return (
    <div className="w-full bg-white rounded-xl p-3 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-semibold text-slate-700 dark:text-white">Earnings Overview</h2>
        <span className="text-xs font-bold text-amber-600">{formatCurrency(totalEarnings)}</span>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <XAxis dataKey="day" tick={{ fontSize: 8 }} axisLine={false} tickLine={false} interval={5} />
          <YAxis tick={{ fontSize: 8 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ fontSize: 11 }} />
          <Area type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={1.5} fill="url(#earningsGradient)" />
        </AreaChart>
      </ResponsiveContainer>
      <Link to="/photographer/billing" className="text-[10px] text-blue hover:underline mt-1.5 inline-block">View full earnings report →</Link>
    </div>
  );
};

export default EarningsOverviewChart;
