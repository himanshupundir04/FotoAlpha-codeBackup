import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import bgimg from "../image/login-bg.png";
import { useFormik } from "formik";
import { toast } from "react-toastify";
import { EmailContext } from "../Context/EmailContext";
import axios from "axios";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

const baseUrl = process.env.REACT_APP_BASE_URL;

function ChangePassword() {
  const [loading, setLoading] = useState(false);
  const { email } = useContext(EmailContext);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordcnfrm, setShowPasswordcnfrm] = useState(false);
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      email: email || "",
      newPassword: "",
      confirmPassword: "",
    },
    onSubmit: async (values) => {
      // ✅ Check password match before sending request
      if (values.newPassword !== values.confirmPassword) {
        toast.error("Passwords do not match", {autoClose: 1000});
        return;
      }

      setLoading(true);
      try {
        const response = await axios.post(
          `${baseUrl}/auth/reset-password`,
          values
        );
        toast.success(response?.data?.message || "Password reset successful. Please login with new password.", {
          autoClose: 1200,
        });
        
        setLoading(false);
         setTimeout(() => {
          navigate("/");
        }, 1200);
      } catch (error) {
        toast.error(error?.response?.data?.message || "Something went wrong", {
          autoClose: 1000,
        });
        setLoading(false);
      }
    },
  });

  return (
    <>
      <section className="bg-slate-200 h-screen">
        <img src={bgimg} alt="login" className="h-screen w-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white/60 backdrop-blur-sm shadow-2xl md:mx-auto md:w-1/3 w-11/12 p-5 mt-5">
            <div className="flex mb-3">
              <h2 className="text-slate-700 text-xl font-normal ">
                Change Password
              </h2>
            </div>
            <form onSubmit={formik.handleSubmit}>
              <p className="text-slate-700 text-start font-normal">New password</p>
              <div className="flex mt-1 justify-center w-full border-solid border-2 border-gray-200 rounded-lg bg-white">
                <input
                  type={showPassword ? "text" : "password"}
                  name="newPassword"
                  placeholder="Enter new password"
                  value={formik.values.newPassword}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="p-2 w-full outline-none"
                />
                <button
                  type="button"
                  className="text-sm text-blue mt-1 me-1"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <VisibilityOffIcon /> : <RemoveRedEyeIcon />}
                </button>
              </div>
              <p className="text-slate-700 text-start font-normal mt-2">
                Confirm password
              </p>
              <div className="flex mt-1 justify-center w-full border-solid border-2 border-gray-200 rounded-lg bg-white">
                <input
                   type={showPasswordcnfrm ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Enter confirm password"
                  value={formik.values.confirmPassword}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="p-2 w-full outline-none"
                />
                <button
                  type="button"
                  className="text-sm text-blue mt-1 me-1"
                  onClick={() => setShowPasswordcnfrm((prev) => !prev)}
                >
                  {showPasswordcnfrm ? <VisibilityOffIcon /> : <RemoveRedEyeIcon />}
                </button>
              </div>
              <button
                className="btn bg-blue w-full text-lg text-white font-normal mt-3 p-2 rounded-lg hover:bg-blueHover"
                type="submit"
                disabled={loading}
              >
                {loading ? "Submit..." : "Submit"}
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

export default ChangePassword;

