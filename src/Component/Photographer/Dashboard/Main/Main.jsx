import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CircularProgress } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import BoltIcon from "@mui/icons-material/Bolt";
import CloseIcon from "@mui/icons-material/Close";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import InsertPhotoOutlinedIcon from "@mui/icons-material/InsertPhotoOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import BackupOutlinedIcon from "@mui/icons-material/BackupOutlined";

import { PhotographerEventContext } from "../../Context/PhotographerEventContext";
import {
  fetchDashboardSummary,
  fetchBillables,
  fetchTeamInvitations,
  checkHasEvents,
  formatFileSize,
  formatNumber,
} from "../../../../services/dashboardService";

import DashboardHero from "../DashboardHero";
import StatCard from "../../../Common/Dashboard/StatCard";
import EventLifecycleChart from "../../../Common/Dashboard/EventLifecycleChart";
import SubEventScheduleChart from "../../../Common/Dashboard/SubEventScheduleChart";
import UpcomingEventsList from "../../../Common/Dashboard/UpcomingEventsList";
import RecentActivityFeed from "../../../Common/Dashboard/RecentActivityFeed";
import PendingInvitationsCard from "../../../Common/Dashboard/PendingInvitationsCard";
import BillablesCard from "../../../Common/Dashboard/BillablesCard";

function Main() {
  const navigate = useNavigate();
  const { notification, profile } = useContext(PhotographerEventContext);

  const [summary, setSummary] = useState(null);
  const [billables, setBillables] = useState({ summary: {}, unpaidEvents: [] });
  const [invitations, setInvitations] = useState({
    users: [],
    invitationSummary: { pending: 0, accepted: 0, rejected: 0, total: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [billablesLoading, setBillablesLoading] = useState(false);
  const [permission, setPermission] = useState(false);
  const [showEmpty, setShowEmpty] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadPrimary();
    loadSecondary();
  }, []);

  const loadPrimary = async () => {
    setLoading(true);
    try {
      const [summaryData, hasEvents] = await Promise.all([
        fetchDashboardSummary(),
        checkHasEvents(),
      ]);
      setSummary(summaryData);
      setShowEmpty(!hasEvents);
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || "";
      if (status === 403 || msg.toLowerCase().includes("trial") || msg.toLowerCase().includes("upgrade")) {
        setPermission(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadSecondary = async () => {
    setBillablesLoading(true);
    try {
      const [b, inv] = await Promise.all([
        fetchBillables(),
        fetchTeamInvitations(),
      ]);
      setBillables(b);
      setInvitations(inv);
    } catch (_) {
      // non-critical; cards show empty state
    } finally {
      setBillablesLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-white dark:bg-slate-900 rounded-lg shadow-sm p-6">
        <CircularProgress className="text-blue-600" />
        <p className="mt-4 text-slate-600 dark:text-slate-300">Loading...</p>
      </div>
    );
  }

  if (permission) {
    return (
      <div className="bg-slate-100 p-5 rounded text-center mt-5 dark:bg-slate-800">
        <ErrorOutlineIcon sx={{ fontSize: "50px" }} className="text-red-600" />
        <h1 className="text-slate-700 font-normal text-2xl dark:text-white">
          You do not have access to this page
        </h1>
        <p className="text-slate-700 font-normal text-sm dark:text-white">
          Your plan does not have permission. Upgrade to continue.
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

  const statCards = [
    {
      icon: <CalendarMonthIcon sx={{ fontSize: { xs: 20, md: 30 } }} className="text-orange-400" />,
      iconBg: "bg-orange-50 dark:bg-orange-900/20",
      label: "Upcoming Events",
      value: formatNumber(summary?.upcomingEventCount),
      to: "/photographer/events_category",
    },
    {
      icon: <InsertPhotoOutlinedIcon sx={{ fontSize: { xs: 20, md: 30 } }} className="text-green-600" />,
      iconBg: "bg-green-50 dark:bg-green-900/20",
      label: "Total Photos",
      value: formatNumber(summary?.totalPhotos),
    },
    {
      icon: <PeopleAltOutlinedIcon sx={{ fontSize: { xs: 20, md: 30 } }} className="text-red-500" />,
      iconBg: "bg-red-50 dark:bg-red-900/20",
      label: "Team Members",
      value: formatNumber(summary?.teamMemberCount),
      to: "/photographer/team",
    },
    {
      icon: <BackupOutlinedIcon sx={{ fontSize: { xs: 20, md: 30 } }} className="text-violet-500" />,
      iconBg: "bg-violet-50 dark:bg-violet-900/20",
      label: "Optimized Storage",
      value: formatFileSize(summary?.totalPhotoSize),
    },
  ];

  return (
    <>
      <div className="main-dash">
        <DashboardHero
          profileName={profile?.name}
          searchTerm={searchTerm}
          onSearchChange={(e) => setSearchTerm(e.target.value)}
          onSearchSubmit={() => navigate(`/photographer/search/${searchTerm}`)}
        />

        <div className="grid grid-cols-2 gap-2 md:gap-4 md:grid-cols-4">
          {statCards.map((card) => (
            <StatCard key={card.label} {...card} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-4">
          <div>
            <EventLifecycleChart eventStatusStats={summary?.eventStatusStats} />
            <UpcomingEventsList events={summary?.recentUpcomingEvents || []} />
          </div>
          <div>
            <SubEventScheduleChart nextSevenDaysEvents={summary?.nextSevenDaysEvents || []} />
            <div className="mt-5">
              <RecentActivityFeed entries={notification || summary?.recentAuditLogs || []} />
            </div>
          </div>
        </div>

        <PendingInvitationsCard
          users={invitations.users}
          summary={invitations.invitationSummary}
        />

        <BillablesCard billables={billables} loading={billablesLoading} />

        <div className="mt-5" />
      </div>

      {showEmpty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative w-[90%] max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-blue via-blue/70 to-cyan-400 opacity-90" />
            <div className="relative z-10 flex justify-end p-4">
              <button
                onClick={() => setShowEmpty(false)}
                className="p-1 hover:bg-white/20 rounded-full transition"
              >
                <CloseIcon
                  sx={{ fontSize: "24px" }}
                  className="text-white/80 hover:text-white"
                />
              </button>
            </div>
            <div className="px-8 pt-4 pb-8 flex flex-col items-center text-center">
              <div className="mb-6 mt-2">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue/20 to-cyan-400/20 border border-blue/30">
                  <svg
                    className="w-8 h-8 text-blue"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                No Events Yet
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
                Your calendar is empty. Create your first event to get started
                with managing your photography bookings.
              </p>
              <button
                className="w-full text-xs md:text-lg bg-gradient-to-r from-blue to-cyan-400 hover:from-blue/90 hover:to-cyan-400/90 text-white font-semibold py-3 px-3 rounded-lg transition duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                onClick={() => navigate("/photographer/create_event")}
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
                Create Your Event
              </button>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
                Tip: Add event details, dates, and times to attract more clients
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Main;
