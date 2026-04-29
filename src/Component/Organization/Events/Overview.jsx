import React, { useContext, useEffect, useRef, useState } from "react";
import DateRangeIcon from "@mui/icons-material/DateRange";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import BorderColorOutlinedIcon from "@mui/icons-material/BorderColorOutlined";
import QRCode from "react-qr-code";
import { Alert, Avatar, Divider, Snackbar } from "@mui/material";
import ShareIcon from "@mui/icons-material/Share";
import PrintIcon from "@mui/icons-material/Print";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { Box, Modal } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import FacebookIcon from "@mui/icons-material/Facebook";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import XIcon from "@mui/icons-material/X";
import { PortfolioEventContext } from "../Context/PortfolioEventContext";
import PeopleIcon from "@mui/icons-material/People";
import axios from "axios";

const baseurl = process.env.REACT_APP_BASE_URL;
const baseurlFront = process.env.REACT_APP_FRONT_BASE_URL;
const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: {
    xs: "90%", // mobile screens
    sm: 400, // small screens and up
    md: 500, // medium screens and up
  },
  boxShadow: 24,
};
function Oveview() {
  const { portfolioevent } = useContext(PortfolioEventContext);
 const { eventid } = useParams();
  const qrCodeRef = useRef(null);
  const [open, setOpen] = useState(false);
  const slot = portfolioevent?.timeSlots;
  const [openqr, setOpenqr] = useState(false);
  const handleCloseqr = () => setOpenqr(false);
  const [show, setShow] = useState(false);
  const navigate = useNavigate();
  const [team, setTeam] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const [eventStatus, setEventStatus] = useState(portfolioevent?.status || "upcoming");
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusSeverity, setStatusSeverity] = useState("success");

  useEffect(() => {
    if (portfolioevent?.status) {
      setEventStatus(portfolioevent.status);
    }
  }, [portfolioevent]);

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    axios
      .get(`${baseurl}/photographer/event/team-assigned?eventId=${eventid}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      .then((response) => {
        // console.log(response.data.team);
        setTeam(response.data.team);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const copyToClipboard = async () => {
    try {
      const textToCopy = "Your text or URL here";
      navigator.clipboard.writeText(textToCopy).then(() => {
        setOpen(true);
      });
      await navigator.clipboard.writeText(
        `${baseurlFront}/guest/register?eventcode=${portfolioevent?.eventCode}`
      );
    } catch (error) {
      console.error("Unable to copy to clipboard:", error);
    }
  };

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
    const url = `${baseurlFront}/guest/register?eventcode=${portfolioevent?.eventCode}`;
    const message = `Check out this event album: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  const handleFacebookShare = () => {
    const url = `${baseurlFront}/guest/register?eventcode=${portfolioevent?.eventCode}`;
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      "_blank"
    );
  };

  const handleTwitterShare = () => {
    const url = `${baseurlFront}/guest/register?eventcode=${portfolioevent?.eventCode}`;
    const message = `Check out this event album: ${url}`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  };

  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      const response = await axios.patch(
        `${baseurl}/events/${eventid}/status`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setEventStatus(newStatus);
      setStatusMessage(`Event status updated to ${newStatus}!`);
      setStatusSeverity("success");
      setShowStatusModal(false);
    } catch (error) {
      setStatusMessage(error.response?.data?.message || "Failed to update status");
      setStatusSeverity("error");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200";
      case "upcoming":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200";
      case "ongoing":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200";
      case "cancelled":
        return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  return (
    <>
      <section>
        <div className="flex flex-col lg:flex-row justify-between text-start md:gap-3">
          <div className=" h-max md:mb-0 mb-3 lg:w-3/5 w-full">
            <div className="bg-white w-full p-4 rounded dark:bg-slate-800">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-start text-xl font-normal dark:text-white text-slate-700">
                  Event Information
                </h2>
                <div className="flex gap-2 items-center">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold capitalize cursor-pointer hover:opacity-80 transition ${getStatusColor(
                      eventStatus
                    )}`}
                    onClick={() => setShowStatusModal(true)}
                    title="Click to change status"
                  >
                    {eventStatus}
                  </span>
                  <button
                    className="bg-transparent flex gap-1 items-center text-slate-700 py-1 px-2 text-sm rounded-lg font-normal border-slate-300 border dark:border-slate-600 dark:text-white "
                    onClick={() => navigate("edit_event")}
                  >
                    <BorderColorOutlinedIcon /><span className="hidden md:block"> Edit Event</span>
                  </button>
                </div>
              </div>
              {slot &&
                slot.map((slot, index) => (
                  <React.Fragment key={index}>
                    <div className="flex flex-col mt-2 mb-2">
                      <div className="flex ">
                        <DateRangeIcon className="text-slate-700 dark:text-white" />
                        <p className="text-slate-700 font-normal ml-1 dark:text-white">
                          {slot?.eventSubCategory?.name}
                        </p>
                      </div>
                      <p className="text-lg font-normal text-slate-700 dark:text-white mt-2">
                        {slot.date
                          ? format(new Date(slot.date), "MMM dd, yyyy")
                          : "Date not available"}
                      </p>
                      {slot.startTime && slot.endTime && (
                        <div className="flex mt-1">
                          <AccessTimeIcon className="text-slate-700" />
                          <p className="text-slate-700 font-normal ml-1">
                            {slot.startTime} - {slot.endTime}
                          </p>
                        </div>
                      )}
                      {slot.venue &&(

                        <div className="flex mt-2">
                        <LocationOnIcon className="text-slate-700 dark:text-white" />
                        <p className="text-slate-700 font-normal ml-1 dark:text-white">
                          {slot.venue}
                        </p>
                      </div>
                      )}
                      {slot?.description && (

                        <div className="flex mt-2">
                        <ErrorOutlineIcon className="text-slate-700 dark:text-white" />
                        <p className="text-slate-700 font-normal ml-1 dark:text-white">
                          {slot.description}
                        </p>
                      </div>
                      )}
                    </div>
                    <Divider />
                  </React.Fragment>
                ))}
              <div className="flex flex-col mt-5">
                <p className="text-slate-700 font-medium ml-1 dark:text-white">Description</p>
                <p
                  className={`text-slate-700 ml-1 dark:text-white ${expanded ? "" : "line-clamp-3"
                    }`}
                >
                  {portfolioevent?.description}
                </p>
                {portfolioevent?.description?.length > 100 && ( // only show toggle if text is long
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="text-blue font-medium mt-1 text-sm self-start"
                  >
                    {expanded ? "Show Less" : "Show More"}
                  </button>
                )}
              </div>
            </div>
            <div className="bg-white flex flex-col rounded p-4 md:mb-0 mb-3 mt-3 dark:bg-slate-800 w-full relative">
              <div className="flex gap-2 items-center mb-5">
                <PeopleIcon className="text-blue" />
                <p className="text-slate-700 font-normal text-xl dark:text-white">
                  Assigned Team
                </p>
              </div>
              {team &&
                team.map((item, index) => (
                  <div className="flex mb-3 gap-2" key={index}>
                    <Avatar
                      alt={item.user?.name}
                      src="/static/images/avatar/1.jpg"
                    />
                    <div className="flex flex-col">
                      <p className="text-slate-700 font-normal dark:text-white">
                        {item.user?.name}
                      </p>
                      <span className="text-slate-500 ">
                        {item.user?.role?.name}
                      </span>
                    </div>
                  </div>
                ))}
              <div className="flex justify-end">
                <button
                  className="btn bg-blue text-white p-2 text-sm rounded mt-3 hover:bg-blueHover w-max font-normal"
                  onClick={() => navigate("team_management")}
                >
                  Manage Event Team
                </button>
              </div>
            </div>
          </div>
          <div className="rounded md:mb-0 mb-3 h-max lg:w-2/5 w-full">
            <div className="bg-white p-4 rounded dark:bg-slate-800">
              <div className="text-start text-xl font-normal dark:text-white text-slate-700">
                <h3>Client Information</h3>
              </div>
              {portfolioevent?.hostName && (
                <div className="flex mt-2">
                  <h2 className="text-slate-700 font-normal dark:text-white">Client Name: </h2>
                  <p className="text-slate-700 ml-1 dark:text-white">
                    {portfolioevent?.hostName}
                  </p>
                </div>
              )}
              {portfolioevent?.hostEmail && (
                <div className="flex">
                  <h2 className="text-slate-700 font-normal dark:text-white">Client Email: </h2>
                  <p className="text-slate-700 ml-1 dark:text-white">
                    {portfolioevent?.hostEmail}
                  </p>
                </div>
              )}
              {portfolioevent?.hostMobile && (
                <div className="flex">
                  <h2 className="text-slate-700 font-normal dark:text-white">
                    Client Mobile No:{" "}
                  </h2>
                  <p className="text-slate-700 ml-1 dark:text-white">
                    +91 {portfolioevent?.hostMobile}
                  </p>
                </div>
              )}
            </div>
            <div className="bg-white p-4 mt-3 rounded dark:bg-slate-800">
              <h2 className="text-slate-700 text-xl font-normal dark:text-white mb-3">
                Event Sharing
              </h2>
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
                  value={`${baseurlFront}/guest/register?eventcode=${portfolioevent?.eventCode}`}
                  viewBox={`0 0 256 256`}
                  ref={qrCodeRef}
                />
              </div>
              <div className="flex justify-center mt-5">
                <button
                  className="btn border border-blue rounded p-2 text-sm text-blue font-normal hover:bg-blueHover hover:text-white font-normal"
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
                <div className="bg-white rounded dark:bg-slate-800 p-4">
                  <div className="flex justify-end">
                    <CloseIcon
                      className="text-slate-700 cursor-pointer dark:text-white"
                      onClick={handleCloseqr}
                    />
                  </div>
                  <div className=" title flex justify-center items-center dark:border-slate-800 md:p-3 md:py-4 dark:text-white">
                    <h2 className="mb-5 md:mb-0 font-normal text-2xl ml-2 text-slate-700 dark:text-white">
                      FOTOALPHA
                    </h2>
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
                      value={`${baseurlFront}/guest/register?eventcode=${portfolioevent?.eventCode}`}
                      viewBox={`0 0 256 256`}
                      ref={qrCodeRef}
                    />
                  </div>
                  <p className="text-slate-700 font-normal text-center mt-2 dark:text-white">
                    Scan to view the album
                  </p>
                  <div className="flex justify-center">
                    <button
                      className="border border-slate-300 rounded-md font-normal text-slate-700 px-4 mt-3 py-2 rounded dark:text-white"
                      onClick={printCard}
                    >
                      <PrintIcon /> Print
                    </button>
                    <button
                      className="ms-3 border border-slate-300 rounded-md font-normal text-slate-700 px-4 mt-3 py-2 rounded dark:text-white"
                      onClick={() => setShow(true)}
                    >
                      <ShareIcon /> Share
                    </button>
                  </div>
                  {show && (
                    <>
                      <div className="flex justify-center">
                        <p className="text-slate-700 font-normal mt-3 dark:text-white">
                          Event Code: {portfolioevent?.eventCode}
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
                  <div className="flex flex-col md:flex-row justify-center items-center mt-3">
                    <p className="text-slate-700 dark:text-white">79733 06537</p>
                    <p className="text-slate-700 md:ml-10 dark:text-white">www.fotoalpha.com</p>
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
          {/* Status Change Modal */}
          <Modal
            open={showStatusModal}
            onClose={() => setShowStatusModal(false)}
            aria-labelledby="status-modal-title"
          >
            <Box sx={style}>
              <div className="bg-white rounded dark:bg-slate-800 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-slate-700 dark:text-white">
                    Change Event Status
                  </h2>
                  <CloseIcon
                    className="text-slate-700 cursor-pointer dark:text-white"
                    onClick={() => setShowStatusModal(false)}
                  />
                </div>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  Current Status: <span className="font-semibold capitalize">{eventStatus}</span>
                </p>
                <div className="space-y-2">
                  {["upcoming", "ongoing", "completed", "cancelled"].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      disabled={updatingStatus || status === eventStatus}
                      className={`w-full px-4 py-2 rounded font-medium text-sm transition capitalize
                        ${
                          status === eventStatus
                            ? "bg-gray-50 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400"
                            : `${getStatusColor(status)} border border-current hover:opacity-80`
                        }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </Box>
          </Modal>
          {/* Status Message Snackbar */}
          <Snackbar
            anchorOrigin={{ vertical: "top", horizontal: "right" }}
            open={!!statusMessage}
            autoHideDuration={4000}
            onClose={() => setStatusMessage("")}
          >
            <Alert
              onClose={() => setStatusMessage("")}
              severity={statusSeverity}
              sx={{ width: "100%" }}
            >
              {statusMessage}
            </Alert>
          </Snackbar>
        </div>
        {/* print */}
        <div ref={cardRef} className="hidden">
          <div style={{ display: "flex", justifyContent: "center" }}>
            <h2 style={{ fontSize: "20px" }}>www.fotoalpha.com</h2>
          </div>
          <div>
            <QRCode
              size={100}
              style={{ width: "50%", height: "auto" }}
              value={`${baseurlFront}/guest/register?eventcode=${portfolioevent?.eventCode}`}
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
