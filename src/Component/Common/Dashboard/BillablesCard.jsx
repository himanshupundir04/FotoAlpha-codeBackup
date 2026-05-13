import React from "react";
import { useNavigate } from "react-router-dom";
import { CircularProgress } from "@mui/material";
import { formatCurrency } from "../../../services/dashboardService";

const BillablesCard = ({
  billables = { summary: {}, unpaidEvents: [] },
  loading = false,
  billingPath = "/photographer/billing",
}) => {
  const navigate = useNavigate();
  const { summary = {}, unpaidEvents = [] } = billables;
  const total = summary.totalAmount || 0;
  const received = summary.totalReceived || 0;
  const remaining = summary.remainingTotal || 0;
  const percent = total > 0 ? Math.round((received / total) * 100) : 0;

  return (
    <div
      className="w-full bg-white rounded-md p-3 dark:bg-slate-800 mt-4 cursor-pointer"
      onClick={() => navigate(billingPath)}
    >
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-slate-700 font-medium text-lg dark:text-white">
          Outstanding Billables
        </h2>
        <div className="text-sm text-slate-600 dark:text-slate-300 text-right">
          <div>Total: <b>{formatCurrency(total)}</b></div>
          <div>Received: <b className="text-green-600">{formatCurrency(received)}</b></div>
          <div>Remaining: <b className="text-red-600">{formatCurrency(remaining)}</b></div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <CircularProgress />
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
              <p className="text-lg font-bold text-slate-800 dark:text-white">
                {formatCurrency(total)}
              </p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">Received</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(received)}</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">Remaining</p>
              <p className="text-lg font-bold text-red-600">{formatCurrency(remaining)}</p>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-600 dark:text-slate-400">Collected</span>
              <span className="text-xs font-medium text-slate-700 dark:text-white">{percent}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-green-600 transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>

          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            {unpaidEvents.length
              ? `${unpaidEvents.length} unpaid event(s)`
              : "No unpaid events"}
          </div>
        </div>
      )}
    </div>
  );
};

export default BillablesCard;
