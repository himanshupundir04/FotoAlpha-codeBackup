import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  CircularProgress,
  Dialog,
  IconButton,
  Menu,
  MenuItem,
  Modal,
  Skeleton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import UploadPhoto from "./UploadPhoto";
import Swal from "sweetalert2";
import demo from "../../image/demo.jpg";
import axios from "axios";
import { toast } from "react-toastify";
import DownloadIcon from "@mui/icons-material/Download";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import Slider from "react-slick";

const baseURL = process.env.REACT_APP_BASE_URL;

function Images({ folders, fetchFolder }) {
  const token = localStorage.getItem("token");
  const [zoomImg, setZoomImg] = useState(null);
  const [zoomIndex, setZoomIndex] = useState(null);
  const [zoomSource, setZoomSource] = useState("photos");
  const [opend, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClosed = () => setOpen(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [photos, setPhotos] = useState([]);
  // const [folders, setFolders] = useState([]);
  const [photosFolder, setPhotosFolder] = useState([]);
  const [hasMoreFolder, setHasMoreFolder] = useState(false);
  const [loadingFolderPhotos, setLoadingFolderPhotos] = useState(false);
  const [selectDelete, setSelectDelete] = useState([]);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState({});
  const [menuAnchor, setMenuAnchor] = useState({ anchorEl: null, photo: null });
  const [hoverIndex, setHoverIndex] = useState({});
  const [intervals, setIntervals] = useState({});
  const [openfolder, setOpenfolder] = useState(false);

  const handleClosefolder = () => setOpenfolder(false);

  const handleClose = () => {
    setMenuAnchor({ anchorEl: null, photo: null });
  };

  const handleClick = (event, photo) => {
    setMenuAnchor({ anchorEl: event.currentTarget, photo });
  };

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


  const loaderRef = useRef(null);
  const pageRef = useRef(1);

  const loadMorePhotos = useCallback(() => {
    const nextPage = pageRef.current + 1;
    fetchPhotos(nextPage);
    pageRef.current = nextPage;
    setCurrentPage(nextPage);
  }, []);

  useEffect(() => {
    if (!initialLoaded) return;

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
  }, [photos, hasMore, loadMorePhotos, initialLoaded]);

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
      // toast.error(error?.response?.data?.message);
      console.log(error);
    }
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        axios
          .delete(`${baseURL}/portfolio/photos/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "ngrok-skip-browser-warning": "69420",
            },
          })
          .then((res) => {
            toast.success("Photo deleted successfully", { autoClose: 1000 });
            setSelectDelete([]);
            setInitialLoaded(false);
            pageRef.current = 1;
            setCurrentPage(1);
            setHasMore(true);
            fetchPhotos(1);
            fetchFolder();
          })
          .catch((err) => {
            toast.error(
              err?.response?.data?.message || "Something went wrong",
              { autoClose: 1000 }
            );
            console.log(err);
          });
      }
    });
  };

  const handleDeleteSelected = () => {
    Swal.fire({
      title: "Are you sure?",
      text: `You are about to delete ${selectDelete.length} photos. This action cannot be undone!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete them!",
    }).then((result) => {
      if (result.isConfirmed) {
        Promise.all(
          selectDelete.map((id) =>
            axios.delete(`${baseURL}/portfolio/photos/${id}`, {
              headers: {
                Authorization: `Bearer ${token}`,
                "ngrok-skip-browser-warning": "69420",
              },
            })
          )
        )
          .then(() => {
            toast.success("Selected photos deleted successfully", {
              autoClose: 1000,
            });
            setSelectDelete([]);
            setInitialLoaded(false);
            pageRef.current = 1;
            setCurrentPage(1);
            setHasMore(true);
            fetchPhotos(1); // re-fetch first page
            fetchFolder(); // refresh photos
          })
          .catch((err) => {
            toast.error("Error deleting one or more photos", {
              autoClose: 1000,
            });
            console.log(err);
          });
      }
    });
  };

  const handleDownload = async (url, name = "image") => {
    try {
      // const response = await fetch(url);
      const response = await fetch(
        `https://fotoalpha.com/api/photos/download${url}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "ngrok-skip-browser-warning": "69420",
          },
        }
      );
      if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);

      const avifBlob = await response.blob();

      // Create image from blob
      const img = new Image();
      img.src = URL.createObjectURL(avifBlob);

      img.onload = () => {
        // Create canvas and draw image
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        // Convert canvas to PNG blob
        canvas.toBlob((pngBlob) => {
          const downloadUrl = URL.createObjectURL(pngBlob);
          const link = document.createElement("a");
          link.href = downloadUrl;
          link.download = `${name}`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          URL.revokeObjectURL(downloadUrl);
        }, "image/png");

        // Clean up image URL
        URL.revokeObjectURL(img.src);
      };

      img.onerror = () => {
        throw new Error("Failed to load AVIF image into <img> element.");
      };
    } catch (error) {
      console.error("Conversion or download failed:", error);
      alert("Failed to convert and download the image.");
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
      xs: "80%", // mobile screens
      sm: "80%", // small screens and up
      md: "80%", // medium screens and up
    },
    
  };

  return (
    <>
      <style>
        {`
          .portimg .MuiModal-backdrop {
            background-color: rgb(0 0 0 / 62%);
            backdrop-filter: blur(6px);
            -webkit-backdrop-filter: blur(6px);
          }
           .css-1tktgsa-MuiPaper-root-MuiPopover-paper-MuiMenu-paper{
           box-shadow: none !important
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
        z-index: 999;
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

      {/* show all image */}

      <div className="bg-white p-4 rounded dark:bg-slate-800 mt-4">
        <div className="flex justify-end items-center mb-3 gap-2">
          <button
            type="submit"
            className="bg-blue rounded py-2 px-2 text-sm text-white hover:bg-blueHover font-normal"
            onClick={handleOpen}
          >
            Upload Photos
          </button>
          {selectDelete.length > 0 && (
            <button
              className="bg-red-500 rounded py-2 px-4 text-white text-sm hover:bg-red-600 font-normal"
              onClick={handleDeleteSelected}
            >
              Delete Selected ({selectDelete.length})
            </button>
          )}
        </div>
        {/* Case: No folders and no photos */}
        {(!folders || folders.length === 0) &&
        (!photos || photos.length === 0) ? (
          <div className="flex justify-center items-center h-32">
            <p className="text-gray-500 dark:text-gray-300 font-medium">
              No photos to show
            </p>
          </div>
        ) : (
          <>
            {/* Folders */}
            {folders && folders.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 gap-5">
                {folders &&
                  folders.map((folder, index) => {
                    const isSelected = false;
                    const images = folder?.randomPhotos || [];
                    const currentIndex = hoverIndex[folder._id] || 0;
                    return (
                      <div
                        key={index}
                        className={`group text-center md:h-44 h-32 relative cursor-pointer rounded ease-in-out duration-500 overflow-hidden
                ${isSelected ? "scale-105" : "hover:scale-105"}`}
                        onClick={() => {
                          fetchPhotosFolder(folder._id);
                          setOpenfolder(true);
                        }}
                        onMouseEnter={() =>
                          handleMouseEnter(folder._id, images.length)
                        }
                        onMouseLeave={() => handleMouseLeave(folder._id)}
                      >
                        <img
                          src={images[currentIndex]?.signedUrl || demo}
                          alt="album"
                          className="absolute top-0 left-0 w-full md:h-44 h-32 object-cover rounded border border-slate-300 transition-all duration-500 filter grayscale hover:grayscale-0"
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
            )}

            {/* Photos */}
            {photos && photos.length > 0 && (
              <div className="mt-5 grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 gap-5">
                {photos.map((photo, index) => {
                  const isNearEnd = index === photos.length - 4;
                  return (
                    <div
                      key={index}
                      ref={isNearEnd ? loaderRef : null}
                      className="relative bg-slate-100 md:h-48 h-32 group md:hover:scale-105 ease-in-out duration-500 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="absolute z-20 top-2 left-2"
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          if (isChecked) {
                            setSelectDelete((prev) => [...prev, photo._id]);
                          } else {
                            setSelectDelete((prev) =>
                              prev.filter((id) => id !== photo._id)
                            );
                          }
                        }}
                        checked={selectDelete.includes(photo._id)}
                      />

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
                        className="rounded md:h-48 h-32 absolute w-full top-0 border border-slate-300 object-cover cursor-pointer "
                        loading="lazy"
                        onLoad={() => handleImageLoad(index)}
                      />
                      <span
                        className="absolute top-0 left-0 p-2 rounded font-normal text-xl w-full h-full hover:bg-black/30 shadow ease-in-out duration-300"
                        onClick={() => {
                          setZoomImg(photo.signedUrl);
                          setZoomIndex(index);
                          setZoomSource("photos");
                        }}
                      ></span>
                      <div className="absolute top-1 right-1 z-20 bg-slate-100 dark:bg-slate-700 rounded-lg">
                        <div>
                          <IconButton
                            className="p-0"
                            aria-label="more"
                            size="small"
                            onClick={(e) => handleClick(e, photo)}
                          >
                            <MoreVertIcon sx={{ fontSize: 20 }} />
                          </IconButton>
                          <Menu
                            anchorEl={menuAnchor.anchorEl}
                            open={Boolean(menuAnchor.anchorEl)}
                            onClose={handleClose}
                            slotProps={{
                              paper: {
                                style: {
                                  width: "16ch",
                                  boxShadow: "none",
                                },
                              },
                            }}
                            className="shadow-none"
                          >
                            <MenuItem
                              onClick={() => {
                                handleDownload(
                                  menuAnchor.photo?.imageUrl,
                                  menuAnchor.photo?.caption
                                );
                                handleClose();
                              }}
                            >
                              <DownloadIcon className="me-2" /> Download
                            </MenuItem>
                            <MenuItem
                              onClick={() => {
                                handleDelete(menuAnchor.photo?._id);
                                handleClose();
                              }}
                            >
                              <DeleteIcon className="me-2" /> Delete
                            </MenuItem>
                          </Menu>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* {hasMore && (
        <div ref={loaderRef} className="text-center mt-5 py-4">
          <CircularProgress />
        </div>
      )} */}

      {/* folder image more */}
      {hasMoreFolder && (
        <div className="text-center mt-5">
          <button
            onClick={() => {
              const nextPage = currentPage + 1;
              fetchPhotos(nextPage);
              setCurrentPage(nextPage);
            }}
            className="px-6 py-2 bg-blue hover:bg-blueHoverHover text-white rounded-md shadow"
          >
            More Photos
          </button>
        </div>
      )}

      {/* folder image */}
      <Modal
        open={openfolder}
        onClose={handleClosefolder}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
        // className="portimg"
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
            <div className="w-full h-full flex items-center justify-center">
              <CircularProgress />
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
                    className="w-[90vw] h-[90vh] md:max-h-[90vh] md:w-[90vw] object-contain m-auto "
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
            width: { xs: "98vw", sm: "98vw" },
            height: { xs: "98vh", sm: "98vh" },
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
            className="max-h-[98vh] w-[98vw] object-contain"
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

      <UploadPhoto
        handleClose={handleClosed}
        open={opend}
        fetchPhotos={fetchPhotos}
      />
    </>
  );
}

export default Images;
