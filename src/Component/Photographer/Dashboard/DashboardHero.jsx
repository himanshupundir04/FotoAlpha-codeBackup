import React from "react";
import { useNavigate } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";

const DashboardHero = ({
  profileName,
  createEventPath = "/photographer/create_event",
  uploadPath = "/photographer/upload_photo",
}) => {
  const navigate = useNavigate();

  return (
    <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 bg-gradient-to-br from-blue/5 via-white to-cyan-400/5 dark:from-slate-800/50 dark:via-slate-900 dark:to-slate-800/50 rounded-xl p-4 border border-blue/10 dark:border-slate-700/50 overflow-hidden">
      <div className="relative z-10">
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">
          Welcome back{profileName ? `, ${profileName}` : ""}!
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-lg">
          Manage your events, uploads, guests, and sales from one place.
        </p>
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => navigate(createEventPath)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white text-xs font-semibold py-1.5 px-3 rounded-lg hover:from-[#1D4ED8] hover:to-[#2563EB] transition shadow-sm"
          >
            <AddIcon sx={{ fontSize: 16 }} /> Create Event
          </button>
          <button
            onClick={() => navigate(uploadPath)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white text-xs font-semibold py-1.5 px-3 rounded-lg hover:from-[#6D28D9] hover:to-[#7C3AED] transition shadow-sm"
          >
            <CloudUploadOutlinedIcon sx={{ fontSize: 16 }} /> Upload Photos
          </button>
        </div>
      </div>
      <div className="relative z-10 hidden md:block">
        <img
          alt="logo"
          class="max-w-[10vw] w-full h-auto"
          src="/src/Component/image/welcome_img.png"
        />
      </div>
    </div>
  );
};

export default DashboardHero;
