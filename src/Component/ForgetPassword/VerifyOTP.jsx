import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import bgimg from "../image/login-bg.png";
import { useFormik } from "formik";
import OTPInput from "react-otp-input";
import axios from "axios";
import { EmailContext } from "../Context/EmailContext";

const baseUrl = process.env.REACT_APP_BASE_URL;

function VerifyOTP() {
  const [loading, setLoading] = useState();
  const { email } = useContext(EmailContext);
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      email: email || "",
      otp: "",
    },
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const response = await axios.post(`${baseUrl}/auth/verify-otp`, values);
        toast.success(response?.data?.message || "OTP verified successfully.", {
          autoClose: 1200,
        });
        setLoading(false);
         setTimeout(() => {
          navigate("/change_password");
        }, 1200);
      } catch (error) {
        // console.log(error.response.data.message);
        setLoading(false);
        toast.error(error?.response?.data?.message, {
          autoClose: 1000,
        });
      }
    },
  });
  return (
    <>
      <style>
        {`
        .otp{
          width: 340px;
          margin:auto;
        }
           .otp input{           
            width: 2.5em !important;
            border: 1px solid #14558e;
            border-radius: 3px;
            height: 2.5em;
            margin-right: 20px;
          }
          .otp input:focus-visible{
          outline: 2px solid #14558e;
          }

          @media (max-width: 768px) {
          .otp input{
          margin-right: 12px;
          }
          }

        `}
      </style>
      <section className="bg-slate-200 h-screen">
        <img src={bgimg} alt="login" className="h-screen w-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white/60 backdrop-blur-sm shadow-2xl md:mx-auto md:w-1/3 w-11/12 p-5 mt-5">
            <div className="flex mb-2">
              <h2 className="text-slate-700 text-xl font-normal ">
                Verify OTP
              </h2>
            </div>
            <form onSubmit={formik.handleSubmit}>
              <p className="text-gray-500 mb-2 font-normal">
                Enter the 6 digit unique code
              </p>
              <div className="otp ">
                <OTPInput
                  value={formik.values.otp}
                  onChange={(value) => formik.setFieldValue("otp", value)}
                  numInputs={6}
                  name="otp"
                  renderInput={(props) => <input {...props} />}
                />
              </div>
              <button
                className="btn bg-blue w-full text-lg text-white font-normal mt-4 p-2 rounded-lg hover:bg-blueHover"
                type="submit"
                disabled={loading}
              >
                {loading ? "Verify OTP..." : "Verify OTP"}
              </button>
            </form>
            <p
              className="text-gray-500 mt-3 font-normal text-center cursor-pointer"
              onClick={() => navigate("/")}
            >
              Already have an account?
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

export default VerifyOTP;

