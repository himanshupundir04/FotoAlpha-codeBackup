import React, { useEffect, useState } from "react";
import { Divider } from "@mui/material";
import demo from "../../image/guset-album 1.png";
import axios from "axios";
import { useFormik } from "formik";
import { toast } from "react-toastify";
import ChangePassword from "./ChangePassword";

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

  // console.log(watermarkPreview)

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
      // console.log(values);
      const token = localStorage.getItem("token");
      if (!token) return;
      const formData = new FormData();
      formData.append("logo", values.logo);
      formData.append("width", values.width);
      formData.append("height", values.height);
      formData.append("opacity", values.opacity);
      formData.append("position", values.position);

      try {
        const response = await axios.post(
          `${baseUrl}/photographer/watermark`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "ngrok-skip-browser-warning": "69420",
            },
          }
        );
        toast.success("Watermark updated successfully", {autoClose: 1000});
        setLoading(false);
        // console.log(response.data);
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
      <section>
        <div className="bg-white text-start rounded p-4 dark:bg-slate-800">
          <div className="py-2 ">
            <h2 className="text-xl font-normal text-slate-700 dark:text-white">
              Watermark Settings
            </h2>
            <form onSubmit={formik.handleSubmit}>
              <div className="mt-2">
                <div className="flex flex-col">
                  <label className="text-slate-700 font-normal mb-1 dark:text-white">
                    Upload Logo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleWatermarkUpload}
                  />
                </div>
                <div className="flex flex-col md:flex-row justify-between items-center gap-5 mt-3">
                  <div className="relative h-48 bg-gray-100 rounded overflow-hidden border">
                    <img
                      src={demo}
                      alt="Preview background"
                      className="w-full h-full object-contain"
                    />
                    {watermarkPreview && (
                      <img
                        src={watermarkPreview}
                        alt="Watermark"
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
                  <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex flex-col w-full md:w-[30%]">
                      <label className="text-slate-700 font-normal dark:text-white">
                        Width (px)
                      </label>
                      <input
                        type="number"
                        name="width"
                        value={settings.width}
                        onChange={handleSettingChange}
                        className="border border-slate-300 p-2 rounded text-sm bg-transparent outline-none dark:text-white "
                      />
                    </div>
                    <div className="flex flex-col w-full md:w-[30%]">
                      <label className="text-slate-700 font-normal dark:text-white">
                        Height (px)
                      </label>
                      <input
                        type="number"
                        name="height"
                        value={settings.height}
                        onChange={handleSettingChange}
                        className="border border-slate-300 p-2 text-sm rounded bg-transparent outline-none dark:text-white"
                      />
                    </div>
                    <div className="flex flex-col w-full md:w-[30%]">
                      <label className="text-slate-700 font-normal dark:text-white">
                        Opacity (%)
                      </label>
                      <input
                        type="range"
                        name="opacity"
                        min={0}
                        max={100}
                        value={settings.opacity}
                        onChange={handleSettingChange}
                        className="w-full"
                      />
                      <p className="text-sm text-slate-500 text-sm dark:text-white">
                        {settings.opacity}%
                      </p>
                    </div>
                    <div className="flex flex-col w-full md:w-[30%]">
                      <label className="text-slate-700 font-normal dark:text-white">
                        Position
                      </label>
                      <select
                        name="position"
                        value={settings.position}
                        onChange={handleSettingChange}
                        className="border border-slate-300 p-2 rounded text-sm  bg-transparent outline-none dark:text-white"
                      >
                        <option value="top-left">Top Left</option>
                        <option value="top-right">Top Right</option>
                        <option value="center">Center</option>
                        <option value="bottom-left">Bottom Left</option>
                        <option value="bottom-right">Bottom Right</option>
                      </select>
                    </div>
                    <button
                      className="bg-blue hover:bg-blueHover font-normal text-white h-max w-max rounded px-5 py-2 text-sm lg:mt-6"
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>          
        </div>
      </section>
      <ChangePassword open={open} handleClose={handleClosed}/>
    </>
  );
}

export default Account;

