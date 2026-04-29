import React, { useContext, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import axios from "axios";
import { EmailContext } from "../../../Context/otpContext";
import * as yup from "yup";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import countryList from "react-select-country-list";
import { Box, Modal } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const baseURL = process.env.REACT_APP_BASE_URL;
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
function SignupModel({
  open,
  handleClose,
  openlogin,
  openverify,
  closeSignup,
}) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { setEmail, setrole } = useContext(EmailContext);
  const [showPassword, setShowPassword] = useState(false);

  const [value, setValue] = useState("");
  const options = useMemo(() => countryList().getData(), []);

  const changeHandler = (value) => {
    setValue(value);
  };

  const validationSchema = yup.object().shape({
    email: yup.string().email("Invalid email").required("Email is required"),
    password: yup
      .string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),
    name: yup.string().required("Name is required"),
    phone: yup.string().required("Phone is required"),
    role: yup.string().required("Role is required"),
  });

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
      name: "",
      phone: "",
      role: "client",
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      setEmail(values.email);
      setrole(values.role);

      await axios
        .post(`${baseURL}/auth/register`, values, {
          headers: {
            "ngrok-skip-browser-warning": "69420",
          },
        })
        .then((res) => {
          console.log(res.data);
          setLoading(false);
          Swal.fire({
            position: "top-end",
            title: "Registration Successful!",
            text: "Your account has been created.",
            icon: "success",
            showConfirmButton: false,
            timer: 2000,
            willClose: () => {
              closeSignup();
              openverify();
            },
          });
        })
        .catch((error) => {
          console.log(error?.response?.message || error);
          setLoading(false);
          Swal.fire({
            position: "top-end",
            title: "Registration Failed",
            text: error?.response?.data?.message || "Something went wrong!",
            icon: "error",
            showConfirmButton: false,
            timer: 1500,
          });
        });
    },
  });

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
            <h1 className="text-slate-700 text-2xl font-medium ">Sign UP</h1>
            <p className="text-start">
              Enter your credentilas to create your account
            </p>
            <div className="md:flex justify-between mt-3 gap-3">
              <div className="grid text-start mt-1 w-1/2">
                <label className="text-black-700 text-md pb-1 font-semibold">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Enter name"
                  className="p-2 border-solid border-2 border-gray-200 rounded-lg"
                />
                {formik.touched.name && formik.errors.name ? (
                  <p className="text-red">{formik.errors.name}</p>
                ) : null}
              </div>
              <div className="grid text-start mt-1 w-1/2">
                <label className="text-black-700 text-md pb-1 font-semibold">
                  Phone
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formik.values.phone}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Enter phone"
                  className="p-2 border-solid border-2 border-gray-200 rounded-lg"
                />
                {formik.touched.phone && formik.errors.phone ? (
                  <p className="text-red">{formik.errors.phone}</p>
                ) : null}
              </div>
            </div>

            <div className="md:flex justify-between gap-3">
              <div className="grid text-start mt-1 w-1/2">
                <label className="text-black-700 text-md pb-1 font-semibold">
                  Email
                </label>
                <input
                  type="text"
                  name="email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Enter email"
                  className="p-2 border-solid border-2 border-gray-200 rounded-lg"
                />
                {formik.touched.email && formik.errors.email ? (
                  <p className="text-red">{formik.errors.email}</p>
                ) : null}
              </div>
              <div className="grid text-start mt-1 ms-2 w-1/2">
                <label className="text-black-700 text-mdpb-1 font-semibold">
                  Password
                </label>
                <div className="flex justify-between p-2 border-solid border-2 border-gray-200 rounded-lg">
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
                  <p className="text-red">{formik.errors.password}</p>
                ) : null}
              </div>
            </div>

            <div className="grid text-start mt-1">
              <label className="text-black-700 text-md pb-1 font-semibold">
                Role
              </label>
              <select
                value={formik.values.role}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                name="role"
                className="p-2 border-solid border-2 border-gray-200 rounded-lg "
              >
                <option value="client">Client</option>
                <option value="photographer">Photographer</option>
                <option value="user">User</option>
                <option value="guest">Guest</option>
              </select>
              {formik.touched.role && formik.errors.role ? (
                <p className="text-red">{formik.errors.role}</p>
              ) : null}
            </div>
            <div className="grid text-start mt-1">
              <label className="text-black-700 text-md pb-1 font-semibold">
                Country
              </label>
              <select
                value={value}
                onChange={(e) => changeHandler(e.target.value)}
                className="p-2 border-solid border-2 border-gray-200 rounded-lg "
              >
                <option value="">Select a country</option>
                {options.map((country) => (
                  <option key={country.value} value={country.value}>
                    {country.label}
                  </option>
                ))}
              </select>
              {formik.touched.role && formik.errors.role ? (
                <p className="text-red">{formik.errors.role}</p>
              ) : null}
            </div>
            <button
              className="btn bg-blue w-full text-white font-semibold mt-3 p-2 mb-3 rounded-lg hover:bg-blueHover"
              type="submit"
              disabled={loading}
            >
              {loading ? "Loading..." : "Sign Up"}
            </button>
          </form>
          <div className="text-center">
            <p
              className="text-gray-500 font-semibold cursor-pointer"
              onClick={handlelogin}
            >
              Already have an account?
            </p>
          </div>
        </Box>
      </Modal>
    </>
  );
}

export default SignupModel;
