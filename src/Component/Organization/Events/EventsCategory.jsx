import React, { useContext, useEffect, useState } from "react";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { CircularProgress } from "@mui/material";
import demo from "../../image/demo.jpg";
import { OrganizationEventContext } from "../Context/OrganizationEventContext";

const baseURL = process.env.REACT_APP_BASE_URL;

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
  "ngrok-skip-browser-warning": "69420",
});

function StatCard({ icon, iconBg, count, label, sub, loading }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div>
        <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-0.5">{label}</p>
        {loading ? (
          <div className="w-8 h-6 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />
        ) : (
          <p className="text-2xl font-bold text-slate-800 dark:text-white leading-none">{count}</p>
        )}
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

function EventsCategory() {
  const navigate = useNavigate();
  const [category, setCategory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const { setCategoryname } = useContext(OrganizationEventContext);
  const [stats, setStats] = useState({ total: 0, upcoming: 0, completed: 0, totalCategories: 0 });

  useEffect(() => {
    fetchEventsCategory();
  }, []);

  const fetchEventsCategory = async () => {
    setLoading(true);
    axios
      .get(`${baseURL}/organization/event-category`, { headers: authHeaders() })
      .then((response) => {
        setLoading(false);
        const categories = response?.data?.categories || [];
        const nonEmpty = categories.filter((cat) => cat.eventCount > 0);
        setCategory(nonEmpty);
        const total = categories.reduce((sum, cat) => sum + (cat.eventCount || 0), 0);
        setStats((prev) => ({ ...prev, total, totalCategories: nonEmpty.length }));
        fetchEventStats();
      })
      .catch(() => {
        setLoading(false);
      });
  };

  const fetchEventStats = async () => {
    setStatsLoading(true);
    try {
      const res = await axios.get(`${baseURL}/events/all-events`, { headers: authHeaders() });
      const events = res.data?.events || [];
      const today = new Date().setHours(0, 0, 0, 0);
      const upcoming = events.filter((ev) => {
        const slots = ev.timeSlots || [];
        return slots.some((s) => new Date(s.date).setHours(0, 0, 0, 0) >= today);
      }).length;
      const completed = events.filter((ev) => {
        const slots = ev.timeSlots || [];
        return slots.length > 0 && slots.every((s) => new Date(s.date).setHours(0, 0, 0, 0) < today);
      }).length;
      setStats((prev) => ({ ...prev, upcoming, completed }));
    } catch (_) {}
    finally { setStatsLoading(false); }
  };

  const handlesearchChange = (e) => setSearchTerm(e.target.value);

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") { e.preventDefault(); performSearch(); }
  };

  const performSearch = () => navigate(`/organization/search/${searchTerm}`);

  const handleCategory = (name, id) => {
    setCategoryname(name);
    navigate(id);
  };

  return (
    <section>
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-cyan-500 rounded-xl flex items-center justify-center shadow-sm">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white leading-tight">Events</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Organize and manage all your events from one place.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white dark:bg-slate-800 flex items-center py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 w-full sm:w-56">
            <SearchIcon className="text-slate-400 dark:text-slate-500 cursor-pointer" onClick={performSearch} />
            <input
              type="text"
              name="search"
              value={searchTerm}
              onChange={handlesearchChange}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search events by name..."
              className="w-full ms-2 text-sm border-none outline-none bg-transparent dark:text-white"
            />
          </div>
          <button
            onClick={() => navigate("/organization/create_event")}
            className="flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors duration-200 shadow-sm whitespace-nowrap"
          >
            <AddIcon sx={{ fontSize: 18 }} />
            Add Event
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          loading={loading || statsLoading}
          icon={
            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          iconBg="bg-blue-50"
          count={stats.total}
          label="Total Events"
          sub="Across all categories"
        />
        <StatCard
          loading={loading || statsLoading}
          icon={
            <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          iconBg="bg-green-50"
          count={stats.upcoming}
          label="Upcoming Events"
          sub="Scheduled events"
        />
        <StatCard
          loading={loading || statsLoading}
          icon={
            <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          }
          iconBg="bg-purple-50"
          count={stats.completed}
          label="Completed Events"
          sub="Events wrapped up"
        />
        <StatCard
          loading={loading}
          icon={
            <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          }
          iconBg="bg-orange-50"
          count={stats.totalCategories}
          label="Total Categories"
          sub="Active event types"
        />
      </div>

      {/* ── Categories Section ── */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white">Event Categories</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Browse and manage your events by category.</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64">
          <CircularProgress className="text-blue-600" />
          <p className="mt-4 text-slate-600 dark:text-slate-300">Loading event categories...</p>
        </div>
      ) : category.length === 0 ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-full max-w-md">
            <div className="bg-gradient-to-br from-blue/5 via-white to-cyan-400/5 dark:from-slate-800/50 dark:via-slate-900 dark:to-slate-800/50 rounded-2xl p-8 border border-blue/10 dark:border-slate-700/50 shadow-xl">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue to-cyan-400 rounded-full blur opacity-20" />
                  <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue/20 to-cyan-400/20 border border-blue/30">
                    <svg className="w-10 h-10 text-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-3">No Categories Yet</h2>
              <p className="text-base text-slate-700 dark:text-slate-300 text-center mb-2 font-medium">Start Creating Events</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-8 leading-relaxed">
                You don't have any events yet. Create your first event to populate the available categories.
              </p>
              <button
                onClick={() => navigate("/organization/create_event")}
                className="w-full bg-gradient-to-r from-blue to-cyan-400 hover:from-blue/90 hover:to-cyan-400/90 text-white font-semibold py-3 px-6 rounded-lg transition duration-300 shadow-lg flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Your First Event
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {category.map((cat, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer border border-slate-100 dark:border-slate-700"
              onClick={() => handleCategory(cat?.name, cat?._id)}
            >
              <div className="relative aspect-video overflow-hidden">
                <img
                  src={cat?.imageUrl || demo}
                  alt={cat?.name}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white text-xs font-medium px-2 py-0.5 rounded-full">
                  {cat?.eventCount || 0} Events
                </span>
              </div>
              <div className="p-3 flex items-center justify-between">
                <div>
                  <h2 className="text-slate-800 dark:text-white font-semibold text-sm capitalize line-clamp-1">
                    {cat?.name}
                  </h2>
                  {cat?.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">{cat.description}</p>
                  )}
                </div>
                <svg className="w-4 h-4 text-slate-400 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default EventsCategory;
