import React from "react";
import { timeAgo } from "../../../services/dashboardService";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import PsychologyOutlinedIcon from "@mui/icons-material/PsychologyOutlined";
import ReceiptOutlinedIcon from "@mui/icons-material/ReceiptOutlined";
import AttachMoneyOutlinedIcon from "@mui/icons-material/AttachMoneyOutlined";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";

const getIcon = (message = "") => {
  const m = message.toLowerCase();
  if (m.includes("upload")) return <CloudUploadOutlinedIcon sx={{ fontSize: 14 }} className="text-blue-500" />;
  if (m.includes("ai") || m.includes("match")) return <PsychologyOutlinedIcon sx={{ fontSize: 14 }} className="text-violet-500" />;
  if (m.includes("print")) return <ReceiptOutlinedIcon sx={{ fontSize: 14 }} className="text-amber-500" />;
  if (m.includes("earning") || m.includes("payment") || m.includes("paid")) return <AttachMoneyOutlinedIcon sx={{ fontSize: 14 }} className="text-green-500" />;
  return <NotificationsOutlinedIcon sx={{ fontSize: 14 }} className="text-slate-400" />;
};

const RecentActivityFeed = ({ entries = [] }) => (
  <div className="w-full bg-white rounded-xl dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
    <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-slate-700">
      <h2 className="text-xs font-semibold text-slate-700 dark:text-white">Recent Activity</h2>
      <button className="text-[10px] text-blue hover:underline">View all activity →</button>
    </div>
    {entries.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <style>{`@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}.feed-float{animation:float 3s ease-in-out infinite}`}</style>
        <NotificationsNoneIcon sx={{ fontSize: 32 }} className="text-gray-300 dark:text-slate-600 mb-2 feed-float" />
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">No Activity Yet</p>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 px-4 mt-1">Activity from your events will appear here.</p>
      </div>
    ) : (
      <div className="max-h-[240px] overflow-y-auto divide-y divide-slate-50 dark:divide-slate-700/50">
        {entries.slice(0, 8).map((item, i) => (
          <div key={i} className="flex items-start gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/30">
            <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
              {getIcon(item.message)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-slate-700 dark:text-slate-200 line-clamp-1">{item.message || "No message"}</p>
              <p className="text-[9px] text-slate-400 mt-0.5">{timeAgo(item.createdAt)}</p>
            </div>
            <div className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-700 flex-shrink-0" />
          </div>
        ))}
      </div>
    )}
  </div>
);

export default RecentActivityFeed;
