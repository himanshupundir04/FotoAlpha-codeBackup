import React from "react";
import { Box } from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Link } from "react-router-dom";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { format, addDays, startOfDay } from "date-fns";

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  const names = point?.eventNames || [];
  const count = Number(point?.eventsCount || 0);
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 shadow">
      <p className="text-xs font-semibold text-slate-700">{point?.date}</p>
      <p className="text-xs text-slate-600">
        {count} event{count === 1 ? "" : "s"}
      </p>
      {names.length > 0 && (
        <>
          <p className="mt-1 text-[11px] font-semibold text-slate-600">Event Names:</p>
          {names.map((name, i) => (
            <p key={i} className="text-[11px] text-slate-600">
              {i + 1}. {name}
            </p>
          ))}
        </>
      )}
    </div>
  );
};

const SubEventScheduleChart = ({ nextSevenDaysEvents = [], createEventPath = "/photographer/create_event" }) => {
  const today = startOfDay(new Date());
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(today, i);
    const match = nextSevenDaysEvents.find(
      (d) =>
        format(new Date(d._id), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
    );
    return {
      date: format(date, "MMM dd"),
      eventsCount: match ? match.events.length : 0,
      eventNames: match ? match.events.map((e) => e.eventName) : [],
    };
  });

  const hasEvents = chartData.some((d) => d.eventsCount > 0);

  return (
    <div className="w-full bg-white rounded-md p-3 dark:bg-slate-800">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-slate-700 font-medium text-lg dark:text-white">
          Scheduled Sub-Events
        </h2>
        <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-semibold dark:bg-orange-900 dark:text-orange-200">
          7 Days
        </span>
      </div>
      {hasEvents ? (
        <Box sx={{ width: "100%", height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -10, bottom: 10 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e2e8f0"
              />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#64748b" }}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#64748b" }}
              />
              <Tooltip
                cursor={{ fill: "rgba(249, 115, 22, 0.15)" }}
                content={<CustomTooltip />}
              />
              <Bar
                dataKey="eventsCount"
                name="Events"
                fill="#FF9800"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Box>
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
          <Link to={createEventPath}>
            <button className="bg-orange-500 text-white py-1 px-3 rounded text-xs font-semibold hover:bg-orange-600">
              Schedule
            </button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default SubEventScheduleChart;
