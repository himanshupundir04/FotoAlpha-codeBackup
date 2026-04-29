import axios from "axios";
import { useFormik } from "formik";
import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EmailContext } from "../../Context/otpContext";
import bgimg from "../../image/login-bg.png";
import { toast } from "react-toastify";
import PhoneInput from "react-phone-input-2";

const baseurl = process.env.REACT_APP_BASE_URL;

function Verify() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { email, role, userId, phone, countryCode } = useContext(EmailContext);

  const formik = useFormik({
    initialValues: {
      phone: phone || "",
      countryCode: countryCode || "",
      user_id: userId || "",
      otp: "",
    },
    onSubmit: async (values) => {
      setLoading(true);
      await axios
        .post(`${baseurl}/auth/verify-email-otp`, values)
        .then((res) => {
          // console.log(res.data);
          setLoading(false);
          formik.resetForm();
          navigate("/");
        })
        .catch((error) => {
          // console.log(error?.response?.message || error);
          setLoading(false);
          toast.error(error.response?.data?.message || error?.message, { autoClose: 1500 });
        });
    },
  });

  const handleResendOtp = async () => {
    try {
      await axios.post(`${baseurl}/auth/request-otp`, {
        phone: phone,
        countryCode: countryCode,
      });
      toast.success("OTP Resend Successful", { autoClose: 1200 });
    } catch (error) {
      toast.error(error.response?.data?.message || "OTP Resend Failed", {
        autoClose: 1500,
      });
    }
  };

  //   console.log(user)
  return (
    <>
      <section className="login bg-slate-200 text-center h-screen">
        <img src={bgimg} alt="login" className="h-screen w-full" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white shadow-2xl mx-auto md:w-1/3 W-1/2 p-5 mt-5">
            <form onSubmit={formik.handleSubmit}>
              <h1 className="text-slate-700 text-2xl font-normal text-start">
                Verification
              </h1>
              <p className="text-start text-sm text-slate-400">
                We've sent OTP to your WhatsApp number{" "}
                <span className="text-slate-700">{phone}</span>.
              </p>
              <div className="grid text-start mt-3">
                <label className="text-slate-700 pb-1 font-normal">Phone</label>
                {/* <input
                  type="text"
                  name="phone"
                  value={phone}
                  placeholder="Enter phone"
                  readOnly
                  className="p-2 border-solid border-2 border-gray-200 rounded-lg outline-none"
                /> */}
                 <div className=" py-1 px-2 bg-white border-2 border-slate-400 rounded-lg">
                    <PhoneInput
                      country={"in"}
                      enableSearch={true}
                      countryCodeEditable={false} 
                      // PhoneInput expects full number (code + phone)
                      value={
                        (formik.values.countryCode || "").replace("+", "") +
                        (formik.values.phone || "")
                      }
                      onChange={(value, country) => {
                        const cleanValue = value.replace(/\D/g, ""); // only digits
                        // extract phone number without code
                        const phoneWithoutCode = cleanValue.slice(
                          country.dialCode.length
                        );
                        formik.setFieldValue("phone", phoneWithoutCode); // only phone number
                        formik.setFieldValue(
                          "countryCode",
                          "+" + country.dialCode
                        ); // country code
                      }}
                      inputStyle={{
                        border: "none",
                        outline: "none",
                        width: "100%",
                        background: "transparent",
                        fontSize: "16px",
                      }}
                      buttonStyle={{
                        border: "none",
                        backgroundColor: "transparent",
                        fontSize: "16px",
                      }}
                      onBlur={formik.handleBlur}
                      disabled
                    />
                  </div>
              </div>
              <div className="grid text-start mt-1 ">
                <label className="text-slate-700 pb-1 font-normal">OTP</label>
                <input
                  type="number"
                  name="otp"
                  value={formik.values.otp}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Enter otp"
                  className="p-2 border-solid border-2 border-gray-200 rounded-lg"
                />
              </div>
              <p className="text-end text-gray-500 font-normal text-sm mt-2 ">
                Didn't get it?{" "}
                <span
                  className="text-blue cursor-pointer"
                  onClick={handleResendOtp}
                >
                  Resend OTP
                </span>{" "}
                on WhatsApp
              </p>

              <button
                className="btn bg-blue w-full text-white font-normal mt-3 p-2 mb-3 border-solid border-2 border-blue rounded-lg"
                type="submit"
                disabled={loading}
              >
                {loading ? "Loading..." : "Send"}
              </button>
            </form>
            <Link to="/" className=" text-gray-500 font-normal">
              Already have an account?
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

export default Verify;

