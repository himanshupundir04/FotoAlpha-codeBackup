import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { useFormik } from "formik";
import Images from "./Images";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import BoltIcon from "@mui/icons-material/Bolt";
import { CircularProgress } from "@mui/material";
import ImageCropper from "./ImageCroper";
import profile from "../../image/profile-avatar.jpg";
import cover from "../../image/cover-avatar.jpg";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PhoneInput from "react-phone-input-2";

const baseURL = process.env.REACT_APP_BASE_URL;

function Portfolio() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [loading, setLoading] = useState(false);
  const [profilePreview, setProfilePreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [portfolio, setPortfolio] = useState({});
  const [permission, setPermission] = useState(false);
  const [dataload, setDataload] = useState(false);
  const users = JSON.parse(localStorage.getItem("users")) || [];
  const currentUser = users.find((u) => u.isCurrent);
  const [folders, setFolders] = useState([]);
  const [open, setOpen] = useState(false);
  // Cropper states
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [cropType, setCropType] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setDataload(true);
    try {
      const response = await axios.get(`${baseURL}/portfolio/me`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "ngrok-skip-browser-warning": "69420",
        },
      });
      setDataload(false);
      setPortfolio(response.data.data);
      setProfilePreview(response.data.data.profileImageSignedUrl);
      setCoverPreview(response.data.data.coverImageSignedUrl);
    } catch (error) {
      setDataload(false);
      const errorMessage = error?.response?.data?.message || "";
      const statusCode = error?.response?.status;

      if (
        statusCode === 403 ||
        errorMessage ===
          "Your trial period has ended. Please upgrade to continue." ||
        errorMessage ===
          "Access to portfolioCreation is not allowed in your plan." ||
        errorMessage ===
          "Your trial period of 14 days has ended. Please upgrade to continue."
      ) {
        setPermission(true);
      }
    }
  };

  const formik = useFormik({
    initialValues: {
      profileImage: portfolio?.profileImage || null,
      coverImage: portfolio?.coverImage || null,
      name: portfolio?.brandName || "",
      tagline: portfolio?.tagline || "",
      biography: portfolio?.biography || "",
      location: portfolio?.location || "",
      contactEmail: portfolio?.contactEmail || "",
      contactPhone: portfolio?.contactPhone || "",
      countryCode: portfolio?.countryCode || "",
      instagramHandle: portfolio?.instagramHandle || "",
      facebookHandle: portfolio?.facebookHandle || "",
      youtubeHandle: portfolio?.youtubeHandle || "",
      pricing: portfolio?.pricing || "",
      specialties: (portfolio?.specialties || []).join(", "),
    },
    enableReinitialize: true,
    onSubmit: async (values) => {
      setLoading(true);
      if (!token) return;

      try {
        const formData = new FormData();
        formData.append("profileImage", values.profileImage);
        formData.append("coverImage", values.coverImage);
        formData.append("brandName", values.name);
        formData.append("tagline", values.tagline);
        formData.append("biography", values.biography);
        formData.append("location", values.location);
        formData.append("contactEmail", values.contactEmail);
        formData.append("contactPhone", values.contactPhone);
        formData.append("countryCode", values.countryCode);
        formData.append("instagramHandle", values.instagramHandle);
        formData.append("facebookHandle", values.facebookHandle);
        formData.append("youtubeHandle", values.youtubeHandle);
        formData.append("pricing", values.pricing);
        formData.append("specialties", values.specialties);

        await axios.post(`${baseURL}/portfolio`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
            "ngrok-skip-browser-warning": "69420",
          },
        });

        setLoading(false);
        toast.success("Portfolio saved successfully!", {
          autoClose: 1000,
        });
        formik.resetForm();
        fetchEvents();
      } catch (error) {
        setLoading(false);
        console.error(error);
      }
    },
  });

  // Handle file select → open cropper
  const handleImageChange = (event, type) => {
    const file = event.currentTarget.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setCropImageSrc(reader.result);
      setCropType(type);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  // After cropping is complete
  const handleCropComplete = (croppedFile) => {
    formik.setFieldValue(cropType, croppedFile);
    const previewUrl = URL.createObjectURL(croppedFile);

    if (cropType === "profileImage") setProfilePreview(previewUrl);
    else setCoverPreview(previewUrl);
  };

  useEffect(() => {
    fetchFolder();
  }, []);

  const fetchFolder = () => {
    axios
      .get(`${baseURL}/folders/user/${currentUser._id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "ngrok-skip-browser-warning": "69420",
        },
      })
      .then((response) => {
        // console.log(response.data);
        setFolders(response.data);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  return (
    <>
      <section>
        {dataload ? (
          <div className="flex flex-col items-center justify-center h-96 bg-white dark:bg-slate-900 rounded-lg shadow-sm p-6">
            <CircularProgress className="text-blue-600" />
            <p className="mt-4 text-slate-600 dark:text-slate-300">
              Loading...
            </p>
          </div>
        ) : permission ? (
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
              access to this page
            </p>
            <button
              className="bg-blue rounded px-5 py-2 mt-4 text-white font-normal hover:bg-blueHoverHover"
              onClick={() => navigate("/organization/upgrade_plan")}
            >
              <BoltIcon /> Upgrade Plan
            </button>
          </div>
        ) : (
          <>
            <div className="bg-white p-4 rounded md:mt-2 text-start dark:bg-slate-800">
              
                <div className="flex justify-between items-center">
                  <div className="flex text-start items-center mb-5 gap-3">
                    <div className="hidden md:block">
                      <ArrowBackIcon
                        sx={{ fontSize: "30px" }}
                        className="bg-slate-300 p-1 rounded text-white cursor-pointer"
                        onClick={() => {
                          navigate(-1);
                        }}
                      />
                    </div>
                    <div className="">
                      <h2 className="text-slate-700 font-normal text-xl dark:text-white">
                        Portfolio Details
                      </h2>
                      <p className="text-slate-400 text-sm">
                        Update your public portfolio information.
                      </p>
                    </div>

                    {/* Desktop button (hidden on mobile) */}
                    {/* <div className="gap-3 hidden md:flex">
                    <button
                      type="button"
                      className="border border-blue rounded p-2 text-sm text-textblue hover:bg-slate-100 font-normal"
                      onClick={() => navigate("/public_portfolio")}
                    >
                      Public Portfolio
                    </button>
                  </div> */}
                    {/* Mobile IconButton (hidden on desktop) */}
                    {/* <div className="md:hidden">
                    <IconButton
                      aria-label="more"
                      size="small"
                      onClick={(e) => handleClick(e)}
                    >
                      <MoreVertIcon sx={{ fontSize: 20 }} />
                    </IconButton>

                    <Menu
                      anchorEl={menuAnchor.anchorEl}
                      open={Boolean(menuAnchor.anchorEl)}
                      onClose={handleClose}
                      slotProps={{
                        paper: {
                          style: {
                            width: "16ch",
                            boxShadow: "none",
                          },
                        },
                      }}
                      className="shadow-none"
                    >
                      <MenuItem
                        onClick={() => {
                          navigate("/public_portfolio");
                        }}
                        className="text-slate-500 dark:text-slate-700"
                      >
                        View public portfolio
                      </MenuItem>
                    </Menu>
                  </div> */}
                  </div>
                  <button
                    className="border border-blue rounded-md py-1 px-2 text-sm text-slate-700 dark:text-white"
                    onClick={() => {
                      navigate(-1);
                    }}
                  >
                    View Portfolio
                  </button>
                </div>
                <form onSubmit={formik.handleSubmit}>
                <div className="mt-3 flex md:flex-nowrap flex-wrap lg:gap-6">
                  <div className="w-1/2">
                    <h2 className="text-slate-700 font-normal py-1 dark:text-white">
                      Profile Image
                    </h2>
                    <div className="flex items-center gap-2 lg:gap-4">
                      <div className="relative">
                        <img
                          src={profilePreview || profile}
                          alt="profile"
                          className="rounded-full bg-gray-300 h-20 w-20  border border-slate-300"
                          loading="lazy"
                        />
                        <label
                          htmlFor="profile"
                          className="absolute -right-2 bottom-1 bg-slate-100 rounded-full p-1 cursor-pointer shadow hover:bg-slate-200 transition"
                        >
                          <PhotoCameraIcon sx={{ fontSize: "18px" }} />
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          id="profile"
                          hidden
                          onChange={(e) => handleImageChange(e, "profileImage")}
                        />
                      </div>
                      <div className="flex flex-col">
                        <p className="text-sm text-slate-500 mt-1">Max: 5mb</p>
                        <p className="text-sm text-slate-500 mt-1">
                          Size: 400*400
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="w-1/2">
                    <h2 className="text-slate-700 font-normal py-1 dark:text-white">
                      Cover Image
                    </h2>
                    <div className="flex items-center gap-2 lg:gap-4">
                      <div className="relative">
                        <img
                          src={coverPreview || cover}
                          alt="cover"
                          className="rounded bg-gray-300 h-14 w-28 lg:w-32 object-fill border border-slate-300"
                          loading="lazy"
                        />
                        <div className="flex flex-col">
                          <input
                            type="file"
                            accept="image/*"
                            id="cover"
                            hidden
                            onChange={(e) => handleImageChange(e, "coverImage")}
                          />
                          <label
                            htmlFor="cover"
                            className="absolute -right-2 bottom-0 bg-slate-100 rounded-full py-1 px-2 cursor-pointer"
                          >
                            <PhotoCameraIcon sx={{ fontSize: "18px" }} />
                          </label>
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <p className="text-sm text-slate-500 mt-1">Max: 5mb</p>
                        <p className="text-sm text-slate-500 mt-1">
                          Size: 1920*1024
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col md:flex-row justify-between items-center mt-4 gap-3">
                  <div className="flex flex-col md:w-1/2 w-full">
                    <label className="text-slate-700 font-normal dark:text-white">
                      Your Name/Brand Name
                    </label>
                    <input
                      type="text"
                      placeholder="Brand Name"
                      name="name"
                      value={formik.values.name}
                      onChange={formik.handleChange}
                      className="border border-slate-300 text-sm rounded p-2 mt-1 bg-transparent dark:text-white"
                    />
                  </div>

                  <div className="flex flex-col md:w-1/2 w-full">
                    <label className="text-slate-700 font-normal dark:text-white">
                      Tagline
                    </label>
                    <input
                      type="text"
                      placeholder="Tagline"
                      name="tagline"
                      value={formik.values.tagline}
                      onChange={formik.handleChange}
                      className="border border-slate-300 text-sm rounded p-2 mt-1 bg-transparent dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex flex-col mt-3">
                  <label className="text-slate-700 font-normal dark:text-white">
                    Biography
                  </label>
                  <textarea
                    name="biography"
                    value={formik.values.biography}
                    onChange={formik.handleChange}
                    className="border border-slate-300 text-sm rounded p-2 mt-1 bg-transparent dark:text-white"
                    placeholder="Biography"
                    rows={4}
                  />
                </div>
                <div className="border border-slate-300 rounded p-3 mt-5">
                  {/* Header */}
                  <div
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => setOpen(!open)}
                  >
                    <p className="font-normal text-slate-700 dark:text-white">
                      Additional Details
                    </p>
                    <ExpandMoreIcon
                      className={`transform transition-transform duration-300 ${
                        open ? "rotate-180" : ""
                      }`}
                    />
                  </div>

                  {/* Expandable Content */}
                  <div
                    className={`grid transition-all duration-500 ease-in-out overflow-hidden ${
                      open
                        ? "max-h-[2000px] opacity-100 mt-3"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row justify-between gap-3">
                      <div className="flex flex-col md:w-1/2 w-full">
                        <label className="text-slate-700 font-normal dark:text-white">
                          Location
                        </label>
                        <input
                          type="text"
                          placeholder="Location"
                          name="location"
                          value={formik.values.location}
                          onChange={formik.handleChange}
                          className="border border-slate-300 text-sm rounded p-2 mt-1 bg-transparent dark:text-white"
                        />
                      </div>
                      <div className="flex flex-col md:w-1/2 w-full">
                        <label className="text-slate-700 font-normal dark:text-white">
                          Pricing per day
                        </label>
                        <input
                          type="number"
                          placeholder="1000"
                          name="pricing"
                          value={formik.values.pricing}
                          onChange={formik.handleChange}
                          className="border border-slate-300 text-sm rounded p-2 mt-1 bg-transparent dark:text-white"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row justify-between mt-3 gap-3">
                      <div className="flex flex-col md:w-1/2 w-full">
                        <label className="text-slate-700 font-normal dark:text-white">
                          Contact Email
                        </label>
                        <input
                          type="email"
                          placeholder="Email"
                          name="contactEmail"
                          value={formik.values.contactEmail}
                          onChange={formik.handleChange}
                          className="border border-slate-300 text-sm rounded p-2 mt-1 bg-transparent dark:text-white"
                        />
                      </div>
                      <div className="flex flex-col md:w-1/2 w-full">
                        <label className="text-slate-700 font-normal dark:text-white">
                          Contact Phone
                        </label>
                        {/* <input
                          type="tel"
                          name="contactPhone"
                          placeholder="1234567891"
                          value={
                            formik.values.contactPhone
                              ? `+${formik.values.contactPhone}`
                              : "+91" // default display
                          }
                          onChange={(e) => {
                            let val = e.target.value.replace(/\D/g, "");

                            // Always enforce the "91" prefix
                            if (!val.startsWith("91")) {
                              val = "91" + val.replace(/^91/, "");
                            }

                            // Keep only 10 digits after 91 → total length = 12
                            if (val.length > 12) {
                              val = val.slice(0, 12);
                            }

                            // Store without the "+" (only digits)
                            formik.setFieldValue("contactPhone", val);
                          }}
                          onKeyDown={(e) => {
                            // Prevent deleting the "91" prefix
                            if (
                              (formik.values.contactPhone?.length <= 2 &&
                                e.key === "Backspace") ||
                              (e.key === "ArrowLeft" &&
                                e.target.selectionStart <= 3) // account for +91
                            ) {
                              e.preventDefault();
                            }
                          }}
                          className="border border-slate-300 text-sm rounded p-2 mt-1 bg-transparent dark:text-white"
                        /> */}
                        <div className="mt-1 px-2 bg-white border border-slate-300 rounded">
                          <PhoneInput
                            country={"in"}
                            enableSearch={true}
                            countryCodeEditable={false}
                            // PhoneInput expects full number (code + phone)
                            value={
                              (formik.values.countryCode || "").replace(
                                "+",
                                ""
                              ) + (formik.values.contactPhone || "")
                            }
                            onChange={(value, country) => {
                              const cleanValue = value.replace(/\D/g, ""); // only digits

                              // extract phone number without code
                              const phoneWithoutCode = cleanValue.slice(
                                country.dialCode.length
                              );

                              formik.setFieldValue(
                                "contactPhone",
                                phoneWithoutCode
                              ); // only phone number
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
                    <div className="flex flex-col md:flex-row justify-between mt-3 gap-3">
                      <div className="flex flex-col md:w-1/2 w-full">
                        <label className="text-slate-700 font-normal dark:text-white">
                          Facebook Username
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., kavitaphotography"
                          name="facebookHandle"
                          value={formik.values.facebookHandle}
                          onChange={formik.handleChange}
                          className="border border-slate-300 text-sm rounded p-2 mt-1 bg-transparent dark:text-white"
                        />
                        {formik.values.facebookHandle && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Full URL: https://www.facebook.com/
                            {formik.values.facebookHandle}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col md:w-1/2 w-full">
                        <label className="text-slate-700 font-normal dark:text-white">
                          YouTube Channel Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., @kavitaphotography or kavitaphotography"
                          name="youtubeHandle"
                          value={formik.values.youtubeHandle}
                          onChange={formik.handleChange}
                          className="border border-slate-300 text-sm rounded p-2 mt-1 bg-transparent dark:text-white"
                        />
                        {formik.values.youtubeHandle && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Full URL: https://www.youtube.com/@
                            {formik.values.youtubeHandle.replace("@", "")}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col md:w-1/2 w-full mt-3">
                      <label className="text-slate-700 font-normal dark:text-white">
                        Instagram Username
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., kavitaphotography"
                        name="instagramHandle"
                        value={formik.values.instagramHandle}
                        onChange={formik.handleChange}
                        className="border border-slate-300 text-sm rounded p-2 mt-1 bg-transparent dark:text-white"
                      />
                      {formik.values.instagramHandle && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Full URL: https://www.instagram.com/
                          {formik.values.instagramHandle}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    className="btn bg-blue rounded p-2 text-sm mt-8 text-white hover:bg-blueHover font-normal"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Save Portfolio Details"}
                  </button>
                </div>
              </form>
            </div>
            <Images folders={folders} fetchFolder={fetchFolder} />
          </>
        )}
      </section>
      {/* Cropper modal */}
      <ImageCropper
        open={cropModalOpen}
        onClose={() => setCropModalOpen(false)}
        imageSrc={cropImageSrc}
        aspect={cropType === "profileImage" ? 1 / 1 : 3.5 / 1}
        onCropComplete={handleCropComplete}
      />
    </>
  );
}

export default Portfolio;

