import React, { useEffect, useState } from "react";
import axios from "axios";
import { useFormik } from "formik";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import OTPInput from "react-otp-input";
import PhoneInput from "react-phone-input-2";
import BorderColorIcon from "@mui/icons-material/BorderColor";

const baseURL = process.env.REACT_APP_BASE_URL;
function LoginForm({ handleClose }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingotp, setLoadingotp] = useState(false);
  const [showotp, setShowotp] = useState(false);
  const [phone, setPhone] = useState(null);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let interval;

    if (showotp) {
      setTimer(30);
      setCanResend(false);

      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [showotp]);

  // console.log(phone);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const currentUser = users.find((u) => u.isCurrent);

    // console.log(currentUser);

    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const expiryTimestamp = payload.exp;
      const now = Math.floor(Date.now() / 1000);

      if (expiryTimestamp <= now) {
        // Token expired, log out user
        localStorage.removeItem("token");
        localStorage.removeItem("users");
        localStorage.removeItem("avatar");
        toast.error("Your session has expired. Please log in again.", {
          autoClose: 1000,
        });
        navigate("/");
        return;
      }

      // ✅ Redirect immediately if token valid:

      if (currentUser.role.name === "photographer") {
        navigate("/photographer/dashboard");
      } else if (currentUser.role.name === "photographer-team") {
        navigate("/photographer_team/dashboard");
      } else if (currentUser.role.name === "organization") {
        navigate("/organization/dashboard");
      } else {
        // 🚫 Any other role → logout
        localStorage.clear();
        navigate("/");
        toast.error(
          "Only Photographer, Organization and Photographer Team are allowed",
        );
        return;
      }

      // Auto logout timer
      const timeout = (expiryTimestamp - now) * 1000;
      const timer = setTimeout(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("users");
        localStorage.removeItem("avatar");
        toast.error("Your session has expired. Please log in again.", {
          autoClose: 1200,
        });
        navigate("/");
      }, timeout);

      return () => clearTimeout(timer);
    } else {
      // No token found — stay on login page or navigate to login
      navigate("/");
    }
  }, [navigate]);

  const formik = useFormik({
    initialValues: {
      phone: "",
      countryCode: "",
    },
    onSubmit: async (values) => {
      setLoading(true);
      setPhone(values.phone);
      try {
        const res = await axios.post(`${baseURL}/auth/login`, values);
        setLoading(false);
        setShowotp(true);
        toast.success("OTP sent successfully", { autoClose: 1200 });
      } catch (error) {
        // console.log(error?.response?.data?.message);
        setLoading(false);
        toast.error(error?.response?.data?.message);
      }
    },
  });

  const formikotp = useFormik({
    enableReinitialize: true,
    initialValues: {
      otp: "",
      phone: phone,
      countryCode: "",
    },
    onSubmit: async (values) => {
      setLoadingotp(true);
      try {
        const res = await axios.post(
          `${baseURL}/auth/verify-login-otp`,
          values,
        );
        setLoadingotp(false);

        formik.resetForm();
        const newUser = {
          ...res.data.data.user,
          token: res.data.data.token,
          refreshToken: res.data.data.refreshToken,
          avatar: res.data.data.avatarUrl,
        };

        let Exuser = JSON.parse(localStorage.getItem("users")) || [];
        // Remove isCurrent flag from all users
        Exuser = Exuser.map((u) => ({ ...u, isCurrent: false }));
        // Check if user already exists
        const existingIndex = Exuser.findIndex((u) => u._id === newUser._id);
        if (existingIndex !== -1) {
          // Update existing user with new tokens and mark as current
          Exuser[existingIndex] = { ...newUser, isCurrent: true };
        } else {
          // Add new user and mark as current
          Exuser.push({ ...newUser, isCurrent: true });
        }

        localStorage.setItem("users", JSON.stringify(Exuser));
        localStorage.setItem("token", newUser.token);
        localStorage.setItem("avatar", newUser.avatar);
        let rolestore = JSON.parse(localStorage.getItem("user")) || [];

        const role = res.data.data.user.role.name || rolestore.role.name;
        // console.log(res.data.data.user.role.name);

        if (role === "photographer") {
          navigate("/photographer/dashboard");
        } else if (role === "photographer-team") {
          navigate("/photographer_team/dashboard");
        } else if (role === "organization") {
          navigate("/organization/dashboard");
        } else {
          localStorage.clear();
          navigate("/");
          toast.error(
            "Only Photographer, Organization and Photographer Team are allowed",
          );
          return;
        }

        handleClose();
      } catch (error) {
        // console.log(error?.response?.data?.message);
        setLoadingotp(false);
        toast.error(error?.response?.data?.message);
      }
    },
  });

  const handleResendOtp = async () => {
    if (!canResend) return;
    try {
      await axios.post(`${baseURL}/auth/request-otp`, {
        phone: phone,
      });
      toast.success("OTP Resend Successful", { autoClose: 1200 });
      setTimer(30);
      setCanResend(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "OTP Resend Failed", {
        autoClose: 1500,
      });
    }
  };

  const handleEditPhone = () => {
    setShowotp(false);
    formikotp.resetForm();
  };

  return (
    <>
      <style>
        {`
        .otp{
          width: 380px;
          margin:auto;
        }
           .otp input{           
            width: 2.4em !important;
            border: 1px solid #14558e;
            border-radius: 3px;
            height: 2.5em;
            margin-right: 14px;
          }
          .otp input:focus-visible{
          outline: 2px solid #14558e;
          }
          @media only screen and (max-width: 570px) {
          .otp input{  
            margin-right: 16px;
          }
          }
        `}
      </style>
      {showotp ? (
        <form onSubmit={formikotp.handleSubmit}>
          <h1 className="text-slate-700 text-2xl font-normal text-start">
            Sign In
          </h1>
          <p className="text-start text-slate-500 mb-4">
            We will send a verification code to this mobile number{" "}
            <span className="font-semibold text-slate-700">{phone}</span>.
            <BorderColorIcon
              sx={{ fontSize: "20px" }}
              className="text-green-600 cursor-pointer"
              onClick={handleEditPhone}
            />
          </p>
          <div className="otp pb-4">
            <OTPInput
              value={formikotp.values.otp}
              onChange={(value) => formikotp.setFieldValue("otp", value)}
              numInputs={6}
              inputType="number"
              name="otp"
              renderInput={(props) => <input {...props} />}
            />
          </div>
          <div className="flex justify-end" >
            {canResend ? (
              <p
                className="font-normal cursor-pointer text-blue"
                onClick={handleResendOtp}
              >
                Resend OTP
              </p>
            ) : (
              <p className="text-slate-700">Resend OTP in {timer}s</p>
            )}
          </div>
          <button
            className="btn bg-blue w-full text-lg mb-3 text-white font-normal mt-3 p-2 rounded-lg hover:bg-blueHover"
            type="submit"
            disabled={loadingotp}
          >
            {loadingotp ? "Loading..." : "Submit"}
          </button>
        </form>
      ) : (
        <form
          onSubmit={formik.handleSubmit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              formik.handleSubmit();
            }
          }}
        >
          <h1 className="text-slate-700 text-2xl font-normal text-start">
            Sign In
          </h1>
          <p className="text-start text-slate-500">
            Enter your credentilas to access your account
          </p>
          <div className="grid text-start mt-3">
            <label className="text-slate-700 text-xl pb-1 font-normal">
              Phone
            </label>
            <div className=" p-1 border-solid border-2 border-slate-400 bg-white rounded-lg">
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
                    country.dialCode.length,
                  );

                  formik.setFieldValue("phone", phoneWithoutCode); // only phone number
                  formik.setFieldValue("countryCode", "+" + country.dialCode); // country code
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
              />
            </div>
          </div>

          <button
            className="btn bg-blue w-full text-lg text-white font-normal mt-3 p-2 rounded-lg hover:bg-blueHover"
            type="submit"
            disabled={loading}
          >
            {loading ? "Loading..." : "Submit"}
          </button>
        </form>
      )}
      <p className=" text-slate-700 font-normal text-center">OR</p>
    </>
  );
}

export default LoginForm;
