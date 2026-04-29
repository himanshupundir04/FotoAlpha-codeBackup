import React, { useEffect, useState } from "react";
import { Box, Modal } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useFormik } from "formik";
import { toast } from "react-toastify";
import axios from "axios";
import PhoneInput from "react-phone-input-2";
import * as Yup from "yup";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: {
    xs: "90%", // mobile screens
    sm: 400, // small screens and up
    md: 400, // medium screens and up
  },
  boxShadow: 24,
};

const baseURL = process.env.REACT_APP_BASE_URL;

function EditTeamMember({ open, handleClose, id, fetchTeam }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState()

  useEffect(() => {
    if(id){
      fetchData();
    }
  },[id])

  const fetchData = async () => {
    try {
      const response = await axios.get(`${baseURL}/photographer/team/${id}`, {
       headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      // console.log(response.data.user)
      setData(response?.data?.user)
    } catch (error) {
      console.log(error)
    }
  }

   const validationSchema = Yup.object({
    phone: Yup.string()
      .required("Phone number is required")
      .matches(/^\d{10}$/, "Phone number must be exactly 10 digits"),
  });

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: data?.name || "",
      username: data?.username || "",
      email: data?.email || "",
      password: "",
      confirmPassword: "",
      role: "685e28d8e3b4f4830998a220",
      phone: data?.phone || "",
      countryCode: data?.countryCode || "",
      id: data?._id
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const response = await axios.put(
          `${baseURL}/photographer/team`,
          values,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        setLoading(false);
        //   console.log(response.data);
        toast.success("Team Member Updated successfully", { autoClose: 1000 });
        formik.resetForm();
        setTimeout(() => {
          fetchTeam();
        }, 500);
        handleClose();
      } catch (error) {
        setLoading(false);
        console.error(error);
        toast.error(error.response.data.message, { autoClose: 1000 });
      }
    },
  });

  return (
    <>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <form
            onSubmit={formik.handleSubmit}
            className="bg-white p-4 dark:bg-slate-800"
          >
            <div className="flex justify-between items-center">
              <h1 className="text-start text-2xl font-normal dark:text-white text-slate-700">
                Edit Team Member
              </h1>
              <div className="flex justify-end">
                <CloseIcon
                  className="text-slate-700 cursor-pointer dark:text-white"
                  onClick={handleClose}
                />
              </div>
            </div>
            <div className="">
              <div className="flex flex-col w-full">
                <label className="text-slate-700 font-normal mt-5 dark:text-white">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  placeholder="Enter name"
                  className="text-slate-700 border rounded p-2 bg-transparent outline-none dark:text-white"
                />
              </div>
               <div className="flex flex-col w-full">
                <label className="text-slate-700 font-normal mt-5 dark:text-white">
                  Phone
                </label>
                <div className="p-1 border border-slate-300 rounded">
                  {/* <span className="text-slate-700">+91</span>
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
                  placeholder="Enter Phone no."
                  className="text-slate-700 outline-none dark:text-white"
                /> */}
              <PhoneInput
                country={"in"}
                enableSearch={true}
                countryCodeEditable={false} 
                // PhoneInput expects full number (code + phone)
                value={(formik.values.countryCode || "").replace("+", "") + (formik.values.phone || "")}

                onChange={(value, country) => {
                  const cleanValue = value.replace(/\D/g, ""); // only digits

                  // extract phone number without code
                  const phoneWithoutCode = cleanValue.slice(
                    country.dialCode.length
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
                 {formik.touched.phone && formik.errors.phone && (
                  <p className="text-red-500 text-sm mt-1">
                    {formik.errors.phone}
                  </p>
                )}
              </div>
              {/* <div className="flex flex-col w-1/2">
                <label className="text-slate-700 font-normal mt-5 dark:text-white">
                  UserName
                </label>
                <input
                  type="text"
                  name="username"
                  value={formik.values.username}
                  onChange={formik.handleChange}
                  placeholder="Enter username"
                  className="text-slate-700 border rounded p-2 bg-transparent outline-none dark:text-white"
                />
              </div> */}
            </div>
            {/* <div className="flex justify-between gap-2">
              <div className="flex flex-col w-1/2">
                <label className="text-slate-700 font-normal mt-1 bg-transparent dark:text-white">
                  Email
                </label>
                <input
                  type="text"
                  name="email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  placeholder="Enter email"
                  className="text-slate-700 border rounded p-2 bg-transparent outline-none dark:text-white"
                />
              </div>
             
            </div> */}
            {/* <div className="flex justify-between gap-2">
              <div className="flex flex-col w-1/2">
                <label className="text-slate-700 font-normal mt-1 dark:text-white">
                  Password
                </label>
                <input
                  type="text"
                  name="password"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  placeholder="Enter password"
                  className="text-slate-700 border rounded p-2 bg-transparent outline-none dark:text-white"
                />
              </div>
              <div className="flex flex-col w-1/2">
                <label className="text-slate-700 font-normal mt-1 dark:text-white">
                  Confirm Password
                </label>
                <input
                  type="text"
                  name="confirmPassword"
                  value={formik.values.confirmPassword}
                  onChange={formik.handleChange}
                  placeholder="Enter confirm password"
                  className="text-slate-700 border rounded p-2 bg-transparent outline-none dark:text-white"
                />
              </div>
            </div> */}
            {/* <div className="flex justify-between gap-2">
              <div className="flex flex-col w-full">
                <label className="text-slate-700 font-normal mt-1 dark:text-white">
                  Role
                </label>
                <input
                  type="text"
                  name="role"
                  value="Photographer Team"
                  placeholder="Enter role"
                  className="text-slate-700 border rounded p-2 bg-transparent dark:text-white"
                  disabled
                />
              </div>
            </div> */}
            <div className="flex justify-end mt-5 gap-4">
              <button
                className="bg-red-500 text-white px-4 py-1 rounded font-normal hover:bg-red-600"
                onClick={handleClose}
              >
                Cancel
              </button>
              <button
                className="bg-blue text-white px-2 py-1 rounded font-normal hover:bg-blueHover"
                type="submit"
                disabled={loading}
              >
                {loading ? "Loading..." : "Update Member"}
              </button>
            </div>
          </form>
        </Box>
      </Modal>
    </>
  );
}

export default EditTeamMember;
