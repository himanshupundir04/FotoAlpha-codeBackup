import { Box, Modal } from "@mui/material";
import { useFormik } from "formik";
import React, { useContext, useEffect, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import axios from "axios";
import { PortfolioEventContext } from "../Context/PortfolioEventContext";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: {
    xs: "90%",
    md: 500,
  },
};

const baseURL = process.env.REACT_APP_BASE_URL;
function AddSubEvent({ open, handleClose, fetchSubevent }) {
  const [loading, setLoading] = useState(false);
  const [subcategory, setSubcategory] = useState([]);
  const { portfolioevent } = useContext(PortfolioEventContext);

  // console.log(portfolioevent);

  useEffect(() => {
    fetchSubCategory();
  }, [portfolioevent]);

  const fetchSubCategory = async () => {
    try {
      const response = await axios.get(
        `${baseURL}/event-categories/sub-category?eventCategoryId=${portfolioevent?.eventCategoryId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "ngrok-skip-browser-warning": "69420",
          },
        }
      );
      setSubcategory(response.data.categories);
    } catch (error) {
      console.error(error);
    }
  };

  const formik = useFormik({
    initialValues: {
      timeSlots: [
        {
          date: "",
          eventSubCategory: "",
          description: "",
          slotTime: "",
        },
      ],
    },
    onSubmit: async (values) => {
      try {
        setLoading(true);
        const mergedValues = {
          ...portfolioevent,
          timeSlots: [
            ...(portfolioevent?.timeSlots || []),
            ...values.timeSlots,
          ],
        };
        await axios.put(
          `${baseURL}/events/${portfolioevent?._id}`,
          mergedValues,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
              "ngrok-skip-browser-warning": "69420",
            },
          }
        );
        setLoading(false);
        handleClose();
        fetchSubevent();
      } catch (error) {
        setLoading(false);
        console.error(error);
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
            className="bg-white p-4 rounded-md dark:bg-slate-800 dark:text-white border-none"
            onSubmit={formik.handleSubmit}
          >
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-slate-700 dark:text-white">
                Add Sub-Event
              </h2>
              <CloseIcon
                className="text-slate-700 cursor-pointer"
                onClick={handleClose}
              />
            </div>
            <div className="flex flex-col">
              <div className="flex flex-col md:flex-row justify-between gap-2 mt-1">
                <div className="flex flex-col gap-1 w-full">
                  <label className="text-md font-normal text-slate-700 dark:text-white">
                    Date
                  </label>
                  <input
                    type="date"
                    name="timeSlots[0].date"
                    value={formik.values.timeSlots[0].date}
                    onChange={formik.handleChange}
                    className="w-full p-2 border border-slate-300 text-sm rounded bg-transparent dark:text-white"
                  />
                </div>
                {/* <div className="flex flex-col gap-1 w-full">
                          <label className="text-md font-normal text-slate-700 dark:text-white">
                            Start Time (optional)
                          </label>
                          <input
                            type="time"
                            name="startTime"
                            value={slot.startTime}
                            onChange={(e) => handleChange(index, e)}
                            className="w-full p-2 border border-slate-300 text-sm rounded bg-transparent dark:text-white "
                          />
                        </div>
                        <div className="flex flex-col gap-1 w-full">
                          <label className="text-md font-normal text-slate-700 dark:text-white">
                            End Time (optional)
                          </label>
                          <input
                            type="time"
                            name="endTime"
                            value={slot.endTime}
                            onChange={(e) => handleChange(index, e)}
                            className="w-full p-2 border border-slate-300 text-sm rounded bg-transparent dark:text-white"
                          />
                        </div> */}
              </div>
              <div className="flex flex-col gap-1 w-full mt-2">
                <label className="text-md font-normal text-slate-700 dark:text-slate-700 dark:text-white">
                  Slot Time
                </label>
                <select
                  className="p-2 border border-slate-300 text-sm rounded text-slate-700 bg-transparent dark:text-white"
                  name="timeSlots[0].slotTime"
                  value={formik.values.timeSlots[0].slotTime}
                  onChange={formik.handleChange}
                >
                  <option value="">Select Slot Time</option>
                  <option value="morning">Morning</option>
                  <option value="noon">Afternoon</option>
                  <option value="evening">Evening</option>
                </select>
              </div>
              {/* <div className="flex flex-col gap-1 w-full mt-3">
                        <label className="text-md font-normal text-slate-700 dark:text-white">
                          Venue
                        </label>
                        <input
                          type="text"
                          placeholder="Venue"
                          name="venue"
                          value={slot.venue}
                          onChange={(e) => handleChange(index, e)}
                          className="w-full p-2 border border-slate-300 text-sm rounded bg-transparent dark:text-white"
                        />
                      </div> */}

              <div className="flex flex-col gap-1 w-full mt-2">
                <label className="text-md font-normal text-slate-700 dark:text-white">
                  Occasion Type
                </label>
                <select
                  className="p-2 border border-slate-300 text-sm rounded text-slate-700 bg-transparent dark:text-white"
                  name="timeSlots[0].eventSubCategory"
                  value={formik.values.timeSlots[0].eventSubCategory}
                  onChange={formik.handleChange}
                >
                  <option value="">Select Subcategory</option>
                  {subcategory &&
                    subcategory.map((item) => (
                      <option key={item._id} value={item._id}>
                        {item.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex flex-col gap-1 w-full mt-2">
                <label className="text-md font-normal text-slate-700 dark:text-white">
                  Occasion Details
                </label>
                <textarea
                  name="timeSlots[0].description"
                  placeholder="City Club, 6 PM, Dinner served after speeches"
                  value={formik.values.timeSlots[0].description}
                  onChange={formik.handleChange}
                  className="w-full p-2 border border-slate-300 text-sm rounded bg-transparent dark:text-white"
                />
              </div>
            </div>
            <div className="flex justify-end mt-6 gap-4">
              <button
                className="bg-red-600 text-white font-normal text-sm px-4 py-2 rounded hover:bg-red-700"
                onClick={handleClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue text-white font-normal text-sm px-4 py-2 rounded hover:bg-blueHover"
                disabled={loading}
              >
                {loading ? "Submit..." : "Submit"}
              </button>
            </div>
          </form>
        </Box>
      </Modal>
    </>
  );
}

export default AddSubEvent;
