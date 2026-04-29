import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { CircularProgress } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import BoltIcon from "@mui/icons-material/Bolt";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useNavigate } from "react-router-dom";

const baseURL = process.env.REACT_APP_BASE_URL;

const UsageStatistics = () => {
  const [usageData, setUsageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();


  useEffect(() => {
    fetchUsageStatistics();
  }, []);

  const fetchUsageStatistics = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${baseURL}/photographer/usage-statistics`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setUsageData(response.data.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching usage statistics:", err);
      setError(
        err.response?.data?.message || "Failed to load usage statistics"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <CircularProgress className="text-blue-600" />
        <p className="mt-4 text-slate-600 dark:text-slate-300">Loading...</p>
      </div>
    );
  }

  if (
    error ===
    "Your subscription status is cancelled. Please contact support or purchase a new plan."
  ) {
    return (
      <div className="bg-slate-100 p-5 rounded text-center mt-5 dark:bg-slate-800">
        <ErrorOutlineIcon sx={{ fontSize: "50px" }} className="text-red-600" />
        <h1 className="text-slate-700 font-normal text-2xl dark:text-white">
          You do not have access to this page
        </h1>
        <p className="text-slate-700 font-normal text-sm dark:text-white">
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
  } else if (error) {
    return (
      <div className="bg-red-50 text-start dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-5 text-red-800 dark:text-red-300 mt-5">
        <div className="flex items-center gap-3">
          <ErrorOutlineIcon />
          <p className="font-medium">Unable to load usage statistics</p>
        </div>
        <p className="mt-2 text-sm">{error}</p>        
      </div>
    );
  }

  const hasUsageData =
    usageData &&
    (usageData?.events ||
      usageData?.photo_uploads ||
      usageData?.storage ||
      usageData?.team_members ||
      usageData?.subscription_plan ||
      usageData?.addons);

  if (!hasUsageData) {
    return (
      <div className="relative text-start overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-8 mt-5">
        <div className="absolute -top-14 -right-14 h-40 w-40 rounded-full bg-blue-100/60 dark:bg-blue-900/20 blur-2xl" />
        <div className="absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-indigo-100/50 dark:bg-indigo-900/20 blur-2xl" />

        <div className="relative text-center max-w-lg mx-auto">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
            <BarChartOutlinedIcon className="text-blue-600 dark:text-blue-400" />
          </div>

          <h3 className="text-xl font-semibold text-slate-800 dark:text-white">
            No usage data available
          </h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Your usage report will appear here after event activity starts,
            photos are uploaded, or storage/team usage changes.
          </p>
          
        </div>
      </div>
    );
  }

  const {
    subscription_plan,
    events,
    photo_uploads,
    storage,
    team_members,
    addons,
  } = usageData;

  // Prepare chart data
  const barChartData = [
    {
      name: "Events",
      available: events?.available || 0,
      used: events?.used || 0,
    },
    {
      name: "Photos",
      available: photo_uploads?.available || 0,
      used: photo_uploads?.used || 0,
    },
    {
      name: "Storage (GB)",
      available: storage?.available || 0,
      used: storage?.used || 0,
    },
    {
      name: "Team Members",
      available: team_members?.available || 0,
      used: team_members?.used || 0,
    },
  ];

  return (
    <div className="space-y-6 text-start">
      {/* Subscription Plan */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800/50 dark:to-slate-700/50 rounded-xl p-6 border border-blue-200 dark:border-slate-700/50">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
          Current Plan
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {subscription_plan?.name || "No active plan"}
        </p>
      </div>

      {/* Usage Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Events Card */}
        <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-blue-200 dark:border-slate-700/50 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
              Events
            </h3>
            <span className="text-2xl">🎉</span>
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-slate-600 dark:text-slate-400">Used</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {events?.used || 0}
              </p>
            </div>
            <div className="bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-full transition-all"
                style={{
                  width: `${
                    events?.available > 0
                      ? (events?.used / events?.available) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              of {events?.available || 0} available
            </p>
          </div>
        </div>

        {/* Photo Uploads Card */}
        <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-yellow-200 dark:border-slate-700/50 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
              Photo Uploads
            </h3>
            <span className="text-2xl">📸</span>
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-slate-600 dark:text-slate-400">Used</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {photo_uploads?.used || 0}
              </p>
            </div>
            <div className="bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-yellow-500 h-full transition-all"
                style={{
                  width: `${
                    photo_uploads?.available > 0
                      ? (photo_uploads?.used / photo_uploads?.available) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              of {photo_uploads?.available || 0} available
            </p>
          </div>
        </div>

        {/* Storage Card */}
        <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-green-200 dark:border-slate-700/50 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
              Storage
            </h3>
            <span className="text-2xl">💾</span>
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-slate-600 dark:text-slate-400">Used</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {(storage?.used || 0).toFixed(5)} GB
              </p>
            </div>
            <div className="bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-green-600 h-full transition-all"
                style={{
                  width: `${
                    storage?.available > 0
                      ? (storage?.used / storage?.available) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              of {(storage?.available || 0).toFixed(2)} GB available
            </p>
          </div>
        </div>

        {/* Team Members Card */}
        <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-purple-200 dark:border-slate-700/50 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
              Team Members
            </h3>
            <span className="text-2xl">👥</span>
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Added
              </p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {team_members?.used || 0}
              </p>
            </div>
            <div className="bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-purple-600 h-full transition-all"
                style={{
                  width: `${
                    team_members?.available > 0
                      ? (team_members?.used / team_members?.available) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              of {team_members?.available || 0} available
            </p>
          </div>
        </div>
      </div>

      {/* Addons Section */}
      {addons && addons.total > 0 && (
        <div className="bg-white dark:bg-slate-800/50 rounded-xl p-6 border border-indigo-200 dark:border-slate-700/50 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="text-2xl">🎁</span> Add-ons ({addons.active}{" "}
              active)
            </h3>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {addons.data.map((addon, index) => (
              <div
                key={addon.id || index}
                className={`p-4 rounded-lg border flex items-center justify-between transition ${
                  addon.status === "confirmed" && !addon.isExpired
                    ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800"
                    : "bg-slate-50 dark:bg-slate-700/30 border-slate-200 dark:border-slate-700"
                }`}
              >
                <div className="flex-1">
                  <p className="font-medium text-slate-900 dark:text-white">
                    {addon.displayText}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-600 dark:text-slate-400">
                    <span>💰 ₹{addon.amountRupees}</span>
                    <span>
                      ⏰ {new Date(addon.createdAt).toLocaleDateString()}
                    </span>
                    {addon.expiresAt && (
                      <span
                        className={
                          addon.isExpired
                            ? "text-red-600 dark:text-red-400"
                            : ""
                        }
                      >
                        Expires:{" "}
                        {new Date(addon.expiresAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {addon.type !== "subscription_discount" &&
                    addon.remaining >= 0 && (
                      <div className="mt-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-slate-600 dark:text-slate-400">
                            Remaining
                          </span>
                          <span className="text-xs font-semibold text-slate-900 dark:text-white">
                            {addon.remaining} / {addon.quantity}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                          <div
                            className="bg-indigo-600 h-full rounded-full transition-all"
                            style={{
                              width: `${
                                addon.quantity > 0
                                  ? (addon.remaining / addon.quantity) * 100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                </div>
                <div className="ml-4">
                  {addon.status === "confirmed" && !addon.isExpired ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                      ✓ Active
                    </span>
                  ) : addon.status === "refunded" ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                      ⟲ Refunded
                    </span>
                  ) : addon.isExpired ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                      ✕ Expired
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300">
                      Inactive
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700/50 shadow-md">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Usage Comparison
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #475569",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
              <Legend />
              <Bar
                dataKey="available"
                stackId="a"
                fill="#3b82f6"
                name="Available"
              />
              <Bar dataKey="used" stackId="a" fill="#ef4444" name="Used" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Usage Summary */}
        <div className="bg-white dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700/50 shadow-md">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Usage Summary
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Events Used
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {events?.used || 0} / {events?.available || 0}
              </span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Photos Uploaded
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {photo_uploads?.used || 0} / {photo_uploads?.available || 0}
              </span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Storage Used
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {(storage?.used || 0).toFixed(2)} /{" "}
                {(storage?.available || 0).toFixed(2)} GB
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Team Members
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {team_members?.used || 0} / {team_members?.available || 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsageStatistics;
