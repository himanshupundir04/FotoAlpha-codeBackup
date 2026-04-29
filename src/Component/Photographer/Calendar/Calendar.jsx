import React, { useEffect, useState } from "react";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { CircularProgress, Modal, Box, IconButton } from "@mui/material";
import axios from "axios";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import BoltIcon from "@mui/icons-material/Bolt";
import CloseIcon from "@mui/icons-material/Close";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useNavigate } from "react-router-dom";

// Locale setup
const locales = {
  "en-US": require("date-fns/locale/en-US"),
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const CustomEvent = ({ event }) => {
  return (
    <div className="bg-[#0b8599] hover:bg-[#086a7a] text-white p-2 rounded-xl shadow-sm transition-all h-full overflow-hidden flex flex-col justify-center gap-0.5 group border border-[#086a7a]/50">
      {!event.allDay && (
        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
          <AccessTimeIcon sx={{ fontSize: 10 }} />
          <span className="text-[10px] font-bold uppercase tracking-wide">
            {format(event.start, "h:mm a")}
          </span>
        </div>
      )}
      <div className="font-bold text-[12px] truncate leading-tight">
        {event.title}
      </div>
      {event.venue && (
        <div className="text-[10px] font-medium opacity-80 truncate flex items-center gap-0.5">
          <LocationOnIcon sx={{ fontSize: 10 }} />
          {event.venue}
        </div>
      )}
    </div>
  );
};

const CustomToolbar = (toolbar) => {
  const goToBack = () => { toolbar.onNavigate("PREV"); };
  const goToNext = () => { toolbar.onNavigate("NEXT"); };
  const goToCurrent = () => { toolbar.onNavigate("TODAY"); };

  const label = () => {
    const date = format(toolbar.date, "MMMM yyyy");
    return <span className="text-2xl font-bold text-slate-800 dark:text-white capitalize">{date}</span>;
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4 px-2 mt-2">
      <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
        {label()}
        <div className="flex items-center bg-slate-100 dark:bg-slate-700/50 rounded-full p-1 border border-slate-200 dark:border-slate-700">
          <button onClick={goToBack} className="p-1.5 rounded-full hover:bg-white dark:hover:bg-slate-600 transition-colors text-slate-600 dark:text-slate-300">
            <ChevronLeftIcon fontSize="small" />
          </button>
          <button onClick={goToCurrent} className="px-4 py-1 rounded-full text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-[#0b8599] transition-colors uppercase tracking-widest">
            Today
          </button>
          <button onClick={goToNext} className="p-1.5 rounded-full hover:bg-white dark:hover:bg-slate-600 transition-colors text-slate-600 dark:text-slate-300">
            <ChevronRightIcon fontSize="small" />
          </button>
        </div>
      </div>

      <div className="flex items-center bg-slate-50 dark:bg-slate-800 rounded-full p-1 border border-slate-200 dark:border-slate-700 shadow-inner">
        {["month", "week", "day"].map((view) => (
          <button
            key={view}
            onClick={() => toolbar.onView(view)}
            className={`px-5 py-2 rounded-full text-[11px] font-bold tracking-wider uppercase transition-all ${toolbar.view === view
              ? "bg-white dark:bg-slate-700 text-[#0b8599] shadow-sm transform scale-105"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
          >
            {view}
          </button>
        ))}
      </div>
    </div>
  );
};

const baseURL = process.env.REACT_APP_BASE_URL;

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  boxShadow: 24,
  outline: 'none',
};

export default function PublicCalendar() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [view, setView] = useState(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [permission, setPermission] = useState(false);
  const [loading, setLoading] = useState(false);

  const [openEventModal, setOpenEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const fetchEvents = async (startDate, endDate) => {
    setLoading(true)
    
    try {
      const response = await axios.get(
        `${baseURL}/calender?startDate=${startDate}&endDate=${endDate}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "ngrok-skip-browser-warning": "69420",
          },
        }
      );

      const fetchedEvents = response.data.map((event) => {
        const { date, startTime, endTime, venue } = event.timeSlots;
        const dateOnly = date.split("T")[0];

        const hasTimes = startTime && endTime;

        return {
          title: event.name,
          venue: venue,
          date: dateOnly,
          start: hasTimes
            ? new Date(`${dateOnly}T${startTime}`)
            : new Date(dateOnly),
          end: hasTimes
            ? new Date(`${dateOnly}T${endTime}`)
            : new Date(dateOnly),
          allDay: !hasTimes,
          id: event._id
        };
      });

      // console.log(response.data)
      setLoading(false)
      setEvents(fetchedEvents);
    } catch (error) {
      setLoading(false)
      // console.error("Error fetching:", error.response.data.message);
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

  const handleRangeChange = (range, view) => {
    let startDate, endDate;

    if (Array.isArray(range)) {
      // Week/Day view
      startDate = range[0];
      endDate = range[range.length - 1];
    } else {
      // Month view
      startDate = range.start;
      endDate = range.end;
    }

    const formattedStart = format(startDate, "yyyy-MM-dd");
    const formattedEnd = format(endDate, "yyyy-MM-dd");

    fetchEvents(formattedStart, formattedEnd);
  };

  useEffect(() => {
    const now = new Date();

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const formattedStart = format(startOfMonth, "yyyy-MM-dd");
    const formattedEnd = format(endOfMonth, "yyyy-MM-dd");

    fetchEvents(formattedStart, formattedEnd);
  }, []);

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setOpenEventModal(true);
  };


  return (
    <>
      <style>
        {`
          /* Aesthetic Calendar Overrides */
          .rbc-month-view, .rbc-time-view, .rbc-agenda-view { border: none !important; }
          .rbc-month-row { border-top: 1px dashed #e2e8f0 !important; }
          .rbc-day-bg { border-left: 1px dashed #e2e8f0 !important; }
          .rbc-header {
            border-bottom: 1px solid #e2e8f0 !important;
            border-left: none !important;
            padding: 16px 0 !important;
            font-weight: 700 !important;
            color: #64748b !important;
            text-transform: uppercase;
            font-size: 11px;
            letter-spacing: 0.1em;
          }
          .rbc-today {
            background-color: transparent !important;
            position: relative;
          }
          .rbc-today::after {
            content: '';
            position: absolute;
            top: 4px;
            left: 4px;
            right: 4px;
            bottom: 4px;
            background-color: #f8fafc;
            border-radius: 12px;
            z-index: -1;
            border: 1px solid #e2e8f0;
          }
          .dark .rbc-today::after {
            background-color: #1e293b;
            border-color: #334155;
          }
          .rbc-date-cell { padding: 12px !important; font-weight: 700; color: #475569; font-size: 13px; }
          .rbc-off-range-bg { background-color: transparent !important; opacity: 0.4; }
          .rbc-event { background: none !important; padding: 2px !important; border: none !important; }
          .rbc-time-header.rbc-overflowing { border-right: none !important; }
          .rbc-time-content { border-top: 1px solid #e2e8f0 !important; }
          .rbc-timeslot-group { border-bottom: 1px dashed #e2e8f0 !important; }
          .rbc-day-slot .rbc-time-slot { border-top: none !important; }
        `}
      </style>
      {permission ? ( // <-- check permission first
        <div className="bg-slate-100 p-5 rounded text-center mt-5">
          <ErrorOutlineIcon
            sx={{ fontSize: "50px" }}
            className="text-red-600"
          />
          <h1 className="text-slate-700 font-normal text-2xl">
            You do not have access to this page
          </h1>
          <p className="text-slate-700 font-normal text-sm">
            We're sorry, your plan does not have permission to access this page
          </p>
          <button
            className="bg-blue rounded px-5 py-2 mt-4 text-white font-normal hover:bg-blueHoverHover"
            onClick={() => navigate("/photographer/upgrade_plan")}
          >
            <BoltIcon /> Upgrade Plan
          </button>
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center h-96 ">
          <CircularProgress className="text-blue-600" />
          <p className="mt-4 text-slate-600 dark:text-slate-300">
            Loading events...
          </p>
        </div>
      ) : (
        <div>
          <Calendar
            selectable
            allDayAccessor="allDay"
            localizer={localizer}
            events={events}
            view={view}
            defaultView={Views.MONTH}
            onView={setView}
            date={date}
            onNavigate={setDate}
            views={["month", "week", "day"]}
            step={30}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 'calc(100vh - 180px)', minHeight: 600 }}
            components={{
              event: CustomEvent,
              toolbar: CustomToolbar
            }}
            onSelectEvent={handleSelectEvent}
            onRangeChange={handleRangeChange}
            className="bg-white p-6 rounded-3xl font-normal shadow-xl border border-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />

          {/* Quick Glance Event Modal */}
          <Modal
            open={openEventModal}
            onClose={() => setOpenEventModal(false)}
            aria-labelledby="modal-modal-title"
          >
            <Box sx={{
              ...modalStyle,
              width: { xs: '90%', sm: 400 },
              p: 0,
              borderRadius: '24px',
              overflow: 'hidden',
              bgcolor: 'background.paper'
            }}>
              <div className="bg-[#0b8599] h-20 relative flex items-center justify-end px-4">
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <IconButton
                    onClick={() => setOpenEventModal(false)}
                    sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }, width: 32, height: 32 }}
                  >
                    <CloseIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </div>
              </div>

              <div className="p-8 relative bg-white dark:bg-slate-800">
                <div className="w-16 h-16 rounded-2xl bg-[#ccf2ff] flex items-center justify-center text-[#0b8599] absolute -top-8 left-8 shadow-md border-4 border-white dark:border-slate-800">
                  <span className="text-2xl font-bold">{selectedEvent?.date ? new Date(selectedEvent.date).getDate() : ''}</span>
                </div>

                <div className="mt-8 mb-8">
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-white leading-tight mb-4">
                    {selectedEvent?.title}
                  </h3>
                  <div className="flex flex-col gap-3">
                    {selectedEvent?.venue && (
                      <div className="flex items-start gap-3 text-slate-600 dark:text-slate-300 text-sm bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                        <LocationOnIcon fontSize="small" className="text-[#0b8599] mt-0.5" />
                        <span className="font-medium flex-1">{selectedEvent.venue}</span>
                      </div>
                    )}
                    {!selectedEvent?.allDay && selectedEvent?.start && (
                      <div className="flex items-start gap-3 text-slate-600 dark:text-slate-300 text-sm bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                        <AccessTimeIcon fontSize="small" className="text-[#0b8599] mt-0.5" />
                        <span className="font-medium flex-1">
                          {format(selectedEvent.start, "h:mm a")} - {format(selectedEvent.end, "h:mm a")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => navigate(`/photographer/event/${selectedEvent?.id}`)}
                    className="flex-1 bg-[#0b8599] hover:bg-[#086a7a] text-white py-4 rounded-2xl font-bold text-xs flex items-center justify-center transition-all shadow-md active:scale-95 tracking-widest uppercase"
                  >
                    Go to Event Dashboard
                  </button>
                </div>
              </div>
            </Box>
          </Modal>
        </div>
      )}
    </>
  );
}
