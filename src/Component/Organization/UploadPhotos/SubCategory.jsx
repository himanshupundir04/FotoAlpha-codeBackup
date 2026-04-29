import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import Select from "react-select";
import { OrganizationPortfolioContext } from "../Context/PortfolioContext";

const baseURL = process.env.REACT_APP_BASE_URL;

function SubCategory() {
  const [event, setEvent] = useState([]);
  const { eventId, setSubId, subId, setCategoryname } = useContext(OrganizationPortfolioContext);

  // console.log(eventId.value);
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${baseURL}/events/${eventId.value}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "ngrok-skip-browser-warning": "69420",
        },
      });
      setEvent(response.data.event.timeSlots);
      window.electronAPI.setStore(
        "uplaodSubCate",
        response.data.event.timeSlots
      );
    } catch (error) {
      const cachedSummary = await window.electronAPI.getStore("uplaodSubCate");
      if (cachedSummary) {
        setEvent(cachedSummary);
      }
    }
  };

  const options = event.map((cat) => ({
    label: cat.eventSubCategory.name,
    value: cat.eventSubCategory.id,
  }));

  return (
    <>
      <div className="my-5 text-start">
        <label className="text-slate-700 text-start font-semibold dark:text-white">
          Choose Category
        </label>
        <Select
          options={options}
          // value={subId}
          // onChange={setSubId}
          value={options.find((opt) => opt.value === subId)}
          onChange={(selectedOption) => {
            setSubId(selectedOption);
            setCategoryname(selectedOption.label);
          }}
          placeholder="Choose Sub Category"
          className="w-full mt-1 capitalize"
        />
      </div>
    </>
  );
}

export default SubCategory;
