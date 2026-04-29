import React, { useContext, useEffect, useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { toast } from "react-toastify";
import axios from "axios";
import { useFormik } from "formik";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate, useParams } from "react-router-dom";
import PhoneInput from "react-phone-input-2";
import { PortfolioEventContext } from "../Context/PortfolioEventContext";

const baseURL = process.env.REACT_APP_BASE_URL;

function EditEvents() {
  const { portfolioevent } = useContext(PortfolioEventContext);
  const [loading, setLoading] = useState(false);
  const [event, setEvent] = useState([]);
  const navigate = useNavigate();
  const { eventid } = useParams();

  // console.log("id",portfolioevent)
  // console.log("cat",catid)

  useEffect(() => {
    fetchSubCategory();
  }, []);

  const fetchSubCategory = async () => {
    axios
      .get(
        `${baseURL}/event-categories/sub-category?eventCategoryId=${portfolioevent?.eventCategoryId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "ngrok-skip-browser-warning": "69420",
          },
        }
      )
      .then((response) => {
        setEvent(response.data.categories);
      })
      .catch((error) => {
        console.error("Error fetching subcategories:", error);
      });
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: portfolioevent?.name || "",
      description: portfolioevent?.description || "",
      timeSlots: portfolioevent?.timeSlots?.length
        ? portfolioevent.timeSlots.map((slot) => ({
            date: slot.date?.split("T")[0] || "",
            description: slot.description || "",
            eventSubCategory: slot.eventSubCategory._id || "",
            slotTime: slot?.slotTime || "",
          }))
        : [
            {
              date: "",
              description: "",
              eventSubCategory: "",
              slotTime: "",
            },
          ],
      hostName: portfolioevent?.hostName || "",
      hostMobile: portfolioevent?.hostMobile || "",
      countryCode: portfolioevent?.countryCode || "",
      hostEmail: portfolioevent?.hostEmail || "",
    },

    onSubmit: async (values) => {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const response = await axios.put(
          `${baseURL}/events/${eventid}`,
          values,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              "ngrok-skip-browser-warning": "69420",
            },
          }
        );
        setLoading(false);
        toast.success("Event Updated successfully");
        formik.resetForm();
        setTimeout(() => {
          navigate(-1);
        }, 1000);
      } catch (error) {
        setLoading(false);
        console.error("Error updating event:", error.response || error.message);
      }
    },
  });

  const handleAddSlot = () => {
    const updated = [
      ...formik.values.timeSlots,
      {
        date: "",
        eventSubCategory: "",
        description: "",
        slotTime: "",
      },
    ];
    formik.setFieldValue("timeSlots", updated);
  };

  // const handleChange = (index, e) => {
  //   const { name, value } = e.target;
  //   const updated = [...formik.values.timeSlots];
  //   updated[index][name] = value;
  //   formik.setFieldValue("timeSlots", updated);
  // };

  const handleChange = (index, e) => {
    const { name, value } = e.target;

    // create a new array with updated slot at the right index
    const updated = formik.values.timeSlots.map((slot, i) =>
      i === index ? { ...slot, [name]: value } : slot
    );

    formik.setFieldValue("timeSlots", updated);
  };

  const handleRemoveSlot = (index) => {
    const updated = formik.values.timeSlots.filter((_, i) => i !== index);
    formik.setFieldValue("timeSlots", updated);
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <>
      <section>
        <div className="flex items-center">
          <ArrowBackIcon
            sx={{ fontSize: "30px" }}
            className="bg-slate-300 p-1 rounded text-white cursor-pointer"
            onClick={handleBack}
          />
        </div>
        <div className="border border-slate-300 rounded-md bg-white dark:bg-slate-800 p-4 shadow-md w-3/4 m-auto mt-4">
          <form onSubmit={formik.handleSubmit}>
            <div className="flex flex-col text-left">
              <h3 className="text-lg font-semibold text-slate-700 dark:text-white">
                Event Details
              </h3>
              <span className="text-sm text-slate-600 dark:text-white">
                Fill in the information for your event.
              </span>
            </div>

            <div className="flex flex-col gap-1 w-full mt-3 text-left">
              <label className="text-md font-semibold text-slate-600 dark:text-white">
                Event Name
              </label>
              <input
                type="text"
                placeholder="Event Name"
                name="name"
                value={formik.values.name}
                onChange={formik.handleChange}
                className="w-full p-2 border border-slate-300 text-sm rounded bg-transparent dark:text-white"
              />
            </div>
            <div className="flex flex-col gap-1 w-full mt-3 text-left">
              <label className="text-md font-semibold text-slate-600 dark:text-white">
                Event Description
              </label>
              <textarea
                rows={4}
                placeholder="Description"
                name="description"
                value={formik.values.description}
                onChange={formik.handleChange}
                className="w-full p-2 border border-slate-300 text-sm rounded bg-transparent dark:text-white"
              />
            </div>

            <div className="flex flex-col mt-1 border border-slate-300 rounded p-2 mt-3">
              {formik.values.timeSlots.map((slot, index) => (
                <div
                  key={index}
                  className="flex flex-col border border-slate-300 rounded p-3 mt-3"
                >
                  <div className="remove flex justify-end">
                    {formik.values.timeSlots.length > 1 && (
                      <DeleteIcon
                        className="text-slate-700 cursor-pointer dark:text-white"
                        onClick={() => handleRemoveSlot(index)}
                      />
                    )}
                  </div>

                  <div className="flex justify-between gap-2 mt-1">
                    <div className="flex flex-col gap-1 w-full text-left">
                      <label className="text-md font-semibold text-slate-600 dark:text-white">
                        Date
                      </label>
                      <input
                        type="date"
                        name="date"
                        required
                        value={slot.date}
                        onChange={(e) => handleChange(index, e)}
                        className="w-full p-2 border border-slate-300 text-sm rounded bg-transparent dark:text-white"
                      />
                    </div>
                    {/* <div className="flex flex-col gap-1 w-full text-left">
                      <label className="text-md font-semibold text-slate-600">
                        Start Time (optional)
                      </label>
                      <input
                        type="time"
                        name="startTime"
                        value={slot.startTime}
                        onChange={(e) => handleChange(index, e)}
                        className="w-full p-2 border border-slate-300 text-sm rounded"
                      />
                    </div> */}
                    {/* <div className="flex flex-col gap-1 w-full text-left">
                      <label className="text-md font-semibold text-slate-600">
                        End Time (optional)
                      </label>
                      <input
                        type="time"
                        name="endTime"
                        value={slot.endTime}
                        onChange={(e) => handleChange(index, e)}
                        className="w-full p-2 border border-slate-300 text-sm rounded"
                      />
                    </div> */}
                  </div>
                  <div className="flex flex-col gap-1 w-full mt-2 text-start">
                    <label className="text-md font-semibold text-slate-600 dark:text-white">
                      Occasion Time
                    </label>
                    <select
                      className="p-2 border border-slate-300 rounded text-sm text-slate-700 bg-transparent dark:text-white"
                      name="slotTime"
                      value={slot.slotTime}
                      onChange={(e) => handleChange(index, e)}
                    >
                      <option value="">Select Slot Time</option>
                      <option value="morning">Morning</option>
                      <option value="noon">Afternoon</option>
                      <option value="evening">Evening</option>
                    </select>
                  </div>

                  {/* <div className="flex flex-col gap-1 w-full mt-3 text-left">
                    <label className="text-md font-semibold text-slate-600">
                      Venue
                    </label>
                    <input
                      type="text"
                      placeholder="Venue"
                      name="venue"
                      value={slot.venue}
                      onChange={(e) => handleChange(index, e)}
                      className="w-full p-2 border border-slate-300 text-sm rounded"
                    />
                  </div> */}

                  <div className="flex flex-col gap-1 w-full mt-2 text-left">
                    <label className="text-md font-semibold text-slate-600 dark:text-white">
                      Occasion Type
                    </label>
                    <select
                      className="p-2 border border-slate-300 rounded text-sm text-slate-700 bg-transparent dark:text-white"
                      name="eventSubCategory"
                      required
                      value={slot.eventSubCategory}
                      onChange={(e) => handleChange(index, e)}
                    >
                      <option value="">Select Event Type</option>
                      {event &&
                        event.map((item) => (
                          <option key={item._id} value={item._id}>
                            {item.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1 w-full mt-2 text-left">
                    <label className="text-md font-semibold text-slate-600 dark:text-white">
                      Occasion Details
                    </label>
                    <textarea
                      rows={4}
                      name="description"
                      placeholder="City Club, 6 PM, Dinner served after speeches"
                      value={slot.description}
                      onChange={(e) => handleChange(index, e)}
                      className="w-full p-2 border border-slate-300 text-sm rounded bg-transparent dark:text-white"
                    />
                  </div>
                </div>
              ))}
              <div className="flex justify-end items-center mt-3">
                <button
                  type="button"
                  className="btn bg-blue text-white px-2 py-1 text-sm rounded font-semibold"
                  onClick={handleAddSlot}
                >
                  <AddIcon sx={{ fontSize: "18px" }} /> Add Sub Event
                </button>
              </div>
            </div>

            <div className="flex justify-between gap-2 mt-3">
              <div className="flex flex-col gap-1 w-full text-left">
                <label className="text-md font-semibold text-slate-600 dark:text-white">
                  Client Name
                </label>
                <input
                  type="text"
                  name="hostName"
                  placeholder="Client Name"
                  value={formik.values.hostName}
                  onChange={formik.handleChange}
                  className="w-full p-2 border border-slate-300 text-sm rounded bg-transparent dark:text-white"
                />
              </div>
              <div className="flex flex-col gap-1 w-full text-left">
                <label className="text-md font-semibold text-slate-600 dark:text-white">
                  Client Mobile
                </label>
                {/* <input
                  type="text"
                  name="hostMobile"
                  placeholder="Mobile Number"
                  value={formik.values.hostMobile}
                  // onChange={formik.handleChange}
                  onChange={(e) => {
                const value = e.target.value.replace(/\D/g, ""); // allow only digits
                if (value.length <= 10) {
                  formik.setFieldValue("hostMobile", value);
                }
              }}
                  className="w-full p-2 border border-slate-300 text-sm rounded"
                /> */}
                <div className="border border-slate-300 rounded">
                  <PhoneInput
                    country={"in"}
                    enableSearch={true}
                    countryCodeEditable={false} 
                    // PhoneInput expects full number (code + phone)
                    value={
                      (formik.values.countryCode || "").replace("+", "") +
                      (formik.values.hostMobile || "")
                    }
                    onChange={(value, country) => {
                      const cleanValue = value.replace(/\D/g, ""); // only digits

                      // extract phone number without code
                      const phoneWithoutCode = cleanValue.slice(
                        country.dialCode.length
                      );

                      formik.setFieldValue("hostMobile", phoneWithoutCode); // only phone number
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

            <div className="flex flex-col gap-1 w-full mt-3 text-left">
              <label className="text-md font-semibold text-slate-600 dark:text-white">
                Client Email (Optional)
              </label>
              <input
                type="email"
                name="hostEmail"
                placeholder="Email Address"
                value={formik.values.hostEmail}
                onChange={formik.handleChange}
                className="w-full p-2 border border-slate-300 text-sm rounded bg-transparent dark:text-white"
              />
            </div>

            <div className="flex justify-end mt-6 gap-4">
              <button
                type="button"
                onClick={handleBack}
                className="bg-bgred text-white text-lg px-2 py-1 text-sm rounded hover:bg-bgredHover"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue text-white px-2 py-1 text-sm rounded hover:bg-blueHover font-semibold"
              >
                {loading ? "Updating..." : "Update Event"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}

export default EditEvents;

