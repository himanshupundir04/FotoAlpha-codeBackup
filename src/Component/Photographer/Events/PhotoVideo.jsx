import React, { useState } from "react";
import SyncPhotos from "./SyncPhotos";
import SyncVideos from "./SyncVideos";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";

function PhotoVideo() {
  const [activeTab, setActiveTab] = useState("photos");
  const navigate = useNavigate();

  const tabs = [
    { id: "photos", label: "Photos" },
    { id: "videos", label: "Videos" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "photos":
        return <SyncPhotos />;
      case "videos":
        return <SyncVideos />;
      default:
        return null;
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <>
      <section>
        <div className="flex items-center gap-2">
          <ArrowBackIcon
            sx={{ fontSize: "30px" }}
            className="bg-slate-300 p-1 rounded text-white cursor-pointer"
            onClick={handleBack}
          />
          <h2 className="text-xl font-bold text-slate-700 dark:text-white">
            Sync Photo/Video
          </h2>
        </div>

        <div className="mt-4 mb-1">
          <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
            {tabs.map((tab) => (
              <li key={tab.id} className="me-2">
                <button
                  className={`inline-block p-4 pb-2 border-b-2 rounded-t-lg text-black dark:text-slate-200 font-bold text-sm ${
                    activeTab === tab.id
                      ? "text-blue border-blue"
                      : "hover:text-slate-600 hover:border-slate-300 dark:hover:text-slate-300 border-transparent"
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="p-4">{renderContent()}</div>
      </section>
    </>
  );
}

export default PhotoVideo;
