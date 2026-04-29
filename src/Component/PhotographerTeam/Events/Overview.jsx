import React, { useContext, useMemo, useRef, useState } from "react";
import DateRangeIcon from "@mui/icons-material/DateRange";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import QRCode from "react-qr-code";
import { Alert, Divider, Snackbar } from "@mui/material";
import ShareIcon from "@mui/icons-material/Share";
import PrintIcon from "@mui/icons-material/Print";
import {useParams } from "react-router-dom";
import { format } from "date-fns";
import { Box, Modal } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import FacebookIcon from "@mui/icons-material/Facebook";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import XIcon from "@mui/icons-material/X";
import { PhotographerTeamEventContext } from "../Context/PhotographerTeamEventContext";

const baseurl = process.env.REACT_APP_BASE_URL;
const baseurlFront = process.env.REACT_APP_FRONT_BASE_URL;
const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  boxShadow: 24,
  border: "1px solid #fff",
  py: 2,
  px: 4,
};
function Oveview() {
  const { photographerteamevent } = useContext(PhotographerTeamEventContext);
  const { id } = useParams();
  const qrCodeRef = useRef(null);
  const [open, setOpen] = useState(false);
  const slot = photographerteamevent?.timeSlots;
  const [openqr, setOpenqr] = useState(false);
  const handleCloseqr = () => setOpenqr(false);
  const [show, setShow] = useState(false);
      const [expanded, setExpanded] = useState(false);


  const copyToClipboard = async () => {
    try {
      const textToCopy = "Your text or URL here";
      navigator.clipboard.writeText(textToCopy).then(() => {
        setOpen(true);
      });
      await navigator.clipboard.writeText(`${baseurlFront}/guest/register?eventcode=${photographerteamevent?.eventCode}`);
    } catch (error) {
      console.error("Unable to copy to clipboard:", error);
    }
  };


    const getMinutesFromStartTime = (timeValue) => {
    if (!timeValue) return Number.MAX_SAFE_INTEGER;

    const normalized = String(timeValue)
      .trim()
      .toLowerCase()
      .replace(/\./g, "");
    const match = normalized.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
    if (!match) return Number.MAX_SAFE_INTEGER;

    let hours = Number(match[1]);
    const minutes = Number(match[2] || 0);
    const meridiem = match[3];

    if (Number.isNaN(hours) || Number.isNaN(minutes) || minutes > 59) {
      return Number.MAX_SAFE_INTEGER;
    }

    if (meridiem) {
      if (hours === 12) hours = 0;
      if (meridiem === "pm") hours += 12;
    }

    if (hours < 0 || hours > 23) return Number.MAX_SAFE_INTEGER;
    return hours * 60 + minutes;
  };

  const getSlotSortTimestamp = (slotItem) => {
    if (!slotItem?.date) return Number.MAX_SAFE_INTEGER;

    const parsedDate = new Date(slotItem.date);
    if (Number.isNaN(parsedDate.getTime())) return Number.MAX_SAFE_INTEGER;

    const startOfDay = new Date(parsedDate);
    startOfDay.setHours(0, 0, 0, 0);

    const minutesFromStart = getMinutesFromStartTime(slotItem.startTime);
    const minuteOffset =
      minutesFromStart === Number.MAX_SAFE_INTEGER ? 1439 : minutesFromStart;

    return startOfDay.getTime() + minuteOffset * 60 * 1000;
  };

  const sortedSlots = useMemo(() => {
    if (!Array.isArray(slot)) return [];

    return [...slot].sort((a, b) => {
      const timeA = getSlotSortTimestamp(a);
      const timeB = getSlotSortTimestamp(b);

      if (timeA !== timeB) return timeA - timeB;

      const nameA = a?.eventSubCategory?.name || "";
      const nameB = b?.eventSubCategory?.name || "";
      return nameA.localeCompare(nameB);
    });
  }, [slot]);

  const handleClose = (_, reason) => {
    if (reason === "clickaway") return;
    setOpen(false);
  };

  const cardRef = useRef();

  const printCard = () => {
    if (!cardRef.current) return;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
    <html>
      <head>
        <title>Print QR Card</title>
        <style>
           body {
            font-family: sans-serif;
            text-align: center;
            margin: auto;
          }            
          
        </style>
      </head>
      <body>
        ${cardRef.current.innerHTML}       
        <script>
          window.onload = function () {
            window.print();
            window.onafterprint = function () { window.close(); };
          };
        </script>
      </body>
    </html>
  `);
    printWindow.document.close();
  };

  const handleWhatsAppShare = () => {
    const url = `${baseurlFront}/guest/register?eventcode=${photographerteamevent?.eventCode}`;
    const message = `Check out this event album: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  const handleFacebookShare = () => {
    const url = `${baseurlFront}/guest/register?eventcode=${photographerteamevent?.eventCode}`;
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      "_blank"
    );
  };

  const handleTwitterShare = () => {
    const url =  `${baseurlFront}/guest/register?eventcode=${photographerteamevent?.eventCode}`;
    const message = `Check out this event album: ${url}`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  };

  return (
    <>
      <section >
        <div className="flex justify-between gap-3">
          <div className=" h-max md:mb-0 rounded mb-3 w-3/5">
            <div className="bg-white w-full p-4 rounded dark:bg-slate-800">
              <div className="flex justify-between">
                <h3 className="text-start text-xl font-bold dark:text-white text-slate-700">
                  Event Information
                </h3>                
              </div>
              {sortedSlots &&
                sortedSlots.map((slot, index) => (
                  <React.Fragment key={index}>
                    <div className="flex flex-col mt-2 mb-2 text-start">
                      <div className="flex">
                        <DateRangeIcon className="text-slate-700 dark:text-white" />
                        <p className="text-slate-700 font-semibold ml-1 dark:text-white">
                          {slot?.eventSubCategory?.name}
                        </p>
                      </div>
                      <p className="text-lg font-bold text-slate-700 dark:text-white mt-2 dark:text-white">
                        {slot.date
                          ? format(new Date(slot.date), "MMM dd, yyyy")
                          : "Date not available"}
                      </p>
                      {slot?.startTime && slot?.endTime && (

                      <div className="flex mt-1">
                        <AccessTimeIcon className="text-slate-700 dark:text-white" />
                        <p className="text-slate-700 font-semibold ml-1 dark:text-white">
                          {slot.startTime} - {slot.endTime}
                        </p>
                      </div>
                      )}
                      {slot.venue && (

                        <div className="flex mt-2">
                        <LocationOnIcon className="text-slate-700 dark:text-white" />
                        <p className="text-slate-700 font-semibold ml-1 dark:text-white">
                          {slot.venue}
                        </p>
                      </div>
                      )}
                      {slot.description && (

                        <div className="flex mt-2">
                        <ErrorOutlineIcon className="text-blue" />
                        <p className="text-blue font-semibold ml-1">
                          {slot.description}
                        </p>
                      </div>
                      )}
                    </div>
                    <Divider />
                  </React.Fragment>
                ))}
                {photographerteamevent?.description && (

               <div className="flex flex-col mt-5 text-start">
                <p className="text-slate-700 font-medium ml-1 dark:text-white">Description</p>
                <p
                  className={`text-slate-700 ml-1 dark:text-white ${expanded ? "" : "line-clamp-3"
                    }`}
                >
                  {photographerteamevent?.description}
                </p>
                {photographerteamevent?.description?.length > 100 && ( // only show toggle if text is long
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="text-blue font-medium mt-1 text-sm self-start"
                  >
                    {expanded ? "Show Less" : "Show More"}
                  </button>
                )}
              </div>
                )}
            </div>           
          </div>
          <div className="rounded md:mb-0 mb-3 h-max w-2/5">
            <div className="bg-white p-4 rounded dark:bg-slate-800">
              <div className="text-start text-xl font-bold dark:text-white text-slate-700 dark:text-white">
                <h3>Client Information</h3>
              </div>
              <div className="flex mt-2">
                <p className="text-slate-700 font-semibold dark:text-white">Client Name: </p>
                <p className="text-slate-700 ml-1 dark:text-white">
                  {photographerteamevent?.hostName}
                </p>
              </div>
              {photographerteamevent?.hostEmail && (
              <div className="flex">
                <p className="text-slate-700 font-semibold dark:text-white">Client Email: </p>
                <p className="text-slate-700 ml-1 dark:text-white">
                  {photographerteamevent?.hostEmail}
                </p>
              </div>
              )}
              <div className="flex">
                <p className="text-slate-700 font-semibold dark:text-white">
                  Client Mobile No:{" "}
                </p>
                <p className="text-slate-700 ml-1 dark:text-white">
                  {photographerteamevent?.hostMobile}
                </p>
              </div>
            </div>
            <div className="bg-white p-4 mt-3 rounded dark:bg-slate-800">
              <p className="text-slate-700 text-xl font-bold dark:text-white mb-3 ">
                Event Sharing
              </p>
              <div
                style={{
                  height: "auto",
                  margin: "0 auto",
                  maxWidth: 180,
                  width: "100%",
                }}
              >
                <QRCode
                  size={250}
                  style={{
                    height: "auto",
                    maxWidth: "100%",
                    width: "100%",
                  }}
                  value={`${baseurlFront}/guest/register?eventcode=${photographerteamevent?.eventCode}`}
                  viewBox={`0 0 256 256`}
                  ref={qrCodeRef}
                />
              </div>
              <div className="flex justify-center mt-5">
                <button
                  className="btn border border-blue rounded p-2 text-blue font-semibold hover:bg-blueHover hover:text-white"
                  onClick={() => setOpenqr(true)}
                >
                  Manage QR / Link
                </button>
              </div>
            </div>
            <Modal
              open={openqr}
              onClose={handleCloseqr}
              aria-labelledby="modal-modal-title"
              aria-describedby="modal-modal-description"
            >
              <Box sx={style}>
                <div className="bg-white rounded">
                  <div className="flex justify-end">
                    <CloseIcon
                      className="text-slate-700 cursor-pointer"
                      onClick={handleCloseqr}
                    />
                  </div>
                  <div className=" title flex justify-center items-center dark:border-slate-800 md:p-3 md:py-4 dark:text-white">
                    
                    <p className="mb-0 font-semibold text-2xl ml-2 text-slate-700 dark:text-white">
                      FotoAlpha
                    </p>
                  </div>
                  <div
                    style={{
                      height: "auto",
                      margin: "0 auto",
                      maxWidth: 180,
                      width: "100%",
                    }}
                  >
                    <QRCode
                      size={250}
                      style={{
                        height: "auto",
                        maxWidth: "100%",
                        width: "100%",
                      }}
                       value={`${baseurlFront}/guest/register?eventcode=${photographerteamevent?.eventCode}`}
                      viewBox={`0 0 256 256`}
                      ref={qrCodeRef}
                    />
                  </div>
                  <p className="text-slate-700 font-semibold text-center mt-2">
                    Scan to view the album
                  </p>
                  <div className="flex justify-center">
                    <button
                      className="border border-slate-300 rounded-md font-semibold text-slate-600 px-4 mt-3 py-2 rounded dark:text-slate-400"
                      onClick={printCard}
                    >
                      <PrintIcon /> Print
                    </button>
                    <button
                      className="ms-3 border border-slate-300 rounded-md font-semibold text-slate-600 px-4 mt-3 py-2 rounded dark:text-slate-400"
                      onClick={() => setShow(true)}
                    >
                      <ShareIcon /> Share
                    </button>
                  </div>
                  {show && (<>
                     <div className="flex justify-center">
                        <p className="text-slate-700 font-semibold mt-3">
                          Event Code: {photographerteamevent?.eventCode}
                        </p>
                      </div>
                    <div className="flex justify-center gap-4 mt-3">
                      <WhatsAppIcon
                        className="cursor-pointer text-green-500"
                        onClick={handleWhatsAppShare}
                      />
                      <FacebookIcon
                        className="cursor-pointer text-blue"
                        onClick={handleFacebookShare}
                      />
                      <XIcon
                        className="cursor-pointer dark:text-white"
                        onClick={handleTwitterShare}
                      />
                      <ContentCopyIcon
                        className="cursor-pointer dark:text-white"
                        onClick={copyToClipboard}
                      />
                    </div>
                    </>
                  )}
                  <div className="flex justify-center mt-3">
                    <p className="text-slate-700">79733 06537</p>
                    <p className="text-slate-700 ml-10">
                      www.fotoalpha.com
                    </p>
                  </div>
                </div>
              </Box>
            </Modal>            
          </div>
          <Snackbar
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            open={open}
            autoHideDuration={2000}
            onClose={handleClose}
          >
            <Alert
              onClose={handleClose}
              severity="success"
              sx={{ width: "100%" }}
            >
              Copied !
            </Alert>
          </Snackbar>
        </div>
        {/* print */}
        <div ref={cardRef} className="hidden">
          <div style={{ display: "flex", justifyContent: "center" }}>
            
            <p style={{ fontSize: "20px" }}>FotoAlpha</p>
          </div>
          <div>
            <QRCode
              size={100}
              style={{ width: "50%", height: "auto" }}
               value={`${baseurlFront}/guest/register?eventcode=${photographerteamevent?.eventCode}`}
              viewBox="0 0 256 256"
              ref={qrCodeRef}
            />
          </div>
          <p>Scan to view the album</p>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <p>79733 06537</p>
            <p style={{ marginLeft: "20px" }}>www.fotoalpha.com</p>
          </div>
        </div>
      </section>
    </>
  );
}

export default Oveview;
