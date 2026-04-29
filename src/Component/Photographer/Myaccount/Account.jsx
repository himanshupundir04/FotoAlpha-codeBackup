import React, { useEffect, useState } from "react";
import axios from "axios";
import { useFormik } from "formik";
import { toast } from "react-toastify";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import BoltIcon from "@mui/icons-material/Bolt";
import { useNavigate } from "react-router-dom";
import { CircularProgress } from "@mui/material";
import demo from "../../image/profile-avatar.jpg";
import PhoneInput from "react-phone-input-2";
import * as Yup from "yup";

const baseURL = process.env.REACT_APP_BASE_URL;
const nameRegex = /^[A-Za-z\s]+$/;

const validationSchema = Yup.object({
  firstName: Yup.string()
    .trim()
    .required("First name is required")
    .max(40, "First name must be at most 40 characters")
    .matches(nameRegex, "First name can contain only letters and spaces"),
  lastName: Yup.string()
    .trim()
    .max(40, "Last name must be at most 40 characters")
    .matches(nameRegex, "Last name can contain only letters and spaces"),
     username: Yup.string()
    .trim()
    .required("Username is required"),
  email: Yup.string()
    .trim()
    .email("Enter a valid email address")
    .max(100, "Email must be at most 100 characters"),
});

function Account() {
  const [profile, setProfile] = useState({});
  const [loading, setLoding] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [permission, setPermission] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    axios
      .get(`${baseURL}/users/profile`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "ngrok-skip-browser-warning": "69420",
        },
      })
      .then((response) => {
        setProfile(response.data);
        localStorage.setItem("avatar", response?.data?.avatarUrl);
        // console.log(response.data);
      })
      .catch((error) => {
        console.log(error);
        const errorMessage = error?.response?.data?.message || "";
        const statusCode = error?.response?.status;

        if (
          statusCode === 403 ||
          errorMessage ===
            "Your trial period has ended. Please upgrade to continue." ||
          errorMessage ===
            "Your trial period of 14 days has ended. Please upgrade to continue."
        ) {
          setPermission(true);
        }
      });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];

     // ✅ Allowed image types
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPG, JPEG, PNG, and WEBP files are allowed", {
        autoClose: 3000,
      });
      e.target.value = "";
      return;
    }

    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      formik.setFieldValue("avatarUrl", file);
    }
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      avatarUrl: profile.avatarUrl || selectedImage,
      firstName: profile.firstName || "",
      username: profile.username || "",
      lastName: profile.lastName || "",
      email: profile.email || "",
      phone: profile.phone || "",
      countryCode: profile.countryCode || "",
      displayName: profile.displayName || "",
      bio: profile.bio || "",
      gstNumber: profile.gstNumber || "",
    },
    validationSchema,
    onSubmit: async (values) => {
      // console.log(values)
      setLoding(true);
      const token = localStorage.getItem("token");
      if (!token) return;
      const formData = new FormData();
      formData.append("avatarUrl", values.avatarUrl);
      formData.append("firstName", values.firstName);
      formData.append("email", values.email);
      formData.append("lastName", values.lastName);
      formData.append("username", values.username);
      formData.append("phone", values.phone);
      formData.append("countryCode", values.countryCode);
      formData.append("displayName", values.displayName);
      formData.append("gstNumber", values.gstNumber);
      formData.append("bio", values.bio);
      try {
        const response = await axios.put(`${baseURL}/users/profile`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "69420",
          },
        });
        toast.success("Profile updated successfully", { autoClose: 1000 });
        setLoding(false);
        fetchProfile();
        // console.log(response.data);
      } catch (error) {
        setLoding(false);
        console.error("Error making request:", error?.message);
      }
    },
  });
  const bioCharCount = formik.values.bio.length;
  const handleNameChange = (fieldName) => (event) => {
    const lettersOnlyValue = event.target.value.replace(/[^A-Za-z\s]/g, "");
    formik.setFieldValue(fieldName, lettersOnlyValue);
  };

  return (
    <>
      <section>
        {permission ? ( // <-- check permission first
          <div className="bg-slate-100 p-5 rounded text-center mt-5">
            <ErrorOutlineIcon
              sx={{ fontSize: "50px" }}
              className="text-red-600"
            />
            <h1 className="text-slate-700 font-normal text-2xl">
              You do not have access to this page
            </h1>
            <p className="text-slate-700 font-normal text-sm">
              We're sorry, your plan does not have permission or upgrade to
              access this page
            </p>
            <button
              className="bg-blue rounded px-5 py-2 mt-4 text-white font-normal hover:bg-blueHover"
              onClick={() => navigate("/photographer/upgrade_plan")}
            >
              <BoltIcon /> Upgrade Plan
            </button>
          </div>
        ) : loading ? (
          <div className="flex justify-center mt-5">
            <CircularProgress />
          </div>
        ) : (
          <div className="bg-white text-start rounded p-4 dark:bg-gray-800">
            <p className="font-normal text-slate-700 text-xl dark:text-white">
              Profile Settings
            </p>
            <span className="text-slate-500">
              Manage your personal information and profile picture.
            </span>
            <form onSubmit={formik.handleSubmit}>
              <div className="flex items-center gap-5 mt-5">
                <img
                  src={imagePreview || profile.avatarUrl || demo}
                  alt="profile"
                  className="w-24 h-24 rounded-full bg-gray-300 object-cover"
                />
                <label
                  htmlFor="file"
                  className="bg-slate-100 rounded p-2 text-sm h-max font-normal text-slate-700 cursor-pointer hover:bg-slate-200"
                >
                  Change Picture
                </label>
                <input
                  type="file"
                  id="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </div>
              <div className="flex justify-between gap-2 md:gap-4 mt-5 w-full">
                <div className="flex flex-col w-1/2 ">
                  <label className="text-slate-700 font-normal dark:text-white">
                    First Name<span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={formik.values.firstName}
                    onChange={handleNameChange("firstName")}
                    name="firstName"
                    maxLength={50}
                    placeholder="Enter your first name"
                    className="border rounded p-2 bg-transparent outline-none dark:text-white"
                  />
                  {formik.touched.firstName && formik.errors.firstName ? (
                    <p className="mt-1 text-xs text-red-500">
                      {formik.errors.firstName}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col w-1/2">
                  <label className="text-slate-700 font-normal dark:text-white">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formik.values.lastName}
                    onChange={handleNameChange("lastName")}
                    name="lastName"
                    maxLength={50}
                    placeholder="Enter your last name"
                    className="border rounded p-2 bg-transparent outline-none dark:text-white"
                  />
                  {formik.touched.lastName && formik.errors.lastName ? (
                    <p className="mt-1 text-xs text-red-500">
                      {formik.errors.lastName}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-col md:flex-row justify-between gap-2 md:gap-4 mt-1 w-full">
                <div className="flex flex-col md:w-1/2">
                  <label className="text-slate-700 font-normal dark:text-white">
                    Usename<span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={formik.values.username}
                     onChange={(e) => {
                    const value = e.target.value;
                    const regex = /^[a-zA-Z0-9]*$/; // only letters & numbers

                    if (regex.test(value)) {
                      formik.setFieldValue("username", value);
                    }
                  }}
                    onBlur={formik.handleBlur}
                    name="username"
                      maxLength={80}
                    placeholder="Enter your username"
                    className="border rounded p-2 bg-transparent text-sm outline-none dark:text-white"
                  />
                  {formik.touched.username && formik.errors.username ? (
                    <p className="mt-1 text-xs text-red-500">
                      {formik.errors.username}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col md:w-1/2">
                  <label className="text-slate-700 font-normal dark:text-white">
                    Phone
                  </label>
                  <div className=" border border-slate-300 rounded bg-white">
                    {/* <span className="text-slate-700 dark:text-white text-sm">
                      +91
                    </span>
                    <input
                      type="text"
                      value={formik.values.phone}
                      onChange={formik.handleChange}
                      name="phone"
                      placeholder="Enter your phone no."
                      className=" text-sm outline-none dark:text-white"
                    /> */}
                    <PhoneInput
                      country={"in"}
                      enableSearch={true}
                      countryCodeEditable={false}
                      disableDropdown={true}
                      // PhoneInput expects full number (code + phone)
                      value={
                        (formik.values.countryCode || "").replace("+", "") +
                        (formik.values.phone || "")
                      }
                      inputProps={{
                        readOnly: true, // ⬅️ makes input non-editable
                      }}
                      inputStyle={{
                        border: "none",
                        outline: "none",
                        width: "100%",
                        background: "transparent",
                        fontSize: "16px",
                        pointerEvents: "none",
                        color: "GrayText"
                      }}
                      buttonStyle={{
                        border: "none",
                        backgroundColor: "transparent",
                        fontSize: "16px",
                        pointerEvents: "none",
                      }}
                      onBlur={formik.handleBlur}
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col w-full mt-1">
                <label className="text-slate-700 font-normal dark:text-white">
                  Email
                </label>
                <input
                  type="text"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  name="email"
                  maxLength={100}
                  placeholder="Enter your email address"
                  className="border rounded p-2 bg-transparent text-sm outline-none dark:text-white"
                />
                {formik.touched.email && formik.errors.email ? (
                  <p className="mt-1 text-xs text-red-500">
                    {formik.errors.email}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-col md:flex-row justify-between gap-2 md:gap-4 w-full">
                <div className="flex flex-col mt-2 md:w-1/2">
                  <label className="text-slate-700 font-normal dark:text-white">
                    Dispaly Name (Public Portfolio)
                  </label>
                  <input
                    type="text"
                    value={formik.values.displayName}
                    onChange={formik.handleChange}
                    name="displayName"
                    maxLength={80}
                    placeholder="Enter your display name"
                    className="border rounded p-2 bg-transparent outline-none dark:text-white"
                  />
                </div>
                <div className="flex flex-col mt-2 md:w-1/2">
                  <label className="text-slate-700 font-normal dark:text-white">
                    GST Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={formik.values.gstNumber}
                    onChange={formik.handleChange}
                    name="gstNumber"
                    maxLength={15}
                    placeholder="Enter your GST number"
                    className="border rounded p-2 bg-transparent outline-none dark:text-white"
                  />
                </div>
              </div>
              <div className="flex flex-col mt-2">
                <label className="text-slate-700 font-normal dark:text-white">
                  Short Bio (Public Portfolio)
                </label>
                <textarea
                  rows={4}
                  value={formik.values.bio}
                  onChange={formik.handleChange}
                  name="bio"
                  maxLength={500}
                  placeholder="Enter your short bio"
                  className="border rounded p-2 bg-transparent text-sm outline-none dark:text-white"
                />
                <p className="text-xs text-slate-500 mt-1">
                  {bioCharCount}/500
                </p>
              </div>
              <button
                className="btn bg-blue text-white py-2 px-3 text-sm mt-5 rounded hover:bg-blueHover font-normal"
                type="submit"
              >
                {!loading ? "Save Profile" : "Saving..."}
              </button>
            </form>
          </div>
        )}
      </section>
    </>
  );
}

export default Account;

