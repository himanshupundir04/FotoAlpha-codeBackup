import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import demo from "../../image/demo.jpg";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
} from "recharts";

import { PhotographerEventContext } from "../Context/PhotographerEventContext";

const baseurl = import.meta.env.VITE_BASE_URL;

function Analysis() {
  const token = localStorage.getItem("token");
  const [data, setData] = useState();
  const { eventid } = useParams();
  const { photoCount } = useContext(PhotographerEventContext);

  useEffect(() => {
    fetchAnalysis();
  }, []);

  const fetchAnalysis = async () => {
    try {
      const res = await axios.get(`${baseurl}/events/analytics/${eventid}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      setData(res.data)
    } catch (err) {
      console.log(err)

    }
  };

  // ✅ Helpers
  const getCleanUrl = (url) => (url ? url.split("?")[0] : "");

  const isImage = (file) => {
    const clean = getCleanUrl(file);
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(clean);
  };

  // ✅ Counts
  const totalImages =
    data?.analytics?.filter((item) => item.photo)?.length || 0;

  const totalClickedImages =
    data?.analytics?.filter((item) => item.clicks > 0)?.length || 0;

  const totalDownloadedImages =
    data?.analytics?.filter((item) => item.downloads > 0)?.length || 0;

  // ✅ Summary Chart Data
  const summaryChartData = [
    {
      name: "Total Images",
      value: photoCount || totalImages,
    },
    {
      name: "Total Clicked",
      value: totalClickedImages,
    },
    {
      name: "Total Downloaded",
      value: totalDownloadedImages,
    },
  ];

  // ✅ Top 5 Items
  const topItems =
    data?.analytics
      ?.filter((item) => item.photo)
      ?.sort(
        (a, b) =>
          (b.clicks + b.downloads) - (a.clicks + a.downloads)
      )
      ?.slice(0, 5)
      ?.map((item, index) => ({
        name: `Img ${index + 1}`,
        clicks: item.clicks || 0,
        downloads: item.downloads || 0,
        image: item?.photo?.signedUrl,
      })) || [];

  const colors = ["#6366f1", "#c95591", "#22c55e"];

  // console.log("top item", topItems)

  return (
    <section>
      <div className="mt-5 md:mt-0 bg-white shadow-md rounded-md p-6 space-y-6 dark:bg-slate-800">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-6 ">
          {/* ✅ SUMMARY CHART */}
          <div className="w-full h-80 mb-5 lg:mb-0">
            <h3 className="text-lg font-medium mb-3 text-slate-700 dark:text-white">
              Analytics Dashboard
            </h3>
            <ResponsiveContainer>
              <BarChart data={summaryChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                {/* <Legend /> */}

                <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={40}>
                  {summaryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* ✅ TOP 5 CARDS */}
          <div className="w-full mt-5 lg:mt-0">
            <h3 className="text-lg font-medium mb-3 text-slate-700 dark:text-white">
              Top 5 Performers
            </h3>
               {topItems.length === 0 ? (
                <p className="text-gray-400 text-sm text-center mt-5">No activity yet</p>
              ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
              {topItems.map((item, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-slate-700 rounded-lg shadow p-3 text-center hover:shadow-lg transition"
                >
                  {isImage(item.image) ? (
                    <img
                      src={item.image || demo}
                      alt=""
                      className="w-full h-24 object-cover rounded mb-2"
                    />
                  ) : (
                    <video
                      src={item.image || demo}
                      className="w-full h-24 object-cover rounded mb-2"
                    />
                  )}
                  <p className="text-blue text-sm">
                    {item.clicks} clicks
                  </p>

                  <p className="text-green-600 text-sm">
                    {item.downloads} downloads
                  </p>
                </div>
              ))}
            </div>
              )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Analysis;