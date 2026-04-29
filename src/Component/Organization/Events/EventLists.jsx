import { CircularProgress } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import MUIDataTable from "mui-datatables";
import React, { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import BoltIcon from "@mui/icons-material/Bolt";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import demo from "../../image/demo.jpg";
import BorderColorIcon from "@mui/icons-material/BorderColor";
import { PortfolioEventContext } from "../Context/PortfolioEventContext";
import Swal from "sweetalert2";
import { format } from "date-fns";
import SearchIcon from "@mui/icons-material/Search";

const baseUrl = process.env.REACT_APP_BASE_URL;
function EventLists() {
  const [loading, setLoading] = useState(false);
  const [permission, setPermission] = useState(false);
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [searchText, setSearchText] = useState("");
  const [status, setStatus] = useState("");
  const { setPortfolioEvent } = useContext(PortfolioEventContext);

  useEffect(() => {
    fetchAllevent("", "", "", status);
  }, [status]);

  const handleSearchText = () => {
    if (searchText.trim() === "") {
      fetchAllevent(fromDate, toDate);
    } else {
      fetchAllevent(fromDate, toDate, searchText);
    }
  };

  const fetchAllevent = async (
    from = "",
    to = "",
    search = "",
    status = ""
  ) => {
    setLoading(true);
    const query = new URLSearchParams();
    if (from) query.append("startDate", from);
    if (to) query.append("endDate", to);
    if (search) query.append("search", search);
    if (status) query.append("status", status);
    try {
      const response = await axios.get(
        `${baseUrl}/events/all-events?${query.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const events =
        response?.data?.events?.map((ev) => ({
          firstPhoto: ev?.firstPhotoSignedUrl,
          eventName: ev?.name,
          category: ev?.eventCategoryId?.name,
          startDate: ev?.timeSlots?.[0]?.date,
          eventid: ev?._id,
        })) || [];
      setEvents(events);
      setFromDate("");
      setToDate("");
      setSearchText("");
      setLoading(false);
    } catch (error) {
      console.log(error.response?.data?.message);
      setLoading(false);
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

  const handleDateSearch = () => {
    if (!fromDate && !toDate) {
      toast.warning("Please select a date range", { autoClose: 1500 });
      return;
    }
    fetchAllevent(fromDate, toDate);
  };

  const handleEdit = (data) => {
    // console.log(data);
    const eventId = data[4];
    fetchEvents(eventId);
    navigate(`/organization/event/${eventId}/edit_event`);
  };

  const fetchEvents = async (eventId) => {
    axios
      .get(`${baseUrl}/events/${eventId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "ngrok-skip-browser-warning": "69420",
        },
      })
      .then((response) => {
        setPortfolioEvent(response.data.event);
        // console.log(response.data.event);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const data = events;

  const tableOptions = {
    filter: false,
    search: false,
    download: false,
    print: false,
    viewColumns: false,
    selectableRows: "none",
    responsive: "standard",
    pagination: true,
    rowsPerPageOptions: [10, 25, 50],
    textLabels: {
      body: {
        noMatch: loading ? "Loading..." : "No events found",
      },
    },
    
    onRowClick: (rowData, rowMeta) => {
      const clickedEvent = data[rowMeta.dataIndex];
      const eventId = clickedEvent.eventid;

      navigate(`/organization/event/${eventId}`);
    },
  };

  const columns = [
    {
      name: "firstPhoto",
      label: "IMAGE",
      options: {
        filter: false,
        sort: false,
        customBodyRender: (value) => {
          return (
            <div className="w-16 h-16 rounded-md overflow-hidden border border-slate-200 dark:border-slate-700">
              <img
                src={value || demo}
                alt="event"
                className="w-full h-full object-cover"
              />
            </div>
          );
        },
      },
    },
    {
      name: "eventName",
      label: "Event Name",
      options: {
        filter: false,
        sort: true,
        customBodyRender: (value) => {
          return (
            <span className="font-medium text-slate-800 dark:text-white">
              {value}
            </span>
          );
        },
      },
    },
    {
      name: "category",
      label: "Category",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value) => {
          return (
            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue dark:bg-blue-900 dark:text-white">
              {value}
            </span>
          );
        },
      },
    },
    {
      name: "startDate",
      label: "Date",
      options: {
        filter: false,
        sort: true,
        customBodyRender: (value) => {
          return (
            <div className="flex flex-col">
              <span className="text-sm font-medium text-slate-900 dark:text-white">
                {format(new Date(value), "MMM dd, yyyy")}
              </span>
             
            </div>
          );
        },
      },
    },
    {
      name: "eventid",
      label: "ACTIONS",
      options: {
        filter: false,
        sort: false,
        customBodyRender: (value, tableMeta) => {
          const rowData = tableMeta.rowData;
          return (
            <div className="flex items-center space-x-2">
              <button
                 onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(rowData);
                }}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue hover:bg-blue dark:bg-blue dark:text-white dark:hover:bg-blue-800 transition-colors duration-200"
                title="Edit Event"
              >
                <BorderColorIcon className="w-4 h-4 mr-1" />
                Edit
              </button>
              <button
                 onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteEvent(value);
                }}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-600 dark:hover:bg-red-800/50 transition-colors duration-200"
                title="Delete Event"
              >
                <DeleteIcon className="w-4 h-4 mr-1" />
                Delete
              </button>
            </div>
          );
        },
      },
    },
  ];

  const handleDeleteEvent = (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You are about to delete this event. All associated data and photos will also be permanently deleted. This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes!",
    }).then((result) => {
      if (result.isConfirmed) {
        axios
          .delete(`${baseUrl}/events/${id}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "ngrok-skip-browser-warning": "69420",
            },
          })

          .then(() => {
            toast.success("Event and all related data deleted successfully", {
              autoClose: 1200,
            });
            fetchAllevent();
          })
          .catch((err) => {
            toast.error(err?.response?.data?.message || err?.message, {
              autoClose: 2000,
            });
            console.log(err);
          });
      }
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 ">
        <CircularProgress className="text-blue-600" />
        <p className="mt-4 text-slate-600 dark:text-slate-300">
          Loading events...
        </p>
      </div>
    );
  }

  if (permission) {
    return (
      <div className="bg-slate-100 p-5 rounded text-center mt-5">
        <ErrorOutlineIcon sx={{ fontSize: "50px" }} className="text-red-600" />
        <h1 className="text-slate-700 font-normal text-2xl">
          You do not have access to this page
        </h1>
        <p className="text-slate-700 font-normal text-sm">
          We're sorry, your plan does not have permission or upgrade to access
          this page
        </p>
        <button
          className="bg-blue rounded px-5 py-2 mt-4 text-white font-normal hover:bg-blueHoverHover"
          onClick={() => navigate("/organization/upgrade_plan")}
        >
          <BoltIcon /> Upgrade Plan
        </button>
      </div>
    );
  }

    const handleClear = () => {
    setFromDate("");
    setToDate("");
    setSearchText("");
    setStatus("");
    fetchAllevent();
  };

  return (
    <>
      <style>
        {`
          .no-shadow {
            box-shadow: none !important;
          }
          .MuiTableCell-root.MuiTableCell-head{
                font-weight: bold !important;
                color: #212935ff;
            }
          .MuiTableCell-head {
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: hidden;
          }
          .css-1fnc9ax-MuiButtonBase-root-MuiButton-root {
            padding: 5px 0px;
            justify-content: start;
          }
           .MuiTableRow-root {
  cursor: pointer;
}
        `}
      </style>
      <div className="text-start  ">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex flex-col">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
                    All Events
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {data.length} {data.length === 1 ? "event" : "events"} found
                  </p>
                </div>
                <button
                  onClick={() => navigate("/organization/create_event")}
                  className="inline-flex items-center px-4 py-2 bg-blue hover:bg-blueHover text-white text-sm font-medium rounded-lg transition-colors duration-200 whitespace-nowrap"
                >
                  <AddIcon className="w-5 h-5 mr-1" />
                  Create Event
                </button>
              </div>
              <div className="flex flex-col lg:flex-row justify-between items-center mt-4">
                <div className="flex items-center gap-3">
                  <p className="text-slate-700 text-sm dark:text-white">From</p>
                  <input
                    type="date"
                    name="from"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="border border-slate-300 w-full md:w-max  rounded-lg px-1 py-2 text-slate-700"
                  />
                  <p className="text-slate-700 text-sm dark:text-white">To</p>
                  <input
                    type="date"
                    name="to"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="border border-slate-300 w-full md:w-max rounded-lg px-1 py-2 text-slate-700"
                  />
                  <button
                    className="bg-blue p-2 text-white w-[100%] md:w-max font-semibold hover:bg-blueHover rounded-lg"
                    onClick={handleDateSearch}
                  >
                    Search
                  </button>
                </div>
                <div className="flex flex-wrap mt-4 lg:mt-0 items-center gap-3 w-full md:w-auto">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="border border-slate-300 rounded-lg p-2 outline-none w-full md:max-w-[130px]"
                  >
                    <option disabled>Select Status</option>
                    <option selected value="">
                      All
                    </option>
                    <option value="upcoming">Upcoming</option>
                    <option value="completed">Completed</option>
                  </select>
                 
                  <div className="relative flex w-full md:w-max md:min-w-[150px]">
                    <div className="flex items-center gap-2 w-max p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                      <input
                        type="text"
                        placeholder="Search events..."
                        value={searchText}
                        name="search"
                        onChange={(e) => setSearchText(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleSearchText()
                        }
                        className="w-[150px] outline-none"
                      />
                      <SearchIcon
                        onClick={handleSearchText}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleSearchText();
                          }
                        }}
                        className="text-blue cursor-pointer hover:text-blueHover"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleClear}
                    className="border border-blue text-blue rounded-lg px-3 py-2"
                  >
                    Clear
                  </button>
                   <button
                    onClick={() => {
                      // Trigger CSV download
                      const csvContent = [
                        ["Event Name", "Category", "Date"],
                        ...data.map((event) => [
                          event.eventName,
                          event.category,
                          format(new Date(event.startDate), "MMM dd, yyyy"),
                          
                        ]),
                      ]
                        .map((row) => row.join(","))
                        .join("\n");

                      const blob = new Blob([csvContent], {
                        type: "text/csv;charset=utf-8;",
                      });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement("a");
                      link.href = url;
                      link.download = `events-${
                        new Date().toISOString().split("T")[0]
                      }.csv`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="inline-flex items-center p-2 w-full md:w-max justify-center items-center border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200"
                    title="Download CSV"
                  >
                    <svg
                      className="w-5 h-5 mr-1.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    CSV
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="">
            {data.length === 0 ? (
              <div className="flex items-center justify-center min-h-[500px] p-8">
                <div className="w-full max-w-2xl">
                  {/* Gradient Card Container */}
                  <div className="bg-gradient-to-br from-blue/5 via-white to-cyan-400/5 dark:from-slate-800/50 dark:via-slate-900 dark:to-slate-800/50 rounded-2xl p-12 border border-blue/10 dark:border-slate-700/50 shadow-xl">
                    
                    {/* Icon Container */}
                    <div className="flex justify-center mb-6">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue to-cyan-400 rounded-full blur opacity-20"></div>
                        <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue/20 to-cyan-400/20 border border-blue/30">
                          <svg className="w-12 h-12 text-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Heading */}
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white text-center mb-3">
                      No Events Yet
                    </h2>

                    {/* Subheading */}
                    <p className="text-lg text-slate-700 dark:text-slate-300 text-center mb-2 font-medium">
                      Start Your Journey
                    </p>

                    {/* Description */}
                    <p className="text-base text-slate-600 dark:text-slate-400 text-center mb-10 leading-relaxed max-w-lg mx-auto">
                      You haven't created any events yet. Create your first event to start showcasing your photography work and attract clients.
                    </p>

                    {/* Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                      <div className="bg-white dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700/50 text-center hover:border-blue/30 dark:hover:border-blue/30 transition-colors">
                        <svg className="w-6 h-6 text-blue mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <p className="text-sm font-semibold text-slate-700 dark:text-white">Fast Setup</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Create in minutes</p>
                      </div>
                      <div className="bg-white dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700/50 text-center hover:border-blue/30 dark:hover:border-blue/30 transition-colors">
                        <svg className="w-6 h-6 text-cyan-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm font-semibold text-slate-700 dark:text-white">Attract Clients</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Get more bookings</p>
                      </div>
                      <div className="bg-white dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700/50 text-center hover:border-blue/30 dark:hover:border-blue/30 transition-colors">
                        <svg className="w-6 h-6 text-green-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm font-semibold text-slate-700 dark:text-white">Easy Management</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Full control & analytics</p>
                      </div>
                    </div>

                    {/* Primary CTA Button */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <button
                        onClick={() => navigate("/organization/create_event")}
                        className="flex-1 sm:flex-none bg-gradient-to-r from-blue to-cyan-400 hover:from-blue/90 hover:to-cyan-400/90 text-white font-semibold py-3 px-8 rounded-lg transition duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Your First Event
                      </button>
                      <button
                        onClick={() => navigate("/organization/events_category")}
                        className="flex-1 sm:flex-none border-2 border-blue text-blue hover:bg-blue/5 dark:hover:bg-blue/10 dark:text-cyan-400 dark:border-cyan-400 font-semibold py-3 px-8 rounded-lg transition duration-300 flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        Browse Categories
                      </button>
                    </div>

                    {/* Secondary text */}
                    <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-6">
                      💡 Tip: Start with a category like Wedding, Portrait, or Corporate to organize your work
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <MUIDataTable
                data={data}
                columns={columns}
                options={tableOptions}
                className="no-shadow bg-white dark:bg-slate-800 dark:text-white mt-5"
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default EventLists;

