import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

const generateDummyData = () => {
  const days = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push({
      day: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      uploaded: Math.floor(Math.random() * 80) + 10,
      processed: Math.floor(Math.random() * 50) + 5,
    });
  }
  return days;
};

const UploadActivityChart = () => {
  const data = generateDummyData();

  return (
    <div className="w-full bg-white rounded-xl p-3 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
      <h2 className="text-xs font-semibold text-slate-700 dark:text-white mb-2">Upload Activity (7 Days)</h2>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} barGap={3} barCategoryGap="18%">
          <XAxis dataKey="day" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ fontSize: 11 }} />
          <Bar dataKey="uploaded" name="Photos Uploaded" fill="#6366f1" radius={[3, 3, 0, 0]} />
          <Bar dataKey="processed" name="Photos Processed (AI)" fill="#a78bfa" radius={[3, 3, 0, 0]} />
          <Legend wrapperStyle={{ fontSize: 9 }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default UploadActivityChart;
