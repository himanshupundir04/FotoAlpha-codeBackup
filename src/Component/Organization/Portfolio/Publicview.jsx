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
import ShareIcon from "@mui/icons-material/Share";
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
      { threshold: 0.5 }
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
        params: { page, limit },
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
    setLoadingFolderPhotos(true);
    axios
      .get(`${baseURL}/portfolio/photos`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "ngrok-skip-browser-warning": "69420",
        },
        params: { page, limit: 10, folderId: id },
      })
      .then((response) => {
        const newPhotos = response.data.data;
        // console.log(newPhotos);
        setLoadingFolderPhotos(false);

        if (page === 1) {
          setPhotosFolder(newPhotos);
        } else {
          setPhotosFolder((prev) => [...prev, ...newPhotos]);
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

                  {portfolio?.biography?.length > 100 && ( // only show toggle if text is long
                    <button
                      onClick={() => setExpanded(!expanded)}
                      className="text-blue text-sm mt-1"
                    >
                      {expanded ? "Show less" : "Read more"}
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex justify-center items-center">
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
              {/* show all image */}
              <div className="bg-white rounded dark:bg-slate-800">
                {(!folders || folders.length === 0) &&
                (!photos || photos.length === 0) ? (
                  <div className="flex justify-center items-center ">
                    <p className="text-gray-500 dark:text-white font-medium">
                      No photos to show
                    </p>
                  </div>
                ) : (
                  <>
                    {" "}
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
                ? "scale-105 border-2 border-blue-500"
                : "hover:scale-105"
            }`}
                              onClick={() => {
                                fetchPhotosFolder(folder._id);
                                setOpenfolder(true);
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
                    <div className="mt-5 grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-5">
                      {photos &&
                        photos.map((photo, index) => {
                          const isNearEnd = index === photos.length - 4;
                          return (
                            <div
                              key={index}
                              ref={isNearEnd ? loaderRef : null}
                              className="relative bg-slate-100 md:h-40 h-32 group md:hover:scale-105 ease-in-out duration-500 cursor-pointer"
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
                                src={photo.signedUrl}
                                alt="portfolio"
                                className="rounded md:h-40 h-32 absolute w-full top-0 border border-slate-300 object-cover cursor-pointer "
                                loading="lazy"
                                onLoad={() => handleImageLoad(index)}
                              />
                              <span
                                className="absolute top-0 left-0	p-2 rounded w-full h-full hover:bg-black/30 shadow ease-in-out duration-300"
                                onClick={() => {
                                  setZoomImg(photo.signedUrl);
                                  setZoomIndex(index);
                                  setZoomSource("photos");
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

            {/* folder image more */}
            {hasMoreFolder && (
              <div className="text-center mt-5">
                <button
                  onClick={() => {
                    const nextPage = currentPage + 1;
                    fetchPhotos(nextPage);
                    setCurrentPage(nextPage);
                  }}
                  className="px-6 py-2 bg-blue hover:bg-blueHover text-white rounded-md shadow"
                >
                  More Photos
                </button>
              </div>
            )}
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
                      ₹ {portfolio?.pricing}
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
      <section className="bg-gray-50 -mt-[14px]">
        <div className="relative">
          <div
            className="absolute bg-white top-5 right-5 p-1 px-2 md:px-4 rounded-lg cursor-pointer dark:bg-slate-800"
            onClick={() => navigate("/organization/manage_portfolio")}
          >
            <p className="flex gap-1 text-xs md:text-sm items-center font-normal text-slate-700 dark:text-white">
              Edit Portfolio
            </p>
          </div>
          <div className="w-full bg-gray-300 rounded overflow-hidden">
            <img
              src={coverPreview || cover}
              alt="cover"
              className="w-full h-auto aspect-[3.5/1] object-cover"
              loading="lazy"
            />
          </div>
          <div className="w-[95%] bg-white m-auto p-7 rounded-xl shadow-lg absolute inset-x-0 top-20 md:top-40 xl:top-52 dark:bg-slate-800">
            {/* <div className="w-[100%] bg-white m-auto p-7 inset-x-0 top-28 md:top-52 dark:bg-slate-800"> */}
            <div className="flex flex-col md:flex-row justify-between">
              <div className="flex flex-col md:flex-row md:items-center w-[80%]">
                <img
                  src={profilePreview || profile}
                  alt="profile"
                  className="bg-gray-300 w-24 h-24 md:w-36 md:h-36 rounded-full border-2 border-white shadow-lg"
                  style={{ marginTop: "-70px" }}
                  loading="lazy"
                />
                <div className="md:ml-4 mt-2 text-start md:mt-0 w-full">
                  {portfolio?.brandName ? (
                    <h2 className="md:text-xl font-normal capitalize dark:text-white">
                      {portfolio.brandName}
                    </h2>
                  ) : (
                    <h2 className="text-md font-normal dark:text-white">
                      No name to show
                    </h2>
                  )}
                  {portfolio?.tagline ? (
                    <p className="text-md text-blue font-normal">
                      {portfolio?.tagline}
                    </p>
                  ) : (
                    <p className="text-sm text-blue font-normal">
                      No tagline to show
                    </p>
                  )}
                  {portfolio?.location ? (
                    <p className="text-slate-500 flex items-center gap-1 font-normal mt-1 dark:text-white">
                      <LocationPinIcon /> {portfolio.location}
                    </p>
                  ) : (
                    <p className="text-slate-500 flex items-center gap-1 font-normal mt-1">
                      <LocationPinIcon /> No location to show
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-5">
                {portfolio?.instagramHandle && (
                  <a
                    className="flex text-slate-700 font-normal gap-1 cursor-pointer"
                    href={`https://www.instagram.com/${portfolio.instagramHandle}`}
                    target="blank"
                    rel="noopener noreferrer"
                  >
                    <InstagramIcon
                      sx={{ fontSize: "32px" }}
                      className="text-[#ed018e] rounded-full p-1  bg-blue text-white"
                    />{" "}
                  </a>
                )}
                {portfolio?.facebookHandle && (
                  <a
                    className="flex text-slate-700 font-normal cursor-pointer"
                    href={`https://www.facebook.com/${portfolio.facebookHandle}`}
                    target="blank"
                    rel="noopener noreferrer"
                  >
                    <FacebookRoundedIcon
                      sx={{ fontSize: "35px" }}
                      className="text-[#0866ff] rounded-full text-blue"
                    />{" "}
                  </a>
                )}
                {portfolio?.youtubeHandle && (
                  <a
                    className="flex  cursor-pointer"
                    href={`https://www.youtube.com/@${portfolio.youtubeHandle.replace(
                      "@",
                      ""
                    )}`}
                    target="blank"
                    rel="noopener noreferrer"
                  >
                    <YouTubeIcon
                      sx={{ fontSize: "32px" }}
                      className="text-[#ff0033] rounded-full p-1  bg-blue text-white"
                    />
                    <p className="hidden md:block"></p>
                  </a>
                )}
                {portfolio?.contactEmail && (
                  <a
                    href={`mailto:${portfolio.contactEmail}`}
                    className="inline-block"
                  >
                    <div className="flex text-slate-700 font-normal cursor-pointer items-center gap-1 dark:text-white">
                      <MailOutlineIcon
                        sx={{ fontSize: "32px" }}
                        className="rounded-full p-1  bg-blue text-white"
                      />
                    </div>
                  </a>
                )}
                <button
                  onClick={handleSharePortfolio}
                  className="flex text-slate-700 font-normal cursor-pointer items-center gap-1 dark:text-white hover:scale-110 transition-transform"
                  title="Share this portfolio"
                >
                  <ShareIcon
                    sx={{ fontSize: "32px" }}
                    className="rounded-full p-1  bg-blue text-white"
                  />
                </button>
              </div>
            </div>
            <div className="mt-5 mb-1">
              <ul className="flex flex-wrap text-sm font-normal text-center">
                {tabs.map((tab) => (
                  <li key={tab.id} className="me-1">
                    <button
                      className={`inline-block p-4 pb-2 border-b-2 rounded-t-lg text-black  font-normal text-sm ${
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
            <div className="md:p-4">{renderContent()}</div>
          </div>
        </div>
      </section>

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
          xs: {
            width: "98vw",
            height: "98vh",
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

