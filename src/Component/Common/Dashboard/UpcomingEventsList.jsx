import React from "react";
import { useNavigate, Link } from "react-router-dom";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ChevronRightOutlinedIcon from "@mui/icons-material/ChevronRightOutlined";
import { format } from "date-fns";

const UpcomingEventsList = ({
  events = [],
  eventsListPath = "/photographer/events_list",
  eventDetailPath = "/photographer/event",
  createEventPath = "/photographer/create_event",
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded flex flex-col mt-5 dark:bg-slate-800">
      <div className="flex justify-between items-center p-3 border-b border-slate-100 dark:border-slate-700">
        <h2 className="text-start text-lg font-medium text-slate-700 dark:text-white">
          Upcoming Events
        </h2>
        {events.length > 0 && (
          <button
            onClick={() => navigate(eventsListPath)}
            className="text-xs font-semibold text-blue-500 hover:text-blue-700 dark:hover:text-blue-400"
          >
            View All →
          </button>
        )}
      </div>
      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <CalendarMonthIcon
            sx={{ fontSize: 40 }}
            className="text-gray-300 dark:text-slate-600 mb-2"
          />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
            No Upcoming Events
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">
            Create one to get started
          </p>
          <Link to={createEventPath}>
            <button className="bg-blue-500 text-white py-1 px-3 rounded text-xs font-semibold hover:bg-blue-600">
              Create
            </button>
          </Link>
        </div>
      ) : (
        <div className="max-h-80 overflow-auto">
          {events.map((event, i) => (
            <div
              key={event._id || i}
              className="px-3 border-solid border-t-2 border-slate-100 dark:border-slate-700 flex items-center justify-between py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700"
              onClick={() => navigate(`${eventDetailPath}/${event._id}`)}
            >
              <div className="ml-2">
                <p className="text-start mb-0 font-normal text-slate-700 dark:text-white capitalize">
                  {event.name}
                </p>
                <div className="flex items-center text-gray-500 dark:text-white text-xs">
                  <CalendarMonthIcon sx={{ fontSize: 15 }} />
                  <span className="ms-1">
                    {event.earliestDate
                      ? format(new Date(event.earliestDate), "MMM dd, yyyy")
                      : "TBD"}
                  </span>
                </div>
              </div>
              <div className="flex items-center">
                <p className="text-green-500 font-normal mr-5 text-sm">Active</p>
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
  );
};

export default UpcomingEventsList;
