import React, { useState, useEffect, useContext } from "react";
import { toast } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import MUIDataTable from "mui-datatables";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { CircularProgress, Dialog, TablePagination } from "@mui/material";
import { PortfolioContext } from "../Context/PortfolioContext";
import { startUpload } from "../Context/UploadHelper";
import DeleteIcon from "@mui/icons-material/Delete";
import Swal from "sweetalert2";
import { UploadVideoContext } from "../Context/UploadVideoContext";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RefreshIcon from '@mui/icons-material/Refresh';
import SyncVideos from "./SyncVideos";

const baseURL = process.env.REACT_APP_BASE_URL;

function SyncPhotos() {
  const { updateUploadState, setEventsid, setSubeventsid, setStatus, status } =
    useContext(PortfolioContext);
  const { videoStatus } = useContext(UploadVideoContext)
  const [folderPath, setFolderPath] = useState(null);
  const [totalphoto, setTotalphoto] = useState("");
  const [tableData, setTableData] = useState([]);
  const { eventId, subeventId } = useParams();
  const [photos, setPhotos] = useState([]);
  // const [zoomItem, setZoomItem] = useState(null);
  // const [zoomIndex, setZoomIndex] = useState(0);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [videoUploadMode, setVideoUploadMode] = useState(false);
  const [mediaFilter, setMediaFilter] = useState("image");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [selectedPhotoLoading, setSelectedPhotoLoading] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null);
  const [dialogList, setDialogList] = useState([]);

  // console.log(status, "status")

  useEffect(() => {
    fetchPhoto();
  }, [page, rowsPerPage]);

  useEffect(() => {
    setEventsid(eventId);
    setSubeventsid(subeventId);
  }, [eventId, subeventId]);

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
            limit: rowsPerPage,
          },
        },
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

        const isVideo = /\.(mp4|mov|avi|mkv|webm|flv|wmv)$/i.test(photo.filename);

        return {
          file: fileNameWithoutExt,
          size: formatBytes(photo?.metadata?.size),
          status: "Completed",
          reason: "Uploaded",
          time: new Date(photo.createdAt).toLocaleString(),
          _id: photo.id || photo._id || Math.random().toString(36).substr(2, 9),
          url: photo.urlThumbnailSignedUrl || photo.urlImageSignedUrl,
          type: isVideo ? "video" : "image",
        };
      });

      setTableData(
        serializablePhotos.map((item, index) => ({
          ...item,
          preview: (
            item.type === "video" ? (
              <div
                className="relative w-16 h-16 cursor-pointer"
                // onClick={() => {
                //   setZoomItem(item);
                //   setZoomIndex(index);
                // }}
                onClick={() => {
                  const currentList = serializablePhotos.filter(
                    i => i.type === item.type
                  );

                  const indexInList = currentList.findIndex(
                    i => i._id === item._id
                  );

                  if (indexInList === -1) {
                    console.error("Item not found in list", item, currentList);
                    return;
                  }

                  setDialogList(currentList);
                  fetchPhotoById(item._id, indexInList);
                }}
              >
                <video
                  src={item.url}
                  className="w-full h-full object-cover rounded"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded">
                  ▶
                </div>
              </div>
            ) : (
              <img
                src={item.url}
                alt={item.file}
                className="w-16 h-16 object-contain cursor-pointer"
                // onClick={() => {
                //   setZoomItem(item);
                //   setZoomIndex(index);
                // }}
                onClick={() => {
                  const currentList = serializablePhotos.filter(
                    i => i.type === item.type
                  );

                  const indexInList = currentList.findIndex(
                    i => i._id === item._id
                  );

                  if (indexInList === -1) {
                    console.error("Item not found in list", item, currentList);
                    return;
                  }

                  setDialogList(currentList);
                  fetchPhotoById(item._id, indexInList);
                }}
              />
            )
          ),
        })),
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

  const fetchPhotoById = async (photoId, index) => {
    setSelectedPhotoLoading(true);
    try {
      const response = await axios.get(
        `${baseURL}/photos/public/${photoId}/signed-url`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "ngrok-skip-browser-warning": "69420",
          },
        },
      );
      setSelectedPhoto(response.data.data);
      // console.log(response.data);
      setSelectedPhotoIndex(index);
      setDialogOpen(true);
    } catch (error) {
      console.error("Error fetching photo by ID:", error);
      toast.error("Failed to load photo");
    } finally {
      setSelectedPhotoLoading(false);
    }
  };

  const handleSelectFolder = async () => {
    const selected = await window.electronAPI.selectFolder();
    if (!selected) return;
    setFolderPath(selected);

    if (selected === folderPath) {
      toast.info("You've already selected this folder.");
      return;
    }

    await startUpload(selected, updateUploadState, setStatus);
  };

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
    {
      name: "_id",
      label: "Action",
      options: {
        customBodyRender: (value) => {
          return (
            <button
              className="text-red-600"
              onClick={() => handleDelete(value)}
            >
              <DeleteIcon />
            </button>
          );
        },
      },
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

  const handleDelete = async (id) => {
    // console.log(id);
    Swal.fire({
      title: "Are you sure?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`${baseURL}/photos/${id}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "ngrok-skip-browser-warning": "69420",
            },
          });
          toast.success("Photo deleted successfully");
          await fetchPhoto();
        } catch (err) {
          toast.error(err?.response?.data?.message || "Something went wrong");
          console.log(err);
        }
      }
    });
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleBack = () => {
    navigate(-1);
  };

  const filteredData = tableData.filter((item) => {
    return item.type === mediaFilter;
  });



  const getCleanUrl = (url) => (url ? url.split("?")[0] : "");

  const isImage = (file) => {
    const clean = getCleanUrl(file);
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(clean);
  };

  const isVideo = (file) => {
    const clean = getCleanUrl(file);
    return /\.(mp4|webm|ogg|mov|m3u8|avi|mkv)$/i.test(clean);
  };

  // console.log("selected phto", selectedPhoto)

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
      <div className="flex flex-col">
        <div className="flex justify-between items-start">
          <div className="flex justify-between items-center flex-wrap md:flex-nowrap">
            <ArrowBackIcon
              sx={{ fontSize: "30px" }}
              className="bg-slate-300 p-1 rounded text-white cursor-pointer"
              onClick={handleBack}
            />

          </div>
          <div className="items-end flex flex-col">
            <button
              onClick={() => setOpen(true)}
              className={`px-4 py-2 bg-blue text-white rounded-lg shadow-lg hover:bg-blueHover transition ${status === "loading" || videoStatus === "loading"
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-blueHover"
                }`}
              disabled={status === "loading" || videoStatus === "loading"}
            >
              {status === "loading" || videoStatus === "loading" ? "Uploading..." : "Upload Folder"}
            </button>

            {/* <button
            className={`bg-blue text-white py-2 px-3 rounded font-semibold transition-colors ${
              status === "loading" || videoStatus === "loading"
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-blueHover"
            }`}
            onClick={handleSelectFolder}
            disabled={status === "loading" || videoStatus === "loading"}
          >
            {status === "loading" || videoStatus === "loading" ? "Uploading..." : "Upload Folder"}
          </button> */}
            <div className="flex justify-end items-center mt-1 text-md font-semibold text-slate-700">
              <p>Total: {totalphoto}</p>
            </div>
            <div className="flex justify-end items-center  mt-2 text-lg font-semibold text-slate-700">
              <p
                className="cursor-pointer px-2  border border-slate-400 rounded"
                onClick={() => fetchPhoto()}
              >
                Refresh <RefreshIcon />
              </p>
            </div>
            <div className="flex gap-2 mt-4">

              <button
                onClick={() => setMediaFilter("image")}
                className={`px-4 py-1 rounded ${mediaFilter === "image" ? "bg-blue text-white" : "bg-gray-200"}`}
              >
                Images
              </button>

              <button
                onClick={() => setMediaFilter("video")}
                className={`px-4 py-1 rounded ${mediaFilter === "video" ? "bg-blue text-white" : "bg-gray-200"}`}
              >
                Videos
              </button>
            </div>
          </div>
        </div>

        <SyncVideos videoUploadMode={videoUploadMode} setVideoUploadMode={setVideoUploadMode} />


        <MUIDataTable
          data={filteredData}
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
      </div>

      {/* <Dialog open={!!zoomItem} onClose={() => setZoomItem(null)} maxWidth="md">
        <div className="relative">
          {zoomItem?.type === "video" ? (
            <video
              src={zoomItem.url}
              controls
              autoPlay
              className="h-[80vh] w-[80vw] object-contain p-3"
            />
          ) : (
            <img
              src={zoomItem?.url}
              alt="zoom"
              className="h-[80vh] w-[80vw] object-contain p-3"
            />
          )}
          <button
            onClick={() => setZoomItem(null)}
            className="absolute top-2 right-2 bg-white px-2 py-1 rounded"
          >
            ✕
          </button>

          
          {zoomIndex > 0 && (
            <button
              onClick={() => {
                const newIndex = zoomIndex - 1;
                setZoomIndex(newIndex);
                setZoomItem(tableData[newIndex]);
              }}
              className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-white px-2 py-1 rounded"
            >
              <ChevronLeftIcon />
            </button>
          )}

         
          {zoomIndex < filteredData.length - 1 && (
            <button
              onClick={() => {
                const newIndex = zoomIndex + 1;
                setZoomIndex(newIndex);
                setZoomItem(tableData[newIndex]);
              }}
              className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-white px-2 py-1 rounded"
            >
              <ChevronRightIcon />
            </button>
          )}
        </div>
      </Dialog> */}

      {/* API-based Photo Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <div className="relative max-h-[80vh]">
          {selectedPhotoLoading ? (
            <div className="flex justify-center items-center h-[60vh]">
              <CircularProgress />
            </div>
          ) : (
            <>
              {isImage(selectedPhoto?.imageSignedUrl) ? (
                <img
                  src={selectedPhoto?.imageSignedUrl}
                  alt="media"
                  className="max-h-[80vh] w-full object-contain"
                />
              ) : isVideo(selectedPhoto?.imageSignedUrl) ? (
                <video
                  src={selectedPhoto?.imageSignedUrl}
                  controls
                  autoPlay
                  className="max-h-[80vh] w-full object-contain"
                />
              ) : (
                <p className="text-center text-gray-500">Unsupported format</p>
              )}
              <button
                onClick={() => setDialogOpen(false)}
                className="absolute top-2 right-2 bg-white/80 hover:bg-white p-2 rounded-full"
              >
                ✕
              </button>
              {selectedPhotoIndex > 0 && (
                <button
                  onClick={() => {
                    const newIndex = selectedPhotoIndex - 1;
                    fetchPhotoById(dialogList[newIndex]._id, newIndex);
                  }}
                  className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-black/60 hover:bg-black p-2 rounded-full"
                >
                  <ChevronLeftIcon className="text-white" />
                </button>
              )}
              {selectedPhotoIndex < dialogList.length - 1 && (
                <button
                  onClick={() => {
                    const newIndex = selectedPhotoIndex + 1;
                    fetchPhotoById(dialogList[newIndex]._id, newIndex);
                  }}
                  className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-black/60 hover:bg-black p-2 rounded-full"
                >
                  <ChevronRightIcon className="text-white" />
                </button>
              )}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full">
                {selectedPhotoIndex + 1} / {dialogList.length}
              </div>
            </>
          )}
        </div>
      </Dialog>


      {open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
          <div className="bg-white rounded-3xl p-6 w-80 shadow-2xl relative animate-fadeIn">

            {/* Close Button */}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl"
            >
              ✕
            </button>

            <h2 className="text-xl font-semibold text-center mb-6">
              Upload Folder
            </h2>

            {/* Options */}
            <div className="flex flex-col gap-4">

              {/* Upload Image */}
              <button className="flex items-center justify-center gap-3 border-2 border-dashed border-gray-300 rounded-xl p-4 cursor-pointer hover:border-purple-500 hover:bg-blue-purple-50 transition"
                onClick={() => {
                  setOpen(false);
                  handleSelectFolder()
                }}
              >
                📷 Upload Image

              </button>

              {/* Upload Video */}
              <button className="flex items-center justify-center gap-3 border-2 border-dashed border-gray-300 rounded-xl p-4 cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition"
                onClick={() => {
                  setOpen(false);            // close modal
                  setVideoUploadMode(true);  // trigger SyncVideos
                }}
              >
                🎥 Upload Video

              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default SyncPhotos;

