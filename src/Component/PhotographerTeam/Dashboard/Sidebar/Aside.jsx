import React from "react";
import { Link, useLocation } from "react-router-dom";
import HomeIcon from "@mui/icons-material/Home";
import EventIcon from "@mui/icons-material/Event";
import SettingsIcon from "@mui/icons-material/Settings";
import { Divider } from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import logo from "../../../image/fulllogo.jpg";
import logoshow from "../../../image/bg-removed.png";

function Aside({ setIsOpen, isOpen }) {
  const location = useLocation();
  // console.log(location);
  const isActive = (path) =>
    location.pathname.startsWith(`/photographer_team/${path}`);

  return (
    <>
      <div className="h-screen flex flex-col">
        <nav className="md:flex flex-col space-y-4 ">
          <div className=" title flex justify-center gap-4 items-center border-solid border-b-2 border-slate-100 dark:border-slate-800 py-2 dark:text-white">
            {!isOpen ? (
              <img src={logo} alt="logo" className="w-[80px] lg:w-[180px]" />
            ) : (
              <img src={logoshow} alt="logo" className="w-[40px]" />
            )}
          </div>
          <div className="px-3 md:pt-2">            
            <Link
              to="dashboard"
              className={`flex items-center space-x-2 p-2 mb-1 rounded font-semibold no-underline ${
                isActive("dashboard")
                  ? "bg-blue text-white"
                  : "text-slate-700 dark:!text-white hover:bg-slate-300 dark:hover:bg-gray-700"
              }`}
              onClick={() => {
                if (window.innerWidth < 768) {
                  // ✅ only close on mobile (Tailwind md breakpoint)
                  setIsOpen(false);
                }
              }}
            >
              <HomeIcon size={20} />
              {(!isOpen || window.innerWidth < 768) && <span>Dashboard</span>}
            </Link>

            <Link
              to="events"
              className={`flex items-center space-x-2 p-2 mb-1 rounded font-semibold no-underline ${
                isActive("events")
                  ? "bg-blue text-white"
                  : "text-slate-700 dark:!text-white hover:bg-slate-300 dark:hover:bg-gray-700"
              }`}
              onClick={() => {
                if (window.innerWidth < 768) {
                  // ✅ only close on mobile (Tailwind md breakpoint)
                  setIsOpen(false);
                }
              }}
            >
              <EventIcon size={20} />
              {!isOpen && <span>Events</span>}
            </Link>
            {(!isOpen || window.innerWidth < 768) && (
              <p className="font-semibold text-slate-700 my-2 dark:text-white text-start">
                Tools & Support
              </p>
            )}
            <Divider sx={{ color: "#1e293b" }} />
            <Link
              to="calendar"
              className={`flex items-center space-x-2 p-2 mb-1 rounded font-semibold no-underline ${
                isActive("calendar")
                  ? "bg-blue text-white"
                  : "text-slate-700 dark:!text-white hover:bg-slate-300 dark:hover:bg-gray-700"
              }`}
              onClick={() => {
                if (window.innerWidth < 768) {
                  // ✅ only close on mobile (Tailwind md breakpoint)
                  setIsOpen(false);
                }
              }}
            >
              <CalendarMonthIcon size={20} />
              {(!isOpen || window.innerWidth < 768) && (
                <span>Event Calendar</span>
              )}
            </Link>
            <Link
              to="settings"
              className={`flex items-center space-x-2 p-2 mb-1 rounded font-semibold no-underline ${
                isActive("settings")
                  ? "bg-blue text-white"
                  : "text-slate-700 dark:!text-white hover:bg-slate-300 dark:hover:bg-gray-700"
              }`}
              onClick={() => {
                if (window.innerWidth < 768) {
                  // ✅ only close on mobile (Tailwind md breakpoint)
                  setIsOpen(false);
                }
              }}
            >
              <SettingsIcon size={20} />
              {(!isOpen || window.innerWidth < 768) && <span>Settings</span>}
            </Link>
          </div>
        </nav>
      </div>
    </>
  );
}

export default Aside;
