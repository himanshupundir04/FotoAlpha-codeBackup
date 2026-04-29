import React, { useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useFormik } from "formik";
import axios from "axios";
import { EmailContext } from "../Context/otpContext";
import * as yup from "yup";
// import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
// import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { toast } from "react-toastify";
import bgimg from "../image/login-bg.png";
import PhoneInput from "react-phone-input-2";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import PersonIcon from "@mui/icons-material/Person";
import CorporateFareIcon from "@mui/icons-material/CorporateFare";

const baseURL = process.env.REACT_APP_BASE_URL;

function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get("ref");
  const [loading, setLoading] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(true);
  const { setUserid, setPhone, setCountryCode } = useContext(EmailContext);
  // const [showPassword, setShowPassword] = useState(false);
  const [roles, setRoles] = useState();
  const [organizationroles, setOrganizationRoles] = useState();
  const [selectedRole, setSelectedRole] = useState("");

  console.log("role id", selectedRole);

  useEffect(() => {
    fetchRole();
  }, []);

  const fetchRole = async () => {
    try {
      const response = await axios.get(`${baseURL}/roles/public-roles`);
      const roles = response.data.data.roles; // should be an array
      const photographerRole = roles.find(
        (role) => role.name === "photographer"
      );
      const organizationRole = roles.find(
        (role) => role.name === "organization"
      );
      // console.log(photographerRole?._id);
      setRoles(photographerRole?._id);
      setOrganizationRoles(organizationRole?._id);
    } catch (error) {
      console.log(error);
    }
  };

  const validationSchema = yup.object().shape({
    name: yup.string().required("Name is required"),
    // username: yup.string().required("UserName is required"),
    phone: yup.string().required("Phone is required"),
  });

  const formik = useFormik({
    initialValues: {
      // email: "",
      // password: "",
      name: "",
      // username: "",
      phone: "",
      countryCode: "",
      role: selectedRole || "",
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      // setEmail(values.email);
      setPhone(values.phone);
      setCountryCode(values.countryCode);
      // )
      const payload = { ...values, role: selectedRole };

      // Add referral code if present in URL
      if (referralCode) {
        payload.referralCode = referralCode;
      }

      await axios
        .post(`${baseURL}/auth/register`, payload, {
          headers: {
            "ngrok-skip-browser-warning": "69420",
          },
        })
        .then((res) => {
          // console.log(res.data.data.user.user);
          setLoading(false);
          setUserid(res.data.data.user.user._id);
          toast.success(
            "Please check your phone. We have sent an OTP to your registered phone number.",
            { autoClose: 1500 }
          );
          setTimeout(() => {
            navigate("/register/verify");
          }, 2000);
        })
        .catch((error) => {
          console.log(error?.response?.message || error);
          setLoading(false);
          toast.error(
            error?.response?.data?.message || "Something went wrong!",
            { autoClose: 2000 }
          );
        });
    },
  });

  return (
    <>
      {/* Role Selection Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl p-8 w-full max-w-md animate-fadeIn">
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                Welcome to FotoAlpha
              </h2>
              <p className="text-slate-600">Choose how you'd like to join us</p>
            </div>

            {/* Options Grid */}
            <div className="space-y-4">
              {/* Photographer Option */}
              <button
                onClick={() => {
                  setSelectedRole(roles); // photographer ID
                  setShowRoleModal(false);
                }}
                className="w-full p-6 rounded-xl border-2 border-slate-200 hover:border-blue hover:bg-blue/5 transition-all duration-300 group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-blue/10 group-hover:bg-blue/20 transition">
                    <CameraAltIcon
                      className="text-blue group-hover:scale-110 transition-transform"
                      sx={{ fontSize: 32 }}
                    />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Register as Photographer
                    </h3>
                    <p className="text-sm text-slate-600">
                      Create events and manage photos
                    </p>
                  </div>
                </div>
              </button>

              {/* <button
                onClick={() => {
                  setSelectedRole(organizationroles); // organization ID
                  setShowRoleModal(false);
                }}
                className="w-full p-6 rounded-xl border-2 border-slate-200 hover:border-orange-500 hover:bg-orange/5 transition-all duration-300 group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-orange/10 group-hover:bg-orange/20 transition">
                    <CorporateFareIcon
                      className="text-orange-500 group-hover:scale-110 transition-transform"
                      sx={{ fontSize: 32 }}
                    />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Register as Organization
                    </h3>
                    <p className="text-sm text-slate-600">
                      Create events and manage photos
                    </p>
                  </div>
                </div>
              </button> */}

              {/* Guest Option */}
              {/* <button
                onClick={() => navigate("/guest/register")}
                className="w-full p-6 rounded-xl border-2 border-slate-200 hover:border-green-500 hover:bg-green-50/5 transition-all duration-300 group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-green-100/20 group-hover:bg-green-100/40 transition">
                    <PersonIcon
                      className="text-green-600 group-hover:scale-110 transition-transform"
                      sx={{ fontSize: 32 }}
                    />
                  </div>
                  <div className="text-left">
                    <h3 className="text-md font-semibold text-slate-900">
                      Join as Guest
                    </h3>
                    <p className="text-sm text-slate-600">
                      Browse and collect your photos
                    </p>
                  </div>
                </div>
              </button> */}
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">or</span>
              </div>
            </div>

            {/* Sign In Link */}
            <p className="text-center text-slate-600">
              Already have an account?{" "}
              <Link
                to="/"
                className="text-blue font-semibold hover:underline"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      )}

      <section className="login relative h-screen overflow-hidden">
        <img src={bgimg} alt="login" className="h-screen w-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white/60 backdrop-blur-sm shadow-2xl rounded md:w-3/4 xl:w-1/3 w-11/12 p-5">
            <form
              onSubmit={formik.handleSubmit}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  formik.handleSubmit();
                }
              }}
            >
              <h1 className="text-slate-700 text-2xl font-normal ">Sign Up</h1>
              <p className="text-start text-slate-500">
                Enter your credentials to create your account
              </p>
              <div className=" mt-3">
                {/* <div className="grid text-start mt-1 w-full">
                  <label className="text-slate-700 text-md pb-1 font-normal">
                    User Name
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formik.values.username}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="Enter your username"
                    className="py-1 px-2 border-solid border-2 border-slate-400 rounded-lg"
                  />
                  {formik.touched.username && formik.errors.username ? (
                    <p className="text-red-500">{formik.errors.username}</p>
                  ) : null}
                </div> */}
                <div className="grid text-start mt-1 w-full">
                  <label className="text-slate-700 text-md pb-1 font-normal">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="Enter your name"
                    className="py-1 px-2 border-solid border-2 border-slate-400 rounded-lg"
                  />
                  {formik.touched.name && formik.errors.name ? (
                    <p className="text-red-500">{formik.errors.name}</p>
                  ) : null}
                </div>
                <div className="grid text-start mt-2 w-full">
                  <label className="text-slate-700 text-md pb-1 font-normal">
                    Phone
                  </label>
                  {/* <div className="p-1 flex gap-2 items-center border-solid bg-white border-2 border-slate-400 rounded-lg">
                    <span className="ms-1 text-slate-700">+91</span>
                    <input
                      type="text"
                      name="phone"
                      value={formik.values.phone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, ""); // allow only digits
                        if (value.length <= 10) {
                          formik.setFieldValue("phone", value);
                        }
                      }}
                      onBlur={formik.handleBlur}
                      placeholder="Enter phone"
                      className="outline-none w-full"
                    />
                  </div> */}
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
                    />
                  </div>
                  {formik.touched.phone && formik.errors.phone ? (
                    <p className="text-red-500">{formik.errors.phone}</p>
                  ) : null}
                </div>
              </div>

              <div className="md:flex justify-between gap-3">
                {/* <div className="grid text-start mt-1 w-full">
                  <label className="text-slate-700 text-md pb-1 font-normal">
                    Email
                  </label>
                  <input
                    type="text"
                    name="email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="Enter email"
                    className="py-1 px-2 border-solid border-2 border-slate-400 rounded-lg"
                  />
                  {formik.touched.email && formik.errors.email ? (
                    <p className="text-red-500">{formik.errors.email}</p>
                  ) : null}
                </div> */}
              </div>
              {/* <div className="grid text-start mt-1">
                <label className="text-slate-700 text-md pb-1 font-normal">
                  Password
                </label>
                <div className="flex justify-between py-1 px-2 border-solid border-2 border-slate-400 bg-white rounded-lg">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="Enter Password"
                    className="w-full focus:outline-none"
                  />
                  <button
                    type="button"
                    className="text-sm text-blue mt-1"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? (
                      <VisibilityOffIcon />
                    ) : (
                      <RemoveRedEyeIcon />
                    )}
                  </button>
                </div>
                {formik.touched.password && formik.errors.password ? (
                  <p className="text-red-500">{formik.errors.password}</p>
                ) : null}
              </div>           */}

              <button
                className="btn bg-blue w-full text-white font-normal mt-3 p-2 mb-3 rounded-lg hover:bg-blueHover"
                type="submit"
                disabled={loading}
              >
                {loading ? "Loading..." : "Sign Up"}
              </button>
            </form>
            <div className="text-center">
              <Link to="/" className="text-slate-700 font-normal">
                Already have an account?
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default Register;

<style>{`
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out;
  }
`}</style>;

