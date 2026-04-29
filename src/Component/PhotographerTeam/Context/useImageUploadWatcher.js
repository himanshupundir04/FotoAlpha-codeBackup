import { useContext, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { UploadContext } from "./UploadContext";

const baseURL = process.env.REACT_APP_BASE_URL;
const MAX_CONCURRENT_UPLOADS = 5;

export const useImageUploadWatcher = ({ folderPath }) => {
  const {
    setTotal,
    setUploaded,
    setDuplicate,
    setFailed,
    setError,
    eventId,
    subId,
    eventsid,
    subeventsid,
    setHasStarted,
    setStatus,
  } = useContext(UploadContext);

  const subeventId = subId?.value;
  const uploadStartTimeRef = useRef(null);
  const totalUploadTimeRef = useRef(0); // ms
  const uploadLimitReached = useRef(false);
  const uploadedRef = useRef(0);
  const failedRef = useRef(0);
  const duplicateRef = useRef(0);
  const queueRef = useRef([]);
  const activeUploadsRef = useRef(0);
  const stoppedRef = useRef(false);
  const onTotalImageCountRef = useRef(null);
  const onCompressedFileReadyRef = useRef(null);
  const onNewImageDetectedRef = useRef(null);

  const cleanupListeners = useCallback(() => {
    if (onTotalImageCountRef.current) {
      window.electronAPI.off("total-image-count", onTotalImageCountRef.current);
      onTotalImageCountRef.current = null;
    }
    if (onCompressedFileReadyRef.current) {
      window.electronAPI.off(
        "compressed-file-ready",
        onCompressedFileReadyRef.current,
      );
      onCompressedFileReadyRef.current = null;
    }
    if (onNewImageDetectedRef.current) {
      window.electronAPI.off("new-image-detected", onNewImageDetectedRef.current);
      onNewImageDetectedRef.current = null;
    }

    window.electronAPI.removeListeners?.();
  }, []);

  /* -------------------- EFFECT -------------------- */

  useEffect(() => {
    if (!folderPath) return;

    cleanupListeners();
    uploadStartTimeRef.current = Date.now();

    resetState();
    setHasStarted(true);
    setStatus("loading");

    const handleTotalImageCount = (count) => setTotal(count);
    const handleCompressedFileReady = (chunk) => {
      queueRef.current.push(...chunk);
      processQueue();
    };
    const handleNewImageDetected = (file) => {
      queueRef.current.push(file);
      processQueue();
    };

    onTotalImageCountRef.current = handleTotalImageCount;
    onCompressedFileReadyRef.current = handleCompressedFileReady;
    onNewImageDetectedRef.current = handleNewImageDetected;

    window.electronAPI.onTotalImageCount(handleTotalImageCount);
    window.electronAPI.onCompressedFileReady(handleCompressedFileReady);
    window.electronAPI.onNewImageDetected(handleNewImageDetected);

    window.electronAPI.watchFolder(folderPath);
    window.electronAPI.compressAndReadFolder(folderPath);

    return () => {
      cleanupListeners();
      stopWatching();
    };
  }, [folderPath, cleanupListeners]);

  const start = Date.now();

  /* -------------------- QUEUE -------------------- */

  const processQueue = async () => {
    while (
      activeUploadsRef.current < MAX_CONCURRENT_UPLOADS &&
      queueRef.current.length > 0 &&
      !stoppedRef.current
    ) {
      const file = queueRef.current.shift();
      activeUploadsRef.current++;

      uploadSingle(file)
        .catch(() => {})
        .finally(() => {
          activeUploadsRef.current--;
          processQueue();
          checkCompletion();
        });
    }
  };

  /* -------------------- UPLOAD FLOW -------------------- */

  const uploadSingle = async (file) => {
    if (uploadLimitReached.current) return;

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

      if (!signedRes.data?.signedUrl) {
        throw new Error("Signed URL failed");
      }

      await sendFile(file, signedRes.data.signedUrl);
    } catch (error) {
      handleFailed(file, getErrorMessage(error));
    }
  };

  const sendFile = async (file, signedUrl) => {
    let uploaded = false;

    try {
      const buffer = await window.electronAPI.readFileAsBuffer(file.path);

      await axios.put(signedUrl, buffer, {
        headers: { "Content-Type": "image/webp" },
        timeout: 15000,
      });

      uploaded = true;
    } catch (error) {
      throw error;
    } finally {
      await notifyBackend(file, uploaded);
    }
  };

  const notifyBackend = async (file, uploaded) => {
    try {
      if (!uploaded) throw new Error("Upload incomplete");

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
      const end = Date.now();
      totalUploadTimeRef.current += end - start;
      // cleanup async
      window.electronAPI.deleteFile(file.path);
      window.electronAPI.removeSentImageByHash(file.hash);
    } catch {
      handleFailed(file, "Upload verification failed");
    }
  };

  /* -------------------- HANDLERS -------------------- */

  const handleDuplicate = (file) => {
    duplicateRef.current++;
    setDuplicate(duplicateRef.current);
    window.electronAPI.deleteFile(file.path);
  };

  const handleFailed = (file, message) => {
    failedRef.current++;
    setFailed(failedRef.current);
    setError(message);
    setTimeout(() => setError(""), 5000);
  };

  const getErrorMessage = (error) => {
    if (!error?.response) {
      if (error?.code === "ECONNABORTED")
        return "Slow internet connection detected.";
      return "Network error. Please check your connection.";
    }
    if (error.response.status === 415) return "Unsupported file format.";
    if (error.response.status === 400) return "File is corrupted.";
    if (error.response.status >= 500) return "Server error.";
    return "Upload failed.";
  };

  /* -------------------- FINALIZATION -------------------- */

  const checkCompletion = () => {
    const totalDone =
      uploadedRef.current + failedRef.current + duplicateRef.current;
    if (totalDone === Number(queueTotal())) {
      setStatus("completed");
      setHasStarted(false);
    }
  };

  const queueTotal = () => {
    return (
      uploadedRef.current +
      failedRef.current +
      duplicateRef.current +
      queueRef.current.length +
      activeUploadsRef.current
    );
  };

  /* -------------------- RESET / STOP -------------------- */

  const resetState = () => {
    uploadedRef.current = 0;
    failedRef.current = 0;
    duplicateRef.current = 0;
    queueRef.current = [];
    activeUploadsRef.current = 0;
    stoppedRef.current = false;

    setUploaded(0);
    setFailed(0);
    setDuplicate(0);
    setTotal(0);
    setError("");
  };

  const stopWatching = () => {
    stoppedRef.current = true;

    window.electronAPI.cancelUploadProcessing?.();
    window.electronAPI.deleteCompressed?.();
    window.electronAPI.stopWatchingFolder?.();
    window.electronAPI.removeListeners?.();

    setHasStarted(false);
  };

  /* -------------------- SPEED HELPERS -------------------- */

  const getImagesPerSecond = () => {
    if (!uploadStartTimeRef.current) return 0;
    const elapsedSeconds = (Date.now() - uploadStartTimeRef.current) / 1000;
    if (elapsedSeconds <= 0) return 0;
    return (uploadedRef.current / elapsedSeconds).toFixed(2);
  };

  const getAverageTimePerImage = () => {
    if (uploadedRef.current === 0) return 0;
    return (totalUploadTimeRef.current / uploadedRef.current / 1000).toFixed(2);
  };

  return {
    getImagesPerSecond,
    getAverageTimePerImage,
  };
};
