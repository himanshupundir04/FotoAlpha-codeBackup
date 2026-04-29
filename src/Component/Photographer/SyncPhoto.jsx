import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { PortfolioContext } from "./Context/PortfolioContext";

const baseURL = process.env.REACT_APP_BASE_URL;
function SyncPhoto() {
  const {
    setTotalImages,
    setUploadedImages,
    setDuplicateImages,
    fetchPhoto,
    setTableData,
    folderPath,
    setZoomImg,
    setSyncStatus,
    setPlanlimit,
    eventId,
    subeventId,
  } = useContext(PortfolioContext);

  console.log(folderPath,"folderpath"
  )

  const updateTableStatus = (filename, newStatus, reason) => {
    setTableData((prevData) =>
      prevData.map((item) =>
        item.file === filename ? { ...item, status: newStatus, reason } : item
      )
    );
  };

  function formatFileSize(bytes) {
    const units = ["Bytes", "KB", "MB", "GB", "TB"];
    let i = 0;
    let size = bytes;
    while (size >= 1024 && i < units.length - 1) {
      size /= 1024;
      i++;
    }
    return `${size.toFixed(2)} ${units[i]}`;
  }

  useEffect(() => {
    const handleOnline = async () => {
      const queue =
        (await window.electronAPI.getStore("compressedQueue")) || [];
      const remaining = [];

      for (const item of queue) {
        try {
          await fetchFiles(
            item.name,
            item.type,
            item.path,
            item.hash,
            item.size
          );
          // console.log("Uploaded from queue:", item.name);
        } catch (err) {
          console.log("Retry failed:", item.name);
          remaining.push(item); // Keep in queue
        }
      }

      await window.electronAPI.setStore("compressedQueue", remaining);
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  useEffect(() => {
    if (!folderPath) return;
    setUploadedImages(0);
    setTotalImages(0);
    setDuplicateImages(0);

    window.electronAPI.onTotalImageCount((count) => {
      setTotalImages(count);
    });
    setSyncStatus("loading");

    const handleCompressedChunk = async (chunk) => {
      let sentImages = await window.electronAPI.getSentImages();
      if (!Array.isArray(sentImages)) sentImages = [];

      const queue =
        (await window.electronAPI.getStore("compressedQueue")) || [];
      const newTableRows = [];

      const uploadPromises = chunk.map(async (file) => {
        const isAlreadySent = sentImages.some(
          (img) => img.name === file.name && img.hash === file.hash
        );

        if (isAlreadySent && navigator.onLine) {
          // Only skip if it's already sent and we're online
          return;
        }

        const fileBuffer = await window.electronAPI.readFileAsBuffer(file.path);
        const blob = new Blob([fileBuffer], { type: "image/webp" });
        const previewUrl = URL.createObjectURL(blob);
        const size = formatFileSize(file.size);
        const filesize = file.size;

        const item = {
          name: file.name,
          type: file.type,
          path: file.path,
          hash: file.hash,
          size,
        };

        // Save compressed item to queue
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
              onClick={() => setZoomImg(previewUrl)}
            />
          ),
          file: file.name,
          size,
          status: "Pending",
          reason: navigator.onLine ? "Uploading..." : "Offline",
          time: new Date(file.lastModified).toLocaleString(),
          _id: Math.random().toString(36).substr(2, 9),
        });

        // Attempt to upload if online
        if (navigator.onLine) {
          try {
            await fetchFiles(
              file.name,
              file.type,
              file.path,
              file.hash,
              filesize
            );
            // Remove from queue after successful upload
            const index = queue.findIndex((img) => img.hash === file.hash);
            if (index !== -1) queue.splice(index, 1);
          } catch (err) {
            console.log("Upload failed, will retry later:", file.name);
          }
        }
      });

      await Promise.all(uploadPromises);
      await window.electronAPI.setStore("compressedQueue", queue);
      setTableData((prev) => [...newTableRows, ...prev]);
    };

    window.electronAPI.onCompressedFileReady(handleCompressedChunk);
    const handleNewImage = async (file) => {
      const fileBuffer = await window.electronAPI.readFileAsBuffer(file.path);
      // console.log("new deted", fileBuffer);
      const newTableRows = [];
      const blob = new Blob([fileBuffer], { type: "image/webp" });
      const previewUrl = URL.createObjectURL(blob);
      // const size = file.size;
      const filesize = file.size;
      const size = formatFileSize(file.size);
      newTableRows.push((prev) => [
        {
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
        },
        ...prev,
      ]);

      await fetchFiles(file.name, file.type, file.path, file.hash, filesize);
      setTableData((prev) => [...newTableRows, ...prev]);
      setTotalImages((prev) => prev + 1);
    };

    window.electronAPI.onNewImageDetected(handleNewImage);
    const startCompressionAndWatch = async () => {
      try {
        await window.electronAPI.watchFolder(folderPath);
        await window.electronAPI.compressAndReadFolder(folderPath);
      } catch (error) {
        console.error("Error during compression or watching:", error);
        toast.error("Error during compression.");
        setSyncStatus("completed");
      }
    };
    startCompressionAndWatch();
    return () => {
      window.electronAPI.stopWatchingFolder?.();
      window.electronAPI.removeListeners?.();
      // console.log("Stopped watching folder and removed listeners");
    };
  }, [folderPath]);

  let uploadLimitReached = false; // shared flag outside fetchFiles

  const fetchFiles = async (
    filename,
    filetype,
    filepath,
    filehash,
    filesize
  ) => {
    try {
      if (uploadLimitReached) return;

      const response = await axios.get(
        `${baseURL}/photos/getSignedUrl?fileName=${eventId}/${subeventId}/${filename}&fileType=${filetype}&hash=${filehash}&event=${eventId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "ngrok-skip-browser-warning": "69420",
          },
          validateStatus: () => true,
        }
      );

      const { signedUrl } = response?.data;
      if (signedUrl) {
        await sendFile(filename, filepath, signedUrl, filehash, filesize);
      } else {
        updateTableStatus(filename, "Failed", "No signed URL");
      }

      if (
        response?.data?.message === "Photo upload limit reached for your plan."
      ) {
        uploadLimitReached = true;

        // Clear UI instantly
        setPlanlimit(true);
        fetchPhoto();
        setSyncStatus("cancelled");
        setTableData([]);
        window.electronAPI.cancelUploadProcessing();
        window.electronAPI.deleteCompressed();

        // Delete ALL files in queue
        const queue =
          (await window.electronAPI.getStore("compressedQueue")) || [];
        await Promise.all(
          queue.map(async (img) => {
            await window.electronAPI.deleteFile(img.filepath);
          })
        );
        await window.electronAPI.setStore("compressedQueue", []);

        fetchPhoto();
        setTableData([]);
        // Cancel processing and delete compressed folder

        return;
      } else if (response.status === 409 || !response.data?.signedUrl) {
        updateTableStatus(filename, "Duplicate", "Duplicate File");

        const queue =
          (await window.electronAPI.getStore("compressedQueue")) || [];
        const updatedQueue = queue.filter((img) => img.hash !== filehash);
        await window.electronAPI.setStore("compressedQueue", updatedQueue);

        await window.electronAPI.deleteFile(filepath);
        setDuplicateImages((prev) => prev + 1);
        return;
      }
    } catch (error) {
      console.error("sign", error);
      updateTableStatus(filename, "Failed", "Error fetching signed URL");
    }
  };

  const sendFile = async (
    filename,
    filepath,
    signedUrl,
    filehash,
    filesize
  ) => {
    try {
      const fileBuffer = await window.electronAPI.readFileAsBuffer(filepath);
      await axios.put(signedUrl, fileBuffer, {
        headers: {
          "Content-Type": "image/webp",
        },
      });
      await sendDataBackend(filename, filehash, filepath, filesize);
    } catch (error) {
      console.error(error);
      updateTableStatus(filename, "Failed", "Error sending to server");
      setSyncStatus("completed");
    }
  };

  const sendDataBackend = async (filename, filehash, filepath, filesize) => {
    // console.log("filepath", size);
    try {
      const payload = {
        eventId,
        subeventId,
        hash: filehash,
        size: filesize,
        file: filename,
        url: `/${eventId}/${subeventId}/${filename}`,
      };

      const res = await axios.post(
        `${baseURL}/photos/update-photopath`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "69420",
          },
        }
      );
      if (res.data?.message === "Photo path updated successfully.") {
        // console.log(res.data);
        await window.electronAPI.deleteFile(filepath);
        await window.electronAPI.removeSentImageByHash(filehash);
        updateTableStatus(filename, "Completed", "Uploaded Successfully");
        setUploadedImages((prev) => {
          const updated = prev + 1;
          return updated;
        });
      } else {
        updateTableStatus(filename, "Failed", res.data?.message || "Rejected");
        toast.error("Backend rejected image");
      }
    } catch (error) {
      setSyncStatus("completed");
    }
  };

  return <div>SyncPhoto</div>;
}

export default SyncPhoto;
