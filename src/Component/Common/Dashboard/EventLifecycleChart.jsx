import React from "react";
import { Box } from "@mui/material";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Link, useNavigate } from "react-router-dom";
import InsertPhotoOutlinedIcon from "@mui/icons-material/InsertPhotoOutlined";

const SLICES = [
  { key: "upcoming", name: "Upcoming Events", status: "Upcoming", color: "#d303fd" },
  { key: "completed", name: "Completed Events", status: "Completed", color: "#22c55e" },
  { key: "ongoing", name: "Ongoing Events", status: "Ongoing", color: "#f59e0b" },
  { key: "cancelled", name: "Cancelled Events", status: "Cancelled", color: "#ef4444" },
];

const EventLifecycleChart = ({ eventStatusStats = {}, eventsPath = "/photographer/events_list" }) => {
  const navigate = useNavigate();
  const data = SLICES.map((s) => ({ ...s, value: eventStatusStats[s.key] || 0 }));
  const isEmpty = data.every((d) => d.value === 0);

  return (
    <div className="w-full bg-white rounded-md p-3 dark:bg-slate-800">
      <h2 className="text-slate-700 font-medium text-lg dark:text-white mb-2">
        Event Lifecycle
      </h2>
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center h-48 text-center">
          <InsertPhotoOutlinedIcon
            sx={{ fontSize: 50 }}
            className="text-gray-300 dark:text-slate-600 mb-2"
          />
          <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">
            No Events Yet
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-500 mb-3">
            Add Events to track lifecycle stats
          </p>
          <Link to="/photographer/create_event">
            <button className="bg-blue text-white py-1 px-3 rounded text-xs font-semibold hover:bg-blue-700 dark:bg-blue-600">
              Add Event
            </button>
          </Link>
        </div>
      ) : (
        <Box sx={{ width: "100%", height: 400 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="45%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                labelLine={false}
                label={({ value }) => value}
                onClick={(d) => navigate(`${eventsPath}?type=${d.status}`)}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} stroke={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [value, name]} />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      )}
    </div>
  );
};

export default EventLifecycleChart;
