import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Link } from "react-router-dom";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import { formatFileSize } from "../../../services/dashboardService";

const STORAGE_GB = 20;
const STORAGE_BYTES = STORAGE_GB * 1024 * 1024 * 1024;

const StorageUsageCard = ({ totalPhotoSize = 0 }) => {
  const photosSize = totalPhotoSize * 0.78;
  const albumsSize = totalPhotoSize * 0.14;
  const othersSize = totalPhotoSize * 0.08;
  const pct = Math.min((totalPhotoSize / STORAGE_BYTES) * 100, 100);

  const DUMMY_DATA = [
    { name: "Photos", value: photosSize, color: "#f97316" },
    { name: "Albums", value: albumsSize, color: "#6366f1" },
    { name: "Others", value: othersSize, color: "#a78bfa" },
  ];

  return (
    <div className="w-full bg-white rounded-xl p-3 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 relative">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-semibold text-slate-700 dark:text-white">Storage & Usage</h2>
        <Link to="/photographer/upgrade_plan" className="text-[10px] text-blue hover:underline">Upgrade</Link>
      </div>
      <div className="flex items-center gap-3">
        <div>
          <p className="text-xl font-bold text-slate-800 dark:text-white">{formatFileSize(totalPhotoSize)}</p>
          <p className="text-[9px] text-slate-400">of {STORAGE_GB} GB Used</p>
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
            <span className="font-medium text-slate-700 dark:text-white">{formatFileSize(d.value)}</span>
          </div>
        ))}
      </div>
      <div className="mt-2">
        <div className="w-full bg-slate-100 rounded-full h-1.5 dark:bg-slate-700">
          <div className="bg-blue h-1.5 rounded-full" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-[9px] text-slate-400 mt-0.5">{pct.toFixed(1)}% used</p>
      </div>
      <button className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-blue text-white shadow-lg flex items-center justify-center hover:bg-blue-700 transition">
        <CloudUploadOutlinedIcon sx={{ fontSize: 16 }} />
      </button>
    </div>
  );
};

export default StorageUsageCard;
