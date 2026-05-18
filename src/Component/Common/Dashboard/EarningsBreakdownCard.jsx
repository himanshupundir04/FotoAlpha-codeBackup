import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { formatCurrency } from "../../../services/dashboardService";

const DUMMY_DATA = [
  { name: "Photos Sales", value: 58200, color: "#6366f1" },
  { name: "Print Orders", value: 18750, color: "#a78bfa" },
  { name: "Albums", value: 5500, color: "#22c55e" },
];

const EarningsBreakdownCard = ({ totalEarnings }) => (
  <div className="w-full bg-white rounded-xl p-3 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
    <div className="flex items-center justify-between mb-2">
      <h2 className="text-xs font-semibold text-slate-700 dark:text-white">Earnings Breakdown</h2>
      <span className="text-[9px] text-slate-400">This Month</span>
    </div>
    <div className="flex items-center gap-3">
      <div>
        <p className="text-xl font-bold text-slate-800 dark:text-white">{formatCurrency(totalEarnings)}</p>
        <p className="text-[9px] text-slate-400">Total Earnings</p>
      </div>
      <div className="w-16 h-16 flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={DUMMY_DATA} cx="50%" cy="50%" innerRadius={18} outerRadius={28} dataKey="value" strokeWidth={0}>
              {DUMMY_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
    <div className="space-y-1 mt-2">
      {DUMMY_DATA.map((d) => (
        <div key={d.name} className="flex items-center gap-2 text-[10px]">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
          <span className="text-slate-500 flex-1">{d.name}</span>
          <span className="font-medium text-slate-700 dark:text-white">{formatCurrency(d.value)}</span>
        </div>
      ))}
    </div>
  </div>
);

export default EarningsBreakdownCard;
