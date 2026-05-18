import React, { useCallback } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useNavigate, Link } from "react-router-dom";
import InsertPhotoOutlinedIcon from "@mui/icons-material/InsertPhotoOutlined";

const SLICES = [
  { key: "upcoming", name: "Upcoming", status: "Upcoming", color: "#d303fd" },
  { key: "completed", name: "Completed", status: "Completed", color: "#22c55e" },
  { key: "ongoing", name: "Ongoing", status: "Ongoing", color: "#f59e0b" },
  { key: "cancelled", name: "Cancelled", status: "Cancelled", color: "#ef4444" },
];

const EventLifecycleChart = ({ eventStatusStats = {}, eventsPath = "/photographer/events_list" }) => {
  const navigate = useNavigate();
  const data = SLICES.map((s) => ({ ...s, value: eventStatusStats[s.key] || 0 }));
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const isEmpty = total === 0;

  const handleClick = useCallback((d) => navigate(`${eventsPath}?type=${d.status}`), [navigate, eventsPath]);

  if (isEmpty) {
    return (
      <div className="w-full bg-white rounded-xl p-3 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
        <h2 className="text-xs font-semibold text-slate-700 dark:text-white mb-2">Event Lifecycle</h2>
        <div className="flex flex-col items-center justify-center h-32 text-center">
          <InsertPhotoOutlinedIcon sx={{ fontSize: 32 }} className="text-gray-300 dark:text-slate-600 mb-2" />
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">No Events Yet</p>
          <p className="text-[10px] text-slate-500 mb-3">Add Events to track lifecycle stats</p>
          <Link to="/photographer/create_event"><button className="bg-blue text-white py-1 px-3 rounded text-[10px] font-semibold hover:bg-blue-700">Add Event</button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-xl p-3 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
      <h2 className="text-xs font-semibold text-slate-700 dark:text-white mb-2">Event Lifecycle</h2>
      <div className="flex flex-row items-center">
        <div className="w-[55%] relative">
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={2} dataKey="value" nameKey="name" onClick={handleClick}>
                {data.map((entry) => <Cell key={entry.name} fill={entry.color} stroke={entry.color} />)}
              </Pie>
              <Tooltip formatter={(value, name) => [value, name]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ top: "4px" }}>
            <span className="text-xl font-bold text-slate-800 dark:text-white">{total}</span>
            <span className="text-[10px] text-slate-400">Total</span>
          </div>
        </div>
        <div className="w-[45%] pl-2">
          {data.map((entry) => {
            const pct = total > 0 ? Math.round((entry.value / total) * 100) : 0;
            return (
              <div key={entry.key} className="flex items-center gap-1.5 py-1 cursor-pointer" onClick={() => handleClick(entry)}>
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                <span className="text-[10px] text-slate-600 dark:text-slate-300 flex-1">{entry.name}</span>
                <span className="text-[10px] font-semibold text-slate-800 dark:text-white">{entry.value}</span>
                <span className="text-[9px] text-slate-400 w-6 text-right">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
      <Link to={eventsPath} className="text-[10px] text-blue hover:underline mt-1.5 inline-block">View all events →</Link>
    </div>
  );
};

export default EventLifecycleChart;
