import axios from "axios";
import { useFormik } from "formik";
import React, { useEffect, useState } from "react";
import profilepic from "../../image/profile-avatar.jpg";
import PhoneInput from "react-phone-input-2";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { Skeleton } from "@mui/material";
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
  username: Yup.string().trim().required("Username is required"),
  email: Yup.string()
    .trim()
    .email("Enter a valid email address")
    .max(100, "Email must be at most 100 characters"),
});

function Profile({ profile, fetchProfile }) {
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    localStorage.setItem("tab", "profile");
  }, []);

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
      lastName: profile.lastName || "",
      username: profile.username || "",
      displayName: profile.displayName || "",
      email: profile.email || "",
      phone: profile.phone || "",
      countryCode: profile.countryCode || "",
      bio: profile.bio || "",
      gstNumber: profile.gstNumber || "",
    },
    validationSchema,
    onSubmit: async (values) => {
      // console.log(values)
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }
      const formData = new FormData();
      formData.append("avatarUrl", values.avatarUrl);
      formData.append("firstName", values.firstName.trim());
      formData.append("lastName", values.lastName.trim());
      formData.append("username", values.username.trim());
      formData.append("email", values.email.trim());
      formData.append("phone", values.phone);
      formData.append("countryCode", values.countryCode);
      formData.append("displayName", values.displayName.trim());
      formData.append("gstNumber", values.gstNumber.trim().toUpperCase());
      formData.append("bio", values.bio.trim());
      try {
        await axios.put(`${baseURL}/users/profile`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "69420",
          },
        });
        toast.success("Profile updated successfully", { autoClose: 1000 });
        setLoading(false);
        fetchProfile();
        // console.log(response.data);
      } catch (error) {
        setLoading(false);
        console.error("Error making request:", error?.message);
      }
    },
  });

  const handleNameChange = (fieldName) => (event) => {
    const lettersOnlyValue = event.target.value.replace(/[^A-Za-z\s]/g, "");
    formik.setFieldValue(fieldName, lettersOnlyValue);
  };

  const bioCharCount = formik.values.bio.length;
  return (
    <>
      <section className="animate-fadeIn text-start">
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
          <div className="mb-8">
            <h2 className="font-bold text-slate-800 text-2xl dark:text-white">
              Profile Settings
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Manage your personal information and public professional profile.
            </p>
          </div>
          <form onSubmit={formik.handleSubmit} className="space-y-8">
            {/* Avatar Section */}
            <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700">
              <div className="relative group cursor-pointer">
                {!imgLoaded && (
                  <Skeleton
                    variant="rounded"
                    animation="wave"
                    width="100%"
                    height="100%"
                    className="rounded-full"
                  />
                )}

                <img
                  src={imagePreview || profile?.avatarUrl || profilepic}
                  alt="profile"
                  onLoad={() => setImgLoaded(true)}
                  onError={() => setImgLoaded(true)}
                  className={`w-28 h-28 rounded-full object-cover shadow-md border-4 border-white dark:border-slate-600 transition-transform group-hover:scale-105 ${
                    imgLoaded ? "block" : "hidden"
                  }`}
                />
                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center border-4 border-transparent">
                  <span className="text-white text-xs font-bold tracking-wider">
                    CHANGE
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2 items-center sm:items-start">
                <h3 className="text-sm font-bold text-slate-700 dark:text-white">
                  Profile Picture
                </h3>
                <p className="text-xs text-slate-500 max-w-xs text-center sm:text-left mb-2">
                  We recommend a high-resolution image. JPG, PNG or WEBP (Max
                  2MB).
                </p>
                <label
                  htmlFor="file"
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-full px-5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition-all"
                >
                  Upload New Picture
                </label>
                <input
                  type="file"
                  id="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </div>
            </div>

            {/* Personal Information Section */}
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-700 pb-2">
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formik.values.firstName}
                    onChange={handleNameChange("firstName")}
                    onBlur={formik.handleBlur}
                    name="firstName"
                    required
                    maxLength={50}
                    placeholder="John"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0b8599]/20 focus:border-[#0b8599] transition-all text-sm font-medium text-slate-800 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  />
                  {formik.touched.firstName && formik.errors.firstName && (
                    <p className="mt-1 text-xs text-red-500 font-medium">
                      {formik.errors.firstName}
                    </p>
                  )}
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formik.values.lastName}
                    onChange={handleNameChange("lastName")}
                    onBlur={formik.handleBlur}
                    name="lastName"
                    maxLength={50}
                    placeholder="Doe"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0b8599]/20 focus:border-[#0b8599] transition-all text-sm font-medium text-slate-800 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  />
                  {formik.touched.lastName && formik.errors.lastName && (
                    <p className="mt-1 text-xs text-red-500 font-medium">
                      {formik.errors.lastName}
                    </p>
                  )}
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formik.values.username}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^[a-zA-Z0-9]*$/.test(value)) {
                        formik.setFieldValue("username", value);
                      }
                    }}
                    onBlur={formik.handleBlur}
                    name="username"
                    required
                    maxLength={80}
                    placeholder="johndoe"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0b8599]/20 focus:border-[#0b8599] transition-all text-sm font-medium text-slate-800 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  />
                  {formik.touched.username && formik.errors.username && (
                    <p className="mt-1 text-xs text-red-500 font-medium">
                      {formik.errors.username}
                    </p>
                  )}
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <div className="w-full flex rounded-xl border border-slate-200 bg-slate-50 overflow-hidden dark:bg-slate-700 dark:border-slate-600">
                    <PhoneInput
                      country={"in"}
                      enableSearch={true}
                      countryCodeEditable={false}
                      disableDropdown={true}
                      value={
                        (formik.values.countryCode || "").replace("+", "") +
                        (formik.values.phone || "")
                      }
                      inputProps={{ readOnly: true }}
                      inputStyle={{
                        border: "none",
                        outline: "none",
                        width: "100%",
                        background: "transparent",
                        fontSize: "14px",
                        fontWeight: 500,
                        pointerEvents: "none",
                        color: "#475569",
                        paddingLeft: "48px",
                      }}
                      buttonStyle={{
                        border: "none",
                        backgroundColor: "transparent",
                        pointerEvents: "none",
                        paddingLeft: "8px",
                      }}
                    />
                  </div>
                </div>

                <div className="flex flex-col md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    name="email"
                    maxLength={100}
                    placeholder="johndoe@example.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0b8599]/20 focus:border-[#0b8599] transition-all text-sm font-medium text-slate-800 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  />
                  {formik.touched.email && formik.errors.email && (
                    <p className="mt-1 text-xs text-red-500 font-medium">
                      {formik.errors.email}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Professional Profile Section */}
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-700 pb-2 mt-2">
                Professional Profile
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Display Name (Public Portfolio)
                  </label>
                  <input
                    type="text"
                    value={formik.values.displayName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    name="displayName"
                    maxLength={80}
                    placeholder="e.g. John Doe Photography"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0b8599]/20 focus:border-[#0b8599] transition-all text-sm font-medium text-slate-800 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  />
                  {formik.touched.displayName && formik.errors.displayName && (
                    <p className="mt-1 text-xs text-red-500 font-medium">
                      {formik.errors.displayName}
                    </p>
                  )}
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    GST Number{" "}
                    <span className="text-slate-400 font-normal lowercase">
                      (optional)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={formik.values.gstNumber}
                    onChange={(e) => {
                      const cleanValue = e.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9]/g, "");
                      formik.setFieldValue("gstNumber", cleanValue);
                    }}
                    onBlur={formik.handleBlur}
                    name="gstNumber"
                    maxLength={15}
                    placeholder="Enter GST number"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0b8599]/20 focus:border-[#0b8599] transition-all text-sm font-medium text-slate-800 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  />
                  {formik.touched.gstNumber && formik.errors.gstNumber && (
                    <p className="mt-1 text-xs text-red-500 font-medium">
                      {formik.errors.gstNumber}
                    </p>
                  )}
                </div>

                <div className="flex flex-col md:col-span-2">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Short Bio{" "}
                      <span className="text-slate-400 font-normal lowercase">
                        (Public Portfolio)
                      </span>
                    </label>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                      {bioCharCount}/500
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={formik.values.bio}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    name="bio"
                    maxLength={500}
                    placeholder="Tell clients about your photography style and experience..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0b8599]/20 focus:border-[#0b8599] transition-all text-sm font-medium text-slate-800 dark:bg-slate-700 dark:border-slate-600 dark:text-white resize-none"
                  />
                  {formik.touched.bio && formik.errors.bio && (
                    <p className="mt-1 text-xs text-red-500 font-medium">
                      {formik.errors.bio}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
              <button
                className="w-full sm:w-auto bg-[#0b8599] text-white py-3 px-8 rounded-xl font-bold text-sm hover:bg-[#086a7a] transition-colors shadow-md active:scale-95 disabled:opacity-70 flex justify-center items-center gap-2"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    SAVING...
                  </>
                ) : (
                  "SAVE PROFILE"
                )}
              </button>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}

export default Profile;
