import { useContext, useEffect, useRef } from "react";
import axios from "axios";
import { UploadVideoContext } from "./UploadVideoContext";

const baseURL = process.env.REACT_APP_BASE_URL;
const MAX_CONCURRENT_UPLOADS = 2;

export const useVideoUploadWatcher = ({ folderPath }) => {
  const {
    videos,
    setVideos,
    setVideoStatus,
    updateUploadVideoState,
    setVideoTotal,
    setVideoUploaded,
    setVideoFailed,
    setVideoDuplicate,
    eventid,
    subeventid,
    stepeventid,
    stepsubeventid,
  } = useContext(UploadVideoContext);

  // console.log("eventid", eventid)
  // console.log("subeventid", subeventid)
  // console.log("stepeventid", stepeventid)
  // console.log("stepsubeventid", stepsubeventid)
  
   const resolvedEventId =
    eventid?.value || eventid || stepeventid?.value || stepeventid || null;

  const resolvedSubEventId =
    stepsubeventid?.value || stepsubeventid || subeventid?.value || subeventid || null;


  const eventIdRef = useRef(null);
  const subEventIdRef = useRef(null);

  const uploadQueueRef = useRef([]);
  const activeUploadsRef = useRef(0);
  const processedRef = useRef(new Set());

  /* ================= IDS ================= */

  useEffect(() => {
    eventIdRef.current = resolvedEventId;
    subEventIdRef.current = resolvedSubEventId;
  }, [resolvedEventId, resolvedSubEventId]);

  /* ================= TOTAL ================= */

  useEffect(() => {
    if (!folderPath) return;

    processedRef.current.clear();
    setVideoTotal(0);
    setVideoUploaded(0);
    setVideoFailed(0);
    setVideoDuplicate(0);

    const h = (c) => setVideoTotal(c);
    window.electronAPI.onTotalVideoCount(h);
    return () => window.electronAPI.offTotalVideoCount(h);
  }, [folderPath]);

  /* ================= COUNTERS ================= */

  useEffect(() => {
    setVideoUploaded(videos.filter((v) => v.status === "Completed").length);
    setVideoFailed(videos.filter((v) => v.status === "Failed").length);
    setVideoDuplicate(videos.filter((v) => v.status === "Duplicate").length);
  }, [videos]);

  /* ================= START ================= */

  useEffect(() => {
    if (!folderPath || !resolvedEventId || !resolvedSubEventId) return;

    (async () => {
      setVideoStatus("loading");
      updateUploadVideoState({ isUploading: true });

      const list = await window.electronAPI.readVideoFolder(folderPath);

      const prepared = list.map((v) => ({
        id: v.path,
        originalPath: v.path,
        name: v.name,
        status: "Pending",
        progress: 0,
      }));

      setVideos(prepared);
      await window.electronAPI.compressVideosParallel(
        prepared.map((v) => v.originalPath),
      );
    })();
  }, [folderPath, resolvedEventId, resolvedSubEventId]);

  /* ================= UPLOAD QUEUE ================= */

  const runNextUpload = async () => {
    // if (uploadQueueRef.current.length === 0) return;

    // const file = uploadQueueRef.current.shift();
    // activeUploadsRef.current++;

    // try {
    //   await uploadSingle(file);
    // } finally {
    //   activeUploadsRef.current--;
    //   runNextUpload();
    // }

    while (
      activeUploadsRef.current < MAX_CONCURRENT_UPLOADS &&
      uploadQueueRef.current.length > 0
    ) {
      const file = uploadQueueRef.current.shift();
      activeUploadsRef.current++;

      uploadSingle(file).finally(() => {
        activeUploadsRef.current--;
        runNextUpload();
      });
    }
  };

  /* ================= COMPRESSED EVENT ================= */

  useEffect(() => {
    const handler = (file) => {
      if (processedRef.current.has(file.path)) return;
      processedRef.current.add(file.path);

      setVideos((prev) =>
        prev.map((v) => (v.id === file.id ? { ...v, status: "Uploading" } : v)),
      );

      uploadQueueRef.current.push(file);
      runNextUpload(); // 🚀 IMMEDIATE UPLOAD
    };

    window.electronAPI.onCompressedVideo(handler);
    return () => window.electronAPI.offCompressedVideo(handler);
  }, []);

  /* ================= UPLOAD ================= */

  const uploadSingle = async (file) => {
    try {
      const signed = await axios.get(`${baseURL}/photos/getSignedUrl`, {
        params: {
          fileName: `${eventIdRef.current}/${subEventIdRef.current}/${file.name}`,
          fileType: file.type,
          hash: file.hash,
          event: eventIdRef.current,
        },
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        validateStatus: () => true,
      });

      if (signed.status === 409) return markDuplicate(file);
      if (signed.status !== 200) return markFailed(file);

      const buffer = await window.electronAPI.readFileBuffervideo(file.path);

      await axios.put(signed.data.signedUrl, buffer, {
        headers: { "Content-Type": "video/mp4" },
      });

      await axios.post(
        `${baseURL}/photos/update-photopath`,
        {
          eventId: eventIdRef.current,
          subeventId: subEventIdRef.current,
          hash: file.hash,
          size: file.size,
          file: file.name,
          url: `/${eventIdRef.current}/${subEventIdRef.current}/${file.name}`,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );

      markCompleted(file);
    } catch {
      markFailed(file);
    }
  };

  /* ================= UI ================= */

  const markCompleted = (file) =>
    setVideos((prev) =>
      prev.map((v) =>
        v.id === file.id ? { ...v, status: "Completed", progress: 100 } : v,
      ),
    );

  const markFailed = (file) =>
    setVideos((prev) =>
      prev.map((v) => (v.id === file.id ? { ...v, status: "Failed" } : v)),
    );

  const markDuplicate = (file) =>
    setVideos((prev) =>
      prev.map((v) => (v.id === file.id ? { ...v, status: "Duplicate" } : v)),
    );
};
