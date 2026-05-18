import React from "react";
import { useNavigate } from "react-router-dom";
import GroupAddOutlinedIcon from "@mui/icons-material/GroupAddOutlined";
import PhotoAlbumOutlinedIcon from "@mui/icons-material/PhotoAlbumOutlined";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import PermMediaOutlinedIcon from "@mui/icons-material/PermMediaOutlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";

const actions = [
  { label: "Invite Team", icon: <GroupAddOutlinedIcon sx={{ fontSize: 18 }} />, path: "/photographer/team" },
  { label: "Create Album", icon: <PhotoAlbumOutlinedIcon sx={{ fontSize: 18 }} />, path: "/photographer/create_event" },
  { label: "Share Invitation", icon: <ShareOutlinedIcon sx={{ fontSize: 18 }} />, path: "/photographer/events_category" },
  { label: "View Portfolio", icon: <PermMediaOutlinedIcon sx={{ fontSize: 18 }} />, path: "/photographer/portfolio" },
  { label: "Manage Orders", icon: <ShoppingCartOutlinedIcon sx={{ fontSize: 18 }} />, path: "/photographer/orders" },
];

const QuickActions = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full bg-white rounded-xl p-3 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 mt-3">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-semibold text-slate-700 dark:text-white">Quick Actions</h2>
        <button onClick={() => navigate("#")} className="text-[10px] text-blue hover:underline">View all activity →</button>
      </div>
      <div className="flex flex-wrap gap-2 justify-between">
        {actions.map((act) => (
          <button
            key={act.label}
            onClick={() => navigate(act.path)}
            className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition min-w-[70px]"
          >
            <div className="text-slate-500 dark:text-slate-300">{act.icon}</div>
            <span className="text-[9px] font-medium text-slate-600 dark:text-slate-300 text-center">{act.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
