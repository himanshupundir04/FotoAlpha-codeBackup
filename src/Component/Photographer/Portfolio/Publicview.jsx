import React, { useCallback, useEffect, useRef, useState } from "react";
import LocationPinIcon from "@mui/icons-material/LocationPin";
import { Box, CircularProgress, Modal, Skeleton } from "@mui/material";
import InstagramIcon from "@mui/icons-material/Instagram";
import FacebookRoundedIcon from "@mui/icons-material/FacebookRounded";
import YouTubeIcon from "@mui/icons-material/YouTube";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import axios from "axios";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import { Dialog } from "@mui/material";
import demo from "../../image/demo.jpg";
import { useNavigate } from "react-router-dom";
import Slider from "react-slick";
import profile from "../../image/profile-avatar.jpg";
import cover from "../../image/cover-avatar.jpg";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { toast } from "react-toastify";

const baseURL = process.env.REACT_APP_BASE_URL;

function Publicview() {
  const [profilePreview, setProfilePreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [portfolio, setPortfolio] = useState({});
  const [photos, setPhotos] = useState([]);
  const [view, setView] = useState(false);
  const [zoomImg, setZoomImg] = useState(null);
  const [zoomIndex, setZoomIndex] = useState(null);
  const [zoomSource, setZoomSource] = useState("photos");
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [folders, setFolders] = useState([]);
  const [photosFolder, setPhotosFolder] = useState([]);
  const [hasMoreFolder, setHasMoreFolder] = useState(false);
  const [loadingFolderPhotos, setLoadingFolderPhotos] = useState(false);
  const users = JSON.parse(localStorage.getItem("users")) || [];
  const currentUser = users.find((u) => u.isCurrent);
  const navigate = useNavigate();
  const loaderRef = useRef(null);
  const pageRef = useRef(1);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState({});
  const [activeTab, setActiveTab] = useState("photos");
  const [expanded, setExpanded] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [hoverIndex, setHoverIndex] = useState({}); // store index per folder
  const [intervals, setIntervals] = useState({});
  const [openfolder, setOpenfolder] = useState(false);
  const handleClosefolder = () => setOpenfolder(false);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 6);
  };
  const [visibleCount, setVisibleCount] = useState(6);
  const [showAll, setShowAll] = useState(false);
  const displayedFolders = showAll ? folders : folders?.slice(0, 2);
  const [filter, setFilter] = useState("All");
  const scrollRef = useRef(null);
  const [showFade, setShowFade] = useState(true);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      // Hide fade when user reaches the end of the scroll
      setShowFade(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  const [currentIndex, setCurrentIndex] = useState(0);

  const itemsPerView = 2; // since you use 50% width

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    axios
      .get(`${baseURL}/portfolio/me`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "ngrok-skip-browser-warning": "69420",
        },
      })
      .then((response) => {
        setPortfolio(response.data.data);
        setProfilePreview(response.data.data.profileImageSignedUrl);
        setCoverPreview(response.data.data.coverImageSignedUrl);
        // console.log(response.data.data);
      })
      .catch((error) => {
        // console.log(error);
      });
  };

  // Auto-fetch on filter change
  useEffect(() => {
    // setLoadingFilter(true);
    setPhotos([]);
    setCurrentPage(1);
    setImageLoaded({});

    if (filter === "All" || !selectedFolder) {
      // Fetch all photos
      fetchPhotos(1, 20);
    } else {
      // Fetch folder photos
      fetchPhotosFolder(selectedFolder);
    }
  }, [filter, selectedFolder, portfolio]);

  useEffect(() => {
    fetchFolder();
  }, []);

  useEffect(() => {
    const totalSlots = 24;

    if (folders.length > 0) {
      // If there are folders, limit photos based on remaining slots
      const imageLimit = totalSlots - folders.length;
      fetchPhotos(1, imageLimit);
    } else {
      // If there are no folders, fetch the full limit
      fetchPhotos(1, totalSlots);
    }
  }, [folders]);

  const fetchFolder = () => {
    axios
      .get(`${baseURL}/folders/user/${currentUser._id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "ngrok-skip-browser-warning": "69420",
        },
      })
      .then((response) => {
        // console.log(response.data);
        setFolders(response.data);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const loadMorePhotos = useCallback(() => {
    const nextPage = pageRef.current + 1;
    fetchPhotos(nextPage);
    pageRef.current = nextPage;
    setCurrentPage(nextPage);
  }, []);

  useEffect(() => {
    if (!initialLoaded || view) return; // ✅ wait until initial load is done

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMorePhotos();
        }
      },
      { threshold: 0.5 },
    );

    const currentLoader = loaderRef.current;
    if (currentLoader) observer.observe(currentLoader);

    return () => {
      if (currentLoader) observer.unobserve(currentLoader);
    };
  }, [photos, hasMore, loadMorePhotos, view, initialLoaded]);

  const fetchPhotos = async (page = 1, limit = 20) => {
    try {
      const response = await axios.get(`${baseURL}/portfolio/photos`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "ngrok-skip-browser-warning": "69420",
        },
        params: { page, limit, userId: currentUser.username },
      });

      const newPhotos = response.data.data;

      if (page === 1) {
        setPhotos(newPhotos);
        setInitialLoaded(true); // ✅ mark page 1 as loaded
      } else {
        setPhotos((prev) => [...prev, ...newPhotos]);
      }
      if (newPhotos.length < 10) {
        setHasMore(false);
      }
    } catch (error) {
      setHasMore(false);
      console.log(error);
    }
  };

  const fetchPhotosFolder = async (id, page = 1) => {
    // console.log("id", id);
    setLoadingFolderPhotos(true);
    axios
      .get(`${baseURL}/portfolio/photos`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "ngrok-skip-browser-warning": "69420",
        },
        params: { page, limit: 10, folderId: id, userId: currentUser.username },
      })
      .then((response) => {
        const newPhotos = response.data.data;
        setPhotosFolder(newPhotos);
        // console.log(response.data.data);
        setLoadingFolderPhotos(false);

        if (page === 1) {
          setPhotos(newPhotos);
        } else {
          setPhotos((prev) => [...prev, ...newPhotos]);
        }
        // Optional: Check if more photos are available
        if (newPhotos.length < 10) {
          setHasMoreFolder(false); // Stop fetching if less than limit returned
        }
      })
      .catch((error) => {
        // console.log(error);
        setLoadingFolderPhotos(false);
      });
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleSharePortfolio = () => {
    const currentUser = users.find((u) => u.isCurrent);
    // Use email as username or a username field if available
    const username = currentUser?.email || currentUser?.username;
    const shareUrl = `${window.location.origin}/portfolio/${username}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Portfolio link copied to clipboard!");
  };

  const handleImageLoad = (index) => {
    setImageLoaded((prev) => ({ ...prev, [index]: true }));
  };

  const handleMouseEnter = (folderId, totalImages) => {
    // reset hoverIndex for this folder
    setHoverIndex((prev) => ({ ...prev, [folderId]: 0 }));

    // start interval
    const interval = setInterval(() => {
      setHoverIndex((prev) => {
        const current = prev[folderId] || 0;
        return { ...prev, [folderId]: (current + 1) % totalImages };
      });
    }, 800); // change every 1s

    setIntervals((prev) => ({ ...prev, [folderId]: interval }));
  };

  const handleMouseLeave = (folderId) => {
    clearInterval(intervals[folderId]);
    setIntervals((prev) => {
      const newIntervals = { ...prev };
      delete newIntervals[folderId];
      return newIntervals;
    });
    // reset to first image when leaving
    setHoverIndex((prev) => ({ ...prev, [folderId]: 0 }));
  };

  const getSlideClass = (index) => {
    if (folders.length <= 2) return "";
    return index % 2 === 1
      ? "opacity-60 blur-sm transition-all duration-500"
      : "";
  };

  const style = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: {
      xs: "90%", // mobile screens
      sm: "90%", // small screens and up
      md: "90%", // medium screens and up
    },
  };

  const tabs = [
    { id: "photos", label: "Photos" },
    { id: "about", label: "About" },
    { id: "pricing", label: "Pricing" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "about":
        return (
          <>
            <div className="mt-5">
              {portfolio?.biography ? (
                <div className="text-slate-700 text-start">
                  <p
                    className={`capitalize dark:text-white ${
                      expanded ? "line-clamp-none" : "line-clamp-2"
                    }`}
                  >
                    {portfolio?.biography}
                  </p>
                  {portfolio?.biography?.length > 100 && (
                    <button
                      onClick={() => setExpanded(!expanded)}
                      className="text-blue text-sm mt-1"
                    >
                      {expanded ? "Show less" : "Read more"}
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex justify-center items-center py-8">
                  <p className="text-gray-500 dark:text-white font-medium">
                    No about us to show
                  </p>
                </div>
              )}
            </div>
          </>
        );
      case "photos":
        return (
          <>
            <div className="mt-5">
              <div className="bg-white rounded dark:bg-slate-800">
                {photos.length === 0 ? (
                  <div className="flex justify-center items-center py-8">
                    <p className="text-gray-500 dark:text-white font-medium">
                      No photos to show
                    </p>
                  </div>
                ) : (
                  <>
                    <ul className="flex flex-wrap items-center text-slate-700 font-normal gap-3 ">
                      {folders && folders.length > 0 && (
                        <p className="font-normal text-slate-700 dark:text-white">
                          Specialties:
                        </p>
                      )}
                      {folders &&
                        folders.map((data) => (
                          <li
                            key={data._id}
                            className={`capitalize cursor-pointer border border-slate-300 rounded px-2 py-1 dark:text-white ${
                              selectedFolder === data._id
                                ? "bg-blue text-white"
                                : ""
                            }`}
                            onClick={() => setSelectedFolder(data._id)} // update selected folder
                          >
                            {data.name}
                          </li>
                        ))}
                    </ul>
                    <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 gap-5 mt-4">
                      {folders &&
                        folders.map((folder) => {
                          const isSelected = folder._id === selectedFolder; // highlight if selected
                          const images = folder?.randomPhotos || [];
                          const currentIndex = hoverIndex[folder._id] || 0;

                          return (
                            <div
                              key={folder._id}
                              className={`group text-center md:h-44 h-32 relative cursor-pointer rounded ease-in-out duration-500 overflow-hidden
                              ${
                                isSelected
                                  ? "scale-105 border-2 border-blue"
                                  : "hover:scale-105"
                              }`}
                              onClick={() => {
                                setOpenfolder(true);
                                fetchPhotosFolder(folder._id, images);
                                setSelectedFolder(folder._id); // highlight on folder click too
                              }}
                              onMouseEnter={() =>
                                handleMouseEnter(folder._id, images.length)
                              }
                              onMouseLeave={() => handleMouseLeave(folder._id)}
                            >
                              <img
                                src={images[currentIndex]?.signedUrl || demo}
                                alt="album"
                                className={`absolute top-0 left-0 w-full md:h-44 h-32 object-cover rounded border border-slate-300 transition-all duration-500 filter grayscale hover:grayscale-0 ${
                                  isSelected ? "grayscale-0" : ""
                                }`}
                              />
                              <div className="w-full m-auto flex justify-center">
                                <button className="absolute bottom-2 font-normal bg-black/50 text-lg w-full h-max text-white capitalize">
                                  {folder?.name}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                    <div className="mt-5 grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 gap-5">
                      {photos &&
                        photos.map((photo, index) => {
                          const isNearEnd = index === photos.length - 4;
                          return (
                            <div
                              key={index}
                              ref={isNearEnd ? loaderRef : null}
                              className="relative bg-slate-100 md:h-48 h-32 group md:hover:scale-105 ease-in-out duration-500 cursor-pointer"
                            >
                              {!imageLoaded[index] && (
                                <Skeleton
                                  sx={{ color: "gray.900" }}
                                  variant="rounded"
                                  animation="wave"
                                  width="100%"
                                  height="100%"
                                  className="absolute top-0 left-0 z-10"
                                />
                              )}
                              <img
                                src={photo.signedUrl || demo}
                                alt="portfolio"
                                className="rounded md:h-48 h-32 absolute w-full top-0 border border-slate-300 object-cover cursor-pointer"
                                loading="lazy"
                                onLoad={() => handleImageLoad(index)}
                              />
                              <span
                                className="absolute top-0 p-2 rounded font-normal text-xl w-full h-full hover:bg-black/30 shadow ease-in-out duration-300"
                                onClick={() => {
                                  setZoomImg(photo.signedUrl);
                                  setZoomIndex(index);
                                  // setZoomSource("photos");
                                }}
                              ></span>
                            </div>
                          );
                        })}
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        );
      case "pricing":
        return (
          <>
            <div className="mt-5">
              {portfolio?.pricing ? (
                <>
                  <div className="flex items-baseline gap-1 text-start ">
                    <span className="text-2xl font-bold text-slate-700 dark:text-white">
                      ₹ {portfolio?.pricing?.toLocaleString("en-IN")}
                    </span>
                    <span className="text-sm text-slate-500 dark:text-white">
                      per day
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-center items-center">
                    <p className="text-gray-500 dark:text-white font-medium">
                      No pricing to show
                    </p>
                  </div>
                </>
              )}
            </div>
          </>
        );
      default:
        return null;
    }
  };

  var settings = {
    dots: false,
    infinite: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    initialSlide: 0,
    autoplay: true,
    autoplaySpeed: 2000,
    cssEase: "linear",
  };

  const handleNext = () => {
    if (currentIndex < folders.length - itemsPerView) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  return (
    <>
      <style>
        {`
          .MuiModal-root .MuiModal-backdrop {
            background-color: rgb(0 0 0 / 62%);
            backdrop-filter: blur(6px);
            -webkit-backdrop-filter: blur(6px);
          }          
          .slick-next{
            right :28px;
          }
          .slick-prev:before, .slick-next:before{
            color: #fff !important;
            font-size :40px
          }
          .slick-prev{
            left: 8px;
            z-index: 9;
          }
          .slick-prev, .slick-next{
            top: 50%;
          }        
          
          @media only screen and (max-width: 768px) {
            .slick-prev:before,
            .slick-next:before {
              font-size: 30px;
            }
            .slick-next{
              right: 0px;
            } 
            .slick-prev{
              left: -12px;         
            } 
          }
        `}
      </style>
      {portfolio?.contactPhone && (
        <div className="fixed bottom-6 z-10 right-6 bg-green-500 hover:bg-green-600 text-white p-4 border border-slate-100 rounded-full shadow-xl transition-all duration-300">
          <a
            href={`https://wa.me/${portfolio?.contactPhone}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <WhatsAppIcon />
          </a>
        </div>
      )}

      {/* Main Content Container with proper bottom padding */}
      <div className="min-h-screen bg-gray-50">
        <section className="relative">
          {/* Cover Image */}
          <div className="relative w-full h-[80vh] md:h-[300px] bg-gray-300 rounded overflow-hidden">
            <div
              className="absolute bg-white top-5 right-5 p-1 px-2 md:px-4 rounded-lg cursor-pointer dark:bg-slate-800"
              onClick={() => navigate("/photographer/manage_portfolio")}
            >
              <p className="flex gap-1 text-xs md:text-sm items-center font-normal text-slate-700 dark:text-white">
                Edit Portfolio
              </p>
            </div>
            <img
              src={coverPreview || cover}
              alt="cover"
              className="w-full h-full object-cover bg-slate-100"
              loading="lazy"
            />
            <button
              onClick={() => {
                document
                  .getElementById("contact-section")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className="bg-[#B4A293] text-white block md:hidden p-2 w-72 rounded-full absolute bottom-6 left-1/2 -translate-x-1/2"
            >
              Contact us | +91 {portfolio?.contactPhone}
            </button>
          </div>

          {/* new layout */}
          <div className="w-full p-6 md:p-12 bg-white text-slate-900 font-serif">
            {/* Main Layout: Desktop 2 Columns */}
            <div className="flex flex-col lg:flex-row gap-12">
              {/* Left Section: Featured Albums */}
              <div className="flex-1">
                 {folders.length !== 0 && (
                  <>
                <div className="flex justify-between items-end border-b border-slate-100 pb-4 mb-8">
                  <h2 className="text-xl italic text-[#1A1C1C]">
                    Featured Albums
                  </h2>
                  {folders && folders.length > 2 && (
                    <button
                      onClick={() => setShowAll((prev) => !prev)}
                      className="text-xs block md:hidden tracking-widest uppercase text-slate-500 hover:text-black transition-colors"
                    >
                      {showAll ? "View Less Albums" : "View All Albums"}
                    </button>
                  )}
                </div>
                <div className="grid block md:hidden grid-cols-1 md:grid-cols-2 gap-4">
                  {folders &&
                    displayedFolders.map((folder) => {
                      const isSelected = folder._id === selectedFolder; // highlight if selected
                      const images = folder?.randomPhotos || [];
                      const currentIndex = hoverIndex[folder._id] || 0;

                      return (
                        <div
                          key={folder._id}
                          className="group cursor-pointer"
                          // Setting the outer container to the fixed width ensures the title also stays within bounds

                          onClick={() => {
                            setOpenfolder(true);
                            fetchPhotosFolder(folder._id, images);
                            setSelectedFolder(folder._id);
                          }}
                          onMouseEnter={() =>
                            handleMouseEnter(folder._id, images.length)
                          }
                          onMouseLeave={() => handleMouseLeave(folder._id)}
                        >
                          <div
                            className={`relative w-full overflow-hidden bg-slate-100 mb-4 transition-all duration-300 
                                            ${isSelected ? "scale-105 border-2 border-teal-600" : "hover:scale-105"}
                                          `}
                            // Applying fixed width and height here
                            style={{ height: "400px" }}
                          >
                            <img
                              src={images[currentIndex]?.signedUrl || demo}
                              alt="album"
                              className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          </div>
                          <h3 className="text-xl font-medium capitalize">
                            {folder?.name}
                          </h3>
                        </div>
                      );
                    })}
                </div>

                <div className="relative hidden md:block w-full max-w-2xl mx-auto ">
                  {/* LEFT BUTTON */}
                  <button
                    onClick={handlePrev}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/50 shadow-md p-1 rounded-full"
                  >
                    <ChevronLeftIcon />
                  </button>

                  {/* RIGHT BUTTON */}
                  <button
                    onClick={handleNext}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/50 shadow-md p-1 rounded-full"
                  >
                    <ChevronRightIcon />
                  </button>
                  {/* Scrollable Container */}
                  <div className="overflow-hidden">
                    {/* SLIDER TRACK */}
                    <div
                      className="flex gap-4 transition-transform duration-500"
                      style={{
                        transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
                      }}
                    >
                      {folders &&
                        folders.map((folder) => {
                          const isSelected = folder._id === selectedFolder; // highlight if selected
                          const images = folder?.randomPhotos || [];
                          const currentIndex = hoverIndex[folder._id] || 0;

                          return (
                            <div
                              key={folder._id}
                              className="group cursor-pointer w-1/2 h-[450px] flex-shrink-0"
                              // Setting the outer container to the fixed width ensures the title also stays within bounds

                              onClick={() => {
                                setOpenfolder(true);
                                fetchPhotosFolder(folder._id);
                                setSelectedFolder(folder._id);
                              }}
                              onMouseEnter={() =>
                                handleMouseEnter(folder._id, images.length)
                              }
                              onMouseLeave={() => handleMouseLeave(folder._id)}
                            >
                              {/* <div
                              className={`relative w-full aspect-square overflow-hidden bg-slate-100 transition-all duration-300 
                                  ${isSelected ? "scale-105 border-2 border-teal-600" : "hover:scale-105"}
                                `}
                            > */}
                              <div
                                className={`relative w-full h-[400px] aspect-square overflow-hidden bg-slate-100 transition-all duration-300 
                                  hover:scale-105}
                                `}
                              >
                                <img
                                  src={images[currentIndex]?.signedUrl || demo}
                                  alt="album"
                                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                              </div>
                              <h3 className="text-xl mt-2 font-medium capitalize">
                                {folder?.name}
                              </h3>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* The Faded Overlay Effect */}
                  {showFade && (
                    <div className="absolute top-0 right-0 h-full w-1/3 pointer-events-none bg-gradient-to-l from-white/90 via-white/40 to-transparent transition-opacity duration-300" />
                  )}
                </div>
                </>
                 )}

                <div className="flex flex-col lg:flex-row gap-12 mt-12">
                  {/* Left Column: Gallery Selection */}
                  <div className="flex-1">
                    {photos.length !== 0 ? (
                      <>
                    <div className="flex gap-4 sm:flex-row sm:items-baseline justify-between border-b border-slate-100 pb-4 mb-8">
                      <h2 className="text-xl italic text-[#1A1C1C] mt-4">
                        Gallery
                      </h2>
                      <div className="flex overflow-auto gap-6 mt-4 sm:mt-0 text-[10px] uppercase tracking-widest font-sans font-bold">
                        <button
                          onClick={() => {
                            setFilter("All");
                            setSelectedFolder(null);
                          }}
                          className={`${filter === "All" ? "text-teal-600 border-b border-teal-600" : "text-slate-400 hover:text-black"} transition-all pb-1`}
                        >
                          All
                        </button>
                        {folders &&
                          folders.map((folder) => {
                            const handleFilterClick = () => {
                              setFilter(folder.name);
                              setSelectedFolder(folder._id);
                            };
                            return (
                              <button
                                key={folder._id}
                                onClick={handleFilterClick}
                                className={`${filter === folder.name ? "text-teal-600 border-b border-teal-600" : "text-slate-400 hover:text-black"} transition-all pb-1`}
                              >
                                {folder.name}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-8">
                      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                        {photos &&
                          photos.slice(0, visibleCount).map((photo, index) => {
                            // Keep your existing infinite scroll logic if needed,
                            // but usually load more replaces it.
                            const isNearEnd =
                              index ===
                              photos.slice(0, visibleCount).length - 1;

                            return (
                              <div
                                key={photo._id || index}
                                ref={isNearEnd ? loaderRef : null}
                                className="aspect-square overflow-hidden relative bg-slate-100 group md:hover:scale-105 ease-in-out duration-500 cursor-pointer"
                              >
                                {!imageLoaded[index] && (
                                  <Skeleton
                                    variant="rounded"
                                    animation="wave"
                                    width="100%"
                                    height="100%"
                                    className="absolute top-0 left-0 z-10"
                                  />
                                )}
                                <img
                                  src={photo.signedUrl || demo}
                                  alt="portfolio"
                                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                  onLoad={() => handleImageLoad(index)}
                                />
                                <span
                                  className="absolute top-0 p-2 rounded font-normal text-xl w-full h-full hover:bg-black/30 shadow ease-in-out duration-300"
                                  onClick={() => {
                                    setZoomImg(photo.signedUrl);
                                    setZoomIndex(index);
                                    // setZoomSource("photos");
                                  }}
                                ></span>
                              </div>
                            );
                          })}
                      </div>

                      {/* Load More Button */}
                      {photos && photos.length > visibleCount && (
                        <div className="mt-12 flex justify-center">
                          <button
                            onClick={handleLoadMore}
                            className="px-12 py-4 border border-slate-300 
                                  text-sm uppercase tracking-[0.2em] hover:bg-black 
                                  hover:text-white"
                          >
                            Load More Works
                          </button>
                        </div>
                      )}
                    </div>
                    </> 
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        {/* Icon */}
                        <div className="w-16 h-16 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-4">
                          📷
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-semibold text-slate-800">
                          No Photos Yet
                        </h3>

                        {/* Subtitle */}
                        <p className="text-sm text-slate-500 mt-1 max-w-xs">
                          Looks like there are no photos available right now.
                          Start uploading to see them here.
                        </p>

                        {/* Optional Button */}
                        <button className="mt-4 px-4 py-2 text-sm rounded-full bg-blue-600 text-white hover:bg-blue-700 transition">
                          Upload Photos
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Section: Sidebar Profile */}
              <aside className="lg:w-80 space-y-8" id="contact-section">
                {/* Profile Header */}
                <div className="flex flex-col items-start">
                  <div className="w-24 h-24 bg-black p-2 mb-6">
                    <img
                      src={profilePreview || profile}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h1 className="text-xl font-light mb-2">
                    {portfolio?.brandName ? portfolio.brandName : "No name"}
                  </h1>
                  <p className="text-xs tracking-widest text-teal-600 font-bold uppercase mb-4">
                    {portfolio?.tagline ? portfolio?.tagline : "No tag libne"}
                  </p>
                  <div className="space-y-2">
                    <p className="text-slate-500 leading-relaxed text-sm font-sans transition-all duration-300">
                      {/* Logic: If length > 100 AND not expanded, show slice. Otherwise show full bio. */}
                      {portfolio?.biography
                        ? expanded || portfolio.biography.length <= 100
                          ? portfolio.biography
                          : `${portfolio.biography.substring(0, 100)}...`
                        : "No bio"}
                    </p>

                    {portfolio?.biography?.length > 100 && (
                      <button
                        onClick={() => setExpanded(!expanded)}
                        className="text-xs text-teal-600 hover:text-teal-800 transition-colors flex items-center gap-1 tracking-wider"
                      >
                        {expanded ? (
                          <>
                            Show Less <span className="text-[10px]">▲</span>
                          </>
                        ) : (
                          <>
                            Show More <span className="text-[10px]">▼</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="flex items-center mt-6 text-sm font-sans font-semibold tracking-wide">
                    <span className="mr-2">
                      {" "}
                      <LocationPinIcon fontSize="small" />{" "}
                    </span>{" "}
                    {portfolio?.location
                      ? portfolio?.location
                      : "No location to show"}
                  </div>
                </div>

                {/* Investment Card */}
                <div className="bg-[#F3F3F3] p-8 border-2">
                  <p className="text-[10px] tracking-widest text-slate-400 uppercase mb-4">
                    Investment
                  </p>
                  <div className="flex items-baseline mb-6">
                    <span className="text-xl font-semibold">
                      ₹{" "}
                      {portfolio?.pricing
                        ? portfolio?.pricing?.toLocaleString("en-IN")
                        : "No price"}
                    </span>
                    <span className="ml-2 text-slate-400 text-xs">
                      / DAILY RATE
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-500 font-sans mb-8">
                    Full-day coverage including post-production, digital
                    delivery, and licensing for editorial use.
                  </p>
                  {portfolio?.contactPhone && (
                    <button className="w-full bg-[#C80F0F] text-white py-4 px-6 text-xs tracking-widest uppercase hover:bg-black transition-colors">
                      <a
                        href={`https://wa.me/${portfolio?.contactPhone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Book a Consultation
                      </a>
                    </button>
                  )}
                </div>

                {/* Right Column: Connect & Quote */}
                <aside className="lg:w-80 space-y-12">
                  {/* Connect Links */}
                  <div>
                    {portfolio?.contactPhone && (
                      <h3 className="text-[10px] tracking-widest uppercase text-slate-400 mb-6 font-sans font-bold">
                        Connect
                      </h3>
                    )}
                    <ul className="space-y-4">
                      <li>
                        {portfolio?.contactPhone && (
                          <a
                            href={`https://wa.me/${portfolio?.contactPhone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 group"
                          >
                            <WhatsAppIcon
                              size={10}
                              className="text-slate-400 group-hover:text-black"
                            />
                            <span className="text-[12px] tracking-widest uppercase group-hover:underline">
                              Whatsapp
                            </span>
                          </a>
                        )}
                      </li>
                      <li>
                        {portfolio?.instagramHandle && (
                          <a
                            className="flex items-center gap-3 group"
                            href={`https://www.instagram.com/${portfolio.instagramHandle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <InstagramIcon
                              size={12}
                              className="text-slate-400 group-hover:text-black"
                            />
                            <span className="text-[12px] tracking-widest uppercase group-hover:underline">
                              Instagram
                            </span>
                          </a>
                        )}
                      </li>

                      <li>
                        {portfolio?.facebookHandle && (
                          <a
                            href={`https://www.facebook.com/${portfolio.facebookHandle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 group"
                          >
                            <FacebookRoundedIcon
                              size={12}
                              className="text-slate-400 group-hover:text-black"
                            />
                            <span className="text-[12px] tracking-widest uppercase group-hover:underline">
                              Facebook
                            </span>
                          </a>
                        )}
                      </li>

                      <li>
                        {portfolio?.youtubeHandle && (
                          <a
                            className="flex items-center gap-3 group"
                            href={`https://www.youtube.com/${portfolio.youtubeHandle.replace("@", "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <YouTubeIcon
                              size={12}
                              className="text-slate-400 group-hover:text-black"
                            />
                            <span className="text-[12px] tracking-widest uppercase group-hover:underline">
                              Youtube
                            </span>
                          </a>
                        )}
                      </li>
                      <li>
                        {portfolio?.contactEmail && (
                          <a
                            href={`mailto:${portfolio.contactEmail}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 group"
                          >
                            <MailOutlineIcon
                              size={12}
                              className="text-slate-400 group-hover:text-black"
                            />
                            <span className="text-[12px] tracking-widest uppercase group-hover:underline">
                              Email
                            </span>
                          </a>
                        )}
                      </li>
                      <li>
                        {portfolio?.contactPhone && (
                          <button
                            onClick={handleSharePortfolio}
                            className="flex items-center gap-3 group"
                          >
                            <ContentCopyIcon
                              size={12}
                              className="text-slate-400 group-hover:text-black"
                            />
                            <span className="text-[12px] tracking-widest uppercase group-hover:underline">
                              Share
                            </span>
                          </button>
                        )}
                      </li>
                    </ul>
                  </div>

                  {/* Black Quote Card */}
                  <div className="bg-[#1A1C1C] p-6 text-center flex flex-col items-center justify-center min-h-[150px]">
                    <div className="text-white mb-2">
                      {/* Decorative Stars Icon */}
                      <svg
                        width="28"
                        height="28"
                        viewBox="0 0 28 28"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M22.5 10L20.9375 6.5625L17.5 5L20.9375 3.4375L22.5 0L24.0625 3.4375L27.5 5L24.0625 6.5625L22.5 10ZM22.5 27.5L20.9375 24.0625L17.5 22.5L20.9375 20.9375L22.5 17.5L24.0625 20.9375L27.5 22.5L24.0625 24.0625L22.5 27.5ZM10 23.75L6.875 16.875L0 13.75L6.875 10.625L10 3.75L13.125 10.625L20 13.75L13.125 16.875L10 23.75Z"
                          fill="#F9F9F9"
                        />
                      </svg>
                    </div>
                    <p className="text-white italic text-lg leading-relaxed">
                      "Capturing the moments that vanish into the silence."
                    </p>
                  </div>
                </aside>
              </aside>
            </div>
          </div>

          {/* Profile Card - Positioned with proper spacing */}
          <div className="hidden max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-xl shadow-lg -mt-16 md:-mt-20 relative z-10 dark:bg-slate-800">
              <div className="p-4 sm:p-6 md:p-7">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  {/* Profile Info Section */}
                  <div className="flex flex-col md:flex-row md:items-start w-full md:w-[80%]">
                    <img
                      src={profilePreview || profile}
                      alt="profile"
                      className="bg-slate-100 w-24 h-24 md:w-36 md:h-36 rounded-full border-4 border-white shadow-lg -mt-12 md:-mt-16 object-cover"
                      loading="lazy"
                    />
                    <div className="md:ml-4 mt-4 md:mt-0 w-full">
                      {portfolio?.brandName ? (
                        <h2 className="text-lg md:text-xl font-semibold capitalize dark:text-white">
                          {portfolio.brandName}
                        </h2>
                      ) : (
                        <h2 className="text-md font-normal text-gray-400 dark:text-white">
                          No name to show
                        </h2>
                      )}
                      {portfolio?.tagline ? (
                        <p className="text-sm md:text-base text-blue font-normal mt-1">
                          {portfolio?.tagline}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400 font-normal mt-1">
                          No tagline to show
                        </p>
                      )}
                      {portfolio?.location ? (
                        <p className="text-slate-500 flex items-center gap-1 font-normal mt-2 dark:text-white">
                          <LocationPinIcon fontSize="small" />{" "}
                          {portfolio.location}
                        </p>
                      ) : (
                        <p className="text-slate-400 flex items-center gap-1 font-normal mt-2">
                          <LocationPinIcon fontSize="small" /> No location to
                          show
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Social Icons Section */}
                  <div className="flex items-center gap-2 mt-4 md:mt-0">
                    {portfolio?.instagramHandle && (
                      <a
                        className="flex text-slate-700 font-normal gap-1 cursor-pointer hover:scale-110 transition-transform"
                        href={`https://www.instagram.com/${portfolio.instagramHandle}`}
                        target="blank"
                        rel="noopener noreferrer"
                      >
                        <InstagramIcon
                          sx={{ fontSize: "32px" }}
                          className="text-[#ed018e] rounded-full p-1 bg-blue text-white"
                        />
                      </a>
                    )}
                    {portfolio?.facebookHandle && (
                      <a
                        className="flex text-slate-700 font-normal cursor-pointer hover:scale-110 transition-transform"
                        href={`https://www.facebook.com/${portfolio.facebookHandle}`}
                        target="blank"
                        rel="noopener noreferrer"
                      >
                        <FacebookRoundedIcon
                          sx={{ fontSize: "35px" }}
                          className="text-[#0866ff] rounded-full text-blue"
                        />
                      </a>
                    )}
                    {portfolio?.youtubeHandle && (
                      <a
                        className="flex cursor-pointer hover:scale-110 transition-transform"
                        href={`https://www.youtube.com/${portfolio.youtubeHandle.replace("@", "")}`}
                        target="blank"
                        rel="noopener noreferrer"
                      >
                        <YouTubeIcon
                          sx={{ fontSize: "32px" }}
                          className="text-[#ff0033] rounded-full p-1 bg-blue text-white"
                        />
                      </a>
                    )}
                    {portfolio?.contactEmail && (
                      <a
                        href={`mailto:${portfolio.contactEmail}`}
                        className="inline-block hover:scale-110 transition-transform"
                      >
                        <div className="flex text-slate-700 font-normal cursor-pointer items-center gap-1 dark:text-white">
                          <MailOutlineIcon
                            sx={{ fontSize: "32px" }}
                            className="rounded-full p-1 bg-blue text-white"
                          />
                        </div>
                      </a>
                    )}
                    <button
                      onClick={handleSharePortfolio}
                      className="flex text-slate-700 font-normal cursor-pointer items-center gap-1 dark:text-white hover:scale-110 transition-transform"
                      title="Share this portfolio"
                    >
                      <ContentCopyIcon
                        sx={{ fontSize: "32px" }}
                        className="rounded-full p-1 bg-blue text-white"
                      />
                    </button>
                  </div>
                </div>

                {/* Tabs Section */}
                <div className="mt-6 mb-1">
                  <ul className="flex flex-wrap text-sm font-normal text-center border-b border-gray-200">
                    {tabs.map((tab) => (
                      <li key={tab.id} className="me-1">
                        <button
                          className={`inline-block px-4 py-3 border-b-2 rounded-t-lg text-black font-normal text-sm transition-colors ${
                            activeTab === tab.id
                              ? "text-blue border-blue"
                              : "hover:text-slate-700 hover:border-slate-300 dark:hover:text-slate-300 border-transparent dark:text-white"
                          }`}
                          onClick={() => setActiveTab(tab.id)}
                        >
                          {tab.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Content Section with min-height for consistency */}
                <div className="py-4 min-h-[200px]">{renderContent()}</div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* folder image */}
      <Modal
        open={openfolder}
        onClose={handleClosefolder}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <div className="flex justify-end">
            <button
              onClick={() => setOpenfolder(false)}
              className="bg-white px-2 py-1 rounded-full shadow"
            >
              ✕
            </button>
          </div>
          {loadingFolderPhotos ? (
            <div className="flex flex-col items-center justify-center h-96 bg-white dark:bg-slate-900 rounded-lg shadow-sm p-6">
              <CircularProgress className="text-blue-600" />
              <p className="mt-4 text-slate-600 dark:text-slate-300">
                Loading photos...
              </p>
            </div>
          ) : photosFolder && photosFolder.length > 0 ? (
            <Slider {...settings}>
              {photosFolder.map((photo, index) => (
                <>
                  {/* skeleton while loading */}
                  {!imageLoaded[index] && (
                    <Skeleton
                      variant="rounded"
                      animation="wave"
                      width="100%"
                      height="100%"
                      className="absolute top-0 left-0 z-10"
                      key={index}
                    />
                  )}
                  {/* actual image */}
                  <img
                    src={photo.signedUrl}
                    alt={photo.caption || "Photo"}
                    className="w-[90vw] h-[90vh] md:max-h-[90vh] md:max-w-[90vw] object-contain m-auto "
                    loading="lazy"
                    onLoad={() => handleImageLoad(index)}
                    key={index}
                  />
                </>
              ))}
            </Slider>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-slate-700 text-lg font-normal">
                No photos found.
              </p>
            </div>
          )}
        </Box>
      </Modal>

      {/* zoom image */}
      <Dialog
        open={zoomImg}
        onClose={() => setZoomImg(null)}
        PaperProps={{
          sx: {
            width: { xs: "95vw", sm: "98vw" },
            height: { xs: "90vh", sm: "98vh" },
            maxWidth: "none",
            border: "none",
            boxShadow: "none",
            overflow: "hidden",
            position: "relative",
            backgroundColor: "transparent",
          },
        }}
      >
        <div className="relative">
          <img
            src={zoomImg}
            alt="zoom"
            className="h-[98vh] w-[98vw] object-contain"
          />
          <button
            onClick={() => setZoomImg(null)}
            className="absolute top-1 right-2 bg-white px-2 py-1 rounded-full"
          >
            ✕
          </button>
          {zoomIndex > 0 && (
            <button
              onClick={() => {
                const newIndex = zoomIndex - 1;
                setZoomIndex(newIndex);
                if (zoomSource === "photos") {
                  setZoomImg(photos[newIndex].signedUrl);
                } else {
                  setZoomImg(photosFolder[newIndex].signedUrl);
                }
              }}
              className="absolute top-1/2 left-2 transform -translate-y-1/2 px-2 py-1 rounded"
            >
              <ChevronLeftIcon
                sx={{ fontSize: "45px" }}
                className="text-white"
              />
            </button>
          )}
          {zoomSource === "photos" && zoomIndex < photos.length - 1 && (
            <button
              onClick={() => {
                const newIndex = zoomIndex + 1;
                setZoomIndex(newIndex);
                setZoomImg(photos[newIndex].signedUrl);
              }}
              className="absolute top-1/2 right-2 transform -translate-y-1/2 px-2 py-1 rounded"
            >
              <ChevronRightIcon
                sx={{ fontSize: "45px" }}
                className="text-white"
              />
            </button>
          )}
          {zoomSource === "images" && zoomIndex < photosFolder.length - 1 && (
            <button
              onClick={() => {
                const newIndex = zoomIndex + 1;
                setZoomIndex(newIndex);
                setZoomImg(photosFolder[newIndex].signedUrl);
              }}
              className="absolute top-1/2 right-2 transform -translate-y-1/2 px-2 py-1 rounded"
            >
              <ChevronRightIcon
                sx={{ fontSize: "45px" }}
                className="text-white"
              />
            </button>
          )}
        </div>
      </Dialog>
    </>
  );
}

export default Publicview;
