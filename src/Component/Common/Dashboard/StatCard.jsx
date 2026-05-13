import React from "react";
import { Link } from "react-router-dom";

const Card = ({ icon, iconBg, label, value }) => (
  <div className="flex h-24 bg-white rounded-2xl py-5 dark:bg-slate-800">
    <div className="flex items-center px-4">
      <div className={`p-2 rounded-xl ${iconBg}`}>{icon}</div>
    </div>
    <div className="grid text-start justify-center">
      <h2 className="mb-0 font-semibold text-sm text-slate-500 dark:text-slate-300">
        {label}
      </h2>
      <p className="mb-0 font-semibold text-xl text-slate-700 dark:text-white">
        {value}
      </p>
    </div>
  </div>
);

const StatCard = ({ to, ...props }) =>
  to ? (
    <Link to={to}>
      <Card {...props} />
    </Link>
  ) : (
    <Card {...props} />
  );

export default StatCard;
