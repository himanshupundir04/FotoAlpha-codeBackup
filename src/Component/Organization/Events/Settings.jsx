import React, { useContext, useState } from "react";
import { Switch } from "@mui/material";
import OpacityIcon from "@mui/icons-material/Opacity";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import DeleteIcon from "@mui/icons-material/Delete";
import { useFormik } from "formik";
import axios from "axios";
import { toast } from "react-toastify";
import { useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { PortfolioEventContext } from "../Context/PortfolioEventContext";

const baseURL = process.env.REACT_APP_BASE_URL;

function Settings() {
  const { portfolioevent } = useContext(PortfolioEventContext);
  const [loading, setLoading] = useState(false);
  const { eventid } = useParams();
  // console.log(eventid);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      applyWatermark: portfolioevent?.settings?.applyWatermark ?? false,
      enableDownloads: portfolioevent?.settings?.enableDownloads ?? false,
      anonymousViewing: portfolioevent?.settings?.anonymousViewing ?? false,
      privacyLevel: portfolioevent?.settings?.privacyLevel ?? "",
    },
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const response = await axios.post(
          `${baseURL}/events/settings/${eventid}`,
          values,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
          }
        );
        toast.success("Settings saved successfully", { autoClose: 1000 });
      } catch (error) {
        console.error(error);
        toast.error("Failed to save settings", { autoClose: 1000 });
      } finally {
        setLoading(false);
      }
    },
  });



  const handleDelete = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        axios
          .delete(`${baseURL}/events/${eventid}/delete`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "ngrok-skip-browser-warning": "69420",
            },
          })
          .then((res) => {
            toast.success("Event deleted successfully", { autoClose: 1000 });

          })
          .catch((err) => {
            toast.error(err?.response?.data?.message || "Something went wrong", { autoClose: 1000 });
            console.log(err);
          });
      }
    });
  };

  return (
    <>
      <section>
        <div className="bg-white rounded p-4 mt-2 dark:bg-slate-800">
          <form onSubmit={formik.handleSubmit}>
            <div className="flex justify-between items-center mt-4 border border-1 rounded-md border-slate-200 p-2">
              <div className="flex">
                <OpacityIcon className="text-slate-700 dark:text-white" />
                <label className="text-slate-700 dark:text-white font-normal mb-1 ml-2">
                  Apply Watermark
                </label>
              </div>
              <div className="">
                <Switch
                  name="applyWatermark"
                  checked={formik.values.applyWatermark}
                  onChange={(e, checked) =>
                    formik.setFieldValue("applyWatermark", checked)
                  }
                />
              </div>
            </div>
            <div className="flex justify-between items-center mt-4 border border-1 rounded-md border-slate-200 p-2">
              <div className="flex">
                <CloudDownloadIcon className="text-slate-700 dark:text-white" />
                <label className="text-slate-700 dark:text-white font-normal mb-1 ml-2">
                  Enable Download
                </label>
              </div>
              <div className="">
                <Switch
                  name="enableDownloads"
                  checked={formik.values.enableDownloads}
                  onChange={(e, checked) =>
                    formik.setFieldValue("enableDownloads", checked)
                  }
                />
              </div>
            </div>
            <div className="flex flex-col w-full mt-4 border border-1 rounded-md border-slate-200 p-2">
              <div className="flex">
                <PeopleAltIcon className="text-slate-700 dark:text-white" />
                <label className="text-slate-700 dark:text-white font-normal mb-1 ml-2">
                  Privacy Level
                </label>
              </div>
              <select
                className="border border-slate-200 p-2 text-sm rounded mt-2 text-slate-700"
                name="privacyLevel"
                value={formik.values.privacyLevel}
                onChange={formik.handleChange}
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>
            <div className="flex justify-start">

              <button
                className="bg-blue hover:bg-blueHover text-sm  text-white rounded-md p-2 px-3 mt-8 font-normal"
                type="submit"
                disabled={loading}
              >
                {loading ? "Save Settings..." : "Save Settings"}
              </button>
            </div>
          </form>
        </div>
        {/* <div className="flex flex-col border-2 border-red-500 rounded p-4 mt-4">
          <p className="text-red-500 font-normal ">Danger Zone</p>
          <button className="btn flex items-center bg-red-500 text-white rounded font-normal p-2 mt-3 w-max hover:bg-red-600"
          type="submit"
          disabled={loading}
          onClick={() =>
            handleDelete()}
          >
            <DeleteIcon />
            {loading ? "Delete Event..." : "Delete Event"}
          </button>
          <span className="text-slate-700 mt-1">
            This action is permanent and cannot be undone.
          </span>
        </div> */}
      </section>
    </>
  );
}

export default Settings;

