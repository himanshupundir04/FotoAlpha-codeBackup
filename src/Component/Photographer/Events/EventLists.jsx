import { CircularProgress } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import React, { useContext, useEffect, useState } from "react";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import BoltIcon from "@mui/icons-material/Bolt";
import DeleteIcon from "@mui/icons-material/Delete";
import {useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import demo from "../../image/demo.jpg";
import BorderColorIcon from "@mui/icons-material/BorderColor";
import Swal from "sweetalert2";
import { format } from "date-fns";
import SearchIcon from "@mui/icons-material/Search";
import { toast } from "react-toastify";
import { PortfolioEventContext } from "../Context/PortfolioEventContext"

const baseUrl = process.env.REACT_APP_BASE_URL;
function EventLists() {
   const location = useLocation();
  const params = new URLSearchParams(location.search);
  const type = params.get("type");
  const [loading, setLoading] = useState(false);
  const [permission, setPermission] = useState(false);
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [searchText, setSearchText] = useState("");
  const [status, setStatus] = useState(type || ""); 
  const { setPortfolioEvent } = useContext(PortfolioEventContext); 
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    fetchAllevent("", "", "", status);
  }, [status]);

  const handleSearchText = () => {
    setCurrentPage(1);
    if (searchText.trim() === "") {
      fetchAllevent(fromDate, toDate);
    } else {
      fetchAllevent(fromDate, toDate, searchText);
    }
  };

  const fetchAllevent = async (
    from = "",
    to = "",
    search = "",
    status = "",
  ) => {
    setLoading(true);
    const query = new URLSearchParams();
    if (from) query.append("startDate", from);
    if (to) query.append("endDate", to);
    if (search) query.append("search", search);
    if (status) query.append("status", status);
    try {
      const response = await axios.get(
        `${baseUrl}/events/all-events?${query.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      const getCurrentOrNextSlot = (slots) => {
        if (!slots || slots.length === 0) return null;
        const timeOrder = { morning: 1, noon: 2, evening: 3 };
        const sortedSlots = [...slots].sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          if (dateA !== dateB) return dateA - dateB;
          return (timeOrder[a.slotTime?.toLowerCase()] || 0) - (timeOrder[b.slotTime?.toLowerCase()] || 0);
        });
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const currentHour = now.getHours();
        for (const slot of sortedSlots) {
          const slotDate = new Date(slot.date);
          const slotDay = new Date(slotDate.getFullYear(), slotDate.getMonth(), slotDate.getDate()).getTime();
          if (slotDay > today) return slot;
          if (slotDay === today) {
            const slotTime = slot.slotTime?.toLowerCase();
            let slotEndHour = 24;
            if (slotTime === 'morning') slotEndHour = 12;
            else if (slotTime === 'noon') slotEndHour = 17;
            else if (slotTime === 'evening') slotEndHour = 24;
            if (currentHour < slotEndHour) return slot;
          }
        }
        return sortedSlots[sortedSlots.length - 1];
      };

      const events =
        response?.data?.events?.map((ev) => {
          const currentSlot = getCurrentOrNextSlot(ev?.timeSlots);

          return {
            firstPhoto: ev?.firstPhotoSignedUrl || ev?.eventCategoryId?.imageSignedUrl,
            eventName: ev?.name,
            category: ev?.eventCategoryId?.name,

            startDate: currentSlot?.date,
            eventSubCategory: currentSlot?.eventSubCategory?.name, // subcategory of active slot
            eventid: ev?._id,
            status: ev?.status,
            description: ev?.description,
            slotsCount: ev?.timeSlots?.length || 0,
            slotTime: currentSlot?.slotTime,
          };
        }) || [];
      setEvents(events);
      setFromDate("");
      setToDate("");
      setSearchText("");
      setLoading(false);
    } catch (error) {
      console.log(error.response?.data?.message);
      setLoading(false);
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

  const handleDateSearch = () => {
    setCurrentPage(1);
    if (!fromDate && !toDate) {
      toast.warning("Please select a date range", { autoClose: 1500 });
      return;
    }
    fetchAllevent(fromDate, toDate);
  };

  const handleEdit = (data) => {
    // console.log(data);
    const eventId = data;
    fetchEvents(eventId);
    navigate(`/photographer/event/${eventId}/edit_event`);
  };

  const fetchEvents = async (eventId) => {
    axios
      .get(`${baseUrl}/events/${eventId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "ngrok-skip-browser-warning": "69420",
        },
      })
      .then((response) => {
        setPortfolioEvent(response.data.event);
        // console.log(response.data.event);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const data = events;
  // console.log(events);

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = data.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(data.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleDeleteEvent = (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You are about to delete this event. All associated data and photos will also be permanently deleted. This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes!",
    }).then((result) => {
      if (result.isConfirmed) {
        axios
          .delete(`${baseUrl}/events/${id}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "ngrok-skip-browser-warning": "69420",
            },
          })

          .then(() => {
            toast.success("Event and all related data deleted successfully", {
              autoClose: 1200,
            });
            fetchAllevent();
          })
          .catch((err) => {
            toast.error(err?.response?.data?.message || err?.message, {
              autoClose: 2000,
            });
            console.log(err);
          });
      }
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 ">
        <CircularProgress className="text-blue-600" />
        <p className="mt-4 text-slate-600 dark:text-slate-300">
          Loading events...
        </p>
      </div>
    );
  }

  if (permission) {
    return (
      <div className="bg-slate-100 p-5 rounded text-center mt-5">
        <ErrorOutlineIcon sx={{ fontSize: "50px" }} className="text-red-600" />
        <h1 className="text-slate-700 font-normal text-2xl">
          You do not have access to this page
        </h1>
        <p className="text-slate-700 font-normal text-sm">
          We're sorry, your plan does not have permission or upgrade to access
          this page
        </p>
        <button
          className="bg-blue rounded px-5 py-2 mt-4 text-white font-normal hover:bg-blueHoverHover"
          onClick={() => navigate("/photographer/upgrade_plan")}
        >
          <BoltIcon /> Upgrade Plan
        </button>
      </div>
    );
  }

  const handleClear = () => {
    setFromDate("");
    setToDate("");
    setSearchText("");
    setStatus("");
    setCurrentPage(1);
    fetchAllevent();
  };

  return (
    <>
      <style>
        {`
          .no-shadow {
            box-shadow: none !important;
          }
          .MuiTableCell-root.MuiTableCell-head{
                font-weight: bold !important;
                color: #212935ff;
            }
          .MuiTableCell-head {
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: hidden;
          }
          .css-1fnc9ax-MuiButtonBase-root-MuiButton-root {
            padding: 5px 0px;
            justify-content: start;
          }
          .MuiTableRow-root {
  cursor: pointer;
}

        `}
      </style>
      <div className="  text-start">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex flex-col">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
                    All Events
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {data.length} {data.length === 1 ? "event" : "events"} found
                  </p>
                </div>
                <button
                  onClick={() => navigate("/photographer/create_event")}
                  className="inline-flex items-center px-4 py-2 bg-blue hover:bg-blueHover text-white text-sm font-medium rounded-lg transition-colors duration-200 whitespace-nowrap"
                >
                  <AddIcon className="w-5 h-5 mr-1" />
                  Create Event
                </button>
              </div>

            </div>
          </div>
          <div className="">
            {data.length === 0 ? (
              <div className="flex items-center justify-center min-h-[500px] p-8">
                <div className="w-full max-w-2xl">
                  {/* Gradient Card Container */}
                  <div className="bg-gradient-to-br from-blue/5 via-white to-cyan-400/5 dark:from-slate-800/50 dark:via-slate-900 dark:to-slate-800/50 rounded-2xl p-12 border border-blue/10 dark:border-slate-700/50 shadow-xl">
                    {/* Icon Container */}
                    <div className="flex justify-center mb-6">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue to-cyan-400 rounded-full blur opacity-20"></div>
                        <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue/20 to-cyan-400/20 border border-blue/30">
                          <svg
                            className="w-12 h-12 text-blue"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Heading */}
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white text-center mb-3">
                      No Events Yet
                    </h2>

                    {/* Subheading */}
                    <p className="text-lg text-slate-700 dark:text-slate-300 text-center mb-2 font-medium">
                      Start Your Journey
                    </p>

                    {/* Description */}
                    <p className="text-base text-slate-600 dark:text-slate-400 text-center mb-10 leading-relaxed max-w-lg mx-auto">
                      You haven't created any events yet. Create your first
                      event to start showcasing your photography work and
                      attract clients.
                    </p>

                    {/* Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                      <div className="bg-white dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700/50 text-center hover:border-blue/30 dark:hover:border-blue/30 transition-colors">
                        <svg
                          className="w-6 h-6 text-blue mx-auto mb-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                        <p className="text-sm font-semibold text-slate-700 dark:text-white">
                          Fast Setup
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Create in minutes
                        </p>
                      </div>
                      <div className="bg-white dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700/50 text-center hover:border-blue/30 dark:hover:border-blue/30 transition-colors">
                        <svg
                          className="w-6 h-6 text-cyan-400 mx-auto mb-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <p className="text-sm font-semibold text-slate-700 dark:text-white">
                          Attract Clients
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Get more bookings
                        </p>
                      </div>
                      <div className="bg-white dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700/50 text-center hover:border-blue/30 dark:hover:border-blue/30 transition-colors">
                        <svg
                          className="w-6 h-6 text-green-500 mx-auto mb-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <p className="text-sm font-semibold text-slate-700 dark:text-white">
                          Easy Management
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Full control & analytics
                        </p>
                      </div>
                    </div>

                    {/* Primary CTA Button */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <button
                        onClick={() => navigate("/photographer/create_event")}
                        className="flex-1 sm:flex-none bg-gradient-to-r from-blue to-cyan-400 hover:from-blue/90 hover:to-cyan-400/90 text-white font-semibold py-3 px-8 rounded-lg transition duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
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
                      <button
                        onClick={() =>
                          navigate("/photographer/events_category")
                        }
                        className="flex-1 sm:flex-none border-2 border-blue text-blue hover:bg-blue/5 dark:hover:bg-blue/10 dark:text-cyan-400 dark:border-cyan-400 font-semibold py-3 px-8 rounded-lg transition duration-300 flex items-center justify-center gap-2"
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
                            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                          />
                        </svg>
                        Browse Categories
                      </button>
                    </div>

                    {/* Secondary text */}
                    <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-6">
                      💡 Tip: Start with a category like Wedding, Portrait, or
                      Corporate to organize your work
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col lg:flex-row justify-between items-center mt-2 px-6 gap-4">
                  <div className="flex flex-wrap items-center gap-3 border border-slate-100 p-1.5 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 dark:border-slate-700">
                    <p className="text-slate-500 font-medium text-sm ml-2 dark:text-slate-400">From</p>
                    <input
                      type="date"
                      name="from"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="border border-slate-200 outline-none w-full md:w-max rounded-xl px-3 py-1.5 text-slate-600 focus:border-[#0b8599] transition-colors"
                    />
                    <p className="text-slate-500 font-medium text-sm px-1 dark:text-slate-400">To</p>
                    <input
                      type="date"
                      name="to"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="border border-slate-200 outline-none w-full md:w-max rounded-xl px-3 py-1.5 text-slate-600 focus:border-[#0b8599] transition-colors"
                    />
                    <button
                      className="bg-[#0b8599] px-5 py-1.5 text-white w-[100%] md:w-max font-semibold hover:bg-[#086a7a] rounded-xl shadow-sm transition-colors"
                      onClick={handleDateSearch}
                    >
                      Search
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    <div className="px-2 py-1.5 border w-full md:w-max border-slate-200 dark:border-slate-600 rounded-full bg-white">
                      <select className="text-slate-600 w-full md:w-max"
                       value={status}
                        onChange={(e) => setStatus(e.target.value)}>
                        <option value="">All</option>
                        <option value="Upcoming">Upcoming</option>
                        <option value="Completed">Completed</option>
                        <option value="Ongoing">Ongoing</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div className="relative flex w-full md:w-max md:w-[120px]">
                      <div className="flex items-center gap-2 w-full px-4 py-1.5 border border-slate-200 dark:border-slate-600 rounded-full bg-white dark:bg-slate-800 text-slate-600 focus-within:border-[#0b8599] transition-colors shadow-sm">
                        <input
                          type="text"
                          placeholder="Search events..."
                          value={searchText}
                          name="search"
                          onChange={(e) => setSearchText(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSearchText()}
                          className="w-full outline-none text-sm bg-transparent"
                        />
                        <SearchIcon
                          onClick={handleSearchText}
                          fontSize="small"
                          className="text-[#0b8599] cursor-pointer hover:text-[#086a7a]"
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleClear}
                      className="border border-[#4fb5c4] text-[#4fb5c4] hover:bg-[#4fb5c4]/5 rounded-full px-5 py-1.5 font-medium text-sm transition-colors shadow-sm"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => {
                        const csvContent = [
                          ["Event Name", "Category", "Sub Event", "Date"],
                          ...events.map((event) => [
                            event.eventName,
                            event.category,
                            event.eventSubCategory,
                            format(new Date(event.startDate), "MMM dd yyyy"),
                          ]),
                        ].map((row) => row.join(",")).join("\n");

                        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.href = url;
                        link.download = `events-${new Date().toISOString().split("T")[0]}.csv`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="inline-flex items-center px-4 py-1.5 border border-slate-200 rounded-full text-slate-600 text-sm font-medium bg-white hover:bg-slate-50 transition-colors shadow-sm"
                      title="Download CSV"
                    >
                      <svg
                        className="w-5 h-5 mr-1.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      CSV
                    </button>
                  </div>
                </div>
                <div className="mt-6 px-6 space-y-3 pb-4">
                  {currentItems.map((event, index) => (
                    <div key={index} className="bg-white rounded-2xl p-3 flex flex-col md:flex-row items-center justify-between shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05),0_4px_12px_-2px_rgba(0,0,0,0.02)] border border-slate-100 dark:bg-slate-800 dark:border-slate-700 transition-all hover:shadow-md cursor-pointer" onClick={() => navigate(`/photographer/event/${event.eventid}`)}>
                      {/* Left & Middle: Image and Details */}
                      <div className="flex flex-col md:flex-row items-center gap-5 w-full md:w-auto flex-1">
                        {/* Image Thumbnail */}
                        <div className="w-full md:w-24 h-24 flex-shrink-0">
                          <img
                            src={event.firstPhoto || demo}
                            alt={event.eventName}
                            className="w-full h-full object-cover rounded-xl shadow-sm"
                          />
                        </div>

                        {/* Details */}
                        <div className="flex flex-col text-center md:text-left mt-2 md:mt-0 flex-1">
                          <p className="text-[10px] font-bold tracking-widest text-[#4fb5c4] uppercase mb-1">
                            {event.category || "UNCATEGORIZED"}
                          </p>
                          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-1.5">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">
                              {event.eventName}
                            </h3>
                            {event.status && (
                              <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wide mt-0.5 ${event.status.toLowerCase() === 'upcoming' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                                event.status.toLowerCase() === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' :
                                  'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                }`}>
                                {event.status}
                              </span>
                            )}
                          </div>

                          {event.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 line-clamp-1 max-w-sm">
                              {event.description}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-[12px] text-slate-500 dark:text-slate-400 font-medium mt-auto">
                            <div className="flex items-center gap-1.5">
                              <CalendarTodayOutlinedIcon className="w-3.5 h-3.5" fontSize="small" />
                              <span>
                                {event.startDate ? format(new Date(event.startDate), "MMM dd, yyyy") : "Date N/A"}
                                {event.slotTime && <span className="ml-1 text-[#4fb5c4] font-bold">({event.slotTime})</span>}
                              </span>
                            </div>
                            {event.slotsCount > 0 && (
                              <div className="flex items-center gap-1.5 opacity-80">
                                <AccessTimeOutlinedIcon className="w-3.5 h-3.5" fontSize="small" />
                                <span>{event.slotsCount} Session{event.slotsCount !== 1 ? 's' : ''}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Side: Phase & Actions */}
                      <div className="flex flex-col md:flex-row items-center gap-6 mt-4 md:mt-0">
                        {/* Current Phase */}
                        <div className="flex flex-col items-center mr-4">
                          <span className="text-[9px] font-bold tracking-wider text-slate-400 uppercase mb-1">
                            CURRENT PHASE
                          </span>
                          <div className="bg-[#ebf8f9] text-[#4fb5c4] px-4 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide">
                            {event.eventSubCategory || "INITIAL"}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2.5">
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/photographer/event/${event.eventid}`); }}
                            className="p-2 text-slate-400 hover:text-blue hover:border-blue hover:bg-blue/5 transition-all bg-white"
                            title="View Details"
                          >
                            <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEdit(event.eventid); }}
                            className="p-2 text-slate-400 hover:text-green-600 hover:border-green-600 hover:bg-green-50 transition-all bg-white"
                            title="Edit Event"
                          >
                            <EditOutlinedIcon sx={{ fontSize: 18 }} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteEvent(event.eventid); }}
                            className="p-2 text-slate-400 hover:text-red-500 hover:border-red-500 hover:bg-red-50 transition-all bg-white"
                            title="Delete Event"
                          >
                            <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-4 mb-8">
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white"
                    >
                      <ChevronLeftIcon fontSize="small" />
                    </button>

                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => paginate(i + 1)}
                        className={`w-9 h-9 rounded-md text-sm font-medium transition-all ${currentPage === i + 1
                          ? "bg-[#0b8599] text-white shadow-md shadow-[#0b8599]/30 border border-transparent"
                          : "border border-slate-200 text-slate-600 hover:bg-slate-50 bg-white"
                          }`}
                      >
                        {i + 1}
                      </button>
                    ))}

                    <button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white"
                    >
                      <ChevronRightIcon fontSize="small" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default EventLists;
