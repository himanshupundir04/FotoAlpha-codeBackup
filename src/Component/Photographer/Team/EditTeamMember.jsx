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
  const [data, setData] = useState();
  const [fetchingData, setFetchingData] = useState(false);

  // console.log("id", id);

  useEffect(() => {
    if (open && id) {
      fetchData(id);
    }
    if (!open) {
      setData(undefined);
    }
  }, [open, id]);

  const fetchData = async (memberId) => {
    if (!memberId) return;
    try {
      setFetchingData(true);
      const response = await axios.get(
        `${baseURL}/photographer/team/${memberId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "ngrok-skip-browser-warning": "69420",
          },
        },
      );
      const user =
        response?.data?.user ||
        response?.data?.data?.user ||
        response?.data?.data ||
        null;
      setData(user);
      if (!user) {
        toast.error("Failed to load team member data");
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to fetch team member details");
    } finally {
      setFetchingData(false);
    }
  };

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
      role: "6953cfa992c61d75c3d82fb4",
      phone: data?.phone || "",
      countryCode: data?.countryCode || "",
      id: data?._id,
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
            {fetchingData ? (
              <div className="py-10 text-center text-slate-700 dark:text-white">
                Fetching team member details...
              </div>
            ) : (
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
                  <div className="flex items-center gap-1 px-2 py-1 border border-slate-300 rounded bg-white">
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
                  {formik.touched.phone && formik.errors.phone && (
                    <p className="text-red-500 text-sm mt-1">
                      {formik.errors.phone}
                    </p>
                  )}
                </div>
              </div>
            )}
            <div className="flex justify-end mt-5 gap-4">
              <button
                type="button"
                className="bg-red-500 text-white px-4 py-1 rounded font-normal hover:bg-red-600"
                onClick={handleClose}
              >
                Cancel
              </button>
              <button
                className="bg-blue text-white px-2 py-1 rounded font-normal hover:bg-blueHover disabled:opacity-60"
                type="submit"
                disabled={loading || fetchingData}
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
