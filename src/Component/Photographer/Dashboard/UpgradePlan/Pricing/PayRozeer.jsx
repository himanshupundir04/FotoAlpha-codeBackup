import React, { useContext, useEffect, useState } from "react";
import { Modal, Box } from "@mui/material";
import axios from "axios";
import { PlanContext } from "../../../Context/PlanContext";
import { toast } from "react-toastify";
import { useLocation } from "react-router-dom";

const baseURL = process.env.REACT_APP_BASE_URL;

const PayRozeer = ({ open, handleClose, order }) => {
  const { planid, year, filldetail, pricedetail } = useContext(PlanContext);
  const [type, setType] = useState();
  const [details, setDetails] = useState();
  const users = JSON.parse(localStorage.getItem("users")) || [];
  const currentUser = users.find((u) => u.isCurrent);
  const location = useLocation();

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  useEffect(() => {
    if (year === "MYOP") {
      setType("MyopPlan");
      const details = {
        numberOfEvents: filldetail.numberOfEvents,
        storageBytes: filldetail.storageGB * 1024 ** 3,
        uploadPhotos: filldetail.uploadPhotos,
        validityInMonths: filldetail.validityInMonths,
        price: pricedetail?.total,
      };
      setDetails(details);
    } else {
      setType("SubscriptionPlan");
    }
  }, [year]);

  // console.log("order", order);
  // console.log("year", year);
  // console.log("details trtr: ", details);

  const handlePayment = async () => {
    const res = await loadRazorpayScript();
    if (!res) {
      alert("Failed to load Razorpay script");
      return;
    }
    // Fetch order_id from backen
    const options = {
      key: "rzp_test_RNjRfXKrgw9c73",
      amount: order.amount,
      currency: order.currency,
      order_id: order.orderId,
       name: currentUser?.name,
      description: "Transaction",
      handler: function (response) {
        toast.success("Payment Successful!", {autoClose: 1000});
        // console.log("data", response);
        handleVerify(response);
        handleClose();
      },
      prefill: {
        name: currentUser?.name,
        email: currentUser?.email,
        contact: currentUser?.phone,
      },
      theme: {
        color: "#3b82f6",
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  useEffect(() => {
    if (open) handlePayment();
  }, [open]);

  const handleVerify = (res) => {
    const formdata = {
      razorpay_order_id: res?.razorpay_order_id,
      razorpay_payment_id: res?.razorpay_payment_id,
      razorpay_signature: res?.razorpay_signature,
      user_id: currentUser._id,
      plan_id: planid,
      plan_details: details,
      plan_type: type,
      amount: order.amount,
    };
    const response = axios.post(`${baseURL}/payment/verify-payment`, formdata, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "69420",
      },
    });
    location.reload();
    // console.log(response);
  };

  return (
    <>
      {open && <div></div>}
      {/* <Modal open={open} onClose={handleClose}> */}
      {/* <Box> */}
      {/* <h2 className="text-xl font-normal mb-4">Processing Payment...</h2>
        <p>If the payment window didn’t open, please try again.</p> */}
      {/* </Box> */}
      {/* </Modal> */}
    </>
  );
};

export default PayRozeer;
