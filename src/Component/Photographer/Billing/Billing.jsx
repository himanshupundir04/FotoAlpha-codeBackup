import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import { toast } from "react-toastify";
import jsQR from "jsqr";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PaymentsIcon from '@mui/icons-material/Payments';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import InfoIcon from '@mui/icons-material/Info';
import BoltIcon from '@mui/icons-material/Bolt';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { CircularProgress, Modal, Box } from "@mui/material";

const baseURL = process.env.REACT_APP_BASE_URL;

function Billing() {
  const [billingData, setBillingData] = useState();
  const [currentQRCodeUrl, setCurrentQRCodeUrl] = useState("");
  const modalFileInputRef = useRef(null);
  const [clients, setClients] = useState([]);
  const [unprice, setUnprice] = useState([]);
  const [sendingClientId, setSendingClientId] = useState(null);
  const [errorqr, setErrorqr] = useState();
  const [uploadqr, setUploadqr] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showQRModal, setShowQRModal] = useState(false);

  // Pagination States
  const [paymentPage, setPaymentPage] = useState(0);
  const [eventPage, setEventPage] = useState(0);
  const itemsPerPage = 10;

  const navigate = useNavigate();

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseURL}/events/billables`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "ngrok-skip-browser-warning": "69420",
        },
      });
      setBillingData(response.data.data.summary);
      setClients(response.data.data.unpaidEvents);
      setUnprice(response.data.data.unpricedEvents);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.log(error);
    }
  };

  const handleSendWhatsAppMessage = async (client) => {
    setSendingClientId(client.eventId);
    const message = `Are you sure you want to send a WhatsApp reminder to ${client.hostName} at ${client.hostMobile || "their registered number"}?`;
    if (!window.confirm(message)) return;

    try {
      await axios.post(
        `${baseURL}/photographer/send-payment-reminder`,
        {
          phone: client?.hostMobile || "",
          clientName: client?.hostName || "",
          remainingAmount: client?.remainingAmount || "",
          eventName: client?.eventName || "",
          paymentLink: "",
          qrUrl: client?.qrCodeUrl || "",
          photographerName: client?.photographerName || "",
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      toast.success("WhatsApp message sent successfully");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to send WhatsApp message");
    } finally {
      setSendingClientId(null);
    }
  };

  const validateQRCode = (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, canvas.width, canvas.height);
        if (!code) resolve("Please upload a valid QR code image");
        else resolve(null);
      };
    });
  };

  const handleUploadNewQRCode = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const error = await validateQRCode(file);
    setErrorqr(error);
    if (error) {
      setCurrentQRCodeUrl("");
      formik.setFieldValue("qrCode", "");
      toast.error(error);
      return;
    }
    const newLocalUrl = URL.createObjectURL(file);
    setCurrentQRCodeUrl(newLocalUrl);
    formik.setFieldValue("qrCode", file);
    // If selecting via modal, we might want to trigger upload immediately or let the user confirm
  };

  const handleDeleteQRCode = async () => {
    if (!window.confirm("Are you sure you want to delete your current QR code?"))
      return;
    try {
      await axios.delete(`${baseURL}/photographer/delete-qr`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      toast.success("QR code deleted successfully");
      setShowQRModal(false);
      fetchBillingData();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete QR code");
    }
  };

  const formik = useFormik({
    initialValues: { qrCode: "" },
    onSubmit: async (values) => {
      if (!values.qrCode) {
        toast.error("Please select a QR code image to upload");
        return;
      }
      setUploadqr(true);
      try {
        const formData = new FormData();
        formData.append("qrCode", values.qrCode);
        await axios.put(`${baseURL}/photographer/upload-qr`, formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data",
          },
        });
        toast.success("QR code updated successfully");
        setUploadqr(false);
        formik.resetForm();
        setCurrentQRCodeUrl("");
        setShowQRModal(false);
        fetchBillingData();
      } catch (error) {
        setUploadqr(false);
        toast.error("Failed to upload QR code");
      }
    },
  });

  const paginatedPayments = clients?.slice(paymentPage * itemsPerPage, (paymentPage + 1) * itemsPerPage) || [];
  const paginatedEvents = unprice?.slice(eventPage * itemsPerPage, (eventPage + 1) * itemsPerPage) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-140px)]">
        <CircularProgress sx={{ color: '#0b8599' }} />
      </div>
    );
  }

  const receivedPercent = billingData?.totalAmount ? (billingData.totalReceived / billingData.totalAmount) * 100 : 0;

  return (
    <div className="text-start animate-fadeIn w-full mx-auto h-[calc(100vh-140px)] overflow-hidden flex flex-col gap-6">
      {/* Top Section: Compact KPIs & QR Mini Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-shrink-0">
        {/* KPI Cards (3 Grid Columns) */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-slate-100 dark:bg-slate-800 dark:border-slate-700 hover:shadow-md transition-all group">
            <div className="flex justify-between items-center mb-2">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Invoiced</p>
              <div className="bg-[#ccf2ff] p-1.5 rounded-xl dark:bg-[#0b8599]/20">
                <AccountBalanceWalletIcon className="text-[#0b8599]" sx={{ fontSize: 16 }} />
              </div>
            </div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white">₹{billingData?.totalAmount?.toLocaleString() || 0}</h2>
            <div className="flex items-center gap-1 mt-2 text-[8px] font-bold text-[#0b8599] uppercase">
              <BoltIcon sx={{ fontSize: 10 }} /> Updated just now
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-slate-100 dark:bg-slate-800 dark:border-slate-700 hover:shadow-md transition-all group">
            <div className="flex justify-between items-center mb-2">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Received</p>
              <div className="bg-emerald-50 p-1.5 rounded-xl dark:bg-emerald-900/20">
                <PaymentsIcon className="text-emerald-500" sx={{ fontSize: 16 }} />
              </div>
            </div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white">₹{billingData?.totalReceived?.toLocaleString() || 0}</h2>
            <div className="w-full h-1 bg-slate-100 rounded-full mt-2 overflow-hidden dark:bg-slate-700">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${receivedPercent}%` }}></div>
            </div>
          </div>

          <div className="bg-red-50/30 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-red-100/50 dark:bg-red-900/10 dark:border-red-900/20 hover:shadow-md transition-all group">
            <div className="flex justify-between items-center mb-2">
              <p className="text-[9px] font-black text-red-500/80 uppercase tracking-widest">Pending</p>
              <div className="bg-red-100 p-1.5 rounded-xl dark:bg-red-900/40">
                <PendingActionsIcon className="text-red-600" sx={{ fontSize: 16 }} />
              </div>
            </div>
            <h2 className="text-xl font-black text-red-600 dark:text-red-500">₹{billingData?.remainingTotal?.toLocaleString() || 0}</h2>
            <div className="flex items-center gap-1 mt-2 text-[8px] font-bold text-red-600 uppercase">
              <InfoIcon sx={{ fontSize: 10 }} /> {clients?.length || 0} Accounts Due
            </div>
          </div>
        </div>

        {/* Payment QR Hub Entry Card */}
        <div
          onClick={() => setShowQRModal(true)}
          className="lg:col-span-1 bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-sm border-2 border-[#ccf2ff] dark:bg-slate-800 dark:border-[#0b8599]/30 hover:border-[#0b8599] transition-all cursor-pointer flex items-center gap-4 group relative overflow-hidden"
        >
          <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center dark:bg-slate-900/40 flex-shrink-0 group-hover:scale-110 transition-transform">
            {billingData?.qrCodeUrl ? (
              <img src={billingData.qrCodeUrl} alt="QR" className="w-8 h-8 object-contain opacity-80" />
            ) : (
              <QrCodeScannerIcon className="text-slate-400 group-hover:text-[#0b8599]" sx={{ fontSize: 24 }} />
            )}
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm dark:text-white uppercase tracking-tight">QR Collection Hub</h3>
            <p className="text-[10px] font-black text-[#0b8599] uppercase tracking-wider">Tap to Manage</p>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:rotate-12 transition-all">
            <QrCodeScannerIcon sx={{ fontSize: 80 }} />
          </div>
        </div>
      </div>

      {/* Main Area: Side-by-Side Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-grow overflow-hidden min-h-0">
        {/* Left: Pending Payments */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-sm border border-slate-100 dark:bg-slate-800 dark:border-slate-700 flex flex-col overflow-hidden min-h-0">
          <div className="flex items-center justify-between mb-6 flex-shrink-0">
            <h3 className="font-bold text-slate-800 text-lg dark:text-white flex items-center gap-2">
              Pending Payments <span className="text-[10px] font-black bg-[#ccf2ff] text-[#0b8599] px-2 py-0.5 rounded-full uppercase dark:bg-[#0b8599]/30">{clients?.length || 0}</span>
            </h3>
            {clients?.length > itemsPerPage && (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setPaymentPage(p => Math.max(0, p - 1))}
                  disabled={paymentPage === 0}
                  className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center hover:bg-slate-100 disabled:opacity-30 dark:bg-slate-700"
                >
                  <ArrowBackIosNewIcon sx={{ fontSize: 12 }} />
                </button>
                <span className="text-[10px] font-black">{paymentPage + 1} / {Math.ceil(clients.length / itemsPerPage)}</span>
                <button
                  onClick={() => setPaymentPage(p => Math.min(Math.ceil(clients.length / itemsPerPage) - 1, p + 1))}
                  disabled={(paymentPage + 1) * itemsPerPage >= clients.length}
                  className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center hover:bg-slate-100 disabled:opacity-30 dark:bg-slate-700"
                >
                  <ArrowForwardIosIcon sx={{ fontSize: 12 }} />
                </button>
              </div>
            )}
          </div>

          <div className="overflow-y-auto pr-2 custom-scrollbar flex-grow space-y-2">
            {paginatedPayments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-30">
                <PaymentsIcon sx={{ fontSize: 40 }} className="mb-2" />
                <p className="text-xs font-black uppercase tracking-widest">No pending payments</p>
              </div>
            ) : (
              paginatedPayments.map((client, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/50 border border-slate-100 dark:bg-slate-700/30 dark:border-slate-700 hover:shadow-sm transition-all group">
                  <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => navigate(`/photographer/event/${client.eventId}`)}
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#ccf2ff] flex items-center justify-center font-bold text-[#0b8599] dark:bg-[#0b8599]/20 text-xs shadow-sm group-hover:bg-[#0b8599] group-hover:text-white transition-all">
                      {client?.hostName?.charAt(0) || "C"}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-xs dark:text-white group-hover:text-[#0b8599] transition-colors">{client.hostName}</p>
                      <p className="text-[9px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-[150px]">{client.eventName || "General Event"}</p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <div>
                      <p className="font-black text-slate-800 text-xs dark:text-white">₹{client.remainingAmount?.toLocaleString()}</p>
                      <span className="text-[7px] font-black px-1.5 py-0.5 bg-red-50 text-red-500 rounded-full uppercase dark:bg-red-900/20">Remind</span>
                    </div>
                    <button
                      onClick={() => handleSendWhatsAppMessage(client)}
                      disabled={sendingClientId === client.eventId}
                      className="w-8 h-8 rounded-lg bg-[#25D366] text-white flex items-center justify-center hover:shadow-lg transition-all active:scale-90 disabled:opacity-50"
                    >
                      <WhatsAppIcon sx={{ fontSize: 16 }} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Unpriced Events */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-sm border border-slate-100 dark:bg-slate-800 dark:border-slate-700 flex flex-col overflow-hidden min-h-0">
          <div className="flex items-center justify-between mb-6 flex-shrink-0">
            <h3 className="font-bold text-slate-800 text-lg dark:text-white flex items-center gap-2">
              Unpriced Events <InfoIcon className="text-slate-300" sx={{ fontSize: 16 }} />
            </h3>
            {unprice?.length > itemsPerPage && (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setEventPage(p => Math.max(0, p - 1))}
                  disabled={eventPage === 0}
                  className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center hover:bg-slate-100 disabled:opacity-30 dark:bg-slate-700"
                >
                  <ArrowBackIosNewIcon sx={{ fontSize: 12 }} />
                </button>
                <span className="text-[10px] font-black">{eventPage + 1} / {Math.ceil(unprice.length / itemsPerPage)}</span>
                <button
                  onClick={() => setEventPage(p => Math.min(Math.ceil(unprice.length / itemsPerPage) - 1, p + 1))}
                  disabled={(eventPage + 1) * itemsPerPage >= unprice.length}
                  className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center hover:bg-slate-100 disabled:opacity-30 dark:bg-slate-700"
                >
                  <ArrowForwardIosIcon sx={{ fontSize: 12 }} />
                </button>
              </div>
            )}
          </div>

          <div className="overflow-y-auto pr-2 custom-scrollbar flex-grow space-y-2">
            {paginatedEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-30">
                <BoltIcon sx={{ fontSize: 40 }} className="mb-2" />
                <p className="text-xs font-black uppercase tracking-widest">All Events Priced</p>
              </div>
            ) : (
              paginatedEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/50 border border-slate-100 dark:bg-slate-700/30 dark:border-slate-700 hover:shadow-sm transition-all group">
                  <div
                    className="flex items-center gap-3 cursor-pointer flex-grow"
                    onClick={() => navigate(`/photographer/event/${event.eventId}`, { state: { activeTab: "payment" } })}
                  >
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center dark:bg-slate-800 border border-slate-100 dark:border-slate-600 shadow-sm group-hover:border-[#0b8599]/30 transition-all">
                      <CalendarTodayIcon className="text-[#0b8599]" sx={{ fontSize: 16 }} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs dark:text-white line-clamp-1 group-hover:text-[#0b8599] transition-colors">{event.eventName || "Unnamed Event"}</h4>
                      <p className="text-[9px] font-medium text-slate-400 uppercase tracking-tighter">Event ID: {event.eventId}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/photographer/event/${event.eventId}`, { state: { activeTab: "payment" } })}
                    className="px-4 py-2 bg-[#0b8599] text-white rounded-xl text-[10px] font-black uppercase hover:bg-[#086a7a] transition-all shadow-sm active:scale-95 flex items-center gap-2"
                  >
                    Create Invoice
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* QR Management Modal */}
      <Modal
        open={showQRModal}
        onClose={() => setShowQRModal(false)}
        aria-labelledby="qr-management-modal"
        sx={{ display: 'flex', alignItems: 'center', justifyCenter: 'center' }}
      >
        <Box className="m-auto bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl outline-none max-w-sm w-full mx-4 relative overflow-hidden">
          {/* Decorative Background */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#0b8599] to-[#ccf2ff]"></div>

          <button
            onClick={() => setShowQRModal(false)}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <CloseIcon />
          </button>

          <div className="text-center mb-8 pt-4">
            <h3 className="text-xl font-black text-slate-800 dark:text-white">QR Collection Hub</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Manage your payment gateway</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-full aspect-square bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 dark:bg-slate-900/40 dark:border-slate-700 flex flex-col items-center justify-center p-6 mb-8 relative group">
              {billingData?.qrCodeUrl || currentQRCodeUrl ? (
                <>
                  <img
                    src={currentQRCodeUrl || billingData?.qrCodeUrl}
                    alt="QR Code"
                    className="w-full h-full object-contain shadow-sm rounded-xl"
                  />
                  {currentQRCodeUrl && (
                    <div className="mt-4 text-[10px] font-black text-emerald-500 uppercase flex items-center gap-1 animate-pulse">
                      <BoltIcon sx={{ fontSize: 12 }} /> Preview Mode
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center opacity-40">
                  <QrCodeScannerIcon sx={{ fontSize: 60 }} className="text-slate-400 mb-4" />
                  <p className="text-xs font-black uppercase tracking-widest text-center px-6">No QR Code available for scanning</p>
                </div>
              )}

              <input
                type="file"
                className="hidden"
                ref={modalFileInputRef}
                onChange={handleUploadNewQRCode}
                accept="image/*"
              />
              {errorqr && <p className="mt-3 text-[10px] font-bold text-red-500 uppercase">{errorqr}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4 w-full">
              {(billingData?.qrCodeUrl || currentQRCodeUrl) ? (
                <>
                  <button
                    onClick={() => modalFileInputRef.current.click()}
                    className="col-span-1 py-3 bg-slate-100 text-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-200 dark:bg-slate-700 dark:text-white"
                  >
                    <EditIcon sx={{ fontSize: 14 }} /> Change
                  </button>
                  <button
                    onClick={handleDeleteQRCode}
                    className="col-span-1 py-3 bg-red-50 text-red-500 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-100 dark:bg-red-900/20"
                  >
                    <DeleteIcon sx={{ fontSize: 14 }} /> Delete
                  </button>
                </>
              ) : (
                <button
                  onClick={() => modalFileInputRef.current.click()}
                  className="col-span-2 py-4 bg-slate-100 text-[#0b8599] border-2 border-dashed border-[#0b8599]/30 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-[#ccf2ff]/30 transition-all dark:bg-slate-700"
                >
                  <CloudUploadIcon sx={{ fontSize: 18 }} /> Upload QR Image
                </button>
              )}

              {formik.values.qrCode && !uploadqr && (
                <button
                  onClick={formik.handleSubmit}
                  className="col-span-2 mt-2 py-4 bg-[#0b8599] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-[#086a7a] transition-all flex items-center justify-center gap-3"
                >
                  <PaymentsIcon sx={{ fontSize: 18 }} /> Save Payment Hub
                </button>
              )}

              {uploadqr && (
                <div className="col-span-2 mt-2 py-4 bg-[#0b8599]/50 text-white rounded-2xl flex items-center justify-center gap-3">
                  <CircularProgress size={16} color="inherit" />
                  <span className="text-xs font-black uppercase tracking-widest">Processing...</span>
                </div>
              )}
            </div>
          </div>
        </Box>
      </Modal>
    </div>
  );
}

export default Billing;
