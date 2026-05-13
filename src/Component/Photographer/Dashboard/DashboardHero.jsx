import React from "react";
import { useNavigate } from "react-router-dom";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";

const DashboardHero = ({
  profileName,
  searchTerm,
  onSearchChange,
  onSearchSubmit,
  createEventPath = "/photographer/create_event",
  uploadPath = "/photographer/upload_photo",
}) => {
  const navigate = useNavigate();

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSearchSubmit();
    }
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">
          Welcome back{profileName ? `, ${profileName}` : ""}!
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Here's what's happening with your photography business today.
        </p>
      </div>
      <div className="flex gap-2 items-center flex-wrap">
        <div className="flex bg-white py-2 px-3 dark:bg-slate-800 rounded-md min-w-[180px]">
          <SearchIcon
            className="text-slate-400 dark:text-white cursor-pointer"
            onClick={onSearchSubmit}
          />
          <input
            type="text"
            placeholder="Search events..."
            value={searchTerm}
            onChange={onSearchChange}
            onKeyDown={handleKeyDown}
            className="w-full text-sm ms-1 border-none outline-none bg-transparent dark:text-white"
          />
        </div>
        <button
          onClick={() => navigate(createEventPath)}
          className="flex items-center gap-1 bg-blue text-white text-xs font-semibold py-2 px-3 rounded-lg hover:bg-blue-700 transition"
        >
          <AddIcon sx={{ fontSize: 16 }} /> Create Event
        </button>
        <button
          onClick={() => navigate(uploadPath)}
          className="flex items-center gap-1 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-white text-xs font-semibold py-2 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
        >
          <CloudUploadOutlinedIcon sx={{ fontSize: 16 }} /> Upload Photos
        </button>
      </div>
    </div>
  );
};

export default DashboardHero;
