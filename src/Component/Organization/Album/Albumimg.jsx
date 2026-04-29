import React, { useRef, useEffect, useState } from "react";
import HTMLFlipBook from "react-pageflip";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import PreviewIcon from "@mui/icons-material/Preview";
import BorderColorIcon from "@mui/icons-material/BorderColor";
import SettingsIcon from "@mui/icons-material/Settings";
import ShareIcon from "@mui/icons-material/Share";
import DownloadIcon from "@mui/icons-material/Download";
import Drawer from "@mui/material/Drawer";
import jsPDF from "jspdf";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import html2canvas from "html2canvas";
import {
  Alert,
  Box,
  CircularProgress,
  Modal,
  Skeleton,
  Snackbar,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { toast } from "react-toastify";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import CloseIcon from "@mui/icons-material/Close";
import { Download } from "@mui/icons-material";
import HideImageOutlinedIcon from "@mui/icons-material/HideImageOutlined";
import albumbg from "../../image/albumbg.png"

const baseURL = process.env.REACT_APP_BASE_URL;

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: {
    xs: "90%",
    md: "95vw",
  },
  height: { xs: "90%", md: "95vh" },
  bgcolor: "background.paper",
  boxShadow: 24,
  border: "1px solid #fff",
};

function Albumimg() {
  const bookRef = useRef();
  const pdfRef = useRef();
  const intervalRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState("view");
  const [images, setImages] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tempImages, setTempImages] = useState([]);
  const [eventname, setEventname] = useState();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [imageLoaded, setImageLoaded] = useState({});
  const [generate, setGenerate] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const bookWidth = isMobile ? 300 : 500;
  const [openfull, setOpenfull] = useState();
  const handleCloseFull = () => {
    setOpenfull(false);
  };
  const handleOpen = () => setOpenfull(true);
  const [opensnak, setOpensnak] = useState(false);
  const [loading, setLoading] = useState(false);

  // console.log(location.pathname)

  useEffect(() => {
    fetchImg();
  }, []);

  const fetchImg = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseURL}/albums/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "ngrok-skip-browser-warning": "69420",
        },
      });
      // console.log(response.data.data.layouts);
      setImages(response.data.data.layouts);
      setLoading(false);
      setEventname(response.data.data.eventName);
    } catch (error) {
      setLoading(false);
      console.log("Error fetching image:", error);
    }
  };

  const startAutoPlay = () => {
    clearInterval(intervalRef.current);
    if (isPlaying && activeTab === "view") {
      intervalRef.current = setInterval(() => {
        if (bookRef.current) {
          bookRef.current.pageFlip().flipNext();
        }
      }, 5000);
    }
  };

  const handleManualFlip = (direction) => {
    if (!bookRef.current) return;
    direction === "prev"
      ? bookRef.current.pageFlip().flipPrev()
      : bookRef.current.pageFlip().flipNext();
    startAutoPlay();
  };

  useEffect(() => {
    startAutoPlay();
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, activeTab]);

  useEffect(() => {
    if (bookRef.current && bookRef.current.pageFlip()) {
      const flip = bookRef.current.pageFlip();
      flip.setProps({
        disableFlipByClick: activeTab === "edit",
        disableFlipBySwipe: activeTab === "edit",
      });
    }
  }, [activeTab]);

  const handleDragStart = (e, pageIndex, photoIndex) => {
    e.dataTransfer.setData(
      "dragData",
      JSON.stringify({ pageIndex, photoIndex })
    );
  };

  const handleDrop = (e, targetPageIndex, targetPhotoIndex) => {
    e.preventDefault();
    const data = e.dataTransfer.getData("dragData");

    if (!data) return;

    const { pageIndex: sourcePageIndex, photoIndex: sourcePhotoIndex } =
      JSON.parse(data);

    // Prevent self-drop
    if (
      sourcePageIndex === targetPageIndex &&
      sourcePhotoIndex === targetPhotoIndex
    )
      return;

    const newImages = [...images];

    // Guard: Check if source/target exist
    const sourcePage = newImages[sourcePageIndex];
    const targetPage = newImages[targetPageIndex];

    if (
      !sourcePage ||
      !targetPage ||
      !sourcePage.photos?.[sourcePhotoIndex] ||
      !targetPage.photos?.[targetPhotoIndex]
    ) {
      console.warn("Invalid drop: one of the photos is undefined");
      return;
    }

    // Swap photos
    const temp = targetPage.photos[targetPhotoIndex];
    targetPage.photos[targetPhotoIndex] = sourcePage.photos[sourcePhotoIndex];
    sourcePage.photos[sourcePhotoIndex] = temp;

    // console.log("temp", temp);
    console.log("newimage", newImages);

    setImages(newImages);
    editImage(newImages);
  };

  const allowDrop = (e) => e.preventDefault();

  const loadImage = (src) =>
  new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.src = src;
  });

  const downloadPDF = async () => {
  const container = document.getElementById("pdf-render-container");
  if (!container) return;

  setOpensnak(true);
  setGenerate(true);

  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // 🔹 Load background once
  const bgImg = await loadImage(albumbg);

  for (let i = 0; i < images.length; i++) {
    const layout = images[i];

    if (i > 0) pdf.addPage();

    // 🟦 Add background FIRST
    pdf.addImage(
      bgImg,
      "JPEG",        // or "PNG"
      0,
      0,
      pageWidth,
      pageHeight
    );

    // ---- Create temp layout ----
    const tempDiv = document.createElement("div");
    tempDiv.style.width = "800px";
    tempDiv.style.height = "1000px";
    tempDiv.style.padding = "20px";
    tempDiv.style.boxSizing = "border-box";
    tempDiv.style.background = "transparent"; // 👈 important
    tempDiv.style.display = "flex";
    tempDiv.style.flexDirection =
      layout.layout === "pair-vertical" ? "column" : "row";
    tempDiv.style.gap = "10px";

    layout.photos.forEach((photo) => {
      const img = document.createElement("img");
      img.src = photo.url;
      img.crossOrigin = "anonymous";
      img.style.borderRadius = "8px";
      img.style.objectFit = "contain";
      img.style.width = "100%";
      img.style.height = "auto";
      img.style.maxHeight = "100%";
      img.style.alignSelf = "center";

      switch (layout.layout) {
        case "single":
          img.style.width = "100%";
          break;
        case "pair-horizontal":
          img.style.width = "48%";
          break;
        case "pair-vertical":
          img.style.height = "48%";
          break;
        default:
          img.style.width = "100%";
      }

      tempDiv.appendChild(img);
    });

    container.innerHTML = "";
    container.appendChild(tempDiv);

    const canvas = await html2canvas(tempDiv, {
      useCORS: true,
      scale: 2,
      backgroundColor: null, // 👈 keeps bg transparent
    });

    const imgData = canvas.toDataURL("image/png");

    const ratio = Math.min(
      pageWidth / canvas.width,
      pageHeight / canvas.height
    );

    const imgWidth = canvas.width * ratio;
    const imgHeight = canvas.height * ratio;

    const x = (pageWidth - imgWidth) / 2;
    const y = (pageHeight - imgHeight) / 2;

    // 🖼️ Add layout ON TOP of background
    pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
  }

  pdf.save("album.pdf");
  setOpensnak(false);
  setGenerate(false);
};


  // const downloadPDF = async () => {
  //   const container = document.getElementById("pdf-render-container");
  //   if (!container) return;
  //   setOpensnak(true);
  //   setGenerate(true);
  //   const pdf = new jsPDF("p", "mm", "a4");
  //   const pageWidth = pdf.internal.pageSize.getWidth();
  //   const pageHeight = pdf.internal.pageSize.getHeight();

  //   for (let i = 0; i < images.length; i++) {
  //     const layout = images[i];

  //     // Create a temporary DOM element
  //     const tempDiv = document.createElement("div");
  //     tempDiv.style.width = "800px";
  //     tempDiv.style.height = "1000px";
  //     tempDiv.style.padding = "20px";
  //     tempDiv.style.boxSizing = "border-box";
  //     tempDiv.style.backgroundColor = "#f5f5f5";
  //     tempDiv.style.display = "flex";
  //     tempDiv.style.flexDirection =
  //       layout.layout === "pair-vertical" ? "column" : "row";
  //     tempDiv.style.gap = "10px";

  //     layout.photos.forEach((photo) => {
  //       const img = document.createElement("img");
  //       img.src = photo.url;
  //       img.crossOrigin = "anonymous";
  //       img.style.borderRadius = "8px";
  //       img.style.objectFit = "contain"; // 👈 maintain aspect ratio
  //       img.style.width = "100%";
  //       img.style.height = "auto"; // 👈 don't force height
  //       img.style.maxHeight = "100%"; // 👈 prevent overflow
  //       img.style.backgroundColor = "#000"; // optional (for contrast)
  //       img.style.alignSelf = "center";
  //       img.style.justifySelf = "center";

  //       switch (layout.layout) {
  //         case "single":
  //           img.style.width = "100%";
  //           img.style.height = "auto";
  //           break;
  //         case "pair-horizontal":
  //           img.style.width = "48%";
  //           img.style.height = "auto";
  //           break;
  //         case "pair-vertical":
  //           img.style.width = "100%";
  //           img.style.height = "48%";
  //           break;
  //         default:
  //           img.style.width = "100%";
  //           img.style.height = "auto";
  //       }
  //       tempDiv.appendChild(img);
  //     });

  //     container.innerHTML = ""; // clear container
  //     container.appendChild(tempDiv);

  //     const canvas = await html2canvas(tempDiv, { useCORS: true, scale: 2 });
  //     const imgData = canvas.toDataURL("image/png");

  //     const ratio = Math.min(
  //       pageWidth / canvas.width,
  //       pageHeight / canvas.height
  //     );
  //     const imgWidth = canvas.width * ratio;
  //     const imgHeight = canvas.height * ratio;

  //     const x = (pageWidth - imgWidth) / 2;
  //     const y = (pageHeight - imgHeight) / 2;

  //     if (i > 0) pdf.addPage();
  //     pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
  //   }
  //   pdf.save("album.pdf");
  //   setOpensnak(false);
  //   setGenerate(false);
  // };

  const editImage = async (imgs) => {
    const data = {
      eventId: id,
      eventName: eventname,
      layouts: imgs,
    };
    try {
      const response = axios.put(
        `${baseURL}/albums/${id}`,
        { data },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "69420",
          },
        }
      );
      toast.success("Photo Album Edit Successfully.", { autoClose: 1000 });
      // console.log(response)
    } catch (error) {
      console.log(error);
    }
  };

  const handleBack = () => navigate(-1);

  const copyToClipboard = async () => {
    try {
      const textToCopy = "Your text or URL here";
      navigator.clipboard.writeText(textToCopy).then(() => {
        setOpen(true);
      });
      await navigator.clipboard.writeText(`https://fotoalpha.com${location.pathname}`);
    } catch (error) {
      console.error("Unable to copy to clipboard:", error);
    }
  };

  const handleClose = (_, reason) => {
    if (reason === "clickaway") return;
    setOpen(false);
  };

  const getUpdatedLayouts = (spreads) => {
    let twoPhotoCount = 0;

    return spreads.map((spread) => {
      if (spread.photos.length === 3) {
        return { ...spread, layout: "trio" };
      }

      if (spread.photos.length === 1) {
        return { ...spread, layout: "single" };
      }

      if (spread.photos.length === 2) {
        const layout =
          twoPhotoCount % 2 === 0 ? "pair-vertical" : "pair-horizontal";
        twoPhotoCount++; // increment counter for next 2-photo spread
        return { ...spread, layout };
      }

      // For other photo counts, keep the existing layout
      return spread;
    });
  };

  // const handleImageLoad = (index) => {
  //   setImageLoaded((prev) => ({ ...prev, [index]: true }));
  // };

  return (
    <>
      <style>
        {`
    .demoPage {
      background-image: url('/albumbg.png');
      background-size: cover;
      background-position: center;
    }
    
    
  `}
      </style>
      {loading ? (
        <div className="flex flex-col items-center justify-center h-96 bg-white dark:bg-slate-900 rounded-lg shadow-sm p-6">
          <CircularProgress className="text-blue-600" />
          <p className="mt-4 text-slate-600 dark:text-slate-300">
            Loading album photos...
          </p>
        </div>
      ) : images.length > 0 ? (
        <>
          <div className="flex justify-between items-center mb-4">
            <ArrowBackIcon
              sx={{ fontSize: "30px" }}
              className="bg-slate-300 p-1 rounded text-white cursor-pointer hover:bg-slate-400"
              onClick={handleBack}
            />

            <div className="flex flex-wrap items-center gap-4">
              <button
                className="flex items-center gap-1 text-slate-700 font-normal border border-slate-300 rounded-md p-2 hover:bg-slate-300"
                onClick={() => {
                  handleOpen();
                }}
              >
                <OpenInFullIcon
                  sx={{ fontSize: "18px" }}
                  className="dark:text-white"
                />{" "}
                <p className="hidden md:block text-sm dark:text-white">
                  View Full
                </p>
              </button>
              <div className="flex items-center border border-slate-300 rounded-md p-1 gap-1">
                <button
                  className={`flex items-center gap-1 font-normal py-1 px-2 rounded ${
                    activeTab === "view"
                      ? "bg-slate-300 text-slate-700"
                      : "text-slate-700 dark:text-white"
                  }`}
                  onClick={() => setActiveTab("view")}
                >
                  <PreviewIcon sx={{ fontSize: "18px" }} />
                  <p className="hidden md:block text-sm ">View</p>
                </button>
                <button
                  className={`flex items-center gap-1 font-normal py-1 px-2 rounded ${
                    activeTab === "edit"
                      ? "bg-slate-300 text-slate-700"
                      : "text-slate-700 dark:text-white"
                  }`}
                  onClick={() => setActiveTab("edit")}
                >
                  <BorderColorIcon sx={{ fontSize: "18px" }} />{" "}
                  <p className="hidden md:block text-sm ">Edit</p>
                </button>
              </div>
              <button
                className="flex items-center gap-1 text-slate-700 font-normal border border-slate-300 rounded-md p-2 hover:bg-slate-300"
                onClick={() => {
                  setDrawerOpen(true);
                  setTempImages([...images]);
                }}
              >
                <SettingsIcon
                  sx={{ fontSize: "18px" }}
                  className="dark:text-white"
                />{" "}
                <p className="hidden md:block text-sm dark:text-white">
                  Photo List
                </p>
              </button>
              <button
                className="flex items-center gap-1 text-slate-700 font-normal border border-slate-300 rounded-md p-2 hover:bg-slate-300"
                onClick={copyToClipboard}
              >
                <ShareIcon
                  sx={{ fontSize: "18px" }}
                  className="dark:text-white"
                />
                <p className="hidden md:block text-sm dark:text-white">
                  {" "}
                  Share
                </p>
              </button>
              <button
                className="flex items-center gap-1 text-slate-700 font-normal border border-slate-300 rounded-md p-2 hover:bg-slate-300"
                onClick={downloadPDF}
              >
                <DownloadIcon
                  sx={{ fontSize: "18px" }}
                  className="dark:text-white"
                />
                <p className="hidden md:block text-sm dark:text-white">
                  {!generate ? "Download PDF" : "PDF Generate..."}
                </p>
                <p className="md:hidden">
                  {!generate ? "" : <CircularProgress />}
                </p>
              </button>
            </div>
          </div>
          {/* view mode */}
          <div
            id="pdf-render-container"
            style={{ position: "absolute", left: "-9999px", top: 0 }}
          />
          {images.length > 0 && activeTab === "view" && (
            <div
              className="flex flex-col items-center overflow-hidden"
              ref={pdfRef}
            >
              <HTMLFlipBook
                key={activeTab}
                width={bookWidth}
                height={500}
                ref={bookRef}
                flippingTime={800}
                className="shadow-2xl rounded-lg flip-book"
                useMouseEvents={activeTab === "view"}
                clickEventForward={activeTab === "view"}
                swipeDistance={activeTab === "view" ? 30 : 10000}
              >
                {/* Cover Page */}
                <div className="demoPage shadow-inner p-3 min-w-[300px] min-h-[450px] h-full rounded-e-md">
                  <div className="h-full p-4 rounded-md flex justify-center items-center overflow-hidden">
                    <p className="mt-2 text-center text-slate-500 italic font-normal text-2xl overflow-hidden text-ellipsis">
                      A Beautiful Collection of Memories
                    </p>
                  </div>
                </div>
                <div className="demoPage shadow-inner p-3 min-w-[300px] min-h-[450px] h-full rounded-e-md">
                  <div className="h-full p-4 rounded-md flex flex-col overflow-hidden border-4 border-white/30">
                    <div
                      id="pdf-cover"
                      className="flex-1 flex justify-center items-center overflow-hidden "
                    >
                      <img
                        src={images[0].photos[0].url}
                        alt="cover"
                        style={{ display: imageLoaded ? "block" : "none" }}
                        className="h-full w-max object-contain rounded-md"
                        loading="lazy"
                      />
                    </div>
                  </div>
                </div>
                {/* Photo Pages */}
                {images.slice(1).map((imgObj, index) => (
                  <div
                    key={index}
                    className={`demoPage shadow-inner p-5 min-w-[300px] min-h-[450px] h-full  ${
                      index % 2 === 0 ? "rounded-s-md" : "rounded-e-md"
                    }`}
                  >
                    <div
                      className="p-5 relative rounded-xl h-[450px] flex flex-col border-4 border-white/30"
                      // style={{ backgroundColor: "#eedeaa3b" }}
                    >
                      {imgObj.layout === "trio" ? (
                        <div className="flex h-full">
                          <div className="w-1/2 h-full pr-1">
                            <img
                              src={imgObj.photos[0]?.url}
                              alt="trio-left-main"
                              className="w-full h-full object-contain rounded"
                              draggable={activeTab === "edit"}
                              onDragStart={(e) =>
                                activeTab === "edit" &&
                                handleDragStart(e, index)
                              }
                              loading="lazy"
                            />
                          </div>

                          <div className="w-1/2 h-full flex flex-col gap-1 pl-1">
                            <img
                              src={imgObj.photos[1]?.url}
                              alt="trio-top"
                              className="w-full h-1/2 object-contain rounded"
                              draggable={activeTab === "edit"}
                              onDragStart={(e) =>
                                activeTab === "edit" &&
                                handleDragStart(e, index)
                              }
                              loading="lazy"
                            />
                            <img
                              src={imgObj.photos[2]?.url}
                              alt="trio-bottom"
                              className="w-full h-1/2 object-contain rounded"
                              draggable={activeTab === "edit"}
                              onDragStart={(e) =>
                                activeTab === "edit" &&
                                handleDragStart(e, index)
                              }
                              loading="lazy"
                            />
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`pdf-page flex w-full h-full gap-2 justify-center items-center ${
                            imgObj.layout === "pair-vertical"
                              ? "flex-col"
                              : "flex-row"
                          }`}
                          id={`pdf-spread-${index}`}
                        >
                          {imgObj.photos.map((photo, i) => {
                            let layoutClasses = "";
                            switch (imgObj.layout) {
                              case "single":
                                layoutClasses = "w-full h-full";
                                break;
                              case "pair-horizontal":
                                layoutClasses = "w-1/2";
                                break;
                              case "pair-vertical":
                                layoutClasses = "w-full h-1/2";
                                break;
                              default:
                                layoutClasses = "w-full h-full";
                            }
                            return (
                              <>
                                <img
                                  key={i}
                                  src={photo.url}
                                  crossOrigin="anonymous"
                                  alt={`photo-${i}`}
                                  className={`h-full w-full absolute object-none rounded blur-[2px] object-top z-0`}
                                />
                                <img
                                  key={i}
                                  src={photo.url}
                                  crossOrigin="anonymous"
                                  alt={`photo-${i}`}                                  
                                  className={`${layoutClasses} object-contain rounded object-top z-10 `}
                                />
                              </>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Last Page */}
                <div
                  id="pdf-back-cover"
                  className="demoPage bg-red-50 shadow-inner p-5 h-full min-w-[300px] min-h-[450px] relative rounded-e-md"
                >
                  <p className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-slate-700 text-center font-normal text-2xl">
                    The End
                  </p>
                </div>
              </HTMLFlipBook>

              {/* Controls */}
              <div className="mt-4 flex gap-4">
                <button
                  onClick={() => handleManualFlip("prev")}
                  className="px-3 py-1 text-slate-700 border border-slate-400 rounded hover:bg-slate-300 dark:text-white"
                >
                  <ArrowBackIcon />
                </button>
                <button
                  onClick={() => setIsPlaying((prev) => !prev)}
                  className="px-3 py-1 text-slate-700 border border-slate-400 rounded hover:bg-slate-300 dark:text-white"
                >
                  {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                </button>
                <button
                  onClick={() => handleManualFlip("next")}
                  className="px-3 py-1 text-slate-700 border border-slate-400 rounded hover:bg-slate-300 dark:text-white"
                >
                  <ArrowForwardIcon />
                </button>
              </div>
            </div>
          )}

          {/* edit mode */}
          {images.length > 0 && activeTab === "edit" && (
            <div className="flex flex-col items-center">
              <HTMLFlipBook
                key={activeTab}
                width={bookWidth}
                height={450}
                ref={bookRef}
                flippingTime={800}
                className="shadow-2xl rounded-lg"
                useMouseEvents={activeTab === "view"}
                clickEventForward={activeTab === "view"}
                swipeDistance={activeTab === "view" ? 30 : 10000}
              >
                {/* Cover Page */}
                <div className="demoPage shadow-inner p-3 min-w-[300px] min-h-[450px] h-full rounded-e-md">
                  <div className=" h-full p-4 rounded-md flex justify-center items-center overflow-hidden">
                    <p className="mt-2 text-center text-slate-500 font-normal italic text-2xl overflow-hidden text-ellipsis">
                      A Beautiful Collection of Memories
                    </p>
                  </div>
                </div>
                <div className="demoPage shadow-inner min-w-[300px] min-h-[450px] p-3 h-full rounded-e-md">
                  <div className="h-full p-4 rounded-md flex flex-col overflow-hidden">
                    <div className="flex-1 flex justify-center items-center overflow-hidden">
                      <img
                        src={images[0].photos[0].url}
                        alt="cover"
                        className="max-h-[100%] max-w-[100%] object-contain rounded-md"
                        loading="lazy"
                      />
                    </div>
                  </div>
                </div>
                {/* Photo Pages */}
                {images.map((imgObj, index) => (
                  <div
                    key={index}
                    className={`demoPage shadow-inner min-w-[300px] min-h-[450px] p-5 h-[100%] bg-red-50 ${
                      index % 2 === 0 ? "rounded-s-md" : "rounded-e-md"
                    }`}
                    onDrop={(e) => activeTab === "edit" && handleDrop(e, index)}
                    onDragOver={(e) => activeTab === "edit" && allowDrop(e)}
                  >
                    <div
                      className="p-5 relative rounded-xl h-full flex flex-col border-4 border-white/30"
                      // style={{ backgroundColor: "#d3c9cb" }}
                    >
                      <div
                        className={`flex w-full h-full justify-center items-center gap-2 ${
                          imgObj.layout === "pair-vertical"
                            ? "flex-col"
                            : "flex-row"
                        }`}
                      >
                        {imgObj.photos.map((photo, i) => {
                          let layoutClasses = "";

                          switch (imgObj.layout) {
                            case "single":
                              layoutClasses = "w-full h-full";
                              break;
                            case "pair-horizontal":
                              layoutClasses = "w-1/2";
                              break;
                            case "pair-vertical":
                              layoutClasses = "w-full h-1/2";
                              break;
                            default:
                              layoutClasses = "w-full h-full";
                          }

                          return (
                            <>
                              <img
                                key={i}
                                src={photo.url}
                                alt={`photo-${i}`}
                                loading="lazy"
                                className={`h-full w-full absolute object-none rounded blur-[2px] object-top z-0`}
                              />
                              <img
                                key={i}
                                src={photo.url}
                                alt={`photo-${i}`}
                                loading="lazy"
                                className={`${layoutClasses} object-contain rounded object-top z-10`}
                                draggable={activeTab === "edit"}
                                onDragStart={(e) =>
                                  activeTab === "edit" &&
                                  handleDragStart(e, index, i)
                                }
                                onDrop={(e) =>
                                  activeTab === "edit" &&
                                  handleDrop(e, index, i)
                                }
                                onDragOver={(e) =>
                                  activeTab === "edit" && allowDrop(e)
                                }
                              />
                            </>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Last Page */}
                <div className="demoPage bg-red-50 shadow-inner p-5 min-w-[300px] min-h-[450px] h-full relative rounded-e-md">
                  <p className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-slate-700 text-center font-normal text-2xl">
                    The End
                  </p>
                </div>
              </HTMLFlipBook>
              {/* Controls */}
              <div className="mt-4 flex gap-4">
                <button
                  onClick={() => handleManualFlip("prev")}
                  className="px-3 py-1 text-slate-700 border border-slate-400 rounded hover:bg-slate-300 dark:text-white"
                >
                  <ArrowBackIcon />
                </button>

                <button
                  onClick={() => handleManualFlip("next")}
                  className="px-3 py-1 text-slate-700 border border-slate-400 rounded hover:bg-slate-300 dark:text-white"
                >
                  <ArrowForwardIcon />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="">
            <ArrowBackIcon
              sx={{ fontSize: "30px" }}
              className="bg-slate-300 p-1 rounded text-white cursor-pointer hover:bg-slate-400"
              onClick={handleBack}
            />
          </div>
          <div className="flex justify-center items-center text-slate-700 text-xl gap-2">
            <HideImageOutlinedIcon /> No Photo in this event
          </div>
          <div className="bg-white shadow-md rounded-2xl p-8 max-w-xl text-center mt-5 m-auto">
            {/* Heading */}
            <h2 className="text-2xl font-bold text-slate-700 mb-3">
              Upload Images with Our Desktop App
            </h2>

            {/* Message */}
            <p className="text-slate-500 mb-6">
              For a faster and more reliable upload experience, please use our
              <span className="font-normal"> Desktop Application</span>.
            </p>
            <a
              href="/FotoAlpha.exe"
              download
              className="inline-flex items-center gap-2 bg-blue text-white px-6 py-2 font-normal rounded-lg shadow hover:bg-blueHover transition"
            >
              <Download sx={{ fontSize: "18px" }} />
              Download Desktop App
            </a>
          </div>
        </>
      )}

      {/* Drawer for editing */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: "90%", sm: "30%" },
          },
        }}
      >
        <div className="flex justify-between items-cente dark:bg-slate-800 p-2">
          <h2 className="text-slate-700 text-xl font-bold dark:text-white">
            Edit Album
          </h2>
          <button
            onClick={() => setDrawerOpen(false)}
            className="text-slate-700 dark:text-white font-normal"
          >
            ✕
          </button>
        </div>

        <span className="text-slate-700 dark:text-white font-normal px-2 leading-snug dark:bg-slate-800">
          Drag spreads or drag images inside spreads to reorder.
        </span>
        <div className="dark:bg-slate-800 p-4">
          <button
            onClick={() => {
              editImage(tempImages);
            }}
            className="w-full bg-blue text-white py-2 font-normal rounded hover:bg-blueHover "
          >
            Update Album
          </button>
        </div>
        <div className="space-y-4 dark:bg-slate-800 p-4">
          {tempImages.map((layout, layoutIndex) => (
            <>
              {!imageLoaded && (
                <Skeleton
                  sx={{ bgcolor: "grey.900" }}
                  variant="rounded"
                  animation="wave"
                  width="100%"
                  height="100%"
                />
              )}
              <div
                key={layoutIndex}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("dragSpreadIndex", layoutIndex);
                  e.dataTransfer.setData("type", "spread");
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  if (e.dataTransfer.getData("type") !== "spread") return;

                  const dragIndex = parseInt(
                    e.dataTransfer.getData("dragSpreadIndex")
                  );
                  if (dragIndex === layoutIndex) return;

                  const spreads = [...tempImages];
                  const [moved] = spreads.splice(dragIndex, 1);
                  spreads.splice(layoutIndex, 0, moved);

                  const updatedLayouts = getUpdatedLayouts(spreads);
                  setTempImages(updatedLayouts);

                  // setTempImages(spreads);
                }}
                className="border rounded p-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800"
              >
                <p className="text-sm text-slate-700 mb-2 font-normal dark:text-white">
                  Page {layoutIndex + 1}
                </p>

                <div className="grid grid-cols-2 gap-2 cursor-grab">
                  {layout.photos.map((photo, photoIndex) => (
                    <>
                      {!imageLoaded && (
                        <Skeleton
                          sx={{ bgcolor: "grey.900" }}
                          variant="rounded"
                          animation="wave"
                          width="100%"
                          height="100%"
                        />
                      )}
                      <img
                        key={photoIndex}
                        loading="lazy"
                        draggable
                        onDragStart={(e) => {
                          e.stopPropagation();
                          e.dataTransfer.setData("type", "image");
                          e.dataTransfer.setData(
                            "dragLayoutIndex",
                            layoutIndex
                          );
                          e.dataTransfer.setData("dragPhotoIndex", photoIndex);
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          if (e.dataTransfer.getData("type") !== "image")
                            return;

                          const fromLayout = parseInt(
                            e.dataTransfer.getData("dragLayoutIndex")
                          );
                          const fromPhoto = parseInt(
                            e.dataTransfer.getData("dragPhotoIndex")
                          );

                          // Same position — no change
                          if (
                            fromLayout === layoutIndex &&
                            fromPhoto === photoIndex
                          )
                            return;

                          const updated = [...tempImages];

                          // Move the image
                          const [movedImage] = updated[
                            fromLayout
                          ].photos.splice(fromPhoto, 1);
                          updated[layoutIndex].photos.splice(
                            photoIndex,
                            0,
                            movedImage
                          );

                          const updatedLayouts = getUpdatedLayouts(updated);
                          setTempImages(updatedLayouts);

                          // setTempImages(updated);
                        }}
                        src={photo.url || photo.urlImageSignedUrl}
                        onLoad={() => setImageLoaded(true)}
                        alt={`spread-${layoutIndex}-img-${photoIndex}`}
                        className="w-full h-[60px] object-cover rounded cursor-move border border-slate-300"
                      />
                    </>
                  ))}
                </div>
              </div>
            </>
          ))}
        </div>
      </Drawer>

      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        open={open}
        autoHideDuration={2000}
        onClose={handleClose}
      >
        <Alert onClose={handleClose} severity="success" sx={{ width: "100%" }}>
          Copied !
        </Alert>
      </Snackbar>

      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        open={opensnak}
        message="Generating PDF... Please wait."
      />

      <Modal
        open={openfull}
        onClose={handleCloseFull}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box sx={style}>
          <div className="bg-white rounded dark:bg-slate-800 p-4">
            <div className="flex justify-end">
              <CloseIcon
                className="text-slate-700 cursor-pointer dark:text-white"
                onClick={handleCloseFull}
              />
            </div>
            {images.length > 0 && activeTab === "view" && (
              <div className="flex flex-col items-center h-full" ref={pdfRef}>
                <HTMLFlipBook
                  key={activeTab}
                  width={window.innerWidth / 2 - 60} // width of one page
                  height={window.innerHeight - 150} // height of page
                  size="fixed" // force fixed layout
                  minWidth={500} // each page min width
                  maxWidth={800} // each page max width
                  minHeight={400}
                  maxHeight={1200}
                  drawShadow={true}
                  flippingTime={800}
                  useMouseEvents={activeTab === "view"}
                  clickEventForward={activeTab === "view"}
                  swipeDistance={activeTab === "view" ? 30 : 10000}
                  className="shadow-2xl rounded-lg flip-book"
                  ref={bookRef}
                >
                  {/* Cover Page */}

                  <div className="demoPage shadow-inner p-3 h-full  rounded-e-md">
                    <div className=" h-full p-4 rounded-md flex justify-center items-center overflow-hidden">
                      <p className="mt-2 text-center text-slate-500 italic font-normal text-2xl overflow-hidden text-ellipsis">
                        A Beautiful Collection of Memories
                      </p>
                    </div>
                  </div>
                  <div className="demoPage shadow-inner p-3 h-full bg-red-50 rounded-e-md">
                    <div className=" h-full p-4 rounded-md flex flex-col overflow-hidden">
                      <div
                        id="pdf-cover"
                        className="flex-1 flex justify-center items-center overflow-hidden"
                      >
                        <img
                          src={images[0].photos[0].url}
                          alt="cover"
                          style={{ display: imageLoaded ? "block" : "none" }}
                          className="h-full w-full object-contain rounded-md"
                        />
                      </div>
                    </div>
                  </div>
                  {/* Photo Pages */}
                  {images.slice(1).map((imgObj, index) => (
                    <div
                      key={index}
                      className={`demoPage shadow-inner p-5 h-full bg-red-50  ${
                        index % 2 === 0 ? "rounded-s-md" : "rounded-e-md"
                      }`}
                    >
                      <div
                        className="p-5 relative rounded-xl h-[430px] flex flex-col border-4 border-white/30"
                        // style={{ backgroundColor: "#d3c9cb" }}
                      >
                        {imgObj.layout === "trio" ? (
                          <div className="flex h-full">
                            <div className="w-1/2 h-full pr-1">
                              <img
                                src={imgObj.photos[0]?.url}
                                alt="trio-left-main"
                                className="w-full h-full object-contain rounded"
                                draggable={activeTab === "edit"}
                                onDragStart={(e) =>
                                  activeTab === "edit" &&
                                  handleDragStart(e, index)
                                }
                              />
                            </div>

                            <div className="w-1/2 h-full flex flex-col gap-1 pl-1">
                              <img
                                src={imgObj.photos[1]?.url}
                                alt="trio-top"
                                className="w-full h-1/2 object-contain rounded"
                                draggable={activeTab === "edit"}
                                onDragStart={(e) =>
                                  activeTab === "edit" &&
                                  handleDragStart(e, index)
                                }
                              />
                              <img
                                src={imgObj.photos[2]?.url}
                                alt="trio-bottom"
                                className="w-full h-1/2 object-contain rounded"
                                draggable={activeTab === "edit"}
                                onDragStart={(e) =>
                                  activeTab === "edit" &&
                                  handleDragStart(e, index)
                                }
                              />
                            </div>
                          </div>
                        ) : (
                          <div
                            className={`pdf-page flex w-full h-full gap-2 justify-center items-center ${
                              imgObj.layout === "pair-vertical"
                                ? "flex-col"
                                : "flex-row"
                            }`}
                            id={`pdf-spread-${index}`}
                          >
                            {imgObj.photos.map((photo, i) => {
                              let layoutClasses = "";
                              switch (imgObj.layout) {
                                case "single":
                                  layoutClasses = "w-full h-full";
                                  break;
                                case "pair-horizontal":
                                  layoutClasses = "w-1/2 h-auto";
                                  break;
                                case "pair-vertical":
                                  layoutClasses = "w-full h-1/2";
                                  break;
                                default:
                                  layoutClasses = "w-full h-full";
                              }

                              return (
                                <>
                                  <img
                                    key={i}
                                    src={photo.url}
                                    crossOrigin="anonymous"
                                    alt={`photo-${i}`}
                                    loading="lazy"
                                    className={`h-full w-full absolute object-none rounded blur-[2px] object-top z-0`}
                                  />
                                  <img
                                    key={i}
                                    src={photo.url}
                                    crossOrigin="anonymous"
                                    alt={`photo-${i}`}
                                    loading="lazy"
                                    className={`${layoutClasses}  object-contain rounded object-top z-10`}
                                  />
                                </>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Last Page */}
                  <div
                    id="pdf-back-cover"
                    className="demoPage bg-red-50 shadow-inner p-5 h-full min-w-[300px] min-h-[450px] relative rounded-e-md"
                  >
                    <p className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-slate-700 text-center font-normal text-2xl">
                      The End
                    </p>
                  </div>
                </HTMLFlipBook>

                {/* Controls */}
                <div className="mt-4 flex gap-4">
                  <button
                    onClick={() => handleManualFlip("prev")}
                    className="px-3 py-1 text-slate-700 border border-slate-400 rounded hover:bg-slate-300 dark:text-white"
                  >
                    <ArrowBackIcon />
                  </button>
                  <button
                    onClick={() => setIsPlaying((prev) => !prev)}
                    className="px-3 py-1 text-slate-700 border border-slate-400 rounded hover:bg-slate-300 dark:text-white"
                  >
                    {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                  </button>
                  <button
                    onClick={() => handleManualFlip("next")}
                    className="px-3 py-1 text-slate-700 border border-slate-400 rounded hover:bg-slate-300 dark:text-white"
                  >
                    <ArrowForwardIcon />
                  </button>
                </div>
              </div>
            )}
          </div>
        </Box>
      </Modal>
    </>
  );
}

export default Albumimg;

