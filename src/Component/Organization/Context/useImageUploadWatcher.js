import { useContext, useEffect, useRef } from "react";
import axios from "axios";
import { OrganizationPortfolioContext } from "./PortfolioContext";

const baseURL = process.env.REACT_APP_BASE_URL;

export const useImageUploadWatcher = ({ folderPath, updateUploadState }) => {
  const {
    setTotal,
    setUploaded,
    setDuplicate,
    eventId,
    subId,
    eventsid,
    subeventsid,
    setHasStarted,
    setStatus,
  } = useContext(OrganizationPortfolioContext);


  const subeventId = subId?.value;
  const uploadLimitReached = useRef(false);

  useEffect(() => {
    if ( !folderPath) return;
    setHasStarted(true);

    setUploaded(0);
    setTotal(0);
    setDuplicate(0);
    setStatus("loading");

    // listeners
    window.electronAPI.onTotalImageCount((count) => setTotal(count));

    const handleCompressedChunk = async (chunk) => {
      await Promise.all(
        chunk.map((file) =>
          fetchFiles(file.name, file.type, file.path, file.hash, file.size)
        )
      );
    };

    window.electronAPI.onCompressedFileReady(handleCompressedChunk);
    window.electronAPI.onNewImageDetected((file) =>
      fetchFiles(file.name, file.type, file.path, file.hash, file.size)
    );

    // start watching
    window.electronAPI.watchFolder(folderPath);
    window.electronAPI.compressAndReadFolder(folderPath);

    // cleanup when unmount or folder changes
    return () => {
      window.electronAPI.stopWatchingFolder?.();
      window.electronAPI.removeListeners?.();
      window.electronAPI.cancelUploadProcessing?.();
      window.electronAPI.deleteCompressed?.();
      stopWatching();
    };
  }, [folderPath]);

  const fetchFiles = async (
    filename,
    filetype,
    filepath,
    filehash,
    filesize
  ) => {
    if (uploadLimitReached.current) return;

    try {
      const response = await axios.get(
        `${baseURL}/photos/getSignedUrl?fileName=${
          eventId?.value || eventsid
        }/${
          subeventId || subeventsid
        }/${filename}&fileType=${filetype}&hash=${filehash}&event=${
          eventId?.value || eventsid
        }`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "ngrok-skip-browser-warning": "69420",
          },
          validateStatus: () => true,
        }
      );

      if (response?.data?.signedUrl) {
        await sendFile(
          filename,
          filepath,
          response.data.signedUrl,
          filehash,
          filesize
        );
      } else if (
        response?.data?.message === "Photo upload limit reached for your plan."
      ) {
        uploadLimitReached.current = true;
        await handleUploadLimitReached();
      } else if (response.status === 409) {
        await handleDuplicate(filepath, filehash);
      }
    } catch (error) {
      console.error("fetchFiles error:", error);
      await handleDuplicate(filepath, filehash);
    }
  };

  const handleUploadLimitReached = async () => {
    stopWatching();
    setStatus("limit-reached");
  };

  const handleDuplicate = async (filepath, filehash) => {
    setDuplicate((prev) => prev + 1);
    await window.electronAPI.deleteFile(filepath);
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
        headers: { "Content-Type": "image/webp" },
      });
      await sendDataBackend(filename, filehash, filepath, filesize);
    } catch (error) {
      console.error("sendFile error:", error);
    }
  };

  const sendDataBackend = async (filename, filehash, filepath, filesize) => {
    try {
      const payload = {
        eventId: eventId?.value || eventsid,
        subeventId: subeventId || subeventsid,
        hash: filehash,
        size: filesize,
        file: filename,
        url: `/${eventId?.value || eventsid}/${
          subeventId || subeventsid
        }/${filename}`,
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
        await window.electronAPI.deleteFile(filepath);
        await window.electronAPI.removeSentImageByHash(filehash);
        setUploaded((prev) => prev + 1);
        // ✅ If upload complete, stop watching
        // if (uplaoded + duplicate === total) {
        //   stopWatching();
        //   setStatus("completed");
        // }
      }
    } catch (error) {
      console.error("sendDataBackend error:", error);
    }
  };

 const stopWatching = () => {
    window.electronAPI.cancelUploadProcessing?.();
    window.electronAPI.deleteCompressed?.();
    window.electronAPI.stopWatchingFolder?.();
    window.electronAPI.removeListeners?.();

    uploadLimitReached.current = false;
    setHasStarted(false);
  };
};



