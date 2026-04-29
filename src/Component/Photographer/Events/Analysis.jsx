import axios from "axios";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import demo from "../../image/demo.jpg"

const baseurl = process.env.REACT_APP_BASE_URL;
function Analysis() {
  const token = localStorage.getItem("token");
  const [data, setData] = useState();
  const { eventid } = useParams();

  useEffect(() => {
    fetchAnalysis();
  }, []);

  const fetchAnalysis = () => {
    axios
      .get(`${baseurl}/events/analytics/${eventid}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        console.log(res.data);
        setData(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  return (
    <>
      <section>
        <div className="bg-white shadow-md rounded-md p-6 space-y-6 dark:bg-slate-800">
          <h2 className="text-start text-xl font-semibold text-slate-700 dark:text-white">
            Analytics Summary
          </h2>
          {/* <div className="flex items-center gap-4 border-b">
            {data?.analytics.map((data, index) => (
              <div className="pb-4" key={index}>
                <img
                  src={data?.photo?.presignedUrl || demo}
                  alt="Clicked"
                  className="w-24 h-24 object-contain rounded border"
                />
                <p className="text-blue">{data?.clicks || 0} clicks</p>
              </div>
            ))}
          </div> */}
          {/* Top Clicked Image */}
          <div className="flex items-center space-x-4 border-b pb-4">
            <img
              src={data?.topClicked?.presignedUrl || demo}
              alt="Top Clicked"
              className="w-24 h-24 object-contain rounded border"
            />
            <div>
              <p className="text-slate-700 dark:text-white">Top Clicks</p>
              <p className="text-blue">{data?.topClicked?.clicks || 0} clicks</p>
            </div>
          </div>
          {/* Top Downloaded Image */}
          <div className="flex items-center space-x-4 border-b pb-4">
            <img
              src={data?.topDownloaded?.presignedUrl || demo}
              alt="Top Downloaded"
              className="w-24 h-24 object-contain rounded border"
            />
            <div>
              <p className="text-slate-700 dark:text-white">Top Downloads</p>
              <p className="text-green-600">
                {data?.topDownloaded?.downloads || 0} downloads
              </p>
            </div>
          </div>
          {/* Total Photos  */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-slate-700 dark:text-white font-semibold">
              Total Photos
            </span>
            <span className="text-slate-700 font-semibold dark:text-white">
              {data?.totalPhotos ?? "N/A"}
            </span>
          </div>
        </div>
      </section>
    </>
  );
}

export default Analysis;
