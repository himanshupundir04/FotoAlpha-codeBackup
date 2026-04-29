import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useFormik } from "formik";
import CameraAltIcon from "@mui/icons-material/CameraAlt";

const baseURL = process.env.REACT_APP_BASE_URL;

function Billing() {
  const [billingData, setBillingData] = useState();
  const [currentQRCodeUrl, setCurrentQRCodeUrl] = useState("");
  const fileInputRef = useRef(null);
  const [clients, setClients] = useState();
  const [unprice, setUnprice] = useState();
   const [sendingClientId, setSendingClientId] = useState(null);
  const [uploadqr, setUploadqr] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      const response = await axios.get(`${baseURL}/events/billables`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setBillingData(response.data.data.summary);
      setClients(response.data.data.unpaidEvents);
      setUnprice(response.data.data.unpricedEvents);
      // console.log(response.data.data.unpaidEvents);
    } catch (error) {
      console.log(error);
    }
  };

   const handleSendWhatsAppMessage = async (client) => {
    setSendingClientId(client.eventId); // or client.id

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
        }
      );

      toast.success("WhatsApp message sent successfully", {
        autoClose: 1000,
      });
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to send WhatsApp message"
      );
    } finally {
      setSendingClientId(null); // ✅ reset only after this client
    }
  };

  // const handleSendWhatsAppMessage = async (client) => {
  //   setSendWhatsApp(true);
  //   try {
  //     await axios.post(
  //       `${baseURL}/photographer/send-payment-reminder`,
  //       {
  //         phone: client?.hostMobile || "",
  //         clientName: client?.hostName || "",
  //         remainingAmount: client?.remainingAmount || "",
  //         eventName: client?.eventName || "",
  //         paymentLink: "",
  //         qrUrl: client?.qrCodeUrl || "",
  //         photographerName: client?.photographerName || "",
  //       },
  //       {
  //         headers: {
  //           Authorization: `Bearer ${localStorage.getItem("token")}`,
  //         },
  //       }
  //     );
  //     setSendWhatsApp(false);
  //     toast.success("WhatsApp message sent successfully", {
  //       autoClose: 1000,
  //     });
  //   } catch (error) {
  //     setSendWhatsApp(false);
  //     toast.error(error?.response?.data?.message || "Failed to send WhatsApp message");
  //     // console.log(error);
  //   }
  // };

  const handleUploadNewQRCode = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const newLocalUrl = URL.createObjectURL(file);
    setCurrentQRCodeUrl(newLocalUrl);
    formik.setFieldValue("qrCode", file);
  };

  const formik = useFormik({
    initialValues: {
      qrCode: "",
    },
    onSubmit: async (values) => {
      setUploadqr(true);
      try {
        const formData = new FormData();
        formData.append("qrCode", values.qrCode);

        const response = await axios.put(
          `${baseURL}/photographer/upload-qr`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        toast.success("QR code updated successfully", { autoClose: 1000 });
        // console.log("QR Code upload success:", response.data);
        setUploadqr(false);
        formik.resetForm();
        setCurrentQRCodeUrl("");
        fetchBillingData();
      } catch (error) {
        console.error("QR Code upload failed:", error);
        setUploadqr(false);
        toast.error("Failed to upload QR code");
      }
    },
  });

  return (
    <>
    <div className="text-start">
      {/* <h1 className="text-xl font-semibold text-slate-700 mb-8">Billing Dashboard</h1> */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div className="bg-white rounded-lg p-4 ">
            <h2 className="text-xl font-semibold text-slate-700 dark:text-white">
              Billing Summary
            </h2>
            <div className="mb-3 mt-5">
              <div className="flex items-center justify-between py-2 border-b">
                <p className="text-slate-700 font-medium text-slate-700 dark:text-white">
                  Total Invoiced Amount
                </p>
                <span className="text-slate-700 font-semibold text-slate-700 dark:text-white">
                  ₹{billingData?.totalAmount?.toLocaleString() || 0}
                </span>
              </div>
            </div>
            <div className="mb-3">
              <div className="flex items-center justify-between py-2 border-b">
                <p className="text-slate-700 font-medium text-slate-700 dark:text-white">
                  Payments Received
                </p>
                <span className="text-slate-700 font-semibold text-slate-700 dark:text-white">
                  ₹{billingData?.totalReceived?.toLocaleString() || 0}
                </span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between py-1">
                <p className=" text-slate-700 font-medium text-slate-700 dark:text-white">
                  Payment Pending
                </p>
                <span className="font-semibold text-red-600">
                  ₹{billingData?.remainingTotal?.toLocaleString() || 0}
                </span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 mb-6 dark:bg-slate-800">
            <h2 className="text-lg font-semibold text-slate-700 mb-4 dark:text-white">
              Pending Payments Report
            </h2>
            {clients?.length === 0 ? (
              <p className="text-slate-700 dark:text-white text-center">
                No pending payments at the moment!
              </p>
            ) : (
              <ul className="max-h-[300px] overflow-auto">
                {clients &&
                  clients.map((client, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between py-2 border-b last:border-b-0"
                    >
                      <div>
                        <p className="font-medium text-slate-700 dark:text-white">
                          {client.hostName}
                        </p>
                        <p className="text-slate-600 dark:text-white">
                          Pending:{" "}
                          <span className="font-semibold text-red-500">
                            ₹{client.remainingAmount?.toLocaleString()}
                          </span>
                        </p>
                      </div>
                      <button
                          onClick={() => handleSendWhatsAppMessage(client)}
                          disabled={sendingClientId === client.eventId}
                          className="inline-flex items-center px-4 py-1 text-sm bg-blue text-white font-semibold rounded-md hover:bg-blueHover transition-colors duration-200"
                        >
                          <WhatsAppIcon className="mr-2" />
                          {sendingClientId === client.eventId
                            ? "Sending..."
                            : "Send WhatsApp"}
                        </button>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 dark:bg-slate-800">
          <h2 className="text-lg font-semibold text-slate-700 mb-4 dark:text-white">
            Payment QR Code
          </h2>
          <form onSubmit={formik.handleSubmit}>
            <div className="flex flex-col items-center justify-center space-y-4">
              {billingData?.qrCodeUrl || currentQRCodeUrl ? (
                <div className="relative">
                  <img
                    src={currentQRCodeUrl || billingData?.qrCodeUrl}
                    alt="Payment QR Code"
                    className="w-48 h-48 border border-gray-300 rounded-md object-cover"
                  />
                  <label
                    htmlFor="qr"
                    className="absolute -bottom-2 -right-2 cursor-pointer bg-white/80 p-1 rounded-full shadow"
                  >
                    <CameraAltIcon className="text-blue"/>
                  </label>
                </div>
              ) : (
                <label
                  htmlFor="qr"
                  className="w-48 h-48 bg-gray-100 cursor-pointer flex flex-col items-center justify-center text-gray-400 rounded-md border border-dashed border-gray-300"
                >
                  <p>No QR Code</p>
                  <p className="text-sm">Select a file to upload</p>
                </label>
              )}

              <input
                type="file"
                id="qr"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleUploadNewQRCode}
                className="hidden"
              />
              <button
                type="submit"
                className="inline-flex items-center bg-blue text-white hover:bg-blueHover text-sm px-6 py-2 font-semibold rounded-md transition-colors duration-200"
              >
                {uploadqr ? (
                  <>Uploading...</>
                ) : (
                  <>
                    <CloudUploadIcon className="mr-2" />
                    Upload QR Code
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      <div className="bg-white mt-5 rounded-lg p-4 dark:bg-slate-800 md:w-[49%]">
        <h2 className="text-lg font-semibold text-slate-700 mb-4 dark:text-white">
          Unpriced Events
        </h2>
        {unprice?.length === 0 ? (
          <p className="text-slate-700 dark:text-white text-center">
            All events have prices added
          </p>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-slate-700 max-h-[400px] overflow-y-auto">
            {unprice &&
              unprice?.map((event) => (
                <li
                  key={event.id}
                  className="flex justify-between items-center py-3 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors rounded-md px-2"
                >
                  <div>
                    <p className="font-medium text-slate-800 dark:text-white">
                      {event.eventName || "Unnamed Event"}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      navigate(`/organization/event/${event.eventId}`)
                    }
                    className="inline-flex items-center px-4 py-1 text-sm bg-blue text-white font-semibold rounded-md hover:bg-blueHover transition-colors duration-200"
                  >
                    Add Prices
                  </button>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
    </>
  );
}

export default Billing;

