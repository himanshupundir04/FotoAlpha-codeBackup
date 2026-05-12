import { useEffect, useRef, useCallback } from "react";
import {
  desktopUploadService,
} from "../../services/desktopUploadService";

const MAX_CONCURRENT_UPLOADS = 5;

export const useImageUploadWatcher = ({
  folderPath,
  setTotal,
  setUploaded,
  setDuplicate,
  setFailed,
  setHasStarted,
  setStatus,
  eventId,
  subeventId,
  eventsid,
  subeventsid,
  updateUploadState,
}) => {
  const uploadedRef = useRef(0);
  const failedRef = useRef(0);
  const duplicateRef = useRef(0);
  const queueRef = useRef([]);
  const activeUploadsRef = useRef(0);
  const stoppedRef = useRef(false);
  const uploadLimitReached = useRef(false);
  const failedFileIdsRef = useRef(new Set());

  const onTotalImageCountRef = useRef(null);
  const onCompressedFileReadyRef = useRef(null);
  const onNewImageDetectedRef = useRef(null);
  const onWatcherErrorRef = useRef(null);

  const cleanupListeners = useCallback(() => {
    if (onTotalImageCountRef.current) {
      onTotalImageCountRef.current();
      onTotalImageCountRef.current = null;
    }
    if (onCompressedFileReadyRef.current) {
      onCompressedFileReadyRef.current();
      onCompressedFileReadyRef.current = null;
    }
    if (onNewImageDetectedRef.current) {
      onNewImageDetectedRef.current();
      onNewImageDetectedRef.current = null;
    }
    if (onWatcherErrorRef.current) {
      onWatcherErrorRef.current();
      onWatcherErrorRef.current = null;
    }
    window.electronAPI?.removeListeners?.();
  }, []);

  const stopWatching = useCallback(() => {
    stoppedRef.current = true;
    window.electronAPI?.stopWatchingFolder?.();
    window.electronAPI?.removeListeners?.();
    setHasStarted?.(false);
  }, [setHasStarted]);

  const resetState = useCallback(() => {
    uploadedRef.current = 0;
    failedRef.current = 0;
    duplicateRef.current = 0;
    queueRef.current = [];
    activeUploadsRef.current = 0;
    stoppedRef.current = false;
    failedFileIdsRef.current.clear();

    setUploaded?.(0);
    setDuplicate?.(0);
    setFailed?.(0);
    setTotal?.(0);
  }, [setTotal, setUploaded, setDuplicate, setFailed]);

  const handleDuplicate = (file) => {
    duplicateRef.current++;
    setDuplicate?.(duplicateRef.current);
    window.electronAPI?.deleteFile(file.path);
  };

  const markFailedOnce = (file) => {
    if (file.__failed) return;
    file.__failed = true;
    failedRef.current++;
    setFailed?.(failedRef.current);
    window.electronAPI?.deleteFile(file.path);
  };

  const queueTotal = () =>
    uploadedRef.current +
    failedRef.current +
    duplicateRef.current +
    queueRef.current.length +
    activeUploadsRef.current;

  const checkCompletion = () => {
    if (
      uploadedRef.current + failedRef.current + duplicateRef.current ===
      queueTotal()
    ) {
      setHasStarted?.(false);
    }
  };

  const handleWatcherError = useCallback(({ filePath, message }) => {
    console.error(`[Compression Error] ${filePath}:`, message);
    failedRef.current++;
    setFailed?.(failedRef.current);
  }, [setFailed]);

  const uploadSingle = async (file) => {
    try {
      const result = await desktopUploadService.uploadFile({
        filePath: file.path,
        fileName: file.name,
        fileType: file.type,
        fileHash: file.hash,
        fileSize: file.size,
        eventId: eventId?.value || eventsid,
        subeventId: subeventId || subeventsid,
      });
      if (result === null) {
        markFailedOnce(file);
      }
    } catch (err) {
      markFailedOnce(file);
    }
  };

  useEffect(() => {
    const unsubComplete = desktopUploadService.onComplete((events) => {
      events.forEach(() => {
        uploadedRef.current++;
        setUploaded?.(uploadedRef.current);
      });
    });

    const unsubError = desktopUploadService.onError((events) => {
      events.forEach((data) => {
        if (data.fileId && failedFileIdsRef.current.has(data.fileId)) return;
        if (data.fileId) failedFileIdsRef.current.add(data.fileId);
        failedRef.current++;
        setFailed?.(failedRef.current);
        checkCompletion();
      });
    });

    desktopUploadService.init();

    return () => {
      unsubComplete();
      unsubError();
    };
  }, []);

  const processQueue = useCallback(() => {
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
  }, [eventId, eventsid, subeventId, subeventsid]);

  useEffect(() => {
    if (!folderPath) return;

    cleanupListeners();

    resetState();

    setHasStarted?.(true);
    setStatus?.("loading");

    const handleTotalImageCount = (count) => {
      setTotal?.(count);
    };

    const handleCompressedFileReady = (chunk) => {
      queueRef.current.push(...chunk);
      processQueue();
    };

    const handleNewImageDetected = (file) => {
      // If previous batch is done, reset counters so the monitor re-appears
      if (activeUploadsRef.current === 0 && queueRef.current.length === 0) {
        uploadedRef.current = 0;
        failedRef.current = 0;
        duplicateRef.current = 0;
        failedFileIdsRef.current.clear();
        setUploaded?.(0);
        setDuplicate?.(0);
        setFailed?.(0);
        setTotal?.(0);
        setHasStarted?.(true);
      }
      setTotal?.((prev) => prev + 1);
      queueRef.current.push(file);
      processQueue();
    };

    onTotalImageCountRef.current = window.electronAPI?.onTotalImageCount(handleTotalImageCount) ?? null;
    onCompressedFileReadyRef.current = window.electronAPI?.onCompressedFileReady(handleCompressedFileReady) ?? null;
    onNewImageDetectedRef.current = window.electronAPI?.onNewImageDetected(handleNewImageDetected) ?? null;
    onWatcherErrorRef.current = window.electronAPI?.onWatcherError(handleWatcherError) ?? null;

    window.electronAPI?.watchFolder(folderPath);
    window.electronAPI?.compressAndReadFolder(folderPath);

    return () => {
      cleanupListeners();
      stopWatching();
    };
  }, [folderPath]);

  return {
    stopWatching,
  };
};
