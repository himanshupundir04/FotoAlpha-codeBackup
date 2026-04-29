import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import bgimg from "../image/login-bg.png";
import { useFormik } from "formik";
import axios from "axios";
import { toast } from "react-toastify";
import { EmailContext } from "../Context/EmailContext";

const baseURL = process.env.REACT_APP_BASE_URL;

function ForgetPassword() {
  const [loading, setLoading] = useState(false);
  const { setEmail } = useContext(EmailContext);
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      email: "",
    },
    onSubmit: async (values) => {
      setLoading(true);
      try {
        await axios.post(`${baseURL}/auth/forgot-password`, values);

        setEmail(values.email);
        toast.success("Password reset token sent to email", {
          autoClose: 1200,
        });
        setTimeout(() => {
          navigate("/verify");
        }, 1200);
      } catch (error) {
        // console.error(error?.response?.data?.message);
        toast.error(error?.response?.data?.message || "Something went wrong", {
          autoClose: 1000,
        });
      } finally {
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
                Forget Password
              </h2>
            </div>
            <form onSubmit={formik.handleSubmit}>
              <p className="text-slate-700 font-normal">Enter Your Email</p>
              <div className="flex mt-1 justify-center w-full border-solid border-2 border-gray-200 rounded-lg">
                <input
                  type="text"
                  name="email"
                  placeholder="Enter your email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="p-2 w-full"
                />
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

export default ForgetPassword;

