import React from "react";
import { format } from "date-fns";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";

const RecentActivityFeed = ({ entries = [] }) => (
  <div className="bg-white rounded flex flex-col dark:bg-slate-800">
    <h2 className="text-start text-lg font-medium p-3 text-slate-700 dark:text-white border-b border-slate-100 dark:border-slate-700">
      System Notifications
    </h2>
    {entries.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <style>{`
          @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
          .feed-float { animation: float 3s ease-in-out infinite; }
        `}</style>
        <NotificationsNoneIcon
          sx={{ fontSize: 48 }}
          className="text-gray-300 dark:text-slate-600 mb-3 feed-float"
        />
        <h3 className="text-base font-semibold text-slate-600 dark:text-slate-300 mb-1">
          No Notifications Yet
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 px-3">
          You're all caught up! Check back later for system updates.
        </p>
      </div>
    ) : (
      <div className="max-h-[58vh] overflow-auto">
        {entries.map((item, i) => (
          <div
            key={i}
            className="flex flex-col px-4 py-1 border-solid border-t-2 border-slate-100 dark:border-slate-700 text-start w-[95%]"
          >
            <div className="flex justify-end">
              <p
                className={`hidden md:block text-end rounded-full text-white w-max px-2 text-sm ${
                  item.status === "success" ? "bg-green-700" : "bg-red-700"
                }`}
              >
                {item.status}
              </p>
            </div>
            <div className="flex">
              <CloudUploadOutlinedIcon
                sx={{ fontSize: "20px" }}
                className="text-slate-700 dark:text-white"
              />
              <p className="mb-0 ml-3 dark:text-white text-slate-700 font-normal">
                <span className="font-normal text-slate-600 dark:text-white">
                  {item.message}.
                </span>
              </p>
            </div>
            <div className="flex justify-between items-center">
              <p className="mb-0 text-start ml-8 text-xs font-normal text-gray-500 dark:text-white">
                {format(new Date(item.createdAt), "MMM dd, yyyy hh:mm a")}
              </p>
              <p
                className={`md:hidden rounded-full text-white w-max px-2 text-sm font-normal ${
                  item.status === "success" ? "bg-green-700" : "bg-red-700"
                }`}
              >
                {item.status}
              </p>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default RecentActivityFeed;
