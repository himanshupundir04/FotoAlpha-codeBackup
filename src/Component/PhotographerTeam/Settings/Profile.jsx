import axios from "axios";
import { useFormik } from "formik";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import profilepic from "../../image/profile-avatar.jpg";
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

function Profile() {
  const [profile, setProfile] = useState({});
  const [imagePreview, setImagePreview] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${baseURL}/photographer-team/profile`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "ngrok-skip-browser-warning": "69420",
        },
      });
      setProfile(response.data);
      localStorage.setItem("avatar", response?.data?.avatarUrl);
      window.electronAPI.setStore("profile", response.data);
    } catch (error) {
      const cachedSummary = await window.electronAPI.getStore("profile");
      if (cachedSummary) {
        setProfile(cachedSummary);
      }
    }
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
      avatarUrl: profile?.avatarUrl || selectedImage,
      firstName: profile.firstName || "",
      lastName: profile.lastName || "",
      username: profile.username || "",
      email: profile.email || "",
      phone: profile.phone || "",
      countryCode: profile.countryCode || "",
    },
    validationSchema,
    onSubmit: async (values) => {
      const token = localStorage.getItem("token");
      if (!token) return;

      const formData = new FormData();
      formData.append("avatarUrl", values.avatarUrl);
      formData.append("firstName", values.firstName);
      formData.append("lastName", values.lastName);
      formData.append("username", values.username);
      formData.append("email", values.email);
      formData.append("phone", values.phone);
      formData.append("countryCode", values.countryCode);

      try {
        const response = await axios.put(
          `${baseURL}/photographer-team/profile`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "ngrok-skip-browser-warning": "69420",
              "Content-Type": "multipart/form-data",
            },
          },
        );
        toast.success("Profile updated successfully");
        fetchEvents(); // Refresh data after update
      } catch (error) {
        console.error("Error making request:", error?.message);
        toast.error("Failed to update profile");
      }
    },
  });

  const handleNameChange = (fieldName) => (event) => {
    const lettersOnlyValue = event.target.value.replace(/[^A-Za-z\s]/g, "");
    formik.setFieldValue(fieldName, lettersOnlyValue);
  };

  return (
    <>
      <section>
        <div className="bg-white text-start rounded p-4 dark:bg-gray-800 text-start">
          <p className="font-bold text-slate-700 text-xl dark:text-white">
            Profile Settings
          </p>
          <span className="text-slate-500">
            Manage your personal information and profile picture.
          </span>
          <form onSubmit={formik.handleSubmit}>
            <div className="flex items-center gap-5 mt-5">
              <img
                src={imagePreview || profile.avatarUrl || profilepic}
                alt="profile"
                className="w-24 h-24 rounded-full bg-gray-300 object-cover"
              />
              <label
                htmlFor="file"
                className="bg-slate-100 rounded p-2 h-max font-semibold text-slate-700 cursor-pointer hover:bg-slate-200"
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

            {/* Other fields (same as before) */}
            <div className="flex justify-between gap-2 md:gap-4 mt-5 w-full">
              <div className="flex flex-col w-1/2 ">
                <label className="text-slate-700 font-semibold dark:text-white">
                  First Name<span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formik.values.firstName}
                  onChange={handleNameChange("firstName")}
                  name="firstName"
                  maxLength={50}
                  placeholder="Enter your first name"
                  className="border border-slate-30 rounded p-2 bg-transparent dark:text-white"
                />
                {formik.touched.firstName && formik.errors.firstName ? (
                  <p className="mt-1 text-xs text-red-500">
                    {formik.errors.firstName}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-col w-1/2">
                <label className="text-slate-700 font-semibold dark:text-white">
                  Last Name
                </label>
                <input
                  type="text"
                  value={formik.values.lastName}
                  onChange={handleNameChange("lastName")}
                  name="lastName"
                  maxLength={50}
                  placeholder="Enter your last name"
                  className="border border-slate-30 rounded p-2 bg-transparent dark:text-white"
                />
                {formik.touched.lastName && formik.errors.lastName ? (
                  <p className="mt-1 text-xs text-red-500">
                    {formik.errors.lastName}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="flex justify-between gap-2 md:gap-4 mt-2 w-full">
              <div className="flex flex-col w-1/2">
                <label className="text-slate-700 font-normal dark:text-white">
                  UserName<span className="text-red-600">*</span>
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
              <div className="flex flex-col w-1/2">
                <label className="text-slate-700 font-normal dark:text-white">
                  Phone
                </label>
                {/* <input
                  type="text"
                  value={formik.values.phone}
                  // onChange={formik.handleChange}
                  onChange={(e) => {
                const value = e.target.value.replace(/\D/g, ""); // allow only digits
                if (value.length <= 10) {
                  formik.setFieldValue("phone", value);
                }
              }}
                  name="phone"
                  placeholder="Enter your phone no."
                  className="border rounded p-2 bg-transparent text-sm outline-none dark:text-white"
                /> */}
                <div className="border border-slate-300 rounded">
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
                    className="dark:text-white"
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col w-full mt-2">
              <label className="text-slate-700 font-normal dark:text-white">
                Email
              </label>
              <input
                type="text"
                value={formik.values.email}
                onChange={formik.handleChange}
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

            <button
              className="btn bg-blue text-white font-medium text-sm py-2 px-4 mt-5 rounded hover:bg-blueHover"
              typeof="submit"
              type="submit"
            >
              Save Profile
            </button>
          </form>
        </div>
      </section>
    </>
  );
}

export default Profile;

