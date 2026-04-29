import React, { useState, useEffect } from "react";
import axios from "axios";

const baseURL = process.env.REACT_APP_BASE_URL;

/**
 * CoinQuotaWidget
 * Shows user's remaining quota for each feature type
 * Useful to display in header or sidebar during photo upload/event creation flows
 */
const CoinQuotaWidget = () => {
  const [quotas, setQuotas] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllQuotas();
    // Refresh every 30 seconds
    const interval = setInterval(fetchAllQuotas, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAllQuotas = async () => {
    try {
      const features = [
        "photo_uploads",
        "storage",
        "events",
        "team_members",
      ];

      const quotaData = {};
      for (const feature of features) {
        try {
          const res = await axios.get(
            `${baseURL}/api/coin-purchases/available/${feature}`,
            {
              headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            }
          );
          if (res.data.success) {
            quotaData[feature] = res.data.data;
          }
        } catch (err) {
          console.error(`Error fetching ${feature} quota:`, err);
          quotaData[feature] = { available_quota: 0 };
        }
      }
      setQuotas(quotaData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching quotas:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-xs text-slate-500">Loading quotas...</div>;
  }

  const features = [
    { key: "photo_uploads", label: "Photo Uploads", unit: "photos" },
    { key: "storage", label: "Storage", unit: "GB" },
    { key: "events", label: "Events", unit: "events" },
    { key: "team_members", label: "Team Members", unit: "members" },
  ];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
        Coin-Purchased Quotas
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {features.map(({ key, label, unit }) => {
          const quota = quotas[key] || { available_quota: 0 };
          const available = quota.available_quota || 0;
          const hasQuota = available > 0;

          return (
            <div
              key={key}
              className={`p-3 rounded-lg text-sm ${
                hasQuota
                  ? "bg-blue-50 dark:bg-blue-900/20"
                  : "bg-gray-50 dark:bg-gray-700/20"
              }`}
            >
              <p
                className={`font-medium ${
                  hasQuota
                    ? "text-blue-900 dark:text-blue-200"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                {label}
              </p>
              <p
                className={`text-lg font-bold ${
                  hasQuota
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-500 dark:text-gray-500"
                }`}
              >
                {available} {unit}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CoinQuotaWidget;
