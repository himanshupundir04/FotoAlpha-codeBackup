import { useContext, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { PortfolioContext } from "./PortfolioContext";

const baseURL = process.env.REACT_APP_BASE_URL;
const MAX_CONCURRENT_UPLOADS = 5;

export const useImageUploadWatcher = ({ folderPath }) => {
  const {
    setTotal,
    setUploaded,
    setDuplicate,
    eventId,
    setFailed,
    subId,
    eventsid,
    subeventsid,
    setHasStarted,
    setStatus,
  } = useContext(PortfolioContext);

  const subeventId = subId?.value;

  // console.log("eventid", eventsid)
  // console.log("subeventid", subeventsid)

  
  /* ---------------- SPEED REFS ---------------- */
  const uploadStartTimeRef = useRef(null);
  // 🔥 NETWORK SPEED
  const lastBytesRef = useRef(0);
  const lastSpeedTimeRef = useRef(Date.now());
  const networkSpeedRef = useRef(0); // MB/s

  /* ---------------- QUEUE REFS ---------------- */
  const uploadedRef = useRef(0);
  const failedRef = useRef(0);
  const duplicateRef = useRef(0);
  const queueRef = useRef([]);
  const activeUploadsRef = useRef(0);
  const stoppedRef = useRef(false);

  /* ---------------- REF TO STORE LISTENER CALLBACKS ---------------- */
  // Store callbacks as refs so we can properly remove them later
  const onTotalImageCountRef = useRef(null);
  const onCompressedFileReadyRef = useRef(null);
  const onNewImageDetectedRef = useRef(null);

  /* ---------------- CLEANUP FUNCTION ---------------- */
  const cleanupListeners = useCallback(() => {
    // Remove old event listeners to prevent stale closures from interfering
    if (onTotalImageCountRef.current) {
      window.electronAPI.off("total-image-count", onTotalImageCountRef.current);
      onTotalImageCountRef.current = null;
    }
    if (onCompressedFileReadyRef.current) {
      window.electronAPI.off("compressed-file-ready", onCompressedFileReadyRef.current);
      onCompressedFileReadyRef.current = null;
    }
    if (onNewImageDetectedRef.current) {
      window.electronAPI.off("new-image-detected", onNewImageDetectedRef.current);
      onNewImageDetectedRef.current = null;
    }
    
    // Also use the removeListeners method as a fallback
    window.electronAPI.removeListeners?.();
  }, []);

  /* ---------------- EFFECT ---------------- */
  useEffect(() => {
    if (!folderPath) return;

    // Clean up any existing listeners before setting up new ones
    cleanupListeners();
    
    // Reset state for new upload
    uploadStartTimeRef.current = Date.now();
    resetState();

    setHasStarted(true);
    setStatus("loading");

    // Create callback functions and store references for cleanup
    const handleTotalImageCount = (count) => {
      setTotal(count);
    };
    
    const handleCompressedFileReady = (chunk) => {
      queueRef.current.push(...chunk);
      processQueue();
    };
    
    const handleNewImageDetected = (file) => {
      queueRef.current.push(file);
      processQueue();
    };

    // Store callbacks for cleanup
    onTotalImageCountRef.current = handleTotalImageCount;
    onCompressedFileReadyRef.current = handleCompressedFileReady;
    onNewImageDetectedRef.current = handleNewImageDetected;

    // Set up event listeners
    window.electronAPI.onTotalImageCount(handleTotalImageCount);
    window.electronAPI.onCompressedFileReady(handleCompressedFileReady);
    window.electronAPI.onNewImageDetected(handleNewImageDetected);

    window.electronAPI.watchFolder(folderPath);
    window.electronAPI.compressAndReadFolder(folderPath);

    return () => {
      // Cleanup when component unmounts or folderPath changes
      cleanupListeners();
      stopWatching();
    };
  }, [folderPath, cleanupListeners]);

  /* ---------------- QUEUE ---------------- */
  const processQueue = () => {
    while (
      activeUploadsRef.current < MAX_CONCURRENT_UPLOADS &&
      queueRef.current.length > 0 &&
      !stoppedRef.current
    ) {
      const file = queueRef.current.shift();
      activeUploadsRef.current++;

      uploadSingle(file).finally(() => {
        activeUploadsRef.current--;
        processQueue();
        checkCompletion();
      });
    }
  };

  /* ---------------- UPLOAD ---------------- */
  const uploadSingle = async (file) => {
    try {
      const signedRes = await axios.get(
        `${baseURL}/photos/getSignedUrl?fileName=${
          eventId?.value || eventsid
        }/${subeventId || subeventsid}/${file.name}&fileType=${
          file.type
        }&hash=${file.hash}&event=${eventId?.value || eventsid}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          validateStatus: () => true,
        },
      );

      if (signedRes.status === 409) {
        handleDuplicate(file);
        return;
      }

      if (signedRes.status !== 200 || !signedRes.data?.signedUrl) {
        markFailedOnce(file);
        return;
      }

      await sendFile(file, signedRes.data.signedUrl);
    } catch (err) {
      console.log(err);
    }
  };

  /* ---------------- SEND FILE ---------------- */
  const sendFile = async (file, signedUrl) => {
    let uploaded = false;

    try {
      const buffer = await window.electronAPI.readFileAsBuffer(file.path);

      await axios.put(signedUrl, buffer, {
        headers: { "Content-Type": "image/webp" },

        onUploadProgress: (e) => {
          const now = Date.now();
          const diffBytes = e.loaded - lastBytesRef.current;
          const diffTime = (now - lastSpeedTimeRef.current) / 1000;

          if (diffTime > 0 && diffBytes > 0) {
            networkSpeedRef.current = diffBytes / (1024 * 1024) / diffTime;
          }

          lastBytesRef.current = e.loaded;
          lastSpeedTimeRef.current = now;
        },
      });

      uploaded = true;
    } catch (err) {
      console.error("Upload failed:", err);
      markFailedOnce(file);
    } finally {
      await notifyBackend(file, uploaded);
    }
  };

  /* ---------------- BACKEND ---------------- */
  const notifyBackend = async (file, uploaded) => {
    try {
      if (!uploaded) throw new Error();

      await axios.post(
        `${baseURL}/photos/update-photopath`,
        {
          eventId: eventId?.value || eventsid,
          subeventId: subeventId || subeventsid,
          hash: file.hash,
          size: file.size,
          file: file.name,
          url: `/${eventId?.value || eventsid}/${subeventId || subeventsid}/${file.name}`,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      uploadedRef.current++;
      setUploaded(uploadedRef.current);

      window.electronAPI.deleteFile(file.path);
      window.electronAPI.removeSentImageByHash(file.hash);
    } catch (err) {
      console.log(err);
      markFailedOnce(file);
    }
  };

  /* ---------------- HANDLERS ---------------- */
  const handleDuplicate = (file) => {
    duplicateRef.current++;
    setDuplicate(duplicateRef.current);
    window.electronAPI.deleteFile(file.path);
  };

  /* ---------------- FAILED ---------------- */
  const markFailedOnce = (file) => {
  if (file.__failed) return;
  file.__failed = true;
  failedRef.current++;
  setFailed(failedRef.current);
  window.electronAPI.deleteFile(file.path);
};

  /* ---------------- FINISH ---------------- */
  const checkCompletion = () => {
    if (
      uploadedRef.current + failedRef.current + duplicateRef.current ===
      queueTotal()
    ) {
      // setStatus("completed");
      setHasStarted(false);
    }
  };

  const queueTotal = () =>
    uploadedRef.current +
    failedRef.current +
    duplicateRef.current +
    queueRef.current.length +
    activeUploadsRef.current;

  const resetState = () => {
    uploadedRef.current = 0;
    failedRef.current = 0;
    duplicateRef.current = 0;
    queueRef.current = [];
    activeUploadsRef.current = 0;
    stoppedRef.current = false;
    lastBytesRef.current = 0;
    lastSpeedTimeRef.current = Date.now();
    networkSpeedRef.current = 0;

    setUploaded(0);
    setDuplicate(0);
    setFailed(0);
    setTotal(0);
  };

  const stopWatching = () => {
    stoppedRef.current = true;
    window.electronAPI.stopWatchingFolder?.();
    window.electronAPI.removeListeners?.();
    setHasStarted(false);
  };

  /* ---------------- PUBLIC HELPERS ---------------- */
  const getNetworkUploadSpeedMB = () => networkSpeedRef.current.toFixed(2);

  return {
    getNetworkUploadSpeedMB,
  };
};
