import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { format } from "date-fns";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";

const statusBadge = (status) => {
  const colors = {
    upcoming: "bg-blue-100 text-blue-700",
    ongoing: "bg-amber-100 text-amber-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-600",
  };
  return `px-1.5 py-0.5 rounded text-[9px] font-semibold ${colors[status] || colors.upcoming}`;
};

const UpcomingEventsTable = ({ events = [], calendarPath = "/photographer/events_category", eventDetailPath = "/photographer/event", eventsListPath = "/photographer/events_list" }) => {
  const navigate = useNavigate();

  return (
    <div className="w-full bg-white rounded-xl dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-slate-700">
        <h2 className="text-xs font-semibold text-slate-700 dark:text-white">Upcoming Events</h2>
        <Link to={calendarPath} className="text-[10px] text-blue hover:underline">View Calendar →</Link>
      </div>
      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <CalendarMonthIcon sx={{ fontSize: 32 }} className="text-slate-300 dark:text-slate-600 mb-2" />
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">No upcoming events</p>
          <p className="text-[10px] text-slate-500 mt-1 mb-3">Create your first event to get started</p>
          <button onClick={() => navigate("/photographer/create_event")} className="bg-blue text-white text-[10px] font-semibold py-1.5 px-3 rounded-lg hover:bg-blue-700">Create Event</button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[9px] font-semibold text-slate-400 uppercase border-b border-slate-50 dark:border-slate-700">
                <th className="px-3 py-2">Event</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Venue</th>
                <th className="px-3 py-2">Sub-Events</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {events.map((ev, i) => (
                <tr key={ev._id || i} className="border-b border-slate-50 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer text-[11px]" onClick={() => navigate(`${eventDetailPath}/${ev._id}`)}>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-[9px] font-bold text-slate-500 flex-shrink-0">
                        {ev.name ? ev.name.charAt(0).toUpperCase() : "?"}
                      </div>
                      <div>
                        <p className="text-slate-800 dark:text-white font-medium text-[11px] leading-tight">{ev.name || "Untitled Event"}</p>
                        {ev.eventType && <p className="text-[9px] text-slate-400">{ev.eventType}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-slate-500 text-[10px]">
                    {ev.earliestDate ? format(new Date(ev.earliestDate), "MMM dd, yyyy") : "—"}
                  </td>
                  <td className="px-3 py-2 text-slate-400 text-[10px]">—</td>
                  <td className="px-3 py-2 text-slate-400 text-[10px]">—</td>
                  <td className="px-3 py-2">
                    <span className={statusBadge(ev.status || "upcoming")}>{ev.status || "upcoming"}</span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <button onClick={(e) => { e.stopPropagation(); navigate(`${eventDetailPath}/${ev._id}`); }} className="text-[9px] bg-blue text-white px-2 py-0.5 rounded hover:bg-blue-700">Open</button>
                      <MoreHorizIcon sx={{ fontSize: 14 }} className="text-slate-300" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="px-3 py-2 border-t border-slate-100 dark:border-slate-700">
        <Link to={eventsListPath} className="text-[10px] text-blue hover:underline">View all events →</Link>
      </div>
    </div>
  );
};

export default UpcomingEventsTable;
