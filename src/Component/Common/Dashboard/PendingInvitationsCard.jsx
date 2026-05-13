import React from "react";
import { Link } from "react-router-dom";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";

const STAT_CELLS = [
  { key: "pending", label: "Pending", bg: "bg-amber-50 dark:bg-amber-900/30", text: "text-amber-600 dark:text-amber-400" },
  { key: "accepted", label: "Accepted", bg: "bg-green-50 dark:bg-green-900/30", text: "text-green-600 dark:text-green-400" },
  { key: "rejected", label: "Rejected", bg: "bg-red-50 dark:bg-red-900/30", text: "text-red-600 dark:text-red-400" },
  { key: "total", label: "Total", bg: "bg-slate-50 dark:bg-slate-700", text: "text-slate-700 dark:text-white" },
];

const PendingInvitationsCard = ({
  users = [],
  summary = { pending: 0, accepted: 0, rejected: 0, total: 0 },
  teamPath = "/photographer/team",
}) => (
  <div className="w-full bg-white rounded-md p-3 dark:bg-slate-800 mt-4">
    <div className="flex justify-between items-center mb-3">
      <h2 className="text-slate-700 font-medium text-lg dark:text-white">
        Pending Invitations
      </h2>
      <Link to={teamPath}>
        <button className="text-xs font-semibold text-blue-500 hover:text-blue-700 dark:hover:text-blue-400">
          View All →
        </button>
      </Link>
    </div>

    {summary.pending > 0 ? (
      <div>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {STAT_CELLS.map(({ key, label, bg, text }) => (
            <div key={key} className={`p-2 ${bg} rounded text-center`}>
              <p className={`text-xs ${text}`}>{label}</p>
              <p className={`text-lg font-bold ${text}`}>{summary[key]}</p>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {users.map((user, i) => (
            <div
              key={user._id || i}
              className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center mr-3">
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">
                    {user.name ? user.name.charAt(0).toUpperCase() : "?"}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-white">
                    {user.name || "Unknown"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {user.countryCode} {user.phone}
                    {user.email && ` • ${user.email}`}
                  </p>
                </div>
              </div>
              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                Pending
              </span>
            </div>
          ))}
        </div>
      </div>
    ) : (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <PeopleAltOutlinedIcon
          sx={{ fontSize: 40 }}
          className="text-gray-300 dark:text-slate-600 mb-2"
        />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
          No Pending Invitations
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">
          Invite team members to collaborate
        </p>
        <Link to={teamPath}>
          <button className="bg-blue text-white py-1 px-3 rounded text-xs font-semibold hover:bg-blue-600">
            Invite Team
          </button>
        </Link>
      </div>
    )}
  </div>
);

export default PendingInvitationsCard;
