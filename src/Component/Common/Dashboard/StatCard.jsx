import React from "react";
import { Link } from "react-router-dom";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";

const TrendBadge = ({ trend }) => {
  if (!trend) return null;
  const { text, direction } = trend;
  const colors =
    direction === "up"
      ? "text-green-600 bg-green-50"
      : direction === "down"
        ? "text-red-500 bg-red-50"
        : "text-slate-400 bg-slate-50";
  const Icon = direction === "up" ? TrendingUpIcon : direction === "down" ? TrendingDownIcon : RemoveRedEyeIcon;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[9px] font-medium px-1 py-0.5 rounded-full ${colors}`}>
      <Icon sx={{ fontSize: 10 }} />
      {text}
    </span>
  );
};

const Card = ({ icon, iconBg, label, value, trend, footer, progress }) => (
  <div className="flex flex-col bg-white rounded-xl p-2.5 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
    <div className="flex items-start gap-2">
      <div className={`p-1.5 rounded-lg ${iconBg}`}>
        {React.cloneElement(icon, { sx: { fontSize: 16 } })}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">{label}</p>
        <p className="text-base font-bold text-slate-800 dark:text-white mt-0.5">{value}</p>
        <TrendBadge trend={trend} />
      </div>
    </div>
    {footer && (
      <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1.5">{footer}</p>
    )}
    {progress !== undefined && (
      <div className="w-full bg-slate-100 rounded-full h-1 mt-1.5 dark:bg-slate-700">
        <div className="bg-blue h-1 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }} />
      </div>
    )}
  </div>
);

const StatCard = ({ to, ...props }) =>
  to ? (
    <Link to={to}>
      <Card {...props} />
    </Link>
  ) : (
    <Card {...props} />
  );

export default StatCard;
