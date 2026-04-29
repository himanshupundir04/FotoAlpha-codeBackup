import React, { useState, useEffect, useContext } from "react";
import { toast } from "react-toastify";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate, useParams } from "react-router-dom";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import MUIDataTable from "mui-datatables";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { Alert, Dialog, Snackbar, TablePagination } from "@mui/material";
import Swal from "sweetalert2";
import { PortfolioContext } from "../Context/PortfolioContext";

const baseURL = process.env.REACT_APP_BASE_URL;

function SyncPhotos() {
  const navigate = useNavigate();
  const [folderPath, setFolderPath] = useState(null);
  const [totalphoto, setTotalphoto] = useState("");
  const [tableData, setTableData] = useState([]);
  const { eventId, subeventId } = useParams();
  const [totalImages, setTotalImages] = useState(0);
  const [uploadedImages, setUploadedImages] = useState(0);
  const [duplicateImages, setDuplicateImages] = useState(0);
  const [photos, setPhotos] = useState([]);
  const [zoomImg, setZoomImg] = useState(null);
  const [zoomIndex, setZoomIndex] = useState(0);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [syncStatus, setSyncStatus] = useState("idle");
  const [planlimit, setPlanlimit] = useState(false);
  const [opensnak, setOpensnak] = useState(false);
  const {setTotalimg, setUploadimg, setDuplicateimg} = useContext(PortfolioContext)

  useEffect(() => {
    fetchPhoto();
  }, [page, rowsPerPage]);

  useEffect(() => {
    setTotalimg(totalImages)
    setUploadimg(uploadedImages)
    setDuplicateimg(duplicateImages)
  },[totalImages, uploadedImages, duplicateImages])

  const fetchPhoto = async () => {
    try {
      const response = await axios.get(
        `${baseURL}/photos/get/${eventId}/${subeventId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "ngrok-skip-browser-warning": "69420",
          },
          params: {
            page: page + 1,
            pageSize: rowsPerPage,
          },
        }
      );
      const photos = response.data.data.photos;
      setPhotos(photos);
      setTotalphoto(response.data.data.pagination.total);
      setPagination(response.data.data.pagination);
      // console.log(photos)

      const serializablePhotos = photos.map((photo) => {
        // Remove file extension
        const fileNameWithoutExt = photo.filename.split(".")[0];

        // Format size
        const formatBytes = (bytes, decimals = 2) => {
          if (!bytes) return "0 B";
          const k = 1024;
          const dm = decimals < 0 ? 0 : decimals;
          const sizes = ["B", "KB", "MB", "GB", "TB"];
          const i = Math.floor(Math.log(bytes) / Math.log(k));
          return (
            parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
          );
        };

        return {
          file: fileNameWithoutExt,
          size: formatBytes(photo?.metadata?.size),
          status: "Completed",
          reason: "Uploaded",
          time: new Date(photo.createdAt).toLocaleString(),
          _id: photo.id || Math.random().toString(36).substr(2, 9),
          url: photo.urlImageSignedUrl,
        };
      });

      setTableData(
        serializablePhotos.map((item, index) => ({
          ...item,
          preview: (
            <img
              src={item.url}
              alt={item.file}
              className="w-16 h-16 object-contain cursor-pointer"
              onClick={() => {
                setZoomImg(item.url);
                setZoomIndex(index);
              }}
            />
          ),
        }))
      );
      window.electronAPI.setStore("syncphotos", serializablePhotos);
    } catch (error) {
      const cachedSummary = await window.electronAPI.getStore("syncphotos");
      if (cachedSummary) {
        setTableData(cachedSummary);
        // console.log(cachedSummary);
      }
    }
  };

  const handleSelectFolder = async () => {
    try {
      const selected = await window.electronAPI.selectFolder();

      if (selected) {
        if (selected === folderPath) {
          toast.info("You've already selected this folder.");
          return;
        }

        setFolderPath(selected);
        // Optionally, you can show a success toast here
        // toast.success("Folder selected successfully.");
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to select folder");
    }
  };

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

  useEffect(() => {
    if (totalImages > 0 && uploadedImages + duplicateImages === totalImages) {
      // toast.success("✅ All images uploaded successfully!");
      // setTotalImages(totalImages + uploadedImages)
      setSyncStatus("completed");
      // setOpensnak(true);
      fetchPhoto();
    }
  }, [uploadedImages, totalImages, duplicateImages]);

  const columns = [
    {
      name: "preview",
      label: "Preview",
    },
    {
      name: "file",
      label: "File",
    },   
    {
      name: "status",
      label: "Status",
      options: {
        customBodyRender: (value) => {
          let bgColor = "bg-bgred";
          let textColor = "text-red";
          let border = "border-red";

          if (value === "Completed") {
            bgColor = "bg-green-500";
            textColor = "text-white";
            border = "border-green-500";
          } else if (value === "Failed") {
            bgColor = "bg-bgred";
            textColor = "text-white";
            border = "border-red";
          } else if (value === "Duplicate") {
            bgColor = "bg-yellow-500";
            textColor = "text-white";
            border = "border-yellow-500";
          } else if (value === "Pending") {
            bgColor = "bg-blue";
            textColor = "text-white";
            border = "border-blue";
          }

          return (
            <span
              className={`${bgColor} ${textColor} border ${border} px-2 py-1 capitalize rounded-full font-medium`}
            >
              {value}
            </span>
          );
        },
      },
    },
    {
      name: "reason",
      label: "Reason",
    },
    {
      name: "time",
      label: "Time",
    },
  ];

  const options = {
    filter: false,
    search: false,
    pagination: false,
    viewColumns: false,
    print: false,
    download: false,
    selectableRows: "none",
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 20));
    setPage(0);
  };

  const progressPercentage =
    totalImages === 0
      ? 0
      : ((uploadedImages + duplicateImages) / totalImages) * 100;

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
        window.electronAPI.cancelUploadProcessing();
        window.electronAPI.deleteCompressed();
        setSyncStatus("cancelled");
        setOpensnak(true);
      }
    });
  };

  const handleClosesnak = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }

    setOpensnak(false);
  };

  return (
    <>
      <style>
        {`
            .no-shadow {
            box-shadow: none !important;
            }
            .tss-1h9t3sl-MUIDataTableHeadCell-sortAction{
                font-weight: bold !important;
            }
            .MuiTableCell-head {
                white-space: nowrap;
                text-overflow: ellipsis;
                overflow: hidden;
            }
            .css-1fnc9ax-MuiButtonBase-root-MuiButton-root{
             padding: 5px 0px;
              justify-content: start;
            }
            .tss-1vd39vz-MUIDataTableBodyCell-stackedCommon:nth-last-of-type(2){
            display:none;
            }
        `}
      </style>
      <section className="flex flex-col">
        {/* {syncStatus === "loading" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white  w-[50%] p-6 rounded-lg shadow-lg flex flex-col items-center">
              <div className="flex flex-col justify-end items-center mt-2 text-lg font-semibold text-slate-700">
                <p>
                  Upload Images: {uploadedImages} / {totalImages}
                </p>
                <p>Duplicate Images: {duplicateImages}</p>
              </div>
              <div className="w-full bg-gray-200 bo border border-slate-400 rounded-full h-4 overflow-hidden mt-2">
                <div
                  className="bg-green-500 h-4 transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <button
                onClick={handleCancelUpload}
                className="mt-4 bg-bgred text-white py-2 px-4 rounded font-semibold"
              >
                Cancel Upload
              </button>             
            </div>
          </div>
        )} */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ArrowBackIcon
              sx={{ fontSize: "30px" }}
              className="bg-slate-300 p-1 rounded text-white cursor-pointer"
              onClick={handleBack}
            />
            <h2 className="text-3xl font-bold text-slate-700 dark:text-white">
              Sync Photos
            </h2>
          </div>
          <button
            className="bg-blue text-white py-2 px-3 rounded font-semibold"
            onClick={handleSelectFolder}
          >
            Upload Folder
          </button>
        </div>

        {/* {totalImages > 0 && (
          <div className="flex flex-col items-end mt-2 text-lg font-semibold text-slate-700">
            <p>
              Uplaod Images:{uploadedImages} / {totalImages}
            </p>
            <p>Duplicate Images: {duplicateImages}</p>
          </div>
        )} */}
        <div className="flex justify-end items-center mt-2 text-lg font-semibold text-slate-700">
          <p>Total Photos: {totalphoto}</p>
        </div>
        {planlimit && (
          <div className="flex justify-end items-center mt-2 text-lg font-semibold text-bgred">
            <p>Photo upload limit reached for your plan. upgrade your plan</p>
          </div>
        )}
        <MUIDataTable
          data={tableData}
          columns={columns}
          options={options}
          className="no-shadow bg-white dark:bg-slate-800 dark:text-white mt-5"
        />
        <div>
          <TablePagination
            component="div"
            count={pagination.total}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 15, 20, 50, 100]}
            showLastButton
            className="bg-white text-black dark:bg-slate-800 dark:text-white"
          />
        </div>
      </section>

      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        open={opensnak}
       onClose={handleClosesnak}
        autoHideDuration={6000}
      >
        <Alert  severity="success"
    variant="filled" sx={{ width: "100%" }}  onClose={handleClosesnak}>
          <p className="text-semibold">
            {" "}
            Upload Image: {uploadedImages} / {totalImages}
          </p>
          <p>Duplicate Image: {duplicateImages}</p>
        </Alert>
      </Snackbar>

      <Dialog open={zoomImg} onClose={() => setZoomImg(null)} maxWidth="md">
        <div className="relative">
          <img
            src={zoomImg}
            alt="zoom"
            className="h-[80vh] w-[80vw] object-contain p-3"
          />
          <button
            onClick={() => setZoomImg(null)}
            className="absolute top-2 right-2 bg-white px-2 py-1 rounded"
          >
            ✕
          </button>

          {/* Previous Button */}
          {zoomIndex > 0 && (
            <button
              onClick={() => {
                const newIndex = zoomIndex - 1;
                setZoomIndex(newIndex);
                setZoomImg(photos[newIndex].urlImageSignedUrl);
              }}
              className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-white px-2 py-1 rounded"
            >
              <ChevronLeftIcon />
            </button>
          )}

          {/* Next Button */}
          {zoomIndex < photos.length - 1 && (
            <button
              onClick={() => {
                const newIndex = zoomIndex + 1;
                setZoomIndex(newIndex);
                setZoomImg(photos[newIndex].urlImageSignedUrl);
              }}
              className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-white px-2 py-1 rounded"
            >
              <ChevronRightIcon />
            </button>
          )}
        </div>
      </Dialog>
    </>
  );
}

export default SyncPhotos;

