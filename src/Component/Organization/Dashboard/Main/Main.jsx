import React, { useContext, useEffect, useState } from "react";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import InsertPhotoOutlinedIcon from "@mui/icons-material/InsertPhotoOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import BackupOutlinedIcon from "@mui/icons-material/BackupOutlined";
import ChevronRightOutlinedIcon from "@mui/icons-material/ChevronRightOutlined";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import axios from "axios";
import { format, addDays, startOfDay } from "date-fns";
import { Link, useNavigate } from "react-router-dom";
import SearchIcon from "@mui/icons-material/Search";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import BoltIcon from "@mui/icons-material/Bolt";
import {
  Box,
  CircularProgress,
  useMediaQuery,
  useTheme,
  Popover,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import { PieChart, pieArcLabelClasses } from "@mui/x-charts";
import { BarChart } from "@mui/x-charts/BarChart";
import { OrganizationEventContext } from "../../Context/OrganizationEventContext";

const baseURL = process.env.REACT_APP_BASE_URL;
function Main() {
  const [summary, setSummary] = useState({});
  const [recentevent, setRecentevent] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [audit, setAudit] = useState([]);
  const [permission, setPermission] = useState(false);
  const [dataload, setDataload] = useState(false);
  const [show, setShow] = useState(false);
  const [nextevents, setNextevents] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  // Billables: outstanding payments
  const [billables, setBillables] = useState({
    summary: {},
    unpaidEvents: [],
    unpricedEvents: [],
  });
  const [billablesLoading, setBillablesLoading] = useState(false);
  const [popoverStatus, setPopoverStatus] = useState(null);
  const [popoverAnchorEl, setPopoverAnchorEl] = useState(null);
  const [popoverEvents, setPopoverEvents] = useState([]);
  const { notification } = useContext(OrganizationEventContext);

  // console.log(notification)

  const navigate = useNavigate();
  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    setDataload(true);
    try {
      const response = await axios.get(
        `${baseURL}/dashboard/photographer/dashboard-summary`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "ngrok-skip-browser-warning": "69420",
          },
        }
      );
      setDataload(false);
      setSummary(response.data);
      setRecentevent(response.data.recentUpcomingEvents);
      setAudit(response.data.recentAuditLogs);
      setNextevents(response?.data?.nextSevenDaysEvents);
      // if (response.data.upcomingEventCount === 0) {
      //   setShow(true);
      // }
      // console.log(response.data.recentAuditLogs);
      window.electronAPI.setStore("summary", response?.data);
      window.electronAPI.setStore(
        "upcommingevent",
        response?.data?.recentUpcomingEvents
      );
      window.electronAPI.setStore("audit", response?.data?.recentAuditLogs);
      window.electronAPI.setStore(
        "nextevent",
        response?.data?.nextSevenDaysEvents
      );
    } catch (error) {
      setDataload(false);
      const cachedSummary = await window.electronAPI.getStore("summary");
      const upcommingevent = await window.electronAPI.getStore(
        "upcommingevent"
      );
      const audit = await window.electronAPI.getStore("audit");
      const next = await window.electronAPI.getStore("nextevent");

      setSummary(cachedSummary);
      setRecentevent(upcommingevent || []);
      setAudit(audit);
      setNextevents(next);

      console.error("Error fetching:", error?.response?.data?.message);
      const errorMessage = error?.response?.data?.message || "";
      const statusCode = error?.response?.status;

      if (
        statusCode === 403 ||
        errorMessage ===
          "Your trial period has ended. Please upgrade to continue." ||
        errorMessage ===
          "Your trial period of 14 days has ended. Please upgrade to continue."
      ) {
        setPermission(true);
      }
    }
  };

  useEffect(() => {
    fetchAllevent();
  }, []);

  useEffect(() => {
    fetchBillables();
  }, []);

  const fetchAllevent = async () => {
    try {
      const response = await axios.get(`${baseURL}/events/all-events`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      // console.log(response.data.events);
      setAllEvents(response.data.events);
      if (response.data.events.length === 0) {
        setShow(true);
      }
      window.electronAPI.setStore("allevent", response?.data?.events);
    } catch (error) {
      const allevent = await window.electronAPI.getStore("allevent");

      setAllEvents(allevent);
      console.log(error.response?.data?.message);
    }
  };

  const fetchBillables = async () => {
    setBillablesLoading(true);
    try {
      const response = await axios.get(`${baseURL}/events/billables`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setBillables(
        response.data.data || {
          summary: {},
          unpaidEvents: [],
          unpricedEvents: [],
        }
      );
    } catch (error) {
      console.error(
        "Error fetching billables:",
        error?.response?.data?.message || error.message
      );
    } finally {
      setBillablesLoading(false);
    }
  };

  const handlesearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      performSearch();
    }
  };

  const performSearch = () => {
    // console.log("Searching for:", searchTerm);
    navigate(`/organization/search/${searchTerm}`);
  };

  function formatFileSize(bytes) {
    if (!bytes || isNaN(bytes)) return "0 B";

    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = bytes / Math.pow(1024, i);

    return `${size.toFixed(2)} ${sizes[i]}`;
  }

  const today = startOfDay(new Date());
  const nextSevenDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(today, i);
    const dayLabel = format(date, "EEE"); // Sun, Mon, etc.
    const matchingDay = nextevents.find(
      (d) =>
        format(new Date(d._id), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
    );
    return {
      dayName: dayLabel,
      date: format(date, "MMM dd"),
      events: matchingDay ? matchingDay.events.map((e) => e.name) : [],
    };
  });

  // console.log(nextSevenDays);

  const xLabels = nextSevenDays.map((d) => d.date);
  const eventsCount = nextSevenDays.map((d) => d.events.length);

  // console.log(eventsCount);

  // Get event status breakdown from API response
  const eventStats = summary?.eventStatusStats || {
    completed: 0,
    upcoming: 0,
    ongoing: 0,
    cancelled: 0,
    total: 0,
  };

  // Status breakdown for pie chart
  const statusData = [
    { label: "Completed", value: eventStats.completed },
    { label: "Upcoming", value: eventStats.upcoming },
    { label: "Ongoing", value: eventStats.ongoing },
    { label: "Cancelled", value: eventStats.cancelled },
  ].filter((item) => item.value > 0);

  // Use count directly as arcLabel
  const getArcLabel = (params) => `${params.value}`;

  // Handle pie chart click to show popover with events
  const handleStatusClick = (event, statusLabel) => {
    const statusKey = statusLabel.toLowerCase();
    const eventsForStatus = allEvents.filter((e) => e.status === statusKey);
    setPopoverEvents(eventsForStatus);
    setPopoverStatus(statusLabel);
    setPopoverAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setPopoverAnchorEl(null);
    setPopoverStatus(null);
  };

  const openPopover = Boolean(popoverAnchorEl);

  const theme = useTheme();
  const isXl = useMediaQuery(theme.breakpoints.up("xl"));
  const isLg = useMediaQuery(theme.breakpoints.up("lg"));
  const isMd = useMediaQuery(theme.breakpoints.up("md"));
  const isSm = useMediaQuery(theme.breakpoints.up("sm"));

  // Decide sizes for each screen range
  let width, height;
  if (isXl) {
    width = 500;
    height = 300; // xl screens
  } else if (isLg) {
    width = 450;
    height = 300; // lg screens
  } else if (isMd) {
    width = 350;
    height = 300; // md screens
  } else if (isSm) {
    width = 340;
    height = 240; // sm screens
  } else {
    width = 370;
    height = 200; // xs screens
  }

  return (
    <>
      {dataload ? (
        <div className="flex flex-col items-center justify-center h-96 bg-white dark:bg-slate-900 rounded-lg shadow-sm p-6">
          <CircularProgress className="text-blue-600" />
          <p className="mt-4 text-slate-600 dark:text-slate-300">Loading...</p>
        </div>
      ) : permission ? (
        <div className="bg-slate-100 p-5 rounded text-center mt-5 dark:bg-slate-800">
          <ErrorOutlineIcon
            sx={{ fontSize: "50px" }}
            className="text-red-600"
          />
          <h1 className="text-slate-700 font-normal text-2xl dark:text-white">
            You do not have access to this page
          </h1>
          <p className="text-slate-700 font-normal text-sm dark:text-white">
            We're sorry, your plan does not have permission or upgrade to access
            this page
          </p>
          <button
            className="bg-blue rounded px-5 py-2 mt-4 text-white font-normal hover:bg-blueHoverHover"
            onClick={() => navigate("/organization/upgrade_plan")}
          >
            <BoltIcon /> Upgrade Plan
          </button>
        </div>
      ) : (
        <div className="main-dash">
          <div className="flex justify-end">
            <div className="flex bg-white py-2 px-3 dark:bg-slate-800 rounded-md w-full text-start md:w-[25%]">
              <SearchIcon className="text-slate-400 dark:text-white cursor-pointer" onClick={performSearch} />
              <input
                type="text"
                name="search"
                placeholder="Search events by name...."
                onChange={handlesearchChange}
                onKeyDown={handleSearchKeyDown}
                className="w-full text-sm ms-1 border-none outline-none bg-transparent dark:text-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 md:gap-4 md:grid-cols-4 mt-4">
            <Link to="/organization/events_category">
              <div className="flex h-24 bg-white rounded-2xl py-5 md:mb-0 dark:bg-slate-800 ">
                <div className="flex items-center px-4">
                  <CalendarMonthIcon
                    sx={{
                      fontSize: {
                        xs: 20,
                        md: 35,
                      },
                      display: {
                        xs: "none",
                        lg: "block",
                      },
                    }}
                    className="text-orange-400"
                  />
                </div>
                <div className="grid text-start">
                  <h2 className="mb-0 font-semibold text-sm text-slate-500 dark:text-white">
                    Upcoming Events
                  </h2>
                  <p className="mb-0 font-medium text-xl text-slate-700 dark:text-white">
                    {summary?.upcomingEventCount || 0}
                  </p>
                </div>
              </div>
            </Link>
            <div className="flex h-24 bg-white rounded-2xl py-5 dark:bg-slate-800">
              <div className="flex items-center px-4">
                <InsertPhotoOutlinedIcon
                  sx={{
                    fontSize: {
                      xs: 30,
                      md: 30,
                    },
                    display: {
                      xs: "none",
                      lg: "block",
                    },
                  }}
                  className="text-green-600"
                />
              </div>
              <div className="grid text-start">
                <h2 className="mb-0 font-semibold text-sm text-slate-500 dark:text-white">
                  Total Photos
                </h2>
                <p className="mb-0 font-medium text-xl text-slate-700 dark:text-white">
                  {summary?.totalPhotos || 0}
                </p>
              </div>
            </div>
            <Link to="/organization/team">
              <div className="flex h-24 bg-white rounded-2xl py-5 md:mb-0 dark:bg-slate-800">
                <div className="flex items-center px-4">
                  <PeopleAltOutlinedIcon
                    sx={{
                      fontSize: {
                        xs: 20,
                        md: 30,
                      },
                      display: {
                        xs: "none",
                        lg: "block",
                      },
                    }}
                    className="text-red-500"
                  />
                </div>
                <div className="grid text-start">
                  <h2 className="mb-0 font-semibold text-sm text-slate-500 dark:text-white">
                    Team Members
                  </h2>
                  <p className="mb-0 font-medium text-xl text-slate-700 dark:text-white">
                    {summary?.teamMemberCount || 0}
                  </p>
                </div>
              </div>
            </Link>
            <div className="flex h-24 bg-white rounded-2xl py-5 dark:bg-slate-800">
              <div className="flex items-center px-4">
                <BackupOutlinedIcon
                  sx={{
                    fontSize: {
                      xs: 20,
                      md: 30,
                    },
                    display: {
                      xs: "none",
                      lg: "block",
                    },
                  }}
                  className="text-violet-500"
                />
              </div>
              <div className="grid text-start">
                <h2 className="mb-0 font-semibold text-sm text-slate-500 dark:text-white">
                  Optimized Used Storage
                </h2>
                <p className="mb-0 font-medium text-xl text-slate-700 dark:text-white">
                  {formatFileSize(summary?.totalPhotoSize)}
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-4">
            <div>
              <div className="w-full bg-white rounded-md p-3 dark:bg-slate-800">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-slate-700 font-medium text-lg dark:text-white">
                    Total Events
                  </h2>
                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-semibold dark:bg-blue-900 dark:text-blue-200">
                    {eventStats.total || 0}
                  </span>
                </div>
                {eventStats.total === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-center">
                    <CalendarMonthIcon
                      sx={{ fontSize: 50 }}
                      className="text-gray-300 dark:text-slate-600 mb-2"
                    />
                    <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      No Events Yet
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mb-3">
                      Create events to track performance
                    </p>
                    <Link to="/organization/create_event">
                      <button className="bg-blue text-white py-1 px-3 rounded text-xs font-semibold hover:bg-blue-700 dark:bg-blue-600">
                        Create Event
                      </button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Event Status Breakdown Pie Chart */}
                    {statusData.length > 0 && (
                      <div className="cursor-pointer">
                        <Box sx={{ width: "100%", height: 200 }}>
                          <PieChart
                            series={[
                              {
                                data: statusData,
                                arcLabel: getArcLabel,
                              },
                            ]}
                            onItemClick={(event, d, series) => {
                              // Get the clicked data item
                              const clickedData = statusData[d.dataIndex];
                              const statusKey = clickedData.label.toLowerCase();
                              const eventsByStatus =
                                summary?.eventsByStatus || {};

                              setPopoverEvents(eventsByStatus[statusKey] || []);
                              setPopoverStatus(clickedData.label);
                              setPopoverAnchorEl(event.currentTarget);
                            }}
                            sx={{
                              [`& .${pieArcLabelClasses.root}`]: {
                                fill: "white",
                                fontSize: 12,
                              },
                            }}
                            height={200}
                            width={Math.min(width - 80, 350)}
                            margin={{
                              right: 150,
                            }}
                            className="m-auto dark:text-white hover:opacity-80 transition"
                          />
                        </Box>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="bg-white rounded mt-5 flex flex-col pb-3 dark:bg-slate-800">
                <div className="flex justify-between items-center p-3 border-b border-slate-100 dark:border-slate-700">
                  <h2 className="text-start text-lg font-medium text-slate-700 dark:text-white">
                    Upcoming Events
                  </h2>
                  {recentevent.length > 0 && (
                    <button
                      onClick={() => navigate("/organization/events_list")}
                      className="text-xs font-semibold text-blue-500 hover:text-blue-700 dark:hover:text-blue-400"
                    >
                      View All →
                    </button>
                  )}
                </div>
                {recentevent.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <CalendarMonthIcon
                      sx={{ fontSize: 40 }}
                      className="text-gray-300 dark:text-slate-600 mb-2"
                    />
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                      No Upcoming events
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">
                      Create one to get started
                    </p>
                    <Link to="/organization/create_event">
                      <button className="bg-blue-500 text-white py-1 px-3 rounded text-xs font-semibold hover:bg-blue-600">
                        Create
                      </button>
                    </Link>
                  </div>
                ) : (
                  <div className="max-h-80 overflow-auto">
                    {recentevent.map((event, index) => (
                      <div
                        key={index}
                        className="px-3 border-solid border-t-2 border-slate-100 dark:border-slate-700 flex items-center justify-between py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700"
                        onClick={() =>
                          navigate(`/organization/event/${event?._id}`)
                        }
                      >
                        <div className="ml-2">
                          <p className="text-start mb-0 font-normal text-slate-700 dark:text-white capitalize">
                            {event?.name}
                          </p>
                          <div className="flex items-center text-gray-500 dark:text-white">
                            <CalendarMonthIcon sx={{ fontSize: 15 }} />
                            <span className="ms-1">
                              {format(
                                new Date(event?.earliestDate),
                                "MMM dd, yyyy"
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <p className="text-green-500 font-normal mr-5">
                            Active
                          </p>
                          <ChevronRightOutlinedIcon
                            sx={{ fontSize: 25, color: "gray" }}
                            className="dark:text-white"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <div className="w-full bg-white rounded-md p-3 dark:bg-slate-800">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-slate-700 font-medium text-lg dark:text-white">
                    Upcoming Events
                  </h2>
                  <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-semibold dark:bg-orange-900 dark:text-orange-200">
                    7 Days
                  </span>
                </div>
                {nextSevenDays.some((d) => d.events.length > 0) ? (
                  <>
                    <Box sx={{ width: "100%", height: 220 }}>
                      <BarChart
                        series={[
                          {
                            data: eventsCount,
                            label: "Events",
                            id: "pvId",
                            color: "#FF9800",
                          },
                        ]}
                        xAxis={[
                          {
                            data: xLabels,
                            scaleType: "band",
                          },
                        ]}
                        yAxis={[{ width: 40, min: 0 }]}
                        margin={{ top: 10, bottom: 30, left: 30, right: 10 }}
                        className="dark:text-white"
                      />
                    </Box>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-center">
                    <CalendarMonthIcon
                      sx={{ fontSize: 50 }}
                      className="text-gray-300 dark:text-slate-600 mb-2"
                    />
                    <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      No Events Coming
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mb-3">
                      Schedule one to get started
                    </p>
                    <Link to="/organization/create_event">
                      <button className="bg-orange-500 text-white py-1 px-3 rounded text-xs font-semibold hover:bg-orange-600">
                        Schedule
                      </button>
                    </Link>
                  </div>
                )}
              </div>
              <div className="bg-white rounded flex flex-col mt-5 dark:bg-slate-800">
                <h2 className="text-start text-lg font-medium p-3 text-slate-700 dark:text-white border-b border-slate-100 dark:border-slate-700">
                  System Notification
                </h2>
                {audit.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <style>{`
                      @keyframes float {
                        0%, 100% { transform: translateY(0px); }
                        50% { transform: translateY(-10px); }
                      }
                      .float-animation {
                        animation: float 3s ease-in-out infinite;
                      }
                    `}</style>
                    <NotificationsNoneIcon
                      sx={{ fontSize: 48 }}
                      className="text-gray-300 dark:text-slate-600 mb-3 float-animation"
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
                    {notification &&
                      notification.map((audit, index) => (
                        <div
                          className="flex flex-col px-4 py-1 border-solid border-t-2 border-slate-100 dark:border-slate-700 text-start w-[95%]"
                          key={index}
                        >
                          <div className="flex justify-end">
                            <p
                              className={`hidden md:block text-end rounded-full text-white w-max px-2 text-sm ${
                                audit?.status === "success"
                                  ? "bg-green-700"
                                  : "bg-red-700"
                              }`}
                            >
                              {audit?.status}
                            </p>
                          </div>
                          <div className="flex ">
                            <CloudUploadOutlinedIcon
                              sx={{ fontSize: "20px" }}
                              className="text-slate-700 dark:text-white"
                            />
                            <p className="mb-0 ml-3 dark:text-white text-slate-700 font-normal">
                              <span className="font-normal text-slate-600 dark:text-white">
                                {audit?.message}.
                              </span>{" "}
                              {/* {audit?.action} {audit?.resourceType}{" "}
                            {audit?.status}. */}
                            </p>
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="mb-0 text-start ml-8 text-xs font-normal text-gray-500 dark:text-white">
                              {format(
                                new Date(audit?.createdAt),
                                "MMM dd, yyyy hh:mm a"
                              )}
                            </p>
                            <p
                              className={`md:hidden rounded-full text-white w-max px-2 text-sm font-normal ${
                                audit?.status === "success"
                                  ? "bg-green-700"
                                  : "bg-red-700"
                              }`}
                            >
                              {audit?.status}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Outstanding Billables */}
          <div className="w-full bg-white rounded-md p-3 dark:bg-slate-800 mt-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-slate-700 font-medium text-lg dark:text-white">
                Outstanding Billables
              </h2>
              <div className="text-sm text-slate-600 dark:text-slate-300">
                <div>
                  Total: <b>₹{billables?.summary?.totalAmount ?? 0}</b>
                </div>
                <div>
                  Received:{" "}
                  <b className="text-green-600">
                    ₹{billables?.summary?.totalReceived ?? 0}
                  </b>
                </div>
                <div>
                  Remaining:{" "}
                  <b className="text-red-600">
                    ₹{billables?.summary?.remainingTotal ?? 0}
                  </b>
                </div>
              </div>
            </div>

            {billablesLoading ? (
              <div className="flex items-center justify-center h-40">
                <CircularProgress />
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Total
                    </p>
                    <p className="text-lg font-bold text-slate-800 dark:text-white">
                      ₹{billables?.summary?.totalAmount ?? 0}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Received
                    </p>
                    <p className="text-lg font-bold text-green-600">
                      ₹{billables?.summary?.totalReceived ?? 0}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Remaining
                    </p>
                    <p className="text-lg font-bold text-red-600">
                      ₹{billables?.summary?.remainingTotal ?? 0}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  {(() => {
                    const total = billables?.summary?.totalAmount || 0;
                    const received = billables?.summary?.totalReceived || 0;
                    const percent =
                      total > 0 ? Math.round((received / total) * 100) : 0;
                    return (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs text-slate-600 dark:text-slate-400">
                            Collected
                          </div>
                          <div className="text-xs font-medium text-slate-700 dark:text-white">
                            {percent}%
                          </div>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-green-600 transition-all"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </>
                    );
                  })()}

                  <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                    {billables?.unpaidEvents?.length
                      ? `${billables.unpaidEvents.length} unpaid event(s)`
                      : "No unpaid events"}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-5"></div>
        </div>
      )}
      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative w-[90%] max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden">
            {/* Gradient background decoration */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-blue via-blue/70 to-cyan-400 opacity-90"></div>

            {/* Close button */}
            <div className="relative z-10 flex justify-end p-4">
              <button
                onClick={() => setShow(false)}
                className="p-1 hover:bg-white/20 rounded-full transition duration-200"
              >
                <CloseIcon
                  sx={{ fontSize: "24px" }}
                  className="text-white/80 hover:text-white"
                />
              </button>
            </div>

            {/* Content */}
            <div className="px-8 pt-4 pb-8 flex flex-col items-center text-center">
              {/* Icon */}
              <div className="mb-6 mt-2">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue/20 to-cyan-400/20 border border-blue/30">
                  <svg
                    className="w-8 h-8 text-blue"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                No Events Yet
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
                Your calendar is empty. Create your first event to get started
                with managing your photography bookings.
              </p>
              <button
                className="w-full bg-gradient-to-r from-blue to-cyan-400 hover:from-blue/90 hover:to-cyan-400/90 text-white font-semibold py-3 px-6 rounded-lg transition duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                onClick={() => navigate("/organization/create_event")}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create Your First Event
              </button>

              {/* Secondary text */}
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
                💡 Tip: Add event details, dates, and times to attract more
                clients
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Status Events Popover */}
      <Popover
        id={openPopover ? "status-popover" : undefined}
        open={openPopover}
        anchorEl={popoverAnchorEl}
        onClose={handlePopoverClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
      >
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-lg w-80">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-slate-700 dark:text-white capitalize">
              {popoverStatus} Events ({popoverEvents.length})
            </h3>
            <CloseIcon
              sx={{ fontSize: "18px" }}
              className="text-slate-500 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300"
              onClick={handlePopoverClose}
            />
          </div>
          <div className="max-h-80 overflow-y-auto">
            {popoverEvents.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                No events in this status
              </p>
            ) : (
              <div className="space-y-2">
                {popoverEvents.map((event, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      navigate(`/organization/event/${event._id}`);
                      handlePopoverClose();
                    }}
                    className="p-3 border border-slate-200 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-slate-700 dark:text-white text-sm group-hover:text-blue transition">
                          {event.name}
                        </p>
                        <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 mt-1">
                          <CalendarMonthIcon
                            sx={{ fontSize: 14 }}
                            className="mr-1"
                          />
                          {event.timeSlots?.length > 0
                            ? format(
                                new Date(event.timeSlots[0].date),
                                "MMM dd, yyyy"
                              )
                            : "No date"}
                        </div>
                      </div>
                      <ChevronRightOutlinedIcon
                        sx={{ fontSize: 18 }}
                        className="text-slate-400 dark:text-slate-500 group-hover:text-blue transition"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Popover>
    </>
  );
}

export default Main;
