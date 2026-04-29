import React, { useContext, useEffect, useState } from "react";
import { PortfolioContext } from "../Context/PortfolioContext";
import { startUpload } from "../Context/UploadHelper";
import { useImageUploadWatcher } from "../Context/useImageUploadWatcher";
import DriveFolderUploadIcon from "@mui/icons-material/DriveFolderUpload";
import { toast } from "react-toastify";

function SyncPhotos() {
  // const [syncStatus, setSyncStatus] = useState("idle");
  const { uploadState, updateUploadState } = useContext(PortfolioContext);
  const [folderPath, setFolderPath] = useState(null);
  const {   
    setStart,   
    setBack,   
    eventname,
    categoryname,
    setStatus,
    status,
  } = useContext(PortfolioContext);

  // useImageUploadWatcher({
  //   folderPath: uploadState.folderPath,
  //   updateUploadState,
  // });

  // console.log("fiolder path", folderPath);

  // const handleStart = async () => {
  //   try {
  //     const selected = await window.electronAPI.selectFolderupload();
  //     // const selected = await window.electronAPI.selectFolder();
  //     if (!selected) return;
  //     setFolderPath(selected);

  //     if (selected === folderPath) {
  //       toast.info("You've already selected this folder.");
  //       return;
  //     }
  //     setStatus("loading");
  //     // setStart(false);
  //     setBack(false);
  //     await startUpload(selected, updateUploadState, setStatus);
  //   } catch (error) {
  //     console.error("Folder selection failed:", error);
  //     toast.error("Failed to select folder");
  //     setStatus("idle");
  //   }
  // };
  const handleStart = async () => {
      const selected = await window.electronAPI.selectFolder();
      if (!selected) return;
      setFolderPath(selected);
            if (selected === folderPath) {
        toast.info("You've already selected this folder.");
        return;
      }
  
      await startUpload(selected, updateUploadState, setStatus);
    };

    return (
    <>
      {eventname && categoryname && (
        <div className="flex flex-col gap-3 mt-5">
          <p className="text-slate-700 font-semibold capitalize dark:text-white">
            Selected Event: <span className="text-blue">{eventname}</span>
          </p>
          <p className="text-slate-700 font-semibold capitalize dark:text-white">
            Selected SubCategory:{" "}
            <span className="text-blue">{categoryname}</span>
          </p>
        </div>
      )}    
      <div className="flex flex-col items-center my-5">
        <button
          className={`bg-blue text-white py-2 px-3 rounded font-semibold transition-colors ${
            status === "loading"
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-blueHover"
          }`}
          onClick={handleStart}
          disabled={status === "loading"}
        >
          <DriveFolderUploadIcon /> Select Folder
        </button>     
      
      </div>
    </>
  );
}

export default SyncPhotos;
