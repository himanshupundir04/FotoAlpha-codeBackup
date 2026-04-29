import React, { useContext, useEffect, useState } from "react";
import Header from "./Dashboard/Header/Header";
import Aside from "./Dashboard/Sidebar/Aside";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import Footer from "./Dashboard/Footer/Footer";
import { Outlet } from "react-router-dom";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { PortfolioContext } from "./Context/PortfolioContext";
import Swal from "sweetalert2";
import { Alert, Snackbar } from "@mui/material";
import { useImageUploadWatcher } from "./Context/useImageUploadWatcher";
import { useVideoUploadWatcher } from "./Context/useVideoUploadWatcher";
import { UploadVideoContext } from "./Context/UploadVideoContext";

function PortfolioLayout() {
  const [isOpen, setIsOpen] = useState(false);
  const [show, setShow] = useState(true);
  const [opensnak, setOpensnak] = useState(false);
  const [stats, setStats] = useState(null);
  const [networkSpeed, setNetworkSpeed] = useState(0);
  const [error, setError] = useState("");

  const { uploadState, updateUploadState, setStatus } =
    useContext(PortfolioContext);

  const {
    total,
    uplaoded,
    duplicate,
    setSubId,
    setEventId,
    setEventsid,
    setSubeventsid,
    setTotal,
    setUploaded,
    setDuplicate,
    setSavedStep,
    setBack,
    setCancel,
    setComplete,
    setFailed,
    failed,
  } = useContext(PortfolioContext);

  const {
    uploadVideoState,
    videoTotal,
    setVideoTotal,
    videoDuplicate,
    setVideoDuplicate,
    videoFailed,
    setVideoFailed,
    videoUploaded,
    setVideoUploaded,
    setUploadVideoState,
    setVideos,
    setVideoStatus,
    setEventid,
    setSubeventid,
    setStepEventid,
    setStepSubeventid,
  } = useContext(UploadVideoContext);

  useImageUploadWatcher({
    folderPath: uploadState.folderPath,
    updateUploadState,
    setSyncStatus: setStatus,
  });

  const cleanupUploads = () => {
    window.electronAPI.cancelUploadProcessing();
    window.electronAPI.deleteCompressed();
    window.electronAPI.stopWatchingFolder?.();
    window.electronAPI.removeListeners?.();
  };

  useEffect(() => {
    return () => {
      cleanupUploads();
      setStatus("completed");
      setTotal(0);
      setUploaded(0);
      setDuplicate(0);
      setSubId("");
      setEventId("");
      setEventsid("");
      setSubeventsid("");
      setError("");
      setSavedStep(0);
      setShow(true);
      setOpensnak(false);
      setFailed(0);
      updateUploadState({ folderPath: null });
      setVideoTotal(0);
      setVideoDuplicate(0);
      setVideoUploaded(0);
      setVideoFailed(0);
      setVideoStatus("completed");
      setStepEventid("");
      setEventid("");
      setSubeventid("");
      setStepSubeventid("");
      setUploadVideoState({ folderPath: null });
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      const data = await window.electronAPI.getSystemStats();
      setStats(data);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      const speed = await window.electronAPI.getNetworkSpeed();
      setNetworkSpeed(speed);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (videoTotal === 0 && total === 0) return; // no upload running

    if (networkSpeed > 0 && networkSpeed < 0.5) {
      setError("Slow internet connection detected");
    } else {
      setError("");
    }
  }, [networkSpeed, total, videoTotal]);

  const progressPercentage =
    total === 0 ? 0 : ((uplaoded + duplicate + failed) / total) * 100;

  const handleCancelUpload = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, cancel it!",
    }).then((result) => {
      if (result.isConfirmed) {
        const compressedFolder = `${uploadState.folderPath}/compressed`;
        cleanupUploads();
        setStatus("completed");
        setSubId("");
        setEventId("");
        setEventsid("");
        setSubeventsid("");
        setError("");
        setComplete(false);
        setCancel(false);
        setBack(true);
        setSavedStep(0);
        setFailed(0);
        setTotal(0);
        setUploaded(0);
        setDuplicate(0);
        window.electronAPI.deleteFolder(compressedFolder);
      }
    });
  };

  useEffect(() => {
    if (total > 0 && uplaoded + duplicate + failed === total) {
      cleanupUploads();
      setStatus("completed");
      const compressedFolder = `${uploadState.folderPath}/compressed`;
      setSubId("");
      setEventId("");
      setEventsid("");
      setSubeventsid("");
      setError("");
      setSavedStep(0);
      setFailed(0);
      setTimeout(() => {
        setTotal(0);
        setUploaded(0);
        setDuplicate(0);
        window.electronAPI.deleteFolder(compressedFolder);
        setOpensnak(true);
      }, 2000);
    }
  }, [uplaoded, total, duplicate, failed]);

  const handleClosesnak = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setOpensnak(false);
  };

  //============== VIDEO UPLOADING ================
  useVideoUploadWatcher({
    folderPath: uploadVideoState.folderPath,
  });

  const videoprogressPercentage =
    videoTotal === 0
      ? 0
      : ((videoUploaded + videoDuplicate + videoFailed) / videoTotal) * 100;

  useEffect(() => {
    if (
      videoTotal > 0 &&
      videoUploaded + videoDuplicate + videoFailed === videoTotal
    ) {
      cleanupUploads();
      setStatus("completed");
      setEventid("");
      setSubeventid("");
      const compressedFolder = `${uploadVideoState.folderPath}/compressed`;
      setTimeout(() => {
        setUploadVideoState({ folderPath: null });
        setVideoTotal(0);
        setVideoDuplicate(0);
        setVideoUploaded(0);
        setVideoStatus("idle");
        setStepSubeventid("");
        setStepEventid("");
        setBack(true);
        setSavedStep(0);
        setVideos([]);
        window.electronAPI.deleteFolder(compressedFolder);
        window.electronAPI.cancelVideoCompress();
        setVideoFailed(0);
        setOpensnak(true);
      }, 2000);
    }
  }, [videoUploaded, videoTotal, videoDuplicate, videoFailed]);

  const handleCancelVideoUpload = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, cancel it!",
    }).then((result) => {
      if (result.isConfirmed) {
        const compressedFolder = `${uploadVideoState.folderPath}/compressed`;
        window.electronAPI.deleteFolder(compressedFolder);
        window.electronAPI.cancelVideoCompress();
        setVideoStatus("completed");
        setUploadVideoState({ folderPath: null });
        setEventid("");
        setSubeventid("");
        setError("");
        setVideoTotal(0);
        setVideoDuplicate(0);
        setStepSubeventid("");
        setStepEventid("");
        setVideoUploaded(0);
        setVideoFailed(0);
        setOpensnak(true);
        setBack(true);
        setSavedStep(0);
        setVideos([]);
      }
    });
  };

  return (
    <>
      <div className="flex h-screen">
        <aside
          className={`top-0 left-0 h-full w-[20%] transform border-r-2 border-gray-200 dark:border-slate-800 dark:!bg-slate-900 bg-white transition-transform duration-300 ease-in-out z-50 ${isOpen ? "translate-x-0 w-[8%] lg:w-[5%]" : "-translate-x-full"} md:translate-x-0`}
        >
          <div className="flex justify-end items-center md:hidden dark:text-gray-200 p-1">
            <button onClick={() => setIsOpen(false)}>
              <CloseIcon size={24} />
            </button>
          </div>
          <Aside setIsOpen={setIsOpen} isOpen={isOpen} />
        </aside>
        {isOpen && (
          <div
            className="fixed inset-0 bg-black opacity-50 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          ></div>
        )}
        <section
          className={`flex h-auto transition-all duration-300 ease-in-out ${
            isOpen ? "w-[95%]" : "w-[85%]"
          }`}
        >
          <div className="flex flex-col w-webkit-fill-available h-auto">
            <header className="md:fixed top-0 w-webkit-fill-available z-10 bg-white dark:bg-slate-900 p-1 border-b-2 dark:border-slate-800 border-gray-200 flex items-center">
              <button
                className="p-1 px-0 dark:text-white ms-3"
                onClick={() => setIsOpen(!isOpen)}
              >
                <MenuIcon
                  sx={{ fontSize: { xs: "25px", md: "25px" } }}
                  className="text-slate-700 dark:text-white"
                />
              </button>
              <Header />
            </header>
            <main className="flex-1 p-4 dark:bg-slate-900 bg-gray-50 md:mt-10 overflow-auto">
              <Outlet />
            </main>
            <Footer />
          </div>
        </section>
      </div>

      {/* {total > 0 && (
        <div className="fixed bottom-4 right-4 w-96 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden transition-all duration-300 hover:shadow-2xl">
          <div
            className="flex justify-between items-center bg-gradient-to-r from-blue to-blueHover px-4 py-2 cursor-pointer"
            onClick={() => setShow(!show)}
          >
            <h2 className="text-white font-semibold text-lg">
              Activity Monitor
            </h2>
            <div className="flex items-center gap-2">
              <ExpandMoreIcon
                className={`text-white transform transition-transform duration-300 ${
                  show ? "rotate-180" : ""
                }`}
              />
              {uplaoded + duplicate === total && (
                <CloseIcon
                  sx={{ fontSize: "20PX" }}
                  className="text-white cursor-pointer"
                  onClick={() => {
                    handleClose();
                  }}
                />
              )}
            </div>
          </div>
          <div
            className={`transition-[max-height] duration-500 ease-in-out overflow-hidden ${
              show ? "max-h-58" : "max-h-0"
            }`}
          >
            <div className="px-5 py-4 space-y-4">
              {stats && (
                <div className=" text-sm text-start">
                  <p className="text-slate-700 font-semibold text-base">
                    CPU Cores: {stats.cpu.cores}
                  </p>
                  <p className="text-slate-700 font-semibold text-base">
                    Image Upload Speed: {networkSpeed} MB/s
                  </p>
                </div>
              )}
              <div className="flex justify-between items-center">
                <div className="flex flex-col text-start">
                  <p className="text-slate-700 font-semibold text-base">
                    {uplaoded} / {total} Images
                  </p>
                  <p className="text-slate-700 font-semibold text-base">
                    Duplicate Images: {duplicate}
                  </p>
                  <p className="text-red-600 font-semibold text-base">
                    Failed Images: {failed}
                  </p>
                </div>
                {uplaoded + duplicate !== total && (
                  <button
                    className="text-red-600 font-semibold hover:text-red-700 transition-colors"
                    onClick={handleCancelUpload}
                  >
                    Cancel All
                  </button>
                )}
              </div>
              {error && (
                <p className="text-red-600 font-medium text-sm">{error}</p>
              )}
              {total > 0 && uplaoded + duplicate === total ? (
                <div>
                  <p className="text-green-600 font-semibold text-base">
                    Upload Images successfully!
                  </p>
                </div>
              ) : (
                <div className="relative w-full h-3 bg-gray-200 rounded-full border border-slate-300 overflow-hidden">
                  <div
                    className="bg-blue h-4 transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              )}
              <p className="text-xs text-blueHover">
                Uploading large Images works best with 8 or more CPU cores and a
                stable broadband connection.
              </p>{" "}
            </div>
          </div>
        </div>
      )} */}

      {(videoTotal > 0 || total > 0) && (
        <div className="fixed bottom-4 right-4 w-96 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden transition-all duration-300 hover:shadow-2xl">
          <div
            className="flex justify-between items-center bg-gradient-to-r from-blue to-blueHover px-4 py-2 cursor-pointer"
            onClick={() => setShow(!show)}
          >
            <h2 className="text-white font-semibold text-lg">
              Activity Monitor
            </h2>
            <div className="flex items-center gap-2">
              <ExpandMoreIcon
                className={`text-white transform transition-transform duration-300 ${
                  show ? "rotate-180" : ""
                }`}
              />
            </div>
          </div>
          <div
            className={`transition-[max-height] duration-500 ease-in-out overflow-hidden ${
              show ? "max-h-58" : "max-h-0"
            }`}
          >
            <div className="px-5 py-4 space-y-4">
              {stats && (
                <div className=" text-sm text-start">
                  <p className="text-slate-700 font-semibold text-base">
                    CPU Cores: {stats.cpu.cores}
                  </p>
                  <p className="text-slate-700 font-semibold text-base">
                    Upload Speed: {networkSpeed} MB/s
                  </p>
                </div>
              )}
              {total > 0 && (
                <>
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col text-start">
                      <p className="text-slate-700 font-semibold text-base">
                        {uplaoded} / {total} Images
                      </p>
                      <p className="text-slate-700 font-semibold text-base">
                        Duplicate Images: {duplicate}
                      </p>
                      <p className="text-red-600 font-semibold text-base">
                        Failed Images: {failed}
                      </p>
                    </div>
                    {uplaoded + duplicate !== total && (
                      <button
                        className="text-red-600 font-semibold hover:text-red-700 transition-colors"
                        onClick={handleCancelUpload}
                      >
                        Cancel All
                      </button>
                    )}
                  </div>
                  <div className="relative w-full h-3 bg-gray-200 rounded-full border border-slate-300 overflow-hidden">
                    <div
                      className="bg-blue h-4 transition-all duration-500"
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                </>
              )}
              {videoTotal > 0 && (
                <>
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col text-start">
                      <p className="text-slate-700 font-semibold text-base">
                        {videoUploaded} / {videoTotal} Videos
                      </p>
                      <p className="text-slate-700 font-semibold text-base">
                        Duplicate Videos: {videoDuplicate}
                      </p>
                      <p className="text-red-600 font-semibold text-base">
                        Failed Videos: {videoFailed}
                      </p>
                    </div>
                    {videoUploaded + videoDuplicate !== videoTotal && (
                      <button
                        className="text-red-600 font-semibold hover:text-red-700 transition-colors"
                        onClick={handleCancelVideoUpload}
                      >
                        Cancel All
                      </button>
                    )}
                  </div>
                  <div className="relative w-full h-3 bg-gray-200 rounded-full border border-slate-300 overflow-hidden">
                    <div
                      className="bg-blue h-4 transition-all duration-500"
                      style={{ width: `${videoprogressPercentage}%` }}
                    ></div>
                  </div>
                </>
              )}
              {error && (
                <p className="text-red-600 font-medium text-sm">{error}</p>
              )}
              {(videoTotal > 0 &&
                videoUploaded + videoDuplicate === videoTotal) ||
                (total > 0 && uplaoded + duplicate === total && (
                  <div>
                    <p className="text-green-600 font-semibold text-base">
                      Upload successfully!
                    </p>
                  </div>
                ))}
              <p className="text-xs text-blueHover">
                Uploading large Images works best with 8 or more CPU
                cores and a stable broadband connection.
              </p>{" "}
            </div>
          </div>
        </div>
      )}

      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        open={opensnak}
        onClose={handleClosesnak}
        autoHideDuration={6000}
      >
        <Alert
          severity="success"
          variant="filled"
          sx={{ width: "100%" }}
          onClose={handleClosesnak}
        >
          <p className="text-white font-semibold text-base">
            Upload Successfully!
          </p>
        </Alert>
      </Snackbar>
    </>
  );
}

export default PortfolioLayout;
