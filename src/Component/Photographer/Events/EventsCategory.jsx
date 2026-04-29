import React, { useContext, useEffect, useState } from "react";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { CircularProgress } from "@mui/material";
import demo from "../../image/demo.jpg";
import { PhotographerEventContext } from "../Context/PhotographerEventContext";

const baseURL = process.env.REACT_APP_BASE_URL;

function EventsCategory() {
  const navigate = useNavigate();
  const [category, setCategory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const { setCategoryname } = useContext(PhotographerEventContext);

  useEffect(() => {
    fetchEventsCategory();
  }, []);

  const fetchEventsCategory = async () => {
    setLoading(true);
    axios
      .get(`${baseURL}/photographer/event-category`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "ngrok-skip-browser-warning": "69420",
        },
      })
      .then((response) => {
        setLoading(false);
        const categories = response?.data?.categories || [];
        const nonEmptyCategories = categories.filter(
          (cat) => cat.eventCount > 0
        );
        setCategory(nonEmptyCategories);
        // console.log(response.data.categories);
      })
      .catch((error) => {
        setLoading(false);
        // console.log(error);
      });
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

  const handleCategory = (name, id) => {
    setCategoryname(name);
    navigate(id);
  };

  return (
    <>
      <section>
        {loading ? (
      <div className="flex flex-col items-center justify-center h-96 ">
        <CircularProgress className="text-blue-600" />
        <p className="mt-4 text-slate-600 dark:text-slate-300">
          Loading events categories...
        </p>
      </div>
        ) : category.length === 0 ? (
          <div className="flex items-center justify-center min-h-[500px]">
            <div className="w-full max-w-md">
              {/* Gradient Card Container */}
              <div className="bg-gradient-to-br from-blue/5 via-white to-cyan-400/5 dark:from-slate-800/50 dark:via-slate-900 dark:to-slate-800/50 rounded-2xl p-8 border border-blue/10 dark:border-slate-700/50 shadow-xl">
                
                {/* Icon Container */}
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue to-cyan-400 rounded-full blur opacity-20"></div>
                    <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue/20 to-cyan-400/20 border border-blue/30">
                      <svg className="w-10 h-10 text-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Heading */}
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-3">
                  No Categories Yet
                </h2>

                {/* Subheading */}
                <p className="text-base text-slate-700 dark:text-slate-300 text-center mb-2 font-medium">
                  Start Creating Events
                </p>

                {/* Description */}
                <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-8 leading-relaxed">
                  You don't have any events in your categories yet. Create your first event to populate the available categories and start growing your portfolio.
                </p>

                {/* Stats or Tips Section */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-white dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700/50 text-center">
                    <svg className="w-6 h-6 text-blue mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs font-semibold text-slate-700 dark:text-white">Quick Setup</p>
                  </div>
                  <div className="bg-white dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700/50 text-center">
                    <svg className="w-6 h-6 text-cyan-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <p className="text-xs font-semibold text-slate-700 dark:text-white">Get Booked</p>
                  </div>
                </div>

                {/* Primary CTA Button */}
                <button
                  onClick={() => navigate("/photographer/create_event")}
                  className="w-full bg-gradient-to-r from-blue to-cyan-400 hover:from-blue/90 hover:to-cyan-400/90 text-white font-semibold py-3 px-6 rounded-lg transition duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 mb-4"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Your First Event
                </button>

                {/* Secondary text */}
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                  💡 Tip: Add different categories like Wedding, Corporate, Portrait, etc.
                </p>
              </div>

              {/* Additional info below card */}
              <div className="mt-8 grid grid-cols-3 gap-4 px-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue">100%</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Free to Start</p>
                </div>
                <div className="text-center border-l border-r border-slate-200 dark:border-slate-700">
                  <p className="text-2xl font-bold text-cyan-400">0%</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Hidden Fees</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-500">∞</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Unlimited Events</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-end">
              <div className="bg-white flex py-2 px-3 dark:bg-slate-800 rounded-md w-full  text-start md:w-[20%]">
                <SearchIcon className="text-slate-400 dark:text-white cursor-pointer" onClick={performSearch} />
                <input
                  type="text"
                  name="search"
                  onChange={handlesearchChange}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search events by name...."
                  className="w-full ms-2 text-sm border-none outline-none bg-transparent dark:text-white"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mt-5">
              <h1 className="btn text-start bg-white text-sm rounded-md p-2 w-max text-slate-700 font-normal dark:bg-slate-800 dark:text-white">
                All Events Category
              </h1>
              <p className="text-green-700 text-sm text-end border mt-2 sm:mt-0 w-max border-green-600 rounded-full bg-green-100 py-1 px-3">
                Choose a category to start creating your event.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8 mt-6 px-4">
              {category &&
                category.map((cat, index) => (
                  <div
                    key={index}
                    className="group relative overflow-hidden rounded-xl bg-white dark:bg-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer aspect-square flex flex-col"
                    onClick={() => handleCategory(cat?.name, cat?._id)}
                  >
                    <div className="relative flex-1 overflow-hidden">
                      <img
                        src={cat?.imageUrl || demo}
                        alt={cat?.name}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                        <span className="text-white font-medium text-sm bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full">
                          {cat?.eventCount || 0} Events
                        </span>
                      </div>
                    </div>
                    <div className="px-3 py-2">
                      <h2 className="text-slate-800 dark:text-white font-medium text-center text-sm sm:text-base capitalize line-clamp-2 min-h-[2.5rem] flex items-center justify-center">
                        {cat?.name}
                      </h2>
                    </div>
                  </div>
                ))}
            </div>
          </>
        )}
      </section>
    </>
  );
}

export default EventsCategory;
