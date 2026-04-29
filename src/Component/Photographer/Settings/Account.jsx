import React, { useEffect, useState } from "react";
import demo from "../../image/guset-album 1.png";
import axios from "axios";
import { useFormik } from "formik";
import ChangePassword from "./ChangePassword";
import { toast } from "react-toastify";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const baseUrl = process.env.REACT_APP_BASE_URL;

function Account() {
  const [open, setOpen] = useState(false);
  const handleClosed = () => setOpen(false);
  const [watermark, setWatermark] = useState(null);
  const [watermarkPreview, setWatermarkPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    logo: "",
    width: 100,
    height: 100,
    opacity: 100,
    position: "bottom-right",
  });

  useEffect(() => {
    fetchWatermark();
  }, []);

  const fetchWatermark = async () => {
    try {
      const response = await axios.get(`${baseUrl}/photographer/watermark`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = response.data?.watermarkSettings;
      if (data) {
        setSettings({
          logo: data.logoSignedUrl || "",
          width: data.width || 100,
          height: data.height || 100,
          opacity: data.opacity || 100,
          position: data.position || "bottom-right",
        });

        if (data.logoSignedUrl) {
          setWatermarkPreview(data.logoSignedUrl);
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      logo: watermark || settings.logo || "",
      width: settings.width,
      height: settings.height,
      opacity: settings.opacity,
      position: settings.position,
    },
    onSubmit: async (values) => {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return;
      const formData = new FormData();
      formData.append("logo", values.logo);
      formData.append("width", values.width);
      formData.append("height", values.height);
      formData.append("opacity", values.opacity);
      formData.append("position", values.position);

      try {
        await axios.post(
          `${baseUrl}/photographer/watermark`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "ngrok-skip-browser-warning": "69420",
            },
          }
        );
        toast.success("Watermark updated successfully", { autoClose: 1000 });
        setLoading(false);
      } catch (error) {
        setLoading(false);
        console.error("Error making request:", error?.message);
      }
    },
  });

  const handleWatermarkUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setWatermark(file);
      setWatermarkPreview(URL.createObjectURL(file));
      formik.setFieldValue("logo", file);
    }
  };

  const handleSettingChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const getPositionStyle = (position) => {
    switch (position) {
      case "top-left":
        return { top: "10px", left: "10px" };
      case "top-right":
        return { top: "10px", right: "10px" };
      case "center":
        return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
      case "bottom-left":
        return { bottom: "10px", left: "10px" };
      case "bottom-right":
      default:
        return { bottom: "10px", right: "10px" };
    }
  };

  return (
    <>
      <section className="animate-fadeIn text-start">
        <div className="bg-white rounded-3xl p-4 md:p-6 shadow-sm border border-slate-100 dark:bg-slate-800 dark:border-slate-700 h-full max-h-[calc(100vh-140px)] overflow-y-auto">
          <div className="mb-4">
            <h2 className="font-bold text-slate-800 text-2xl dark:text-white">
              Watermark & Branding
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Customize how your watermark appears on protected photos.
            </p>
          </div>

          <form onSubmit={formik.handleSubmit}>
            <div className="flex flex-col lg:flex-row gap-6 lg:items-start">
              {/* Left Column: Upload & Preview */}
              <div className="flex-1 flex flex-col gap-6">
                {/* Upload Section */}
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Upload Logo
                  </label>
                  <label htmlFor="watermark-upload" className="w-full h-24 border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-2xl flex flex-row items-center justify-center gap-4 cursor-pointer hover:border-[#0b8599] hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all p-4">
                    <div className="bg-[#ccf2ff] text-[#0b8599] p-2 rounded-full">
                      <CloudUploadIcon fontSize="small" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                        Click to upload watermark
                      </span>
                      <span className="text-xs text-slate-500 font-medium lowercase">
                        PNG with transparent background (Max 1MB)
                      </span>
                    </div>
                  </label>
                  <input
                    id="watermark-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleWatermarkUpload}
                  />
                </div>

                {/* Live Preview Section */}
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Live Preview
                  </label>
                  <div className="relative h-32 sm:h-40 w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner group">
                    <div
                      className="absolute inset-0 z-0 bg-slate-100"
                      style={{
                        backgroundImage: "linear-gradient(45deg, #e2e8f0 25%, transparent 25%, transparent 75%, #e2e8f0 75%, #e2e8f0), linear-gradient(45deg, #e2e8f0 25%, transparent 25%, transparent 75%, #e2e8f0 75%, #e2e8f0)",
                        backgroundSize: "20px 20px",
                        backgroundPosition: "0 0, 10px 10px",
                        opacity: 0.6
                      }}
                    ></div>
                    <img src={demo} alt="Preview" className="w-full h-full object-cover relative z-10 opacity-70" />
                    {watermarkPreview && (
                      <img
                        src={watermarkPreview}
                        alt="Watermark"
                        className="relative z-20 transition-all duration-200 drop-shadow-md"
                        style={{
                          width: `${settings.width}px`,
                          height: `${settings.height}px`,
                          opacity: settings.opacity / 100,
                          position: "absolute",
                          ...getPositionStyle(settings.position),
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Display Settings */}
              <div className="w-full lg:w-[320px] flex flex-col pt-6 lg:pt-0">
                <div className="bg-slate-50 dark:bg-slate-700/30 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 flex flex-col gap-5">
                  <div className="flex gap-4">
                    <div className="flex flex-col flex-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1">Width</label>
                      <input
                        type="number"
                        name="width"
                        value={settings.width}
                        onChange={handleSettingChange}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0b8599]/20 focus:border-[#0b8599] text-sm font-medium dark:bg-slate-600 dark:border-slate-500 dark:text-white shadow-sm"
                      />
                    </div>
                    <div className="flex flex-col flex-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1">Height</label>
                      <input
                        type="number"
                        name="height"
                        value={settings.height}
                        onChange={handleSettingChange}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0b8599]/20 focus:border-[#0b8599] text-sm font-medium dark:bg-slate-600 dark:border-slate-500 dark:text-white shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1.5 mx-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Opacity</label>
                      <span className="text-[xs] font-bold text-[#0b8599] bg-[#ccf2ff] px-2 py-0.5 rounded-full">{settings.opacity}%</span>
                    </div>
                    <input
                      type="range"
                      name="opacity"
                      min={0}
                      max={100}
                      value={settings.opacity}
                      onChange={handleSettingChange}
                      className="w-full accent-[#0b8599] h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1">Position</label>
                    <select
                      name="position"
                      value={settings.position}
                      onChange={handleSettingChange}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0b8599]/20 focus:border-[#0b8599] text-sm font-medium dark:bg-slate-600 dark:border-slate-500 dark:text-white shadow-sm cursor-pointer"
                    >
                      <option value="top-left">Top Left</option>
                      <option value="top-right">Top Right</option>
                      <option value="center">Center</option>
                      <option value="bottom-left">Bottom Left</option>
                      <option value="bottom-right">Bottom Right</option>
                    </select>
                  </div>

                  <button
                    className="w-full bg-[#0b8599] text-white py-3 rounded-2xl font-bold text-sm hover:bg-[#086a7a] transition-all shadow-md active:scale-95 disabled:opacity-70 mt-2"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? "SAVING..." : "SAVE WATERMARK"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </section>
      <ChangePassword open={open} handleClose={handleClosed} />
    </>
  );
}

export default Account;
