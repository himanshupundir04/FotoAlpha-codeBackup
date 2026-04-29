import React, { useContext, useEffect, useMemo, useState } from "react";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import InsertPhotoOutlinedIcon from "@mui/icons-material/InsertPhotoOutlined";
import ChevronRightOutlinedIcon from "@mui/icons-material/ChevronRightOutlined";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import SearchIcon from "@mui/icons-material/Search";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import EventBusyOutlinedIcon from "@mui/icons-material/EventBusyOutlined";
import axios from "axios";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { CircularProgress } from "@mui/material";
import { PhotographerTeamEventContext } from "../../Context/PhotographerTeamEventContext";

const baseURL = process.env.REACT_APP_BASE_URL;

const formatDateSafe = (value, pattern) => {
  if (!value) return "Date not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date not available";
  return format(date, pattern);
};

function Main() {
  const {notification} = useContext(PhotographerTeamEventContext)
  const [summary, setSummary] = useState({});
  const [recentEvent, setRecentEvent] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${baseURL}/photographer-team/dashboard-summary`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "ngrok-skip-browser-warning": "69420",
          },
        },
      );

      const data = response?.data || {};
      setSummary(data);
      setRecentEvent(
        Array.isArray(data?.recentUpcomingEvents)
          ? data.recentUpcomingEvents
          : [],
      );
      setSystemLogs(
        Array.isArray(data?.recentAuditLogs) ? data.recentAuditLogs : [],
      );
    } catch (error) {
      console.log(error);
      setSummary({});
      setRecentEvent([]);
      setSystemLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      performSearch();
    }
  };

  const performSearch = () => {
    const keyword = searchTerm.trim();
    if (!keyword) return;
    navigate(`/photographer_team/search/${keyword}`);
  };

  const statCards = useMemo(
    () => [
      {
        id: "upcoming",
        title: "Upcoming Events",
        value: summary?.upcomingEventCount || 0,
        meta: "Next scheduled events",
        icon: <CalendarMonthIcon sx={{ fontSize: 24 }} />,
        iconClass:
          "text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/30",
        route: "/photographer_team/events",
      },
      {
        id: "photos",
        title: "Total Uploaded Photos",
        value: summary?.totalPhotos || 0,
        meta: "Uploaded by your team",
        icon: <InsertPhotoOutlinedIcon sx={{ fontSize: 24 }} />,
        iconClass:
          "text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/30",
      },
      // {
      //   id: "notifications",
      //   title: "Notifications",
      //   value: systemLogs.length,
      //   meta: "Recent activity logs",
      //   icon: <NotificationsNoneOutlinedIcon sx={{ fontSize: 24 }} />,
      //   iconClass:
      //     "text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-900/30",
      // },
      // {
      //   id: "tracked",
      //   title: "Tracked Events",
      //   value: recentEvent.length,
      //   meta: "Listed in dashboard feed",
      //   icon: <EventBusyOutlinedIcon sx={{ fontSize: 24 }} />,
      //   iconClass:
      //     "text-violet-700 bg-violet-100 dark:text-violet-300 dark:bg-violet-900/30",
      //   route: "/photographer_team/events",
      // },
    ],
    [
      recentEvent.length,
      summary?.totalPhotos,
      summary?.upcomingEventCount,
      systemLogs.length,
    ],
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/40">
        <CircularProgress className="text-blue-600" />
        <p className="mt-4 text-slate-600 dark:text-slate-300">
          Loading dashboard...
        </p>
      </div>
    );
  }

  return (
    <section className="main-dash space-y-6 text-start">
    {recentEvent.length !== 0 && (
      <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 w-full lg:w-[360px]">
        <SearchIcon
          className="cursor-pointer text-slate-400"
          onClick={performSearch}
        />
        <input
          type="text"
          name="search"
          value={searchTerm}
          placeholder="Search events by name"
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          className="w-full border-none bg-transparent text-sm text-slate-700 outline-none"
        />
        <button
          type="button"
          onClick={performSearch}
          className="rounded-md bg-blue px-3 py-1 text-xs font-medium text-white transition hover:bg-blueHover"
        >
          Go
        </button>
      </div>
    )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => card.route && navigate(card.route)}
            className={`rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition dark:border-slate-700 dark:bg-slate-800/60 ${
              card.route
                ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-md"
                : "cursor-default"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className={`rounded-xl p-2 ${card.iconClass}`}>
                {card.icon}
              </div>
              <ChevronRightOutlinedIcon
                sx={{ fontSize: 20 }}
                className="text-slate-300 dark:text-slate-500"
              />
            </div>
            <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-300">
              {card.title}
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-800 dark:text-white">
              {card.value}
            </p>           
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        <div className="xl:col-span-3 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800/60">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700 sm:px-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                Upcoming Events
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Quick access to your most recent event timeline
              </p>
            </div>
             {recentEvent.length !== 0 && (
            <button
              type="button"
              onClick={() => navigate("/photographer_team/events")}
              className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              View all
            </button>
             )}
          </div>

          {recentEvent.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
              <EventBusyOutlinedIcon
                sx={{ fontSize: 48 }}
                className="text-slate-300 dark:text-slate-600"
              />
              <h3 className="mt-3 text-base font-semibold text-slate-700 dark:text-slate-200">
                No upcoming events
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Event cards will show up here when assignments are available.
              </p>
            </div>
          ) : (
            <div className="max-h-[62vh] divide-y divide-slate-100 overflow-auto dark:divide-slate-700">
              {recentEvent.map((event, index) => (
                <button
                  key={event?._id || index}
                  type="button"
                  className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition hover:bg-slate-50 dark:hover:bg-slate-700/40 sm:px-5"
                  onClick={() =>
                    navigate(`/photographer_team/event/${event?._id}`)
                  }
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium capitalize text-slate-800 dark:text-white">
                        {event?.name || "Untitled event"}
                      </p>
                      <div className="mt-1 flex items-center text-xs text-slate-500 dark:text-slate-400">
                        <CalendarMonthIcon sx={{ fontSize: 15 }} />
                        <span className="ml-1">
                          {formatDateSafe(event?.earliestDate, "MMM dd, yyyy")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
                      Active
                    </span>
                    <ChevronRightOutlinedIcon
                      sx={{ fontSize: 20 }}
                      className="text-slate-400 dark:text-slate-500"
                    />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="xl:col-span-2 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800/60">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700 sm:px-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                System Notifications
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Latest upload and activity logs
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-200">
              {notification.length}
            </span>
          </div>

          {notification.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
              <NotificationsNoneOutlinedIcon
                sx={{ fontSize: 48 }}
                className="text-slate-300 dark:text-slate-600"
              />
              <h3 className="mt-3 text-base font-semibold text-slate-700 dark:text-slate-200">
                No notifications
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                You are all caught up. New system activity will appear here.
              </p>
            </div>
          ) : (
            <div className="max-h-[62vh] divide-y divide-slate-100 overflow-auto dark:divide-slate-700">
              {notification.map((audit, index) => {
               

                return (
                 <div key={audit?._id || index} className="px-4 py-2 sm:px-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <CloudUploadOutlinedIcon
                          sx={{ fontSize: 18 }}
                          className="mt-0.5 text-slate-500 dark:text-slate-300"
                        />
                        <p className="text-sm leading-6 text-slate-700 dark:text-slate-200">
                          <span className=" text-slate-700 dark:text-white">
                            {audit.message}
                          </span>{" "}
                          
                        </p>
                      </div>                     
                    </div>

                    <p className=" pl-7 text-xs text-slate-500 dark:text-slate-400">
                      {formatDateSafe(audit?.createdAt, "MMM dd, yyyy hh:mm a")}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default Main;
