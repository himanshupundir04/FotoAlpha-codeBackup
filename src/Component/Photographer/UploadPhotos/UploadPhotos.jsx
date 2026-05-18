import React, { useContext, useEffect, useState, useCallback, useRef, useMemo } from "react";
import axios from "axios";
import { CircularProgress, LinearProgress, Stepper, Step, StepLabel } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import ImageIcon from "@mui/icons-material/Image";
import VideocamIcon from "@mui/icons-material/Videocam";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import MoreVert from "@mui/icons-material/MoreVert";
import Select from "react-select";
import Slider from "react-slick";
import { toast } from "react-toastify";
import { showConfirmDialog } from "../../../services/confirmDialog";
import { PortfolioContext } from "../Context/PortfolioContext";
import { UploadVideoContext } from "../Context/UploadVideoContext";
import { desktopUploadService } from "../../../services/desktopUploadService";
import { formatFileSize } from "../../Common/utils";
import demo from "../../image/demo.jpg";

const baseURL = import.meta.env.VITE_BASE_URL;

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "heic", "webp", "gif", "bmp", "tiff", "tif", "raw", "cr2", "nef", "arw"];
const VIDEO_EXTENSIONS = ["mp4", "mov", "avi", "mkv", "webm", "wmv", "flv", "m4v"];
const SUPPORTED_FORMATS = ["JPG", "JPEG", "PNG", "HEIC", "WebP", "MP4", "MOV", "AVI"];
const BATCH_SIZE = 8;
const QUEUE_ITEM_HEIGHT = 56;
const OVERSCAN = 10;

const STEPS = [
  { label: "Select Event", description: "Choose an event" },
  { label: "Select Category", description: "Choose a subcategory" },
  { label: "Upload Media", description: "Add your photos or videos" },
];

function getFileExtension(name) {
  return (name || "").split(".").pop()?.toLowerCase() || "";
}

function isImageFile(name) {
  return IMAGE_EXTENSIONS.includes(getFileExtension(name));
}

function isVideoFile(name) {
  return VIDEO_EXTENSIONS.includes(getFileExtension(name));
}

function getFileTypeLabel(name) {
  if (isImageFile(name)) return "image";
  if (isVideoFile(name)) return "video";
  return "unknown";
}

function matchesMediaTypeFilter(name, filter) {
  if (filter === "photos") return isImageFile(name);
  if (filter === "videos") return isVideoFile(name);
  return true;
}

export default function UploadPhotos() {
  const {
    eventId,
    setEventId,
    subId,
    setSubId,
    setEventname,
    setCategoryname,
    eventsid,
    subeventsid,
    status,
  } = useContext(PortfolioContext);

  const {
    videoStatus,
    setStepEventid,
    setStepSubeventid,
  } = useContext(UploadVideoContext);

  const fileInputRef = useRef(null);
  const pipelineRef = useRef({ pending: [], running: false, paused: false, aborted: false });
  const queueScrollRef = useRef(null);

  const [events, setEvents] = useState([]);
  const [eventLoading, setEventLoading] = useState(false);
  const [subCategories, setSubCategories] = useState([]);
  const [subCategoryLoading, setSubCategoryLoading] = useState(false);

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [mediaType, setMediaType] = useState("photos");

  const [uploadQueue, setUploadQueue] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const activeStep = selectedEvent && selectedSubCategory ? (isProcessing || uploadQueue.length > 0 ? 2 : 1) : 0;

  const isUploading = status === "loading" || videoStatus === "loading";

  const eventOptions = events.map((cat) => ({ label: cat.name, value: cat._id }));

  const subCategoryOptions = subCategories.map((slot) => ({
    label: slot.eventSubCategory?.name || "",
    value: slot.eventSubCategory?.id || "",
  }));

  const fetchEvents = useCallback(async () => {
    setEventLoading(true);
    try {
      const response = await axios.get(`${baseURL}/events/all-events`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "ngrok-skip-browser-warning": "69420",
        },
      });
      setEvents(response.data.events);
      window.electronAPI?.setStore("uplaodEvents", response.data.events);
    } catch {
      const cached = await window.electronAPI?.getStore("uplaodEvents");
      if (cached) setEvents(cached);
    } finally {
      setEventLoading(false);
    }
  }, []);

  const fetchSubCategories = useCallback(async (evtId) => {
    if (!evtId) return;
    setSubCategoryLoading(true);
    try {
      const response = await axios.get(`${baseURL}/events/${evtId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "ngrok-skip-browser-warning": "69420",
        },
      });
      setSubCategories(response.data.event.timeSlots || []);
      window.electronAPI?.setStore("uplaodSubCate", response.data.event.timeSlots);
    } catch {
      const cached = await window.electronAPI?.getStore("uplaodSubCate");
      if (cached) setSubCategories(cached);
    } finally {
      setSubCategoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    const loadPersistedQueue = async () => {
      const pending = await desktopUploadService.getPendingUploads();
      setUploadQueue(pending);
    };
    loadPersistedQueue();

    const unsubProgress = desktopUploadService.onProgress(([data]) => {
      setUploadQueue((prev) =>
        prev.map((item) =>
          item.fileId === data.fileId
            ? { ...item, uploadedChunks: data.uploadedChunks, totalChunks: data.totalChunks, bytesUploaded: data.bytesUploaded, status: data.status || "uploading" }
            : item
        )
      );
    });

    const unsubComplete = desktopUploadService.onComplete(([data]) => {
      setUploadQueue((prev) =>
        prev.map((item) =>
          item.fileId === data.fileId ? { ...item, status: "completed" } : item
        )
      );
      setTimeout(() => {
        setUploadQueue((prev) => prev.filter((item) => item.fileId !== data.fileId));
      }, 3000);
    });

    const unsubError = desktopUploadService.onError(([data]) => {
      setUploadQueue((prev) =>
        prev.map((item) =>
          item.fileId === data.fileId ? { ...item, status: "failed", retryCount: (item.retryCount || 0) + 1 } : item
        )
      );
    });

    return () => {
      unsubProgress();
      unsubComplete();
      unsubError();
    };
  }, []);

  const handleEventChange = (option) => {
    setSelectedEvent(option);
    setEventId(option);
    setStepEventid(option);
    setEventname(option?.label || "");
    setSelectedSubCategory(null);
    setSubId(null);
    setSubCategories([]);
    if (option?.value) fetchSubCategories(option.value);
  };

  const handleSubCategoryChange = (option) => {
    setSelectedSubCategory(option);
    setSubId(option);
    setStepSubeventid(option);
    setCategoryname(option?.label || "");
  };

  const handleMediaTypeToggle = (type) => {
    if (isUploading) return;
    setMediaType(type);
  };

  const resolveUploadIds = useCallback(() => {
    const evId = typeof eventId === "object" ? eventId?.value : (eventId || eventsid);
    const sId = typeof subId === "object" ? subId?.value : (subId || subeventsid);
    return { eventId: evId, subeventId: sId };
  }, [eventId, subId, eventsid, subeventsid]);

  const enqueueFiles = useCallback((filePaths) => {
    if (!selectedEvent || !selectedSubCategory) {
      toast.error("Please select an event and subcategory first.");
      return;
    }

    const filtered = filePaths.filter((f) => {
      const name = typeof f === "string" ? f.split(/[\\/]/).pop() : (f.name || "");
      return matchesMediaTypeFilter(name, mediaType);
    });

    if (filtered.length === 0) {
      toast.info(`No ${mediaType === "photos" ? "image" : "video"} files found.`);
      return;
    }

    if (filtered.length < filePaths.length) {
      toast.info(`${filePaths.length - filtered.length} file(s) filtered out by media type.`);
    }

    const entries = filtered.map((fp) => {
      const path = typeof fp === "string" ? fp : (fp.path || fp.name);
      const name = typeof fp === "string" ? fp.split(/[\\/]/).pop() : (fp.name || "");
      const size = typeof fp === "object" ? fp.size : 0;
      return { path, name, size, type: getFileTypeLabel(name) };
    });

    pipelineRef.current.pending.push(...entries);
    if (!pipelineRef.current.running) {
      processPipeline();
    } else {
      toast.success(`${entries.length} file(s) added to queue.`);
    }
  }, [selectedEvent, selectedSubCategory, mediaType]);

  const processPipeline = useCallback(async () => {
    const pipe = pipelineRef.current;
    if (pipe.running || pipe.aborted) return;
    pipe.running = true;
    pipe.paused = false;
    setIsProcessing(true);
    setIsPaused(false);

    const { eventId: evId, subeventId: sId } = resolveUploadIds();

    const processBatch = async () => {
      while (pipe.pending.length > 0 && !pipe.aborted && !pipe.paused) {
        const batch = pipe.pending.splice(0, BATCH_SIZE);

        const results = await Promise.allSettled(
          batch.map(async (entry) => {
            const queueId = `proc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
            setUploadQueue((prev) => [...prev, {
              fileId: queueId, fileName: entry.name, fileType: entry.type,
              fileSize: entry.size, status: "processing", uploadedChunks: 0, totalChunks: 0, bytesUploaded: 0,
            }]);

            const compressed = await window.electronAPI?.compressUpload(entry.path);
            if (!compressed?.success || !compressed?.outputPath) throw new Error("Compression failed");

            const svcFileId = await desktopUploadService.uploadFile({
              filePath: compressed.outputPath,
              fileName: compressed.name || entry.name,
              fileType: entry.type === "video" ? "video/mp4" : "image/webp",
              fileHash: `${entry.name}_${Date.now()}`,
              fileSize: entry.size || 0,
              eventId: evId,
              subeventId: sId,
            });

            setUploadQueue((prev) => prev.map((q) =>
              q.fileId === queueId ? { ...q, fileId: svcFileId || queueId, status: "queued" } : q
            ));
          })
        );

        const failed = results.filter((r) => r.status === "rejected").length;
        if (failed > 0) {
          setUploadQueue((prev) =>
            prev.map((q) => q.status === "processing" ? { ...q, status: "failed" } : q)
          );
        }
      }

      pipe.running = false;
      setIsProcessing(false);
      if (!pipe.aborted && pipe.pending.length === 0 && pipe.paused) {
        setIsPaused(false);
        pipe.paused = false;
      }
    };

    await processBatch();
  }, [resolveUploadIds]);

  const handlePauseResume = useCallback(() => {
    const pipe = pipelineRef.current;
    if (pipe.paused) {
      pipe.paused = false;
      setIsPaused(false);
      processPipeline();
      toast.success("Upload resumed.");
    } else {
      pipe.paused = true;
      setIsPaused(true);
      toast.info("Upload paused. Current batch will finish.");
    }
  }, [processPipeline]);

  const handleStopQueue = useCallback(() => {
    showConfirmDialog({
      title: "Stop Upload?",
      description: "This will cancel all queued and in-progress uploads. Already completed files will not be affected.",
      confirmText: "Yes, stop it!",
      cancelText: "Go back",
      variant: "danger",
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      const pipe = pipelineRef.current;
      pipe.aborted = true;
      pipe.paused = false;
      pipe.pending = [];
      setIsPaused(false);
      setIsProcessing(false);
      await desktopUploadService.cancelAll();
      setUploadQueue([]);
      toast.success("All uploads stopped.");
    });
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    const dt = e.dataTransfer;
    if (!dt) return;

    const entries = [];
    for (let i = 0; i < dt.items.length; i++) {
      const entry = dt.items[i]?.webkitGetAsEntry?.();
      if (entry) entries.push(entry);
    }

    const filePaths = [];
    const folderPaths = [];

    const traverseEntry = (entry) => {
      return new Promise((resolve) => {
        if (entry.isFile) {
          entry.file((file) => {
            filePaths.push({ path: file.path || entry.fullPath, name: file.name, size: file.size || 0 });
            resolve();
          });
        } else if (entry.isDirectory) {
          folderPaths.push(entry.fullPath);
          const reader = entry.createReader();
          const readAll = () => {
            reader.readEntries((childEntries) => {
              if (childEntries.length === 0) { resolve(); return; }
              Promise.all(childEntries.map(traverseEntry)).then(readAll);
            });
          };
          readAll();
        } else {
          resolve();
        }
      });
    };

    await Promise.all(entries.map(traverseEntry));

    if (folderPaths.length > 0) {
      const folderPath = folderPaths[0];
      await scanAndEnqueueFolder(folderPath);
    }

    if (filePaths.length > 0) {
      enqueueFiles(filePaths);
    }
  };

  const scanFolderRecursive = useCallback(async (folderPath) => {
    const collected = [];
    const dirsToProcess = [folderPath];

    while (dirsToProcess.length > 0) {
      const currentDir = dirsToProcess.shift();
      const entries = await window.electronAPI?.readFolder(currentDir) || [];

      for (const entry of entries) {
        if (entry.isDirectory) {
          dirsToProcess.push(entry.path);
        } else {
          const ext = (entry.name || "").split(".").pop()?.toLowerCase() || "";
          if (mediaType === "photos"
            ? IMAGE_EXTENSIONS.includes(ext)
            : VIDEO_EXTENSIONS.includes(ext)) {
            collected.push({ path: entry.path, name: entry.name, size: 0 });
          }
        }
      }
    }

    return collected;
  }, [mediaType]);

  const scanAndEnqueueFolder = useCallback(async (folderPath) => {
    if (!selectedEvent || !selectedSubCategory) {
      toast.error("Please select an event and subcategory first.");
      return;
    }

    toast.info("Scanning folder recursively...");
    const files = await scanFolderRecursive(folderPath);

    if (files.length === 0) {
      toast.warning(`No ${mediaType === "photos" ? "image" : "video"} files found in folder or its subdirectories.`);
      return;
    }

    toast.success(`Found ${files.length} ${mediaType === "photos" ? "image" : "video"} file(s). Starting upload...`);
    enqueueFiles(files);
  }, [selectedEvent, selectedSubCategory, mediaType, scanFolderRecursive, enqueueFiles]);

  const handleSelectFolder = async () => {
    const selected = await window.electronAPI?.selectFolder();
    if (!selected) return;
    await scanAndEnqueueFolder(selected);
  };

  const handleChooseFiles = () => {
    if (!selectedEvent || !selectedSubCategory) {
      toast.error("Please select an event and subcategory first.");
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileInputChange = async (e) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const filePaths = Array.from(fileList).map((f) => ({
      path: f.path || f.name,
      name: f.name,
      size: f.size || 0,
    }));

    enqueueFiles(filePaths);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleStartUpload = async () => {
    if (!selectedEvent || !selectedSubCategory) {
      toast.error("Please select an event and subcategory first.");
      return;
    }
    if (isUploading) {
      toast.error("An upload is already in progress.");
      return;
    }

    const localQueue = uploadQueue.filter((item) =>
      item.fileId?.startsWith("local_") && item.status === "queued"
    );

    if (localQueue.length === 0) {
      toast.info("No files queued to upload. Drag-and-drop files or select a folder.");
      return;
    }

    setUploadStarted(true);

    const resolvedEventId = typeof eventId === "object" ? eventId?.value : (eventId || eventsid);
    const resolvedSubeventId = typeof subId === "object" ? subId?.value : (subId || subeventsid);

    for (const item of localQueue) {
      try {
        const compressed = await window.electronAPI?.compressUpload(item.filePath);
        if (compressed?.success && compressed?.outputPath) {
          await desktopUploadService.uploadFile({
            filePath: compressed.outputPath,
            fileName: compressed.name || item.fileName,
            fileType: item.fileType === "video" ? "video/mp4" : "image/webp",
            fileHash: `${item.fileName}_${Date.now()}`,
            fileSize: item.fileSize || 0,
            eventId: resolvedEventId,
            subeventId: resolvedSubeventId,
          });

          setUploadQueue((prev) => prev.filter((q) => q.fileId !== item.fileId));
        } else {
          setUploadQueue((prev) =>
            prev.map((q) => q.fileId === item.fileId ? { ...q, status: "failed" } : q)
          );
        }
      } catch {
        setUploadQueue((prev) =>
          prev.map((q) => q.fileId === item.fileId ? { ...q, status: "failed" } : q)
        );
      }
    }
  };

  const handleCancelQueueItem = async (fileId) => {
    const item = uploadQueue.find((q) => q.fileId === fileId);
    if (item?.status === "processing" || item?.status === "queued") {
      setUploadQueue((prev) => prev.filter((q) => q.fileId !== fileId));
    } else {
      await desktopUploadService.cancelUpload(fileId);
    }
  };

  const handleClearAll = async () => {
    pipelineRef.current.pending = [];
    await desktopUploadService.cancelAll();
    setUploadQueue([]);
  };

  const getQueueProgress = (item) => {
    if (!item.totalChunks || item.totalChunks === 0) return 0;
    return Math.round((item.uploadedChunks / item.totalChunks) * 100);
  };

  const getQueueProgressColor = (item) => {
    if (item.status === "failed" || item.status === "failed_permanent") return "error";
    if (item.status === "uploading") return "secondary";
    if (item.status === "completed") return "success";
    return "primary";
  };

  const getQueueStatusLabel = (item) => {
    if (item.status === "failed" || item.status === "failed_permanent") return "Failed";
    if (item.status === "completed") return "Done";
    if (item.status === "processing") return "Processing...";
    if (item.status === "uploading") return `${getQueueProgress(item)}%`;
    return "Queued";
  };

  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(350);

  const visibleRange = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / QUEUE_ITEM_HEIGHT) - OVERSCAN);
    const visible = Math.ceil(containerHeight / QUEUE_ITEM_HEIGHT);
    const end = Math.min(uploadQueue.length, start + visible + OVERSCAN * 2);
    return { start, end, paddingTop: start * QUEUE_ITEM_HEIGHT, paddingBottom: (uploadQueue.length - end) * QUEUE_ITEM_HEIGHT };
  }, [scrollTop, containerHeight, uploadQueue.length]);

  const visibleItems = useMemo(
    () => uploadQueue.slice(visibleRange.start, visibleRange.end),
    [uploadQueue, visibleRange]
  );

  const queueHasItems = uploadQueue.length > 0;

  const sliderSettings = {
    dots: false, infinite: false, speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    centerMode: false,
    centerPadding: "0px",
    responsive: [
      { breakpoint: 1280, settings: { slidesToShow: 2, slidesToScroll: 1 } },
      { breakpoint: 768, settings: { slidesToShow: 1, slidesToScroll: 1, dots: true } },
    ],
  };

  return (
    <>
      <style>{`
        .slick-prev:before, .slick-next:before { color: #14558e !important; font-size: 30px; }
        .slick-prev { left: -45px; z-index: 9; }
        @media only screen and (min-width: 768px) {
          .slick-track { display: inline-flex; gap: 10px; }
        }
      `}</style>

      <div className="min-h-full">
        {/* ---- Header ---- */}
        <div className="mb-3">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Upload Media</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Select an event, choose a category, and upload photos or videos in a few clicks.
          </p>
        </div>

        {/* ---- Step Indicator ---- */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 mb-4">
          <Stepper activeStep={activeStep} alternativeLabel>
            {STEPS.map((step, idx) => (
              <Step key={idx} completed={idx < activeStep}>
                <StepLabel
                  StepIconProps={{
                    sx: {
                      color: idx <= activeStep ? (idx === 0 ? "#06b6d4" : "#8b5cf6") : "#d1d5db",
                      "&.Mui-completed": { color: idx === 0 ? "#06b6d4" : "#8b5cf6" },
                      "&.Mui-active": { color: idx === 0 ? "#06b6d4" : "#8b5cf6" },
                    },
                  }}
                >
                  <span className="text-xs text-slate-500 dark:text-slate-400">{step.description}</span>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </div>

        {/* ---- Two Column Layout ---- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* ============ LEFT PANEL — Upload Form ============ */}
          <div className="lg:col-span-2 space-y-3">
            {/* Selection Row */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-3">
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[180px]">
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-0.5 uppercase tracking-wide">Event</label>
                  {eventLoading ? (
                    <div className="flex items-center h-[36px]"><CircularProgress size={16} /></div>
                  ) : (
                    <Select options={eventOptions} value={eventOptions.find((o) => o.value === selectedEvent?.value) || selectedEvent}
                      onChange={handleEventChange} placeholder={isUploading ? "Uploading in progress..." : "Choose Event"}
                      isDisabled={isUploading} className="capitalize"
                      styles={{ control: (base) => ({ ...base, borderRadius: "0.5rem", borderColor: "#e2e8f0", minHeight: "36px" }) }} />
                  )}
                </div>
                <div className="flex-1 min-w-[180px]">
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-0.5 uppercase tracking-wide">Sub Category</label>
                  {subCategoryLoading ? (
                    <div className="flex items-center h-[36px]"><CircularProgress size={16} /></div>
                  ) : (
                    <Select options={subCategoryOptions} value={subCategoryOptions.find((o) => o.value === selectedSubCategory?.value) || selectedSubCategory}
                      onChange={handleSubCategoryChange} placeholder="Choose Sub Category"
                      isDisabled={!selectedEvent || isUploading} className="capitalize"
                      styles={{ control: (base) => ({ ...base, borderRadius: "0.5rem", borderColor: "#e2e8f0", minHeight: "36px" }) }} />
                  )}
                </div>
                <div className="flex-shrink-0">
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-0.5 uppercase tracking-wide">Media Type</label>
                  <div className="flex bg-slate-100 dark:bg-slate-700 rounded-md p-0.5">
                    <button onClick={() => handleMediaTypeToggle("photos")} disabled={isUploading}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-all ${mediaType === "photos" ? "bg-cyan-500 text-white shadow-sm" : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"} ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}>
                      <ImageIcon sx={{ fontSize: 14 }} /> Photos
                    </button>
                    <button onClick={() => handleMediaTypeToggle("videos")} disabled={isUploading}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-all ${mediaType === "videos" ? "bg-purple-500 text-white shadow-sm" : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"} ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}>
                      <VideocamIcon sx={{ fontSize: 14 }} /> Videos
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Drag & Drop Upload Zone */}
            <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
              className={`bg-white dark:bg-slate-800 rounded-lg shadow-sm border-2 border-dashed p-6 text-center transition-all duration-200 cursor-pointer ${dragOver ? "border-cyan-400 bg-cyan-50 dark:bg-cyan-500/10 scale-[1.01]" : "border-slate-300 dark:border-slate-600"}`}>
              <div className="flex flex-col items-center gap-2">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${dragOver ? "bg-cyan-100 dark:bg-cyan-500/20" : "bg-slate-100 dark:bg-slate-700"}`}>
                  {dragOver ? <DragIndicatorIcon sx={{ fontSize: 24, color: "#06b6d4" }} /> : <CloudUploadIcon sx={{ fontSize: 24, color: "#06b6d4" }} />}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-800 dark:text-white">Drop files here</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Drag & drop your {mediaType === "photos" ? "photos" : "videos"} here to start uploading
                  </p>
                </div>
                <div className="flex gap-2 mt-1">
                  <button onClick={(e) => { e.stopPropagation(); handleChooseFiles(); }}
                    className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-md font-medium text-xs transition-colors shadow-sm">Choose Files</button>
                  <button onClick={(e) => { e.stopPropagation(); handleSelectFolder(); }}
                    className="px-4 py-2 border border-slate-300 dark:border-slate-500 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-md font-medium text-xs transition-colors">Select Folder</button>
                  <input ref={fileInputRef} type="file" multiple className="hidden"
                    accept={mediaType === "photos" ? "image/*" : "video/*"} onChange={handleFileInputChange} />
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">You can also drag and drop a folder to upload multiple files.</p>
              </div>
            </div>

            {/* Supported Formats Bar */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-3">
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="font-medium text-slate-600 dark:text-slate-300">Supported formats</span>
                <div className="flex flex-wrap gap-1">
                  {SUPPORTED_FORMATS.map((fmt) => (
                    <span key={fmt} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300">{fmt}</span>
                  ))}
                </div>
                <span className="text-slate-300 dark:text-slate-600 mx-0.5">|</span><span>Bulk upload supported</span>
                <span className="text-slate-300 dark:text-slate-600 mx-0.5">|</span><span>Faster uploads</span>
                <span className="text-slate-300 dark:text-slate-600 mx-0.5">|</span><span>Preserve original quality</span>
              </div>
            </div>
          </div>

          {/* ============ RIGHT PANEL — Upload Queue ============ */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden sticky top-20">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-slate-800 dark:text-white text-xs">
                  Upload Queue {queueHasItems ? `(${uploadQueue.length})` : ""}
                  {isProcessing && !isPaused && <span className="ml-1 text-cyan-500">●</span>}
                  {isPaused && <span className="ml-1 text-yellow-500">⏸</span>}
                </h3>
                {queueHasItems && (
                  <button onClick={handleClearAll} className="text-[11px] text-red-500 hover:text-red-600 font-medium transition-colors">Clear All</button>
                )}
              </div>

              <div className="max-h-[350px] overflow-y-auto"
                ref={(el) => { queueScrollRef.current = el; if (el) setContainerHeight(el.clientHeight); }}
                onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}>
                {!queueHasItems ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <CloudUploadIcon sx={{ fontSize: 32, color: "#94a3b8" }} />
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">No files queued</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Drag & drop files or choose a folder</p>
                  </div>
                ) : (
                  <div style={{ height: uploadQueue.length * QUEUE_ITEM_HEIGHT, position: "relative" }}>
                    <div style={{ position: "absolute", top: visibleRange.paddingTop, width: "100%" }}>
                      {visibleItems.map((item) => (
                        <div key={item.fileId} className="px-3 flex items-center gap-2 border-b border-slate-50 dark:border-slate-750"
                          style={{ height: QUEUE_ITEM_HEIGHT }}>
                          <div className={`w-8 h-8 rounded flex-shrink-0 flex items-center justify-center ${item.fileType === "video" ? "bg-purple-100 dark:bg-purple-500/10" : "bg-cyan-100 dark:bg-cyan-500/10"}`}>
                            {item.fileType === "video" ? <VideocamIcon sx={{ fontSize: 14, color: "#8b5cf6" }} /> : <ImageIcon sx={{ fontSize: 14, color: "#06b6d4" }} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">{item.fileName}</p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500">{item.fileSize > 0 ? formatFileSize(item.fileSize) : "—"}</p>
                            {(item.status === "uploading" || item.status === "processing") && (
                              <div className="mt-1"><LinearProgress variant={item.status === "processing" ? "indeterminate" : "determinate"} value={getQueueProgress(item)} color={getQueueProgressColor(item)} sx={{ height: 3, borderRadius: 1.5 }} /></div>
                            )}
                            <div className="flex items-center gap-0.5 mt-0.5">
                              {(item.status === "completed" || item.status === "failed" || item.status === "failed_permanent") &&
                                (item.status === "completed" ? <CheckCircleOutlineIcon sx={{ fontSize: 12, color: "#22c55e" }} /> : <ErrorOutlineIcon sx={{ fontSize: 12, color: "#ef4444" }} />)}
                              <span className={`text-[11px] font-medium ${item.status === "failed" || item.status === "failed_permanent" ? "text-red-500" : item.status === "completed" ? "text-green-500" : item.status === "uploading" ? "text-purple-500" : item.status === "processing" ? "text-cyan-500" : "text-slate-400"}`}>
                                {getQueueStatusLabel(item)}
                              </span>
                            </div>
                          </div>
                          {(item.status === "queued" || item.status === "failed" || item.status === "failed_permanent") && (
                            <button onClick={() => handleCancelQueueItem(item.fileId)} className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0" title="Remove">
                              <CloseRoundedIcon sx={{ fontSize: 16 }} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <div style={{ position: "absolute", top: visibleRange.paddingTop + visibleItems.length * QUEUE_ITEM_HEIGHT, width: "100%", height: visibleRange.paddingBottom }} />
                  </div>
                )}
              </div>

              {/* Queue Controls */}
              {queueHasItems && (
                <div className="flex items-center gap-2 px-4 py-2 border-t border-slate-200 dark:border-slate-700">
                  <button onClick={handlePauseResume}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${isPaused ? "bg-cyan-500 text-white hover:bg-cyan-600" : "bg-yellow-500 text-white hover:bg-yellow-600"}`}>
                    {isPaused ? <><PlayArrowIcon sx={{ fontSize: 14 }} /> Resume</> : <><PauseIcon sx={{ fontSize: 14 }} /> Pause</>}
                  </button>
                  <button onClick={handleStopQueue}
                    className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium bg-red-500 text-white hover:bg-red-600 transition-colors">
                    <StopIcon sx={{ fontSize: 14 }} /> Stop
                  </button>
                  {pipelineRef.current.pending.length > 0 && (
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 ml-auto">{pipelineRef.current.pending.length} pending</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ============ RECENT EVENTS ============ */}
        {eventLoading ? (
          <div className="flex justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <CircularProgress size={32} />
              <p className="text-xs text-slate-400 dark:text-slate-500">Loading your events...</p>
            </div>
          </div>
        ) : events.length > 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            {/* ---- Section Header ---- */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Recent Events</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Continue where you left off</p>
              </div>
              <button
                onClick={() => { window.location.hash = "#/photographer/events"; }}
                className="text-xs font-medium text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors flex items-center gap-1 flex-shrink-0"
              >
                View All Events
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>

            {/* ---- 1 Event: Featured Card ---- */}
            {events.length === 1 && (
              <div className="flex flex-col md:flex-row bg-slate-50 dark:bg-slate-700/50 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-600 hover:shadow-md transition-shadow duration-200">
                <div className="md:w-[300px] h-48 md:h-auto flex-shrink-0 relative overflow-hidden bg-slate-100 dark:bg-slate-600">
                  <img
                    src={events[0]?.firstPhotoSignedUrl || demo}
                    alt={events[0]?.name}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-3 left-3 text-[11px] px-2.5 py-1 bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 rounded-full font-medium shadow-sm backdrop-blur-sm">
                    {events[0]?.eventCategoryId?.name || "Event"}
                  </span>
                </div>
                <div className="flex-1 p-5 flex flex-col justify-center min-w-0">
                  <h3 className="text-base font-bold text-slate-800 dark:text-white capitalize truncate">{events[0]?.name}</h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2.5 text-xs text-slate-500 dark:text-slate-400">
                    {events[0]?.timeSlots?.[0]?.date && (
                      <span className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        {new Date(events[0].timeSlots[0].date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      {events[0]?.photoCount || 0} photo{events[0]?.photoCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                <div className="md:w-44 p-5 flex md:flex-col items-center md:items-end justify-between md:justify-center gap-3 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-600">
                  <button
                    onClick={() => { window.location.hash = `#/photographer/event/${events[0]._id}`; }}
                    className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 active:bg-cyan-700 text-white rounded-lg text-xs font-medium transition-colors shadow-sm whitespace-nowrap"
                  >
                    Manage Event
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); }}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-600"
                    title="More options"
                  >
                    <MoreVert sx={{ fontSize: 20 }} />
                  </button>
                </div>
              </div>
            )}

            {/* ---- 2-3 Events: Responsive Grid ---- */}
            {events.length >= 2 && events.length <= 3 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {events.map((event) => (
                  <div
                    key={event._id}
                    className="group bg-white dark:bg-slate-700 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-600 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col"
                    onClick={() => { window.location.hash = `#/photographer/event/${event._id}`; }}
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-600">
                      <img
                        src={event?.firstPhotoSignedUrl || demo}
                        alt={event?.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <span className="absolute top-3 left-3 text-[11px] px-2.5 py-1 bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 rounded-full font-medium shadow-sm backdrop-blur-sm">
                        {event?.eventCategoryId?.name || "Event"}
                      </span>
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white capitalize truncate">{event?.name}</h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                        {event?.timeSlots?.[0]?.date && (
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            {new Date(event.timeSlots[0].date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          {event?.photoCount || 0} photo{event?.photoCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-auto pt-3.5 border-t border-slate-100 dark:border-slate-600">
                        <span className="text-xs font-medium text-cyan-600 dark:text-cyan-400 group-hover:text-cyan-700 dark:group-hover:text-cyan-300 transition-colors">
                          Manage Event →
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); }}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-600"
                          title="More options"
                        >
                          <MoreVert sx={{ fontSize: 18 }} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ---- >3 Events: Carousel ---- */}
            {events.length > 3 && (
              <div className="slider-container w-full lg:w-[95%] mx-auto">
                <Slider {...sliderSettings}>
                  {events.map((event) => (
                    <div key={event._id} className="px-2 h-full">
                      <div
                        className="group bg-white dark:bg-slate-700 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-600 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer h-full flex flex-col"
                        onClick={() => { window.location.hash = `#/photographer/event/${event._id}`; }}
                      >
                        <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-600">
                          <img
                            src={event?.firstPhotoSignedUrl || demo}
                            alt={event?.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          <span className="absolute top-3 left-3 text-[11px] px-2.5 py-1 bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 rounded-full font-medium shadow-sm backdrop-blur-sm">
                            {event?.eventCategoryId?.name || "Event"}
                          </span>
                        </div>
                        <div className="p-4 flex flex-col flex-1">
                          <h3 className="text-sm font-bold text-slate-800 dark:text-white capitalize truncate">{event?.name}</h3>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                            {event?.timeSlots?.[0]?.date && (
                              <span className="flex items-center gap-1">
                                <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                {new Date(event.timeSlots[0].date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                              {event?.photoCount || 0} photo{event?.photoCount !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-auto pt-3.5 border-t border-slate-100 dark:border-slate-600">
                            <span className="text-xs font-medium text-cyan-600 dark:text-cyan-400 group-hover:text-cyan-700 dark:group-hover:text-cyan-300 transition-colors">
                              Manage Event →
                            </span>
                            <button
                              onClick={(e) => { e.stopPropagation(); }}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-600"
                              title="More options"
                            >
                              <MoreVert sx={{ fontSize: 18 }} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </Slider>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </>
  );
}
