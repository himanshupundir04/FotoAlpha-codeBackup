import React, { useContext, useEffect, useState } from "react";
import MUIDataTable from "mui-datatables";
import { TablePagination } from "@mui/material";
import axios from "axios";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { UploadVideoContext } from "../Context/UploadVideoContext";
// import { PortfolioContext } from "../Context/PortfolioContext";
import { useParams } from "react-router-dom";

const baseURL = process.env.REACT_APP_BASE_URL;

function SyncVideos({ videoUploadMode, setVideoUploadMode }) {
  const { uploadVideoState, updateUploadVideoState, videoStatus,setEventid, setSubeventid } =
    useContext(UploadVideoContext);
     const { eventId, subeventId } = useParams();

    //  console.log("eventid", eventId)
    //  console.log("subeventid", subeventId)

    // const {status} = useContext(PortfolioContext)

  const [tableData, setTableData] = useState([]);
  const [pagination, setPagination] = useState({ total: 0 });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

 useEffect(() => {
  if (!videoUploadMode) return;

  handleSelectVideo();
}, [videoUploadMode]);

  const handleSelectVideo = async () => {
  try {
    console.log("Video upload triggered");

    await handleSelectFolder(); // wait properly
  } catch (err) {
    console.log(err);
  } finally {
    setVideoUploadMode(false); // reset AFTER complete
  }
};

  useEffect(() => {
      setEventid(eventId);
      setSubeventid(subeventId);
    }, [eventId, subeventId]);

  const fetchVideos = async () => {
    try {
      const res = await axios.get(
        `${baseURL}/videos?page=${page + 1}&limit=${rowsPerPage}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      setTableData(res.data.data);
      setPagination({ total: res.data.total });
    } catch (err){
      // console.log("video error",err?.response?.data?.message)
      toast.error(err?.response?.data?.message);
    }
  };

  // useEffect(() => {
  //   fetchVideos();
  // }, [page, rowsPerPage]);

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      icon: "warning",
      showCancelButton: true,
    });

    if (!confirm.isConfirmed) return;

    await axios.delete(`${baseURL}/videos/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });

    toast.success("Video deleted");
    fetchVideos();
  };

  const handleSelectFolder = async () => {
    const selected = await window.electronAPI.selectVideoFolder();
    if (!selected) return;

    if (selected === uploadVideoState.folderPath) {
      toast.info("Folder already selected");
      return;
    }

    updateUploadVideoState({
      folderPath: selected,
      isUploading: true,
    });

    // console.log("slected folder", selected);
  };

  const columns = [
    { name: "preview", label: "Preview" },
    { name: "file", label: "File" },
    {
      name: "status",
      label: "Status",
      options: {
        customBodyRender: (value) => {
          const map = {
            Completed: "bg-green-500",
            Failed: "bg-red-500",
            Pending: "bg-blue-500",
            Uploading: "bg-yellow-500",
            Compressing: "bg-purple-500",
          };
          return (
            <span
              className={`${map[value]} text-white px-3 py-1 rounded-full text-sm`}
            >
              {value}
            </span>
          );
        },
      },
    },
    { name: "duration", label: "Duration" },
    { name: "time", label: "Time" },
    {
      name: "_id",
      label: "Action",
      options: {
        customBodyRender: (id) => (
          <button onClick={() => handleDelete(id)} className="text-red-600">
            {/* <DeleteIcon /> */}
          </button>
        ),
      },
    },
  ];

  const options = {
    filter: false,
    search: false,
    pagination: false,
    selectableRows: "none",
    download: false,
    print: false,
    viewColumns: false,
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
      {/* <div className="flex justify-end mb-3">
        <button
          onClick={handleSelectFolder}
          disabled={videoStatus === "loading" || status === "loading"}
          className={`bg-blue text-white py-2 px-3 rounded font-semibold transition-colors ${
              videoStatus === "loading" || status === "loading"
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-blueHover"
            }`}
        >
          {videoStatus === "loading" || status === "loading" ? "Uploading..." : "Upload Video Folder"}
        </button>
      </div> */}

      {/* <div className="mb-4">
        {videos && videos.map((v, i) => (
          <div key={i} className="flex gap-3 items-center mb-2">
            <div className="relative">
              <img src={v?.preview} className="w-28 rounded" alt={v?.name} />
              <MovieFilterIcon
                className="absolute bottom-1 right-1 text-white"
                sx={{ fontSize: 16 }}
              />
            </div>
            <div className="flex-1 text-start">
              <p className="text-sm">{v?.name}</p>
              <div className="w-full bg-gray-200 h-2 rounded">
                <div
                  className="bg-blue h-2 rounded"
                  style={{ width: `${v.progress}%` }}
                />
              </div>
              <p className="text-xs">{v?.status}</p>
            </div>
          </div>
        ))}
      </div> */}

      {/* <MUIDataTable data={tableData} columns={columns} options={options} />

      <TablePagination
        component="div"
        count={pagination.total}
        page={page}
        onPageChange={(e, p) => setPage(p)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => setRowsPerPage(+e.target.value)}
      /> */}
    </>
  );
}

export default SyncVideos;
