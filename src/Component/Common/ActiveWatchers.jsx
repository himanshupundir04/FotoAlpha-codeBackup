import React, { useCallback, useEffect, useRef, useState } from "react";
import FolderOpenIcon        from "@mui/icons-material/FolderOpen";
import CloudUploadIcon       from "@mui/icons-material/CloudUpload";
import CheckCircleIcon       from "@mui/icons-material/CheckCircle";
import ErrorIcon             from "@mui/icons-material/Error";
import ContentCopyIcon       from "@mui/icons-material/ContentCopy";
import DeleteOutlineIcon     from "@mui/icons-material/DeleteOutline";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import RefreshIcon           from "@mui/icons-material/Refresh";
import { CircularProgress, Tooltip } from "@mui/material";
import Swal from "sweetalert2";
import { bgWatcherService } from "../../services/bgWatcherService";

const POLL_INTERVAL_MS = 5000;

function WatcherCard({ watcher, onRemove, recentActivity }) {
  const [copied, setCopied] = useState(false);

  const copyPath = () => {
    navigator.clipboard.writeText(watcher.folderPath).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const lastSynced = watcher.lastSynced
    ? new Date(watcher.lastSynced * 1000).toLocaleString()
    : "Never";

  const activity = recentActivity[watcher.folderPath];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <FolderOpenIcon className="text-blue flex-shrink-0" sx={{ fontSize: 22 }} />
          <Tooltip title={watcher.folderPath}>
            <p className="text-slate-700 dark:text-white font-semibold text-sm truncate max-w-xs">
              {watcher.folderPath.split(/[\\/]/).pop() || watcher.folderPath}
            </p>
          </Tooltip>
          <button onClick={copyPath} className="text-slate-400 hover:text-blue transition-colors flex-shrink-0">
            <ContentCopyIcon sx={{ fontSize: 15 }} />
          </button>
          {copied && <span className="text-xs text-green-500">Copied!</span>}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Running badge */}
          <span
            className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
              watcher.isRunning
                ? "bg-green-100 text-green-700"
                : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300"
            }`}
          >
            <FiberManualRecordIcon
              sx={{ fontSize: 8 }}
              className={watcher.isRunning ? "text-green-500 animate-pulse" : "text-slate-400"}
            />
            {watcher.isRunning ? "Watching" : "Paused"}
          </span>

          <button
            onClick={() => onRemove(watcher.folderPath)}
            className="text-slate-400 hover:text-red-500 transition-colors"
            title="Stop and remove this watcher"
          >
            <DeleteOutlineIcon sx={{ fontSize: 20 }} />
          </button>
        </div>
      </div>

      {/* Event / Category */}
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
        <span>
          <span className="font-medium text-slate-600 dark:text-slate-300">Event:</span>{" "}
          {watcher.eventName || watcher.eventId}
        </span>
        <span>
          <span className="font-medium text-slate-600 dark:text-slate-300">Category:</span>{" "}
          {watcher.categoryName || watcher.subeventId}
        </span>
      </div>

      {/* Stats row */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2">
          <p className="text-green-600 font-bold text-lg leading-none">{watcher.totalUploaded}</p>
          <p className="text-xs text-green-600 mt-0.5">Uploaded</p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-2">
          <p className="text-yellow-600 font-bold text-lg leading-none">{watcher.totalDuplicate}</p>
          <p className="text-xs text-yellow-600 mt-0.5">Duplicate</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2">
          <p className="text-red-600 font-bold text-lg leading-none">{watcher.totalFailed}</p>
          <p className="text-xs text-red-600 mt-0.5">Failed</p>
        </div>
      </div>

      {/* Last activity */}
      {activity && (
        <div className="mt-2 flex items-center gap-1 text-xs">
          {activity.type === "uploaded" && (
            <><CheckCircleIcon sx={{ fontSize: 13 }} className="text-green-500" />
              <span className="text-green-600">Uploaded {activity.fileName}</span></>
          )}
          {activity.type === "duplicate" && (
            <><ContentCopyIcon sx={{ fontSize: 13 }} className="text-yellow-500" />
              <span className="text-yellow-600">Duplicate skipped</span></>
          )}
          {activity.type === "error" && (
            <><ErrorIcon sx={{ fontSize: 13 }} className="text-red-500" />
              <span className="text-red-600 truncate max-w-[200px]">{activity.error}</span></>
          )}
          {activity.type === "new" && (
            <><CloudUploadIcon sx={{ fontSize: 13 }} className="text-blue" />
              <span className="text-blue">Uploading {activity.fileName}…</span></>
          )}
        </div>
      )}

      <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
        Last sync: {lastSynced}
      </p>
    </div>
  );
}

export default function ActiveWatchers() {
  const [watchers, setWatchers]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [recentActivity, setRecentActivity] = useState({});
  const unsubscribers                     = useRef([]);

  const setActivity = (folderPath, payload) => {
    setRecentActivity((prev) => ({ ...prev, [folderPath]: payload }));
    setTimeout(
      () => setRecentActivity((prev) => { const n = { ...prev }; delete n[folderPath]; return n; }),
      8000
    );
  };

  const fetchList = useCallback(async () => {
    const list = await bgWatcherService.list();
    setWatchers(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchList();

    const poll = setInterval(fetchList, POLL_INTERVAL_MS);

    // Live events from background watcher
    const u1 = bgWatcherService.onFileUploaded(({ folderPath, fileName }) => {
      setActivity(folderPath, { type: "uploaded", fileName });
      fetchList();
    });
    const u2 = bgWatcherService.onNewFile(({ folderPath, fileName }) => {
      setActivity(folderPath, { type: "new", fileName });
    });
    const u3 = bgWatcherService.onDuplicate(({ folderPath }) => {
      setActivity(folderPath, { type: "duplicate" });
      fetchList();
    });
    const u4 = bgWatcherService.onError(({ folderPath, error }) => {
      setActivity(folderPath, { type: "error", error });
      fetchList();
    });
    const u5 = bgWatcherService.onStarted(() => fetchList());

    unsubscribers.current = [u1, u2, u3, u4, u5];

    return () => {
      clearInterval(poll);
      unsubscribers.current.forEach((fn) => { try { fn(); } catch {} });
    };
  }, [fetchList]);

  const handleRemove = async (folderPath) => {
    const result = await Swal.fire({
      title:             "Stop watching this folder?",
      text:              "The watcher will be removed. Photos already uploaded will remain.",
      icon:              "warning",
      showCancelButton:  true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor:  "#d33",
      confirmButtonText: "Yes, stop it",
    });

    if (result.isConfirmed) {
      await bgWatcherService.remove(folderPath);
      fetchList();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center mt-10">
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-700 dark:text-white">
            Sync Watchers
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Folders watched in the background — new photos are uploaded automatically,
            even when this window is closed.
          </p>
        </div>
        <button
          onClick={fetchList}
          className="text-slate-400 hover:text-blue transition-colors"
          title="Refresh"
        >
          <RefreshIcon />
        </button>
      </div>

      {watchers.length === 0 ? (
        <div className="text-center py-16 text-slate-400 dark:text-slate-500">
          <CloudUploadIcon sx={{ fontSize: 48 }} className="mb-3 opacity-40" />
          <p className="font-medium">No folders are being watched yet.</p>
          <p className="text-sm mt-1">
            Go to <span className="font-semibold">Upload Photos</span>, choose an event
            and select a folder — it will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {watchers.map((w) => (
            <WatcherCard
              key={w.folderPath}
              watcher={w}
              onRemove={handleRemove}
              recentActivity={recentActivity}
            />
          ))}
        </div>
      )}
    </div>
  );
}
