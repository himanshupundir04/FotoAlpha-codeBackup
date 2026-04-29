import React, { useEffect, useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import { useLocation, useNavigate } from "react-router-dom";
import { CircularProgress } from "@mui/material";
import TablePagination from "@mui/material/TablePagination";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import axios from "axios";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import BoltIcon from "@mui/icons-material/Bolt";
import demo from "../../image/demo.jpg";
import { toast, ToastContainer } from "react-toastify";

const baseURL = process.env.REACT_APP_BASE_URL;

function Event() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [event, setEvent] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [pagination, setPagination] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const id = useLocation().pathname.split("/")[3];
  const [permission, setPermission] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [page, rowsPerPage]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseURL}/events/category/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "ngrok-skip-browser-warning": "69420",
        },
        params: {
          page: page + 1,
          limit: rowsPerPage,
        },
      });
      setLoading(false);
      setEvent(response.data.events);
      setPagination(response.data.pagination);
      window.electronAPI.setStore("Events", response.data.events);
      // console.log(response.data.events);
    } catch (error) {
      setLoading(false);
      const cachedSummary = await window.electronAPI.getStore("Events");
      if (cachedSummary) {
        setEvent(cachedSummary);
        // console.log(cachedSummary);
      }
      // console.log(error);
      // console.error("Error fetching:", error.response.data.message);
      const errorMessage = error?.response?.data?.message || "";
      const statusCode = error?.response?.status;

      if (
        statusCode === 403 ||
        errorMessage ===
          "Your trial period has ended. Please upgrade to continue." ||
        errorMessage ===
          "Your trial period of 14 days has ended. Please upgrade to continue."
      ) {
        setPermission(true);
      }
    }
  };

  
 const fetchGuar = async () => {
    try {
      const response = await axios.get(`${baseURL}/v1/subscription/guard/event`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
  
      // console.log(response.data);
  
      if (response.data.canCreate) {
        // setOpen(true);
        navigate("create_event")
      } else {
        toast.error("Limit reached. Please upgrade your plan.");
        
      }
  
    } catch (error) {
      console.error("Error fetching:", error.response?.data?.message);
  
      const errorMessage = error?.response?.data?.message || "";
      const statusCode = error?.response?.status;
  
      if (
        statusCode === 403 ||
        errorMessage === "Your trial period has ended. Please upgrade to continue." ||
        errorMessage === "Your trial period of 14 days has ended. Please upgrade to continue."
      ) {
        // setPermission(true);
      }
    }
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

  const handlesearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      performSearch();
    }
  };

  const performSearch = () => {
    // console.log("Searching for:", searchTerm);
    navigate(`/photographer/search/${searchTerm}`);
  };

  return (
    <>
      {" "}
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
      <ToastContainer/>
      {permission ? ( // <-- check permission first
        <div className="bg-slate-100 p-5 rounded text-center mt-5">
          <ErrorOutlineIcon
            sx={{ fontSize: "50px" }}
            className="text-red-600"
          />
          <h1 className="text-slate-700 font-normal text-2xl">
            You do not have access to this page
          </h1>
          <p className="text-slate-700 font-normal text-sm">
            We're sorry, your plan does not have permission or upgrade to access
            this page
          </p>
          <button
            className="bg-blue rounded px-5 py-2 mt-4 text-white font-normal hover:bg-blueHoverHover"
            onClick={() => navigate("/photographer/upgrade_plan")}
          >
            <BoltIcon /> Upgrade Plan
          </button>
        </div>
      ) : loading ? (
        <div className="flex justify-center mt-5">
          <CircularProgress />
        </div>
      ) : (
        <section>
          <div className="flex justify-between items-center flex-wrap md:flex-nowrap">
            <ArrowBackIcon
              sx={{ fontSize: "30px" }}
              className="bg-slate-300 p-1 rounded text-white cursor-pointer"
              onClick={handleBack}
            />
          </div>
          <>
            {event && event?.length > 0 ? (
              <>
                <div className="flex justify-between items-center">
                  <div className="flex bg-white py-2 px-2 rounded-md w-full md:w-[25%] mt-5 dark:bg-slate-800">
                    <SearchIcon className="text-slate-400 dark:text-gray-400 mr-2 cursor-pointer" onClick={performSearch} />
                    <input
                      type="text"
                      placeholder="Search events by name...."
                      onChange={handlesearchChange}
                      onKeyDown={handleSearchKeyDown}
                      className="border-none text-sm outline-none bg-transparent w-full dark:text-white placeholder-gray-400"
                    />
                  </div>
                  <button
                    className="bg-blue text-white md:px-3 md:py-2 px-2 py-1 text-sm rounded-md font-normal hover:bg-blueHover"
                    onClick={() => fetchGuar()}
                  >
                    <AddIcon sx={{ fontSize: "18px" }} /> Create Event
                  </button>
                </div>
                <div className="">
                  {event && event.length > 0 ? (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4 ">
                        {event.map((data, index) => (
                          <div
                            key={data._id || index}
                            className="group overflow-hidden relative rounded-xl bg-white dark:bg-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer "
                            onClick={() =>
                              navigate(`/photographer/event/${data._id}`)
                            }
                          >
                            <div className="relative rounded-t-xl overflow-hidden">
                              <img
                                src={data?.firstPhotoSignedUrl || demo}
                                alt={data.name}
                                loading="lazy"
                                className="w-full object-cover transition-transform duration-500 group-hover:scale-105 h-[180px]"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-opacity duration-300 flex items-end p-3">
                                <span className="text-white font-medium text-sm bg-black/40 px-3 py-1 rounded-full">
                                  {data?.photoCount || 0} Photos
                                </span>
                              </div>
                              {data?.photoCount === 0 && (
                                <div className="absolute bottom-2 right-2">
                                  <span className="text-xs bg-red-600 text-white px-2 py-1 rounded-full">
                                    No Photos
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="px-2 py-2">
                              <h2 className="text-slate-800 dark:text-white font-medium text-center text-sm sm:text-base capitalize line-clamp-2 min-h-[2rem] flex items-center justify-center">
                                {data.name}
                              </h2>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-8 pt-4">
                        <TablePagination
                          component="div"
                          count={pagination.total}
                          page={page}
                          onPageChange={handleChangePage}
                          rowsPerPage={rowsPerPage}
                          onRowsPerPageChange={handleChangeRowsPerPage}
                          rowsPerPageOptions={[10, 15, 20, 50, 100]}
                          showLastButton
                          className="bg-white text-black dark:bg-slate-800 dark:text-white dark:border-slate-700"
                          sx={{
                            "& .MuiTablePagination-actions svg": {
                              color: "black",
                            },
                            "@media (prefers-color-scheme: dark)": {
                              "& .MuiTablePagination-actions svg": {
                                color: "white",
                              },
                            },
                          }}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col justify-center items-center w-full py-10">
                      <ErrorOutlineIcon
                        sx={{ fontSize: 50 }}
                        className="text-slate-400 mb-4"
                      />
                      <p className="text-xl text-slate-600 dark:text-white mb-4">
                        No events to show
                      </p>
                      <button
                        className="bg-blue hover:bg-blue-700 text-white text-sm rounded-md font-medium px-4 py-2 transition-colors"
                        onClick={() => navigate("create_event")}
                      >
                        Create Event
                      </button>
                    </div>
                  )}
                </div>
                {/* <div className="mt-5 col-span-3">
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
                    sx={{
                      "& .MuiTablePagination-actions svg": {
                        color: "black", // light mode
                      },
                    }}
                  />
                </div> */}
              </>
            ) : (
              <>
                <div className="flex flex-col justify-center items-center w-full col-span-3 mt-10">
                  <ErrorOutlineIcon
                    sx={{ fontSize: 50 }}
                    className="text-slate-400"
                  />
                  <p className="text-xl text-slate-600 dark:text-white">
                    No events to show
                  </p>
                </div>
                <div className="flex justify-center items-center flex-wrap md:flex-nowrap mt-2">
                  <button
                    className="bg-blue w-36 text-white md:px-3 md:py-2 px-2 py-1 text-sm rounded-md font-normal hover:bg-blueHover"
                    onClick={() => navigate("create_event")}
                  >
                    Create Event
                  </button>
                </div>
              </>
            )}
          </>
        </section>
      )}
    </>
  );
}

export default Event;
