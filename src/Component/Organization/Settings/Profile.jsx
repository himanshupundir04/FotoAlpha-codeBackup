import axios from "axios";
import { useFormik } from "formik";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import profilepic from "../../image/profile-avatar.jpg";
import PhoneInput from "react-phone-input-2";

const baseURL = process.env.REACT_APP_BASE_URL;

function Profile({ profile, fetchProfile }) {
  const [loading, setLoding] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);

  // console.log("profile",profile)

   useEffect(() => {
    localStorage.setItem("tab", "profile");
  },[])

  const handleImageChange = (e) => {
    const file = e.target.files[0];
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
    onSubmit: async (values) => {
      // console.log(values)
      setLoding(true);
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
        toast.error(error?.response.data?.message, { autoClose: 1000 });
        console.error("Error making request:", error?.message);
      }
    },
  });

  return (
    <>
      <section>
        <div className="bg-white text-start rounded p-4 dark:bg-gray-800">
          <h2 className="font-normal text-slate-700 text-xl dark:text-white">
            Profile Settings
          </h2>
          <p className="text-slate-500">
            Manage your personal information and profile picture.
          </p>
          <form onSubmit={formik.handleSubmit}>
            <div className="flex items-center gap-5 mt-5">
              <img
                src={imagePreview || profile?.avatarUrl || profilepic}
                alt="profile"
                className="w-24 h-24 rounded-full bg-gray-300 object-contain"
              />
              <label
                htmlFor="file"
                className="bg-slate-200 rounded p-2 text-sm h-max font-normal text-slate-700 cursor-pointer hover:bg-slate-200"
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
                  First Name
                </label>
                <input
                  type="text"
                  value={formik.values.firstName}
                  onChange={formik.handleChange}
                  name="firstName"
                  placeholder="Enter your first name"
                  className="border rounded p-2 bg-transparent text-sm outline-none dark:text-white"
                />
              </div>
              <div className="flex flex-col w-1/2">
                <label className="text-slate-700 font-normal dark:text-white">
                  Last Name
                </label>
                <input
                  type="text"
                  value={formik.values.lastName}
                  onChange={formik.handleChange}
                  name="lastName"
                  placeholder="Enter your last name"
                  className="border rounded p-2 bg-transparent text-sm outline-none dark:text-white"
                />
              </div>
            </div>
            <div className="flex justify-between gap-2 md:gap-4 mt-2 w-full">
              <div className="flex flex-col w-1/2">
                <label className="text-slate-700 font-normal dark:text-white">
                  UserName
                </label>
                <input
                  type="text"
                  value={formik.values.username}
                  onChange={formik.handleChange}
                  name="username"
                  placeholder="Enter your username"
                  className="border rounded p-2 bg-transparent text-sm outline-none dark:text-white"
                />
              </div>
              <div className="flex flex-col w-1/2">
                <label className="text-slate-700 font-normal dark:text-white">
                  Phone
                </label>
                <div className=" border border-slate-300 rounded">
                  {/* <span className="text-slate-700 text-sm">+91</span>
                  <input
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
                    className=" text-sm outline-none dark:text-white"
                  /> */}
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
                placeholder="Enter your email address"
                className="border rounded p-2 bg-transparent text-sm outline-none dark:text-white"
              />
            </div>
            <div className="flex flex-col md:flex-row justify-between gap-2 md:gap-4 w-full">
              <div className="flex flex-col mt-2 md:w-1/2">
                <label className="text-slate-700 font-normal dark:text-white">
                  Display Name (Public Portfolio)
                </label>
                <input
                  type="text"
                  value={formik.values.displayName}
                  onChange={formik.handleChange}
                  name="displayName"
                  placeholder="Enter your display name"
                  className="border rounded p-2 bg-transparent text-sm outline-none dark:text-white"
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
                  placeholder="Enter your GST number"
                  className="border rounded p-2 bg-transparent text-sm outline-none dark:text-white"
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
                placeholder="Enter your short bio"
                className="border rounded p-2 bg-transparent text-sm outline-none dark:text-white"
              />
            </div>
            <button
              className="btn bg-blue text-white py-2 px-3 text-sm mt-5 rounded hover:bg-blueHover font-medium"
              type="submit"
            >
              {!loading ? "Save Profile" : "Saving..."}
            </button>
          </form>
        </div>
      </section>
    </>
  );
}

export default Profile;

