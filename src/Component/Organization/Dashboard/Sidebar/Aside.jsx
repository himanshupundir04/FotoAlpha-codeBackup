import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import HomeIcon from "@mui/icons-material/Home";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import EventIcon from "@mui/icons-material/Event";
import SettingsIcon from "@mui/icons-material/Settings";
import { Divider, Tooltip } from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import GroupsIcon from "@mui/icons-material/Groups";
import logo from "../../../image/fulllogo.jpg";
import logoclose from "../../../image/bg-removed.png";
import BoltIcon from "@mui/icons-material/Bolt";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import EditCalendarIcon from "@mui/icons-material/EditCalendar";
import EventNoteIcon from "@mui/icons-material/EventNote";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import AddToPhotosIcon from "@mui/icons-material/AddToPhotos";

function Aside({ setIsOpen, isOpen }) {
  const location = useLocation();
  const [showUpgrade, setUpgrade] = useState(false);
  const navigate = useNavigate();
  const [isEventOpen, setIsEventOpen] = useState(false);

  // console.log(location);
  const isActive = (path) =>
    location.pathname.startsWith(`/organization/${path}`);

  const users = JSON.parse(localStorage.getItem("users")) || [];
  const currentUser = users.find((u) => u.isCurrent);

  const trial = currentUser?.isTrial;
  const endDate = currentUser?.currentSubscriptionId?.end_date;

  useEffect(() => {
    if (!endDate) {
      setUpgrade(true);
      return;
    }
    const now = new Date();
    const trialEnd = new Date(endDate);
    if (trial === false && trialEnd > now) {
      setUpgrade(false);
    } else {
      setUpgrade(true);
    }
  }, [trial, endDate]);

  return (
    <>
      <div className="h-screen flex flex-col relative text-start">
        <nav
          className={`lg:flex flex-col space-y-4 relative z-10 bg-white dark:bg-slate-900 ${
            !isOpen ? "md:max-h-full max-h-[520px]" : "max-h-full"
          }`}
        >
          <div className=" title flex justify-center py-3 gap-4 items-center border-solid border-b-2 border-slate-100 dark:border-slate-800 dark:text-white">
            {!isOpen ? (
              <img src={logo} alt="logo" className="w-[80px] lg:w-[145px]" />
            ) : (
              <img src={logoclose} alt="logo" className="w-[40px]" />
            )}
          </div>
          <div className="px-3 md:pt-2 h-[100%] overflow-y-auto flex-1">
           <Link
              to="upload_photos"
              className={`flex items-center space-x-2 p-2 mb-1 rounded font-normal
               no-underline ${
                isActive("upload_photos")
                  ? "bg-blue text-white"
                  : "text-slate-700 dark:!text-white hover:bg-slate-300 dark:hover:bg-gray-700"
              }`}
              onClick={() => {
                if (window.innerWidth < 1024) {
                  // ✅ only close on mobile (Tailwind md breakpoint)
                  setIsOpen(false);
                }
              }}
            >
              <AddToPhotosIcon size={20} />
              {(!isOpen || window.innerWidth < 1024) && (
                <span>Upload Photos</span>
              )}
            </Link>
            <Link
              to="dashboard"
              className={`flex items-center space-x-2 p-2 rounded font-normal no-underline ${
                isActive("dashboard")
                  ? "bg-blue text-white"
                  : "text-slate-700 dark:!text-white hover:bg-slate-300 dark:hover:bg-gray-700"
              }`}
              onClick={() => {
                if (window.innerWidth < 1024) {
                  // ✅ only close on mobile (Tailwind md breakpoint)
                   setIsOpen(false);
                }
              }}
            >
              <HomeIcon sx={{ fontSize: 22 }} />
              {(!isOpen || window.innerWidth < 1024) && <span>Dashboard</span>}
            </Link>
            <Link
              to="public_portfolio"
              className={`flex items-center space-x-2 p-2 rounded font-normal no-underline  
                ${
                  isActive("public_portfolio")
                    ? "bg-blue text-white"
                    : "text-slate-700 dark:!text-white hover:bg-slate-300 dark:hover:bg-gray-700"
                }`}
              onClick={() => {
                if (window.innerWidth < 1024) {
                  // ✅ only close on mobile (Tailwind md breakpoint)
                   setIsOpen(false);;
                }
              }}
            >
              <AccountCircleIcon sx={{ fontSize: 22 }} />
              {(!isOpen || window.innerWidth < 1024) && <span>Portfolio</span>}
            </Link>

            <div>
              <button
                className={`w-full flex items-center justify-between p-2 rounded font-normal no-underline ${
                  location.pathname.includes("/organization/event") ||
                  location.pathname.includes("/organization/events_list") ||
                  location.pathname.includes("/organization/create_event")
                    ? "bg-blue text-white"
                    : "text-slate-700 dark:!text-white hover:bg-slate-300 dark:hover:bg-gray-700"
                }`}
                onClick={() => setIsEventOpen(!isEventOpen)}
              >
                <div className="flex items-center space-x-2">
                  <EventIcon sx={{ fontSize: 22 }} />
                  {(!isOpen || window.innerWidth < 1024) && <span>Events</span>}
                </div>
                {(!isOpen || window.innerWidth < 1024) && (
                  <span>
                    {isEventOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </span>
                )}
              </button>
              {isEventOpen && (
                <div className={` ${!isOpen ? "ml-2" : "ml-0"}`}>
                  <Link
                    to="events_category"
                    className={`flex items-center space-x-1 text-start p-2 rounded  font-normal no-underline ${
                      isActive("events_category")
                        ? "text-blue"
                        : "text-slate-700 dark:text-white hover:bg-slate-300 dark:hover:bg-gray-700"
                    }`}
                    onClick={() => {
                      if (window.innerWidth < 1024) {
                        // ✅ only close on mobile (Tailwind md breakpoint)
                        setIsOpen(false);
                      }
                    }}
                  >
                    <EventAvailableIcon sx={{ fontSize: 20 }} />
                    {(!isOpen || window.innerWidth < 1024) && (
                      <span>Events</span>
                    )}
                  </Link>
                  <Link
                    to="create_event"
                    className={`flex items-center space-x-1 text-start p-2 rounded  font-normal no-underline ${
                      isActive("create_event")
                        ? "text-blue"
                        : "text-slate-700 dark:text-white hover:bg-slate-300 dark:hover:bg-gray-700"
                    }`}
                    onClick={() => {
                      if (window.innerWidth < 1024) {
                        // ✅ only close on mobile (Tailwind md breakpoint)
                        setIsOpen(false);
                      }
                    }}
                  >
                    <EditCalendarIcon sx={{ fontSize: 20 }} />
                    {(!isOpen || window.innerWidth < 1024) && (
                      <span> Add Event</span>
                    )}
                  </Link>
                  <Link
                    to="events_list"
                    className={`flex items-center space-x-1 text-start p-2 rounded  font-normal no-underline ${
                      isActive("events_list")
                        ? "text-blue"
                        : "text-slate-700 dark:text-white hover:bg-slate-300 dark:hover:bg-gray-700"
                    }`}
                    onClick={() => {
                      if (window.innerWidth < 1024) {
                        // ✅ only close on mobile (Tailwind md breakpoint)
                        setIsOpen(false);
                      }
                    }}
                  >
                    <EventNoteIcon sx={{ fontSize: 20 }} />
                    {(!isOpen || window.innerWidth < 1024) && (
                      <span>Events List</span>
                    )}
                  </Link>
                </div>
              )}
            </div>
            <Link
              to="album"
              className={`flex items-center space-x-2 p-2 rounded font-normal  no-underline ${
                isActive("album")
                  ? "bg-blue text-white"
                  : "text-slate-700 dark:!text-white hover:bg-slate-300 dark:hover:bg-gray-700"
              }`}
              onClick={() => {
                if (window.innerWidth < 1024) {
                  // ✅ only close on mobile (Tailwind md breakpoint)
                  setIsOpen(false);
                }
              }}
            >
              <PhotoLibraryIcon sx={{ fontSize: 22 }} />
              {(!isOpen || window.innerWidth < 1024) && <span>Album</span>}
            </Link>
           
            {(!isOpen || window.innerWidth < 1024) && (
              <p className="font-medium text-slate-700 my-2 dark:text-white">
                Tools & Support
              </p>
            )}
            <Divider sx={{ color: "#1e293b" }} />
            <Link
              to="team"
              className={`flex items-center space-x-2 p-2 rounded font-normal  no-underline ${
                isActive("team")
                  ? "bg-blue text-white"
                  : "text-slate-700 dark:!text-white hover:bg-slate-300 dark:hover:bg-gray-700"
              }`}
              onClick={() => {
                if (window.innerWidth < 1024) {
                  // ✅ only close on mobile (Tailwind md breakpoint)
                  setIsOpen(false);
                }
              }}
            >
              <GroupsIcon sx={{ fontSize: 22 }} />
              {(!isOpen || window.innerWidth < 1024) && <span>Team</span>}
            </Link>
            <Link
              to="calendar"
              className={`flex items-center space-x-2 p-2 rounded font-normal  no-underline ${
                isActive("calendar")
                  ? "bg-blue text-white"
                  : "text-slate-700 dark:!text-white hover:bg-slate-300 dark:hover:bg-gray-700"
              }`}
              onClick={() => {
                if (window.innerWidth < 1024) {
                  // ✅ only close on mobile (Tailwind md breakpoint)
                  setIsOpen(false);
                }
              }}
            >
              <CalendarMonthIcon sx={{ fontSize: 22 }} />
              {(!isOpen || window.innerWidth < 1024) && (
                <span>Event Calendar</span>
              )}
            </Link>
            <Link
              to="billing"
              className={`flex items-center space-x-2 p-2 rounded font-normal  no-underline ${
                isActive("billing")
                  ? "bg-blue text-white"
                  : "text-slate-700 dark:!text-white hover:bg-slate-300 dark:hover:bg-gray-700"
              }`}
              onClick={() => {
                if (window.innerWidth < 1024) {
                  // ✅ only close on mobile (Tailwind md breakpoint)
                  setIsOpen(false);
                }
              }}
            >
              <AccountBalanceWalletIcon sx={{ fontSize: 22 }} />
              {(!isOpen || window.innerWidth < 1024) && (
                <span>Accounts</span>
              )}
            </Link>
            <Link
              to="coins"
              className={`flex items-center space-x-2 p-2 rounded font-normal  no-underline ${
                isActive("coins")
                  ? "bg-blue text-white"
                  : "text-slate-700 dark:!text-white hover:bg-slate-300 dark:hover:bg-gray-700"
              }`}
              onClick={() => {
                if (window.innerWidth < 1024) {
                  // ✅ only close on mobile (Tailwind md breakpoint)
                  setIsOpen(false);
                }
              }}
            >
              <LocalFireDepartmentIcon sx={{ fontSize: 22 }} />
              {(!isOpen || window.innerWidth < 1024) && (
                <span>Coins</span>
              )}
            </Link>
            <Link
              to="referrals"
              className={`flex items-center space-x-2 p-2 rounded font-normal  no-underline ${
                isActive("referrals")
                  ? "bg-blue text-white"
                  : "text-slate-700 dark:!text-white hover:bg-slate-300 dark:hover:bg-gray-700"
              }`}
              onClick={() => {
                if (window.innerWidth < 1024) {
                  // ✅ only close on mobile (Tailwind md breakpoint)
                  setIsOpen(false);
                }
              }}
            >
              <GroupAddIcon sx={{ fontSize: 22 }} />
              {(!isOpen || window.innerWidth < 1024) && (
                <span>Referrals</span>
              )}
            </Link>
            <Link
              to="settings"
              className={`flex items-center space-x-2 p-2 rounded font-normal  no-underline ${
                isActive("settings")
                  ? "bg-blue text-white"
                  : "text-slate-700 dark:!text-white hover:bg-slate-300 dark:hover:bg-gray-700"
              }`}
              onClick={() => {
                if (window.innerWidth < 1024) {
                  // ✅ only close on mobile (Tailwind md breakpoint)
                  setIsOpen(false);
                }
              }}
            >
              <SettingsIcon sx={{ fontSize: 20 }} />
              {(!isOpen || window.innerWidth < 1024) && <span>Settings</span>}
            </Link>
             {(!isOpen || window.innerWidth < 1024) && (
            <div
              className={`flex items-center justify-between p-2 rounded font-normal cursor-not-allowed opacity-60 ${
                "text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/30"
              }`}
              title="This feature is coming soon"
            >
             <Tooltip title="Coming soon">
                <div className="flex items-center text-sm space-x-2">
                  <AddPhotoAlternateIcon sx={{ fontSize: 22 }} />
                  {(!isOpen || window.innerWidth < 1024) && (
                    <span>Export Photos</span>
                  )}
                </div>
              </Tooltip>
            </div>
             )}
            
          </div>
        </nav>
      </div>
    </>
  );
}

export default Aside;
