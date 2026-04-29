import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { CircularProgress } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import BoltIcon from "@mui/icons-material/Bolt";
import AddIcon from "@mui/icons-material/Add";
import demo from "../../image/demo.jpg"

const baseURL = process.env.REACT_APP_BASE_URL;

function Album() {
  const [event, setEvent] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
   const [permission, setPermission] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseURL}/events/all-events`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "ngrok-skip-browser-warning": "69420",
        },
      });
      setEvent(response.data.events);
      setLoading(false)
    } catch (error) {
      setLoading(false)
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

 return (
  <>
    {loading ? (
      <div className="flex flex-col items-center justify-center h-96 bg-white dark:bg-slate-900 rounded-lg shadow-sm p-6">
        <CircularProgress className="text-blue-600" />
        <p className="mt-4 text-slate-600 dark:text-slate-300">
          Loading albums...
        </p>
      </div>
    ) : permission ? (  // <-- check permission first
      <div className="bg-slate-100 p-5 rounded text-center mt-5">
        <ErrorOutlineIcon
          sx={{ fontSize: "50px" }}
          className="text-red-600"
        />
        <h1 className="text-slate-700 font-normal text-2xl">
          You do not have access to this page
        </h1>
        <p className="text-slate-700 font-normal text-sm">
          We're sorry, your plan does not have permission to access this page
        </p>
        <button
          className="bg-blue rounded px-5 py-2 mt-4 text-white font-normal hover:bg-blueHoverHover"
          onClick={() => navigate("/photographer/upgrade_plan")}
        >
          <BoltIcon /> Upgrade Plan
        </button>
      </div>
    ) : event?.length === 0 ? (  // <-- check for empty events
      <div className="text-center w-full max-w-md mx-auto pt-12">
        <div className="mb-6">
          <AddIcon sx={{ fontSize: 80, color: "#9CA3AF", mb: 2 }} />
        </div>
        <p className="text-slate-700 font-medium text-xl dark:text-white mb-2">
          No Events Created
        </p>
        <p className="text-slate-500 dark:text-slate-400 mb-6">
          Albums are created from your event photos. Create your first event to get started
        </p>
        <button
          className="bg-blue rounded px-6 py-3 text-white font-semibold hover:bg-blueHoverHover transition-all duration-300 inline-flex items-center gap-2"
          onClick={() => navigate("/photographer/create_event")}
        >
          <AddIcon sx={{ fontSize: 20 }} />
          Create Your First Event
        </button>
      </div>
    ) : (
      <div>
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            Your Albums
          </h2>
          {/* <button
            className="bg-blue rounded px-4 py-2 text-white font-semibold hover:bg-blueHoverHover transition-all duration-300 inline-flex items-center gap-2"
            onClick={() => navigate("/photographer/album/create")}
          >
            <AddIcon sx={{ fontSize: 18 }} />
            Create Album
          </button> */}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {event.map((album) => (
          <div
            key={album?._id}
            className="overflow-hidden bg-white rounded-lg shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer group dark:bg-slate-800"
            onClick={() => navigate(`/photographer/album/${album?._id}`)}
          >
            <div className="relative overflow-hidden bg-slate-100 dark:bg-slate-700 h-48 flex items-center justify-center">
              <img
                src={
                  album?.firstPhotoSignedUrl ||
                  demo
                }
                alt={`Cover for ${album?.name}`}
                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="p-4">
              <h2 className="text-slate-700 font-semibold text-center capitalize w-full dark:text-white line-clamp-2">
                {album?.name}
              </h2>            
            </div>
          </div>
        ))}
        </div>
      </div>
    )}
  </>
);

}

export default Album;
