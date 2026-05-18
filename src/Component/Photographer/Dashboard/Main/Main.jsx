import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CircularProgress } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import BoltIcon from "@mui/icons-material/Bolt";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import InsertPhotoOutlinedIcon from "@mui/icons-material/InsertPhotoOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import CloudQueueIcon from "@mui/icons-material/CloudQueue";
import BackupOutlinedIcon from "@mui/icons-material/BackupOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import FaceOutlinedIcon from "@mui/icons-material/FaceOutlined";

import { PhotographerEventContext } from "../../Context/PhotographerEventContext";
import {
  fetchDashboardSummary,
  fetchBillables,
  checkHasEvents,
  formatFileSize,
  formatNumber,
  formatCurrency,
} from "../../../../services/dashboardService";

import DashboardHero from "../DashboardHero";
import StatCard from "../../../Common/Dashboard/StatCard";
import EventLifecycleChart from "../../../Common/Dashboard/EventLifecycleChart";
import UploadActivityChart from "../../../Common/Dashboard/UploadActivityChart";
import EarningsOverviewChart from "../../../Common/Dashboard/EarningsOverviewChart";
import QuickActions from "../../../Common/Dashboard/QuickActions";
import UpcomingEventsTable from "../../../Common/Dashboard/UpcomingEventsTable";
import RecentActivityFeed from "../../../Common/Dashboard/RecentActivityFeed";
import PrintOrdersCard from "../../../Common/Dashboard/PrintOrdersCard";
import EarningsBreakdownCard from "../../../Common/Dashboard/EarningsBreakdownCard";
import StorageUsageCard from "../../../Common/Dashboard/StorageUsageCard";

function Main() {
  const navigate = useNavigate();
  const { notification, profile } = useContext(PhotographerEventContext);

  const [summary, setSummary] = useState(null);
  const [billables, setBillables] = useState({ summary: {}, unpaidEvents: [] });
  const [loading, setLoading] = useState(true);
  const [permission, setPermission] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [summaryData, hasEvents, b] = await Promise.all([
        fetchDashboardSummary(),
        checkHasEvents(),
        fetchBillables(),
      ]);
      setSummary(summaryData);
      setBillables(b);
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
        <h1 className="text-slate-700 font-normal text-2xl dark:text-white">You do not have access to this page</h1>
        <p className="text-slate-700 font-normal text-sm dark:text-white">Your plan does not have permission. Upgrade to continue.</p>
        <button className="bg-blue rounded px-5 py-2 mt-4 text-white font-normal hover:bg-blueHoverHover" onClick={() => navigate("/photographer/upgrade_plan")}>
          <BoltIcon /> Upgrade Plan
        </button>
      </div>
    );
  }

  const totalBytes = summary?.totalPhotoSize || 0;
  const storagePct = Math.min((totalBytes / (20 * 1024 * 1024 * 1024)) * 100, 100);

  const formatTrend = (t) => {
    if (!t || (t.thisMonth === 0 && t.lastMonth === 0)) return { text: "No data yet", direction: "neutral" };
    if (t.direction === "neutral") return { text: "No change vs last month", direction: "neutral" };
    const sign = t.direction === "up" ? "+" : "-";
    return { text: `${sign}${t.changePercent}% vs last month`, direction: t.direction };
  };

  const statCards = [
    {
      icon: <CalendarMonthIcon sx={{ fontSize: 20 }} className="text-orange-400" />,
      iconBg: "bg-orange-50 dark:bg-orange-900/20",
      label: "Upcoming Events",
      value: formatNumber(summary?.upcomingEventCount),
      trend: { text: "+20% vs last month", direction: "up" },
      to: "/photographer/events_category",
    },
    {
      icon: <InsertPhotoOutlinedIcon sx={{ fontSize: 20 }} className="text-green-600" />,
      iconBg: "bg-green-50 dark:bg-green-900/20",
      label: "Total Photos Uploaded",
      value: formatNumber(summary?.totalPhotos),
      trend: { text: "+12% vs last month", direction: "up" },
    },
    {
      icon: <FaceOutlinedIcon sx={{ fontSize: 20 }} className="text-violet-500" />,
      iconBg: "bg-violet-50 dark:bg-violet-900/20",
      label: "Guest Matches (AI)",
      value: formatNumber(summary?.totalGuestAIMatches),
      trend: formatTrend(summary?.guestAIMatchTrend),
    },
    {
      icon: <PeopleAltOutlinedIcon sx={{ fontSize: 20 }} className="text-red-500" />,
      iconBg: "bg-red-50 dark:bg-red-900/20",
      label: "Team Members",
      value: formatNumber(summary?.teamMemberCount),
      trend: { text: "No change", direction: "neutral" },
      to: "/photographer/team",
    },
    {
      icon: <BackupOutlinedIcon sx={{ fontSize: 20 }} className="text-blue-500" />,
      iconBg: "bg-blue-50 dark:bg-blue-900/20",
      label: "Storage Used",
      value: formatFileSize(totalBytes),
      footer: `${storagePct.toFixed(1)}% of 20 GB`,
      progress: storagePct,
    },
    {
      icon: <AccountBalanceWalletOutlinedIcon sx={{ fontSize: 20 }} className="text-amber-500" />,
      iconBg: "bg-amber-50 dark:bg-amber-900/20",
      label: "Monthly Earnings",
      value: formatCurrency(billables?.summary?.totalAmount),
      trend: { text: "+5% vs last month", direction: "up" },
      to: "/photographer/billing",
    },
  ];

  return (
    <div className="space-y-3">
      <DashboardHero profileName={profile?.name} />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <EventLifecycleChart eventStatusStats={summary?.eventStatusStats} />
        <UploadActivityChart />
        <EarningsOverviewChart totalEarnings={billables?.summary?.totalAmount} />
      </div>

      <QuickActions />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        <div className="lg:col-span-3">
          <UpcomingEventsTable events={summary?.recentUpcomingEvents || []} />
        </div>
        <div className="lg:col-span-2">
          <RecentActivityFeed entries={notification || summary?.recentAuditLogs || []} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <PrintOrdersCard />
        <EarningsBreakdownCard totalEarnings={billables?.summary?.totalAmount} />
        <StorageUsageCard totalPhotoSize={totalBytes} />
      </div>
    </div>
  );
}

export default Main;
