import React, { useContext, useState } from "react";
import { PortfolioContext } from "../Context/PortfolioContext";
import { startUpload } from "../Context/UploadHelper";
import { toast } from "react-toastify";
import ImageIcon from "@mui/icons-material/Image";
import VideocamIcon from "@mui/icons-material/Videocam";
import { UploadVideoContext } from "../Context/UploadVideoContext";

function SyncPhotos() {
  // const [syncStatus, setSyncStatus] = useState("idle");
  const { updateUploadState } = useContext(PortfolioContext);
  const [folderPath, setFolderPath] = useState(null);
  const { eventname, categoryname, setStatus, status } =
    useContext(PortfolioContext);

  const { uploadVideoState, updateUploadVideoState, videoStatus } =
    useContext(UploadVideoContext);

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

  // video slected
  const handleSelectFolder = async () => {
    const selected = await window.electronAPI.selectVideoFolder();
    if (!selected) return;

    if (selected === uploadVideoState.folderPath) {
      toast.info("Folder already selected");
      return;
    }

    updateUploadVideoState({
      folderPath: selected,
      isUploading: true,
    });

    // console.log("slected folder", selected);
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
      <div className="flex justify-center items-center my-5 gap-4">
        <button
          className={`bg-blue text-white py-2 px-3 rounded font-semibold transition-colors ${
            status === "loading" || videoStatus === "loading"
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-blueHover"
          }`}
          onClick={handleStart}
          disabled={status === "loading" || videoStatus === "loading"}
        >
          <ImageIcon /> Select Image Folder
        </button>

        {/* <button
          className={`bg-blue text-white py-2 px-3 rounded font-semibold transition-colors ${
            videoStatus === "loading" || status === "loading"
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-blueHover"
          }`}
          onClick={handleSelectFolder}
          disabled={videoStatus === "loading" || status === "loading"}
        >
          <VideocamIcon /> Select Video Folder
        </button> */}
      </div>
    </>
  );
}

export default SyncPhotos;
