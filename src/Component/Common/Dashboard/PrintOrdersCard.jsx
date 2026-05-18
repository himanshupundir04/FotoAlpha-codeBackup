import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Link } from "react-router-dom";

const DUMMY_DATA = [
  { name: "In Production", value: 8, color: "#6366f1" },
  { name: "Shipped", value: 10, color: "#22c55e" },
  { name: "Delivered", value: 6, color: "#a78bfa" },
];
const TOTAL = DUMMY_DATA.reduce((s, d) => s + d.value, 0);

const PrintOrdersCard = () => (
  <div className="w-full bg-white rounded-xl p-3 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
    <div className="flex items-center justify-between mb-2">
      <h2 className="text-xs font-semibold text-slate-700 dark:text-white">Print Orders</h2>
      <Link to="/photographer/orders" className="text-[10px] text-blue hover:underline">View all orders →</Link>
    </div>
    <div className="flex items-center gap-3">
      <div>
        <p className="text-xl font-bold text-slate-800 dark:text-white">{TOTAL}</p>
        <p className="text-[9px] text-slate-400">Total Orders</p>
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
          <span className="font-medium text-slate-700 dark:text-white">{d.value}</span>
        </div>
      ))}
    </div>
  </div>
);

export default PrintOrdersCard;
