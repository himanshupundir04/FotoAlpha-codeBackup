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

const baseUrl = import.meta.env.VITE_BASE_URL;
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
  const itemsPerPage = 12;

  useEffect(() => {
    fetchAllevent("", "", "", status);
  }, [status]);

  const handleSearchText = () => {
    setCurrentPage(1);
    if (searchText.trim() === "") {
      fetchAllevent(fromDate, toDate, "", status);
    } else {
      fetchAllevent(fromDate, toDate, searchText, status);
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
            eventSubCategory: currentSlot?.eventSubCategory?.name,
            eventid: ev?._id,
            status: ev?.status,
            computedStatus: ev?.computedStatus || ev?.status || "upcoming",
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
    fetchAllevent(fromDate, toDate, "", status);
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
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
            <div className="flex flex-col">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <h2 className="text-base font-semibold text-slate-800 dark:text-white">
                    All Events
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {data.length} {data.length === 1 ? "event" : "events"} found
                  </p>
                </div>
                <button
                  onClick={() => navigate("/photographer/create_event")}
                  className="inline-flex items-center px-3 py-1.5 bg-blue hover:bg-blueHover text-white text-xs font-medium rounded-lg transition-colors duration-200 whitespace-nowrap"
                >
                  <AddIcon className="w-4 h-4 mr-1" />
                  Create Event
                </button>
              </div>

            </div>
          </div>
          <div className="">
            <>
                <div className="flex flex-col lg:flex-row justify-between items-center mt-1 px-4 gap-1.5">
                  <div className="flex flex-wrap items-center gap-2 border border-slate-100 p-1 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 dark:border-slate-700">
                    <p className="text-slate-500 font-medium text-xs ml-1.5 dark:text-slate-400">From</p>
                    <input
                      type="date"
                      name="from"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="border border-slate-200 outline-none w-full md:w-max rounded-xl px-2 py-1 text-xs text-slate-600 focus:border-[#0b8599] transition-colors"
                    />
                    <p className="text-slate-500 font-medium text-xs px-0.5 dark:text-slate-400">To</p>
                    <input
                      type="date"
                      name="to"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="border border-slate-200 outline-none w-full md:w-max rounded-xl px-2 py-1 text-xs text-slate-600 focus:border-[#0b8599] transition-colors"
                    />
                    <button
                      className="bg-[#0b8599] px-3 py-1 text-white w-[100%] md:w-max font-semibold text-xs hover:bg-[#086a7a] rounded-xl shadow-sm transition-colors"
                      onClick={handleDateSearch}
                    >
                      Search
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    <div className="px-1.5 py-1 border w-full md:w-max border-slate-200 dark:border-slate-600 rounded-full bg-white">
                      <select className="text-xs text-slate-600 w-full md:w-max outline-none bg-transparent"
                        value={status}
                        onChange={(e) => {
                          const value = e.target.value;
                          setStatus(value);
                          setCurrentPage(1);
                          fetchAllevent(fromDate, toDate, searchText, value);
                        }}
                      >
                        <option value="">All</option>
                        <option value="Upcoming">Upcoming</option>
                        <option value="Completed">Completed</option>
                        <option value="Ongoing">Ongoing</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div className="relative flex w-full md:w-[120px]">
                      <div className="flex items-center gap-1.5 w-full px-3 py-1 border border-slate-200 dark:border-slate-600 rounded-full bg-white dark:bg-slate-800 text-slate-600 focus-within:border-[#0b8599] transition-colors shadow-sm">
                        <input
                          type="text"
                          placeholder="Search events..."
                          value={searchText}
                          name="search"
                          onChange={(e) => setSearchText(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSearchText()}
                          className="w-full outline-none text-xs bg-transparent"
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
                      className="border border-[#4fb5c4] text-[#4fb5c4] hover:bg-[#4fb5c4]/5 rounded-full px-3 py-1 font-medium text-xs transition-colors shadow-sm"
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
                      className="inline-flex items-center px-3 py-1 border border-slate-200 rounded-full text-slate-600 text-xs font-medium bg-white hover:bg-slate-50 transition-colors shadow-sm"
                      title="Download CSV"
                    >
                      <svg
                        className="w-4 h-4 mr-1"
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
                    <div className="relative flex w-full lg:w-[130px]">
                      <div className="flex items-center gap-2 w-full px-4 py-1.5 border border-slate-200 dark:border-slate-600 rounded-full bg-white dark:bg-slate-800 text-slate-600 focus-within:border-[#0b8599] transition-colors shadow-sm">
                        <input
                          type="text"
                          placeholder="Search..."
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
                {data.length === 0 ? (
                  <div className="flex items-center justify-center h-48">
                    <p className="text-slate-500 dark:text-slate-400">No events found{status ? ' for "' + status + '"' : ""}</p>
                  </div>
                ) : (
                  <>
                  <div className="mt-4 px-4 space-y-2 pb-3">
                  {currentItems.map((event, index) => (
                    <div key={index} className={`bg-white rounded-xl p-2 flex flex-col md:flex-row items-center justify-between shadow-[0_1px_4px_-2px_rgba(0,0,0,0.05),0_2px_8px_-1px_rgba(0,0,0,0.02)] border border-slate-100 dark:bg-slate-800 dark:border-slate-700 transition-all hover:shadow-md cursor-pointer border-l-4 ${
                        event.computedStatus === "ongoing"
                          ? "border-l-green-500"
                          : event.computedStatus === "upcoming"
                            ? "border-l-blue-500"
                            : event.computedStatus === "cancelled"
                              ? "border-l-red-400"
                              : "border-l-slate-300"
                      }`} onClick={() => navigate(`/photographer/event/${event.eventid}`)}>
                      {/* Left & Middle: Image and Details */}
                      <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto flex-1">
                        {/* Image Thumbnail */}
                        <div className="w-full md:w-16 h-16 flex-shrink-0">
                          <img
                            src={event.firstPhoto || demo}
                            alt={event.eventName}
                            className="w-full h-full object-cover rounded-lg shadow-sm"
                          />
                        </div>

                        {/* Details */}
                        <div className="flex flex-col text-center md:text-left mt-1 md:mt-0 flex-1 min-w-0">
                          <p className="text-[8px] font-bold tracking-widest text-[#4fb5c4] uppercase mb-0.5">
                            {event.category || "UNCATEGORIZED"}
                          </p>
                          <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 mb-1">
                            <h3 className="text-sm font-bold text-slate-800 dark:text-white leading-tight truncate max-w-[200px]">
                              {event.eventName}
                            </h3>
                            {event.computedStatus && (
                              <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wide ${
                                event.computedStatus === "ongoing"
                                  ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
                                  : event.computedStatus === "upcoming"
                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                                    : event.computedStatus === "cancelled"
                                      ? "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400"
                                      : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                              }`}>
                                {event.computedStatus}
                              </span>
                            )}
                          </div>

                          {event.description && (
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-1 line-clamp-1 max-w-sm">
                              {event.description}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-auto">
                            <div className="flex items-center gap-1">
                              <CalendarTodayOutlinedIcon className="w-3 h-3" fontSize="small" />
                              <span>
                                {event.startDate ? format(new Date(event.startDate), "MMM dd, yyyy") : "Date N/A"}
                                {event.slotTime && <span className="ml-1 text-[#4fb5c4] font-bold">({event.slotTime})</span>}
                              </span>
                            </div>
                            {event.slotsCount > 0 && (
                              <div className="flex items-center gap-1 opacity-80">
                                <AccessTimeOutlinedIcon className="w-3 h-3" fontSize="small" />
                                <span>{event.slotsCount} Session{event.slotsCount !== 1 ? 's' : ''}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Side: Phase & Actions */}
                      <div className="flex flex-col md:flex-row items-center gap-4 mt-2 md:mt-0">
                        {/* Current Phase */}
                          <div className="flex flex-col items-center mr-3">
                            <span className="text-[8px] font-bold tracking-wider text-slate-500 uppercase mb-0.5">
                              CURRENT PHASE
                            </span>
                            <div className="bg-[#d4f0f4] text-[#0b8599] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide shadow-sm">
                              {event.eventSubCategory || "INITIAL"}
                            </div>
                          </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5">
                            <button
                              onClick={(e) => { e.stopPropagation(); navigate(`/photographer/event/${event.eventid}`); }}
                              className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-all bg-white rounded-lg"
                              title="View Details"
                            >
                              <VisibilityOutlinedIcon sx={{ fontSize: 16 }} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleEdit(event.eventid); }}
                              className="p-1.5 text-amber-500 hover:text-amber-700 hover:bg-amber-50 transition-all bg-white rounded-lg"
                              title="Edit Event"
                            >
                              <EditOutlinedIcon sx={{ fontSize: 16 }} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteEvent(event.eventid); }}
                              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 transition-all bg-white rounded-lg"
                              title="Delete Event"
                            >
                              <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                            </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-1 mt-3 mb-6">
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white"
                    >
                      <ChevronLeftIcon fontSize="small" />
                    </button>

                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => paginate(i + 1)}
                        className={`w-7 h-7 rounded-md text-xs font-medium transition-all ${currentPage === i + 1
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
                      className="p-1.5 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white"
                    >
                      <ChevronRightIcon fontSize="small" />
                    </button>
                  </div>
                )}
                </>
              )}
              </>
          </div>
        </div>
      </div>
    </>
  );
}

export default EventLists;
