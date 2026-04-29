import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { CircularProgress } from "@mui/material";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import SubCategory from "./SubCategory";
// import SyncPhotos from "./SyncPhotos";
import Select from "react-select";
import { PortfolioContext } from "../Context/PortfolioContext";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SyncPhoto from "./Syncphoto";
import { toast } from "react-toastify";
import Slider from "react-slick";
import demo from "../../image/demo.jpg";

const baseURL = process.env.REACT_APP_BASE_URL;

const steps = ["Select Event", "Select SubCategory", "Uplaod Photos"];

function Events() {
  const [event, setEvent] = useState([]);
  const [loading, setLoading] = useState(false);
  const {
    back,
    cancel,
    complete,
    setBack,
    setComplete,
    setCancel,
    uplaoded,
    total,
    duplicate,
    setTotal,
    setUploaded,
    setDuplicate,
    savedStep,
    setSavedStep,
    eventId,
    setEventId,
    subId,
    setSubId,
    setEventname,
    status,
  } = useContext(PortfolioContext);

  useEffect(() => {
    fetchEvents();
  }, []);

  // console.log(eventId)

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseURL}/events/all-events`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "ngrok-skip-browser-warning": "69420",
        },
      });
      setLoading(false);
      setEvent(response.data.events);
      // console.log(response.data.events);
      window.electronAPI.setStore("uplaodEvents", response.data.events);
    } catch (error) {
      setLoading(false);
      const cachedSummary = await window.electronAPI.getStore("uplaodEvents");
      if (cachedSummary) {
        setEvent(cachedSummary);
        // console.log(cachedSummary);
      }
      // console.log(error);
    }
  };

  const handleNext = () => {
    if (savedStep === 0 && status === "loading") {
      toast.error(
        "You can’t perform another upload while images are already uploading."
      );
      return; // stop here
    }

    if (savedStep === 0) {
      if (!eventId) {
        toast.error("Please select an event before proceeding.");
        return;
      }
    }

    if (savedStep === 1) {
      if (!subId) {
        toast.error("Please select a subcategory before proceeding.");
        return;
      }
    }
    // Proceed to next step
    setSavedStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setSavedStep((prev) => prev - 1);
  };

  const handleDone = () => {
    window.location.reload();
    setEventId("");
    setSubId("");
    setSavedStep(0);
    setTotal(0);
    setUploaded(0);
    setDuplicate(0);
    setComplete(false);
    setCancel(false);
    setBack(true);
  };

  const options = event.map((cat) => ({
    label: cat.name,
    value: cat._id,
  }));

  var settings = {
    dots: false,
    infinite: false,
    speed: 500,
    slidesToShow: event.length === 1 ? 1 : event.length < 4 ? event.length : 4,
    slidesToScroll: 1,
    centerMode: event.length > 1 && event.length < 4, // only center if 2-3 slides
    centerPadding: "0px",

    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 2,
          infinite: true,
          dots: true,
        },
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          initialSlide: 1,
        },
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };

  return (
    <>
      {" "}
      <style>
        {`
        .slick-prev:before, .slick-next:before{
          color: #14558e !important;
           font-size :30px
        } 
        .center{
        display: block !important;
        margin: auto;
        }
        .slick-prev{
          left: -45px;
          z-index: 9;
        } 
         @media only screen and (min-width: 768px) {
        .slick-track{
        display: inline-flex;
        gap:10px;
        }
      `}
      </style>
      {loading ? (
        <div className="flex justify-center mt-5">
          <CircularProgress />
        </div>
      ) : (
        <>
          {/* {status === "loading" ? (
            <div className="p-4 bg-yellow-100 border-l-4 border-yellow-500 rounded">
              <p className="text-yellow-700 font-medium">
                You can’t perform another upload while images are already
                uploading.
              </p>
            </div>
          ) : ( */}
          <div className="mt-5 p-4 w-9/12 m-auto bg-white rounded-md dark:bg-slate-600 ">
            <>
              <Stepper activeStep={savedStep}>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>

              {savedStep === steps.length ? (
                <></>
              ) : (
                <>
                  {/* {savedStep === 0 && (
                      <div className="text-start my-5 w-full">
                        <label className="text-slate-700 text-start font-semibold">
                          Choose Event
                        </label>
                        <Select
                          options={options}
                          value={options.find((opt) => opt.value === eventId)}
                          onChange={(selectedOption) => {
                            setEventId(selectedOption);
                            setEventname(selectedOption.label);
                          }}
                          placeholder="Choose Event"
                          className="w-full mt-1 capitalize"
                        />
                      </div>
                    )} */}
                  {savedStep === 0 && (
                    <div className="text-start my-5 w-full">
                      <label className="text-slate-700 text-start font-semibold dark:text-white">
                        Choose Event
                      </label>
                      <Select
                        options={options}
                        value={options.find((opt) => opt.value === eventId)}
                        onChange={(selectedOption) => {
                          setEventId(selectedOption);
                          setEventname(selectedOption.label);
                        }}
                        placeholder={
                          status === "loading" ? "choose event" : "Choose Event"
                        }
                        className="w-full mt-1 capitalize"
                        isDisabled={status === "loading"} // disable select while loading
                      />
                    </div>
                  )}

                  {savedStep === 1 && <SubCategory />}
                  {savedStep === 2 && (
                    <>
                      {/* <SyncPhotos selectedOption={selectedOption} /> */}
                      <SyncPhoto />
                    </>
                  )}

                  <div className="flex justify-between gap-5">
                    {back === true && (
                      <button
                        disabled={savedStep === 0}
                        onClick={handleBack}
                        className="bg-blue text-white py-2 px-4 rounded font-semibold hover:bg-blueHover disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        Back
                      </button>
                    )}
                    {savedStep !== steps.length - 1 && (
                      <button
                        onClick={handleNext}
                        className="bg-blue text-white py-2 px-4 rounded font-semibold hover:bg-blueHover"
                      >
                        Next
                      </button>
                    )}
                  </div>
                </>
              )}
            </>
          </div>
          {/* )} */}
        </>
      )}
      {event?.length !== 0 && (
        <div className="bg-white shadow-md rounded-md p-4 mt-8 w-full text-start dark:bg-slate-800">
          <h2 className="text-xl font-bold text-slate-700 mb-3 dark:text-white">
            Recent Added Events
          </h2>
          <div className="slider-container w-full lg:w-[90%] m-auto">
            <Slider {...settings}>
              {event &&
                event.map((event, index) => (
                  <div
                    key={index}
                    className="center bg-white rounded p-4 text-center h-full border border-slate-300 shadow-md dark:bg-slate-700"
                    style={{ display: "block !important" }}
                  >
                    <img
                      src={event?.firstPhotoSignedUrl || demo}
                      alt="event"
                      className="w-full h-40 object-cover"
                    />
                    <h3 className="text-slate-700 font-medium dark:text-white">
                      {event?.name}
                    </h3>
                  </div>
                ))}
            </Slider>
          </div>
        </div>
      )}
    </>
  );
}

export default Events;

