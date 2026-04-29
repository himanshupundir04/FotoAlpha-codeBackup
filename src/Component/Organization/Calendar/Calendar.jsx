import React, { useEffect, useState } from "react";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { CircularProgress, Dialog, DialogContent } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import axios from "axios";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import BoltIcon from "@mui/icons-material/Bolt";
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

const baseURL = process.env.REACT_APP_BASE_URL;

export default function PublicCalendar() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [view, setView] = useState(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [permission, setPermission] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    venue: "",
    start: null,
    end: null,
    id: "",
  });

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

      const fetchedEvents = response?.data?.map((event) => {
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
       window.electronAPI.setStore("calendar", fetchedEvents);
    } catch (error) {
      setLoading(false)
       const cachedSummary = await window.electronAPI.getStore("calendar");
      if (cachedSummary) {
        setEvents(cachedSummary);
        // console.log(cachedSummary);
      }
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
    setFormData({
      title: event.title,
      venue: event.venue,
      start: event.start,
      end: event.end,
    });
     navigate(`/organization/event/${event?.id}`)
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  return (
    <>
      <style>
        {`
          .rbc-toolbar button {
            background-color: #e5e7eb;
            color: black;
            border-radius: 6px;
            padding: 4px 10px;
            margin: 0 4px;
            border: none;
            cursor: pointer;
            font-weight: 400;
          }
          .rbc-toolbar button.rbc-active {
            background-color: #3b82f6 !important;
            color: white !important;
          }
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
            onClick={() => navigate("/organization/upgrade_plan")}
          >
            <BoltIcon /> Upgrade Plan
          </button>
        </div>
      ) : loading ? (
        <div className="flex justify-center mt-5">
          <CircularProgress />
        </div>
      ) : (
        <div>
          {/* <h2 className="text-xl font-normal mb-4">Schedule Calendar</h2> */}

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
            style={{ height: 600 }}
            onSelectEvent={handleSelectEvent}
            onRangeChange={handleRangeChange}
            className="bg-white p-4 rounded-lg font-normal shadow-md dark:bg-slate-800 dark:text-white"
          />

          <Dialog open={dialogOpen} onClose={handleCloseDialog}>
            <DialogContent>
              <div className="flex justify-end">
                <CloseIcon
                  onClick={handleCloseDialog}
                  className="cursor-pointer"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-slate-700 font-normal text-lg">
                  Event Title
                </label>
                <input
                  type="text"
                  placeholder="Event Title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="border border-slate-300 rounded p-2"
                />
              </div>
              <div className="flex flex-col mt-2">
                <label className="text-slate-700 font-normal text-lg">
                  Venue
                </label>
                <input
                  type="text"
                  placeholder="Event Venue"
                  value={formData.venue}
                  onChange={(e) =>
                    setFormData({ ...formData, venue: e.target.value })
                  }
                  className="border border-slate-300 rounded p-2"
                />
              </div>

              <div className="flex flex-col mt-2">
                <label className="text-slate-700 font-normal text-lg">
                  Date
                </label>
                <input
                  type="date"
                  value={
                    formData.start ? format(formData.start, "yyyy-MM-dd") : ""
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      start: new Date(e.target.value),
                    })
                  }
                  className="border border-slate-300 rounded p-2"
                />
              </div>              
            </DialogContent>
          </Dialog>
        </div>
      )}
    </>
  );
}
