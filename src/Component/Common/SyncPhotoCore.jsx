import React, { useEffect, useState } from "react";
import { formatFileSize } from "./utils";
import { desktopUploadService } from "../../services/desktopUploadService";

export default function SyncPhotoCore({
  eventId,
  subeventId,
  folderPath,
  setTotalImages,
  setUploadedImages,
  setDuplicateImages,
  fetchPhoto,
  setTableData,
  setZoomImg,
  setSyncStatus,
  setPlanlimit,
}) {
  const [tableData, setTableDataLocal] = useState([]);
  const [zoomImgLocal, setZoomImgLocal] = useState(null);
  const [syncStatusLocal, setSyncStatusLocal] = useState("idle");
  const [uploadedImages, setUploadedImagesLocal] = useState(0);
  const [totalImages, setTotalImagesLocal] = useState(0);
  const [duplicateImages, setDuplicateImagesLocal] = useState(0);
  const [planlimit, setPlanlimitLocal] = useState(false);

  useEffect(() => { setTableData(tableData); }, [tableData, setTableData]);
  useEffect(() => { setZoomImg?.(zoomImgLocal); }, [zoomImgLocal, setZoomImg]);
  useEffect(() => { setSyncStatus?.(syncStatusLocal); }, [syncStatusLocal, setSyncStatus]);
  useEffect(() => { setUploadedImages?.(uploadedImages); }, [uploadedImages, setUploadedImages]);
  useEffect(() => { setTotalImages?.(totalImages); }, [totalImages, setTotalImages]);
  useEffect(() => { setDuplicateImages?.(duplicateImages); }, [duplicateImages, setDuplicateImages]);
  useEffect(() => { setPlanlimit?.(planlimit); }, [planlimit, setPlanlimit]);

  const updateTableStatus = (filename, newStatus, reason) => {
    setTableDataLocal((prevData) =>
      prevData.map((item) =>
        item.file === filename ? { ...item, status: newStatus, reason } : item
      )
    );
  };

  useEffect(() => {
    const handleOnline = async () => {
      const queue =
        (await window.electronAPI?.getStore("compressedQueue")) || [];
      const remaining = [];

      for (const item of queue) {
        try {
          await fetchFiles(
            item.name,
            item.type,
            item.path,
            item.hash,
            typeof item.size === "number" ? item.size : (item.sizeFormatted ? item.size : 0)
          );
        } catch (err) {
          remaining.push(item);
        }
      }

      await window.electronAPI?.setStore("compressedQueue", remaining);
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  useEffect(() => {
    if (!folderPath) return;
    setUploadedImagesLocal(0);
    setTotalImagesLocal(0);
    setDuplicateImagesLocal(0);

    desktopUploadService.storeWatchedFolder(folderPath);

    window.electronAPI?.onTotalImageCount((count) => {
      setTotalImagesLocal(count);
    });
    setSyncStatusLocal("loading");

    const handleCompressedChunk = async (chunk) => {
      let sentImages = await window.electronAPI?.getSentImages();
      if (!Array.isArray(sentImages)) sentImages = [];

      const queue =
        (await window.electronAPI?.getStore("compressedQueue")) || [];
      const newTableRows = [];
      const previewUrls = [];

      const uploadPromises = chunk.map(async (file) => {
        const isAlreadySent = sentImages.some(
          (img) => img.name === file.name && img.hash === file.hash
        );

        if (isAlreadySent && navigator.onLine) {
          return;
        }

        const fileBuffer = await window.electronAPI?.readFileAsBuffer(file.path);
        const blob = new Blob([fileBuffer], { type: "image/webp" });
        const previewUrl = URL.createObjectURL(blob);
        previewUrls.push(previewUrl);
        const size = formatFileSize(file.size);
        const filesize = file.size;

        const item = {
          name: file.name,
          type: file.type,
          path: file.path,
          hash: file.hash,
          size: filesize,
          sizeFormatted: size,
        };

        const alreadyInQueue = queue.some((img) => img.hash === file.hash);
        if (!alreadyInQueue) {
          queue.push(item);
        }

        newTableRows.push({
          preview: (
            <img
              src={previewUrl}
              alt={file.name}
              className="w-16 h-16 object-contain cursor-pointer"
              onClick={() => setZoomImgLocal(previewUrl)}
            />
          ),
          file: file.name,
          size,
          status: "Pending",
          reason: navigator.onLine ? "Uploading..." : "Offline",
          time: new Date(file.lastModified).toLocaleString(),
          _id: Math.random().toString(36).substr(2, 9),
        });

        if (navigator.onLine) {
          try {
            await fetchFiles(
              file.name,
              file.type,
              file.path,
              file.hash,
              filesize
            );
          } catch (err) {
          }
        }
      });

      await Promise.all(uploadPromises);
      const remainingQueue = queue.filter((img) => {
        const wasUploaded = newTableRows.some(
          (row) => row.file === img.name && row.status !== "Duplicated"
        );
        return !wasUploaded;
      });
      await window.electronAPI?.setStore("compressedQueue", remainingQueue);
      setTableDataLocal((prev) => [...newTableRows, ...prev]);
    };

    window.electronAPI?.onCompressedFileReady(handleCompressedChunk);
    const handleNewImage = async (file) => {
      const fileBuffer = await window.electronAPI?.readFileAsBuffer(file.path);
      const blob = new Blob([fileBuffer], { type: "image/webp" });
      const previewUrl = URL.createObjectURL(blob);
      const filesize = file.size;
      const size = formatFileSize(file.size);
      const newRow = {
        preview: (
          <img
            src={previewUrl}
            alt={file.name}
            className="w-16 h-16 object-contain cursor-pointer"
          />
        ),
        file: file.name,
        size,
        status: "Pending",
        reason: "Compressing...",
        time: new Date(file.lastModified).toLocaleString(),
        _id: Math.random().toString(36).substr(2, 9),
      };

      await fetchFiles(file.name, file.type, file.path, file.hash, filesize);
      setTableDataLocal((prev) => [newRow, ...prev]);
      setTotalImagesLocal((prev) => prev + 1);
    };

    window.electronAPI?.onNewImageDetected(handleNewImage);
    const startCompressionAndWatch = async () => {
      try {
        await window.electronAPI?.watchFolder(folderPath);
        await window.electronAPI?.compressAndReadFolder(folderPath);
      } catch (error) {
        setSyncStatusLocal("error");
      }
    };
    startCompressionAndWatch();
    return () => {
      window.electronAPI?.stopWatchingFolder?.();
      window.electronAPI?.removeListeners?.();
    };
  }, [folderPath]);

  const uploadLimitReached = useRef(false);

  useEffect(() => {
    const unsubProgress = desktopUploadService.onProgress((events) => {
      events.forEach(({ fileId, bytesUploaded, totalBytes, status }) => {
      });
    });
    const unsubComplete = desktopUploadService.onComplete((events) => {
      events.forEach(({ fileId, fileName }) => {
        setUploadedImagesLocal((prev) => prev + 1);
      });
    });
    const unsubError = desktopUploadService.onError((events) => {
      events.forEach(({ fileId, error }) => {
      });
    });

    desktopUploadService.init();

    return () => {
      unsubProgress();
      unsubComplete();
      unsubError();
    };
  }, []);

  const fetchFiles = async (
    filename,
    filetype,
    filepath,
    filehash,
    filesize
  ) => {
    try {
      if (uploadLimitReached.current) return;

      await desktopUploadService.uploadFile({
        filePath: filepath,
        fileName: filename,
        fileType: filetype,
        fileHash: filehash,
        fileSize: filesize,
        eventId,
        subeventId,
      });
    } catch (error) {
      updateTableStatus(filename, "Failed", "Upload error");
    }
  };

  return null;
}
