import { Box, Modal } from "@mui/material";
import React, { useContext, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import { useFormik } from "formik";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { EmailContext } from "../../../Context/otpContext";

const baseurl = process.env.REACT_APP_BASE_URL;
const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: {
    xs: "90%",
    md: 500,
  },
  bgcolor: "background.paper",
  boxShadow: 24,
  border: "1px solid #fff",
  py: 2,
  px: {
    xs: 2,
    md: 4,
  },
};
function VerifyModel({ open, handleClose, openlogin }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { email, role } = useContext(EmailContext);

  const formik = useFormik({
    initialValues: {
      email: email || "",
      otp: "",
    },
    onSubmit: async (values) => {
      setLoading(true);
      await axios
        .post(`${baseurl}/auth/verify-email-otp`, values)
        .then((res) => {
          // console.log(res.data);
          setLoading(false);
          Swal.fire({
            position: "top-end",
            title: "Verification Successful",
            text: "Your account has been verified successfully!",
            timer: 2000,
            showConfirmButton: false,
          });
          if (role === "photographer") {
            navigate("create-portfolio");
          } else {
            navigate("/");
          }
          formik.resetForm();
        })
        .catch((error) => {
          console.log(error?.response?.message || error);
          setLoading(false);
          Swal.fire({
            position: "top-end",
            title: "Verification Failed",
            text:
              error?.response?.data?.message ||
              "Invalid OTP. Please try again.",
            icon: "error",
            showConfirmButton: false,
            timer: 1500,
          });
        });
    },
  });

  const handleResendOtp = async () => {
    try {
      await axios.post(`${baseurl}/auth/request-otp`, {
        email: email,
      });
      Swal.fire({
        icon: "success",
        title: "OTP Resend Successful",
        text: "OTP has been resent successfully",
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "OTP Resend Failed",
        text: error.response?.data?.message,
      });
    }
  };
  const handlelogin = () => {
    handleClose();
    openlogin();
  };
  return (
    <>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <div className="flex justify-end">
            <CloseIcon onClick={handleClose} className="cursor-pointer " />
          </div>
          <form onSubmit={formik.handleSubmit}>
            <h1 className="text-slate-700 text-2xl font-medium text-start">
              Verification
            </h1>
            <p className="text-start">
              Enter your credentilas to Verify your account
            </p>
            <div className="grid text-start mt-1">
              <label className="text-black-700 text-xl pb-1 font-semibold">
                Email
              </label>
              <input
                type="text"
                name="email"
                value={formik.values.email}
                placeholder="Enter email"
                readOnly
                className="p-2 border-solid border-2 border-gray-200 rounded-lg"
              />
            </div>
            <div className="grid text-start mt-1 ">
              <label className="text-black-700 text-xl pb-1 font-semibold">
                OTP
              </label>
              <input
                type="otp"
                name="otp"
                value={formik.values.otp}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Enter otp"
                className="p-2 border-solid border-2 border-gray-200 rounded-lg"
              />
            </div>
            <p
              className="text-end text-gray-500 font-semibold mt-2 cursor-pointer"
              onClick={handleResendOtp}
            >
              RESEND OTP
            </p>

            <button
              className="btn bg-blue w-full text-white font-semibold mt-3 p-2 mb-3 border-solid border-2 border-blue rounded-lg"
              type="submit"
              disabled={loading}
            >
              {loading ? "Loading..." : "Send"}
            </button>
          </form>
          <p className="text-gray-500 font-semibold" onClick={handlelogin}>
            Already have an account?
          </p>
        </Box>
      </Modal>
    </>
  );
}

export default VerifyModel;
