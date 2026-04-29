import React, { useEffect, useState } from "react";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router-dom";
import { CircularProgress } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import axios from "axios";
import demo from "../../image/demo.jpg";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import EventNoteIcon from "@mui/icons-material/EventNote";
import AddIcon from "@mui/icons-material/Add";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const baseURL = process.env.REACT_APP_BASE_URL;

function Event() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [event, setEvent] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    axios
      .get(`${baseURL}/photographer-team/events`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      .then((response) => {
        setLoading(false);
        setEvent(response.data);
        // console.log(response.data);
      })
      .catch((error) => {
        setLoading(false);
        // console.log(error);
      });
  };

  const handleBack = () => {
    navigate(-1);
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
    navigate(`/photographer_team/search/${searchTerm}`);
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
      <section>
        {loading ? (
          <div className="flex flex-col items-center justify-center h-96 ">
            <CircularProgress className="text-blue-600" />
            <p className="mt-4 text-slate-600 dark:text-slate-300">
              Loading events...
            </p>
          </div>
        ) : (
          <>
            {event && event.length > 0 ? (
              <>
                <div className="flex justify-between items-center flex-wrap md:flex-nowrap">
                  <div className="flex items-center">
                    {/* <ArrowBackIcon
                      sx={{ fontSize: "30px" }}
                      className="bg-slate-300 p-1 rounded text-white cursor-pointer dark:bg-slate-800"
                      onClick={handleBack}
                    /> */}
                  </div>
                  <div className="flex bg-white py-2 px-2 rounded-md w-full md:w-1/2 dark:bg-slate-800">
                    <SearchIcon
                      className="text-slate-400 dark:text-white cursor-pointer"
                      onClick={performSearch}
                    />
                    <input
                      type="text"
                      placeholder="Search events by name...."
                      onChange={handlesearchChange}
                      onKeyDown={handleSearchKeyDown}
                      className="ms-1 border-none outline-none bg-transparent w-full dark:text-white "
                    />
                  </div>
                </div>
                <div className="flex justify-start mt-5">
                  <h1 className="btn text-start bg-white text-sm rounded-md p-2 text-slate-700 font-normal dark:bg-slate-800 dark:text-white">
                    All Events
                  </h1>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 mt-4 gap-3">
                  {event &&
                    event.map((data, index) => (
                      <div
                        className="group overflow-hidden relative rounded-xl bg-white dark:bg-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer "
                        onClick={() =>
                          navigate(`/photographer_team/event/${data._id}`)
                        }
                        key={index}
                      >
                        <div className="overflow-hidden relative rounded-t-xl h-40">
                          <img
                            src={data?.firstPhotoSignedUrl || demo}
                            alt=""
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute rounded-t-xl overflow-hidden inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-opacity duration-300 flex items-end p-3">
                            <span className="text-white font-medium text-sm bg-black/40  px-3 py-1 rounded-full">
                              {data.photoCount || 0} Photos
                            </span>
                          </div>
                          {data.photoCount === 0 && (
                            <div className="absolute bottom-2 right-2">
                              <span className="text-xs bg-red-600 text-white px-2 py-1 rounded-full">
                                No Photos
                              </span>
                            </div>
                          )}
                        </div>
                        <h2 className="text-slate-800 dark:text-white py-2 font-medium text-center text-sm sm:text-base capitalize line-clamp-2 min-h-[2rem] flex items-center justify-center">
                          {data?.name}
                        </h2>
                      </div>
                    ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center w-full min-h-[60vh] py-12 px-4">
                <div className="relative mb-6">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center shadow-lg">
                    <EventNoteIcon
                      sx={{ fontSize: 60 }}
                      className="text-blue-500 dark:text-blue-400"
                    />
                  </div>                  
                </div>

                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                  No Events Yet
                </h2>
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}

export default Event;
