import React, { useContext, useState } from "react";
import { Box, Modal, Divider } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { PlanContext } from "../../../Context/PlanContext";
import PayRozeer from "./PayRozeer";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: {
    xs: "90%",
    md: 500,
  },
  height: {
    xs: "90%",
    md: "auto",
  },
  overflow: "auto",
  bgcolor: "background.paper",
  boxShadow: 24,
  border: "1px solid #fff",
  py: 2,
  px: {
    xs: 2,
    md: 4,
  },
};

const baseURL = process.env.REACT_APP_BASE_URL;
function PaymentDetails({ payopen, payclose, discountamnt }) {
  const token = localStorage.getItem("token");
  const { plan, year, planid, setPlan,type, setType } = useContext(PlanContext);
  const [rozeer, setRozeer] = useState(false);
  const handleClose = () => setRozeer(false);
  const [order, setOrder] = useState("");
  const [loading, setLoading] = useState(false);
  const [discountvalue, setDiscountvalue] = useState("");
  const [discountdata, setDiscountdata] = useState();
  const navigate = useNavigate();

  const handleApply = async () => {
    try {
      const response = await axios.post(
        `${baseURL}/coupons/validate`,
        {
          code: discountvalue,
          orderAmount: plan, // fixed typo
          planId: planid,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const planAmount = Number(plan);
      const discountPer = Number(response.data.data.discountPercent);
      const amount = planAmount - (planAmount * discountPer) / 100;
      // console.log(planAmount, "amount");
      // console.log(discountPer, "dic");
      setPlan(amount);

      setDiscountdata(response.data.data);
      // console.log(response.data.data);
      toast.success("Coupon applied successfully", { autoClose: 1000 });
    } catch (error) {
      console.error("Error validating coupon:", error);
      toast.error(error.response?.data?.message || "Failed to apply coupon", {
        autoClose: 2000,
      });
    }
  };

  const loadRazorpay = (subscriptionId, key, options) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => {
      const rzp = new window.Razorpay({
        ...options,
        key: key,
        subscription_id: subscriptionId,
        handler: function (response) {
          // Handle successful payment
          // console.log("Payment successful:", response);
          toast.success("Payment successful", { autoClose: 1500 });
          setLoading(false);
          payclose();
          localStorage.setItem("tab", "billing");
          navigate("/organization/settings");
        },
        prefill: options.prefill || {},
        theme: {
          color: "#04BADE",
        },
      });

      rzp.on("payment.failed", function (response) {
        // console.error("Payment failed:", response.error);
        toast.error("Payment failed. Please try again.", { autoClose: 2000 });
        setLoading(false);
      });
      rzp.open();
    };
    document.body.appendChild(script);
  };

  // const handleRozeer = async () => {
  //   setLoading(true);
  //   try {
  //     const response = await fetch(`${baseURL}/mysubscriptions`, {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${token}`,
  //       },
  //       body: JSON.stringify({ planId: planid, couponCode: discountvalue }),
  //     });
  //     const data = await response.json();
  //     if (data.success) {
  //       loadRazorpay(
  //         data.data.paymentOptions.subscription_id,
  //         data.data.paymentOptions.key,
  //         data.data.paymentOptions
  //       );
  //       setLoading(false);
  //     } else {
  //       setLoading(false);
  //        toast.error(
  //           data.message || "Failed to create subscription. Please try again."
  //         );
  //     }
  //   } catch (error) {
  //     setLoading(false);
  //     toast.error(error.response?.data?.message || "Something went wrong");
  //   }
  // };

const handleRozeer = async () => {
  setLoading(true);

  try {
    const payload = {
      planId: planid,
      couponCode: discountvalue,
    };

    // ✅ only send when type exists
    if (type) {
      payload.planType = type;
    }

    const response = await fetch(`${baseURL}/mysubscriptions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (data.success) {
      loadRazorpay(
        data.data.paymentOptions.subscription_id,
        data.data.paymentOptions.key,
        data.data.paymentOptions
      );

      payclose();
      setDiscountvalue("");
      setLoading(false);
    } else {
      setLoading(false);

      if (response.status === 409) {
        toast.error(
          data.message ||
            "You already have an active subscription. Please wait for it to expire before upgrading.",
          { autoClose: 3000 }
        );
      } else {
        toast.error(
          data.message || "Failed to create subscription. Please try again."
        );
      }
    }
  } catch (error) {
    setLoading(false);
    console.error("Error creating subscription:", error);
    toast.error("An error occurred. Please try again.", { autoClose: 2000 });
  }
};


  return (
    <>
      <Modal
        open={payopen}
        onClose={payclose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <h3 className="text-slate-700 font-normal text-xl">
                Payment Details
              </h3>
            </div>
            <CloseIcon
              className="text-slate-700 cursor-pointer"
              onClick={payclose}
            />
          </div>
          <div className="border border-slate-300 rounded-xl px-3 mt-3 flex items-center justify-between">
            <input
              type="text"
              name="couponCode"
              value={discountvalue}
              onChange={(e) => setDiscountvalue(e.target.value.toUpperCase())}
              placeholder="Promo Code"
              className="w-full py-2 px-2 outline-none"
            />
            <button
              type="button"
              onClick={handleApply}
              className="text-blue font-semibold p-2"
            >
              Apply
            </button>
          </div>
          <div className="flex justify-between items-center mt-5 mb-1">
            <p className="text-slate-700 font-normal ">Billing</p>
            <p className="text-slate-700 font-normal capitalize">{year}</p>
          </div>
          <Divider />
          <div className="flex justify-between items-center mb-1 mt-1">
            <p className="text-slate-700 font-normal">Plan Price</p>
            <p className="text-slate-700 font-normal capitalize">₹{plan}</p>
          </div>

          {discountamnt > 0 && (
            <div className="flex justify-between items-center mb-2">
              <p className="text-slate-700 font-normal">GST</p>
              <p className="text-slate-700 font-normal capitalize">
                {discountamnt}%
              </p>
            </div>
          )}
          {discountdata?.discountPercent > 0 && (
            <div className="flex justify-between items-center mb-2">
              <p className="text-slate-700 font-normal">Discount</p>
              <p className="text-slate-700 font-normal capitalize">
                {discountdata?.discountPercent}%
              </p>
            </div>
          )}

          <div className="flex justify-between items-center mt-1">
            <p className="text-slate-700 font-normal">Total Amount</p>
            <p className="text-slate-700 font-normal text-lg">
              ₹
              {(
                (plan - (plan * (discountdata?.discountPercent || 0)) / 100) *
                (1 + (discountamnt || 0) / 100)
              ).toFixed(2)}
            </p>
          </div>

          <button
            className="bg-blue text-white font-normal rounded w-full py-2 hover:bg-blueHover mt-5"
            onClick={handleRozeer}
            disabled={loading}
          >
            {loading ? "Proceed to Pay..." : "Proceed to Pay"}
          </button>
        </Box>
      </Modal>
      <PayRozeer open={rozeer} handleClose={handleClose} order={order} />
    </>
  );
}

export default PaymentDetails;
