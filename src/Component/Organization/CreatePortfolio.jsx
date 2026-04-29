import React, { useState } from "react";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import img from "../image/photographer(1) 1.png";
import slide1 from "../image/slide-1.png";
import slide2 from "../image/slide-2.png";
import Slider from "react-slick";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import UploadIcon from "@mui/icons-material/Upload";
import upload from "../image/uploading 2.png";
import { useNavigate } from "react-router-dom";

function CreatePortfolio() {
  const navigate = useNavigate();
  const [showUploadimg, setShowUploadimg] = useState(false);
  const [showUploadLogo, setShowUploadLogo] = useState(false);

  const settings = {
    dots: false,
    fade: true,
    infinite: true,
    speed: 200,
    autoplay: true,
    autoplaySpeed: 1000,
    slidesToShow: 1,
    slidesToScroll: 1,
    waitForAnimate: false,
  };

  return (
    <>
      <style>
        {`
          .slick-prev, .slick-next{
            display: none !important;
          }               
        `}
      </style>
      {!showUploadimg && !showUploadLogo && (
        <section className="flex flex-col md:flex-row justify-between md:h-screen p-4 md:p-0">
          <div className="md:w-1/2 ">
            <div className="md:w-1/2 title flex justify-start items-center m-auto md:p-3 md:py-4 dark:text-white">
              <CameraAltIcon sx={{ fontSize: 30 }} />
              <p className="mb-0 font-semibold text-2xl ml-2 text-slate-700 dark:text-white">
                FotoAlpha
              </p>
            </div>
            <div className="md:w-1/2 m-auto text-start relative inset-y-1/4">
              <h1 className="text-slate-700 text-3xl font-bold ">
                Do you want to create your portfolio?
              </h1>
              <p className="text-slate-600 text-md font-semibold mt-3">
                With an online portfolio, you can showcase your work and reach
                more potential clients by directly sharing the portfolio link
                with them.
              </p>
              <div className="flex mt-5">
                <button
                  className="bg-blue py-2 px-12 rounded-md text-white font-semibold"
                  onClick={() => setShowUploadLogo(true)}
                >
                  Yes
                </button>
                <button
                  className="btn py-2 px-12 rounded-md text-blue border-2 border-blue ml-4 font-semibold"
                  onClick={() => navigate("/portfolio/dashboard")}
                >
                  No
                </button>
              </div>
            </div>
          </div>
          <div className="bg-slate-200 md:w-1/2">
            <div className="slider-container relative inset-y-1/4 m-auto hidden md:block">
              <Slider {...settings}>
                <div>
                  <div className="w-2/3 m-auto">
                    <img src={img} alt="portfolio " />
                  </div>
                </div>
                <div>
                  <div className="bg-white p-2 w-2/3 m-auto">
                    <img src={slide1} alt="portfolio" />
                  </div>
                </div>
                <div>
                  <div className="bg-white p-2 w-2/3 m-auto">
                    <img src={slide2} alt="portfolio" />
                  </div>
                </div>
              </Slider>
            </div>
            <button
              className="btn absolute bottom-11 right-11 text-slate-700 font-semibold text-xl dark:text-white"
              onClick={() => navigate("/portfolio/dashboard")}
            >
              Skip
            </button>
          </div>
        </section>
      )}
      {showUploadLogo && !showUploadimg && (
        <section className="flex flex-col md:flex-row justify-between md:h-screen relative p-4 md:p-0">
          <div className="md:w-1/2">
            <div className="md:w-1/2 m-auto title flex items-center md:p-3 md:py-4 dark:text-white">
              <CameraAltIcon sx={{ fontSize: 30 }} />
              <p className="mb-0 font-semibold text-2xl ml-2 text-slate-700 dark:text-white">
                FotoAlpha
              </p>
            </div>
            <div className="md:w-1/2 m-auto text-start relative top-10 md:top-24">
              <h1 className="text-slate-700 text-3xl font-bold ">
                Upload Logo for your portfolio
              </h1>
              <p className="text-slate-600 text-md font-semibold mt-3">
                Add Logo that represent your portfolio.
              </p>
              <div className="flex mt-3">
                <p className="text-slate-700 font-semibold ">
                  <FiberManualRecordIcon sx={{ fontSize: 12 }} /> Max size: 2MB
                </p>
              </div>
              <div className="flex mt-5 items-center flex-col m-auto btn bg-slate-200 p-5 rounded-md text-white font-semibold">
                <UploadIcon sx={{ fontSize: 50 }} className="text-slate-700" />
                <label
                  htmlFor="file"
                  className="bg-blue mt-3 py-2 px-4 cursor-pointer rounded-md text-white font-semibold"
                >
                  <input type="file" className="hidden" id="file" />
                  Upload Logo
                </label>
              </div>
            </div>
          </div>
          <div className="bg-slate-200 md:w-1/2 mt-12 md:mt-0 pb-20 md:pb-0">
            <img
              src={upload}
              alt="portfolio"
              className="md:h-3/6 m-auto mt-12"
            />
            <p className="text-slate-700 font-semibold md:w-1/2 m-auto mt-3">
              Get our desktop application to upload more images.
            </p>
            <div className="flex justify-center">
              <button className="btn bg-blue text-white py-2 px-4 rounded-md mt-4 font-semibold  dark:text-white">
                Download Now
              </button>
            </div>
            <button
              className="btn absolute bottom-11 right-28 text-slate-700 font-semibold text-xl dark:text-white"
              onClick={() => setShowUploadimg(true)}
            >
              Next
            </button>
            <button
              className="btn absolute bottom-11 right-11 text-slate-700 font-semibold text-xl dark:text-white"
              onClick={() => setShowUploadimg(true)}
            >
              Skip
            </button>
          </div>
        </section>
      )}
      {showUploadimg && (
        <section className="flex flex-col md:flex-row justify-between md:h-screen relative p-4 md:p-0">
          <div className="md:w-1/2">
            <div className="md:w-1/2 m-auto title flex items-center md:p-3 md:py-4 dark:text-white">
              <CameraAltIcon sx={{ fontSize: 30 }} />
              <p className="mb-0 font-semibold text-2xl ml-2 text-slate-700 dark:text-white">
                FotoAlpha
              </p>
            </div>
            <div className="md:w-1/2 m-auto text-start relative top-10 md:top-24">
              <h1 className="text-slate-700 text-3xl font-bold ">
                Upload Images for your portfolio
              </h1>
              <p className="text-slate-600 text-md font-semibold mt-3">
                Add images that represent your best work to your portfolio.
              </p>
              <div className="flex mt-3">
                <p className="text-slate-700 font-semibold ">
                  <FiberManualRecordIcon sx={{ fontSize: 12 }} /> Up to 10
                  images
                </p>
                <p className="text-slate-700 font-semibold ml-5">
                  <FiberManualRecordIcon sx={{ fontSize: 12 }} /> Max size: 2MB
                </p>
              </div>
              <div className="flex mt-5 items-center flex-col m-auto btn bg-slate-200 p-5 rounded-md text-white font-semibold">
                <UploadIcon sx={{ fontSize: 50 }} className="text-slate-700" />
                <label
                  htmlFor="file"
                  className="bg-blue mt-3 py-2 px-4 cursor-pointer rounded-md text-white font-semibold"
                >
                  <input type="file" className="hidden" id="file" />
                  Upload Images
                </label>
              </div>
            </div>
          </div>
          <div className="bg-slate-200 md:w-1/2 pb-20 mt-12 md:mt-0">
            <img
              src={upload}
              alt="portfolio"
              className="md:h-3/6 m-auto mt-12"
            />
            <p className="text-slate-700 font-semibold md:w-1/2 m-auto mt-3">
              Get our desktop application to upload more images.
            </p>
            <div className="flex justify-center">
              <button className="btn bg-blue text-white py-2 px-4 rounded-md mt-4 font-semibold  dark:text-white">
                Download Now
              </button>
            </div>
            <button
              className="btn absolute bottom-11 right-11 text-slate-700 font-semibold text-xl dark:text-white"
              onClick={() => navigate("/portfolio/dashboard")}
            >
              Skip
            </button>
          </div>
        </section>
      )}
    </>
  );
}

export default CreatePortfolio;
