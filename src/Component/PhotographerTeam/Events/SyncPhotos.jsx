import React, { useState, useEffect, useContext } from "react";
import { toast } from "react-toastify";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate, useParams } from "react-router-dom";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import MUIDataTable from "mui-datatables";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { Dialog, TablePagination } from "@mui/material";
import { UploadContext } from "../Context/UploadContext";
import { startUpload } from "../Context/UploadHelper";
import Swal from "sweetalert2";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";

const baseURL = process.env.REACT_APP_BASE_URL;

function SyncPhotos() {
  const navigate = useNavigate();
  const [folderPath, setFolderPath] = useState(null);
  const [totalphoto, setTotalphoto] = useState("");
  const [tableData, setTableData] = useState([]);
  const { eventId, subeventId } = useParams();
  const [photos, setPhotos] = useState([]);
  const [zoomImg, setZoomImg] = useState(null);
  const [zoomIndex, setZoomIndex] = useState(0);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  // const [syncStatus, setSyncStatus] = useState("idle");
  const { updateUploadState, setStatus, setEventsid, setSubeventsid, status } =
    useContext(UploadContext);

  useEffect(() => {
    fetchPhoto();
  }, [page, rowsPerPage]);

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
             page: Number(page) + 1,
  limit: Number(rowsPerPage),
          },
        },
      );

      const photos = response.data.data.photos || [];
      setPhotos(photos);
      setTotalphoto(response.data.data.pagination?.total || 0);
      setPagination(response.data.data.pagination);
      console.log(response?.data?.data)

      if (photos.length !== 0) {
        const formattedPhotos = photos.map((photo, index) => {
          const fileNameWithoutExt = photo.filename.split(".")[0];
          return {
            preview: (
              <img
                src={photo?.urlThumbnailSignedUrl || photo?.urlImageSignedUrl}
                alt={photo.filename}
                name={photo.filename}
                id={photo.filename}
                className="w-16 h-16 object-contain cursor-pointer"
                onClick={() => {
                  setZoomImg(photo.urlImageSignedUrl);
                  setZoomIndex(index);
                }}
                loading="lazy"
              />
            ),
            file: fileNameWithoutExt,
            size: photo?.metadata?.size,
            status: "Completed",
            reason: "Uploaded",
            time: new Date(photo.createdAt).toLocaleString(),
            _id: photo.id || Math.random().toString(36).substr(2, 9),
          };
        });
        setTableData(formattedPhotos);
      }
    } catch (error) {
      console.error("Error fetching photos:", error);
    }
  };

  useEffect(() => {
    setEventsid(eventId);
    setSubeventsid(subeventId);
  }, [eventId, subeventId]);

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
          setTimeout(() => {
            fetchPhoto();
          }, 500); 
        } catch (err) {
          toast.error(err?.response?.data?.message || "Something went wrong");
          console.log(err);
        }
      }
    });
  };

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
   setRowsPerPage(parseInt(event.target.value, 10));
  setPage(0);
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
            className={`bg-blue text-white py-2 px-3 rounded font-semibold transition-colors ${
              status === "loading"
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-blueHover"
            }`}
            onClick={handleSelectFolder}
            disabled={status === "loading"}
          >
            {status === "loading" ? "Uploading..." : "Upload Folder"}
          </button>
        </div>
        <div className="flex justify-end items-center mt-2 text-lg font-semibold text-slate-700">
          <p>Total Photos: {totalphoto}</p>
        </div>
        <div className="flex justify-end items-center  mt-2 text-lg font-semibold text-slate-700">
          <p
            className="cursor-pointer px-2  border border-slate-400 rounded"
            onClick={() => fetchPhoto()}
          >
            Refresh <RefreshIcon/>
          </p>
        </div>

        <MUIDataTable
          data={tableData}
          columns={columns}
          options={options}
          className="no-shadow bg-white dark:bg-slate-800 dark:text-white mt-5"
        />
        <div>
          <TablePagination
            component="div"
            count={totalphoto}
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
