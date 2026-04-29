import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PhotographerTeamEventContext } from "../Context/PhotographerTeamEventContext";
import demo from "../../image/demo.jpg";
import axios from "axios";

const baseURL = process.env.REACT_APP_BASE_URL;
function Subevent() {
  const { photographerteamevent } = useContext(PhotographerTeamEventContext);
  const navigate = useNavigate();
  const [slot, setSlots] = useState([]);
  const { id } = useParams();

  useEffect(() => {
    fetchSubevent();
  }, []);

  const fetchSubevent = async () => {
    try {
      const response = await axios.get(
        `${baseURL}/events/event-folders/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "ngrok-skip-browser-warning": "69420",
          },
        }
      );
      // console.log("sub",response.data?.event?.timeSlots)
      setSlots(response?.data?.event?.timeSlots);
      window.electronAPI.setStore(
        "categoryslot",
        response?.data?.event?.timeSlots
      );
    } catch (error) {
      console.log(error);
      const cachedSummary = window.electronAPI.getStore("categoryslot");
      setSlots(cachedSummary);
    }
  };

  return (
    <>
      <section className="flex flex-col">
        <div className="md:mb-0 mb-3 p-4 mt-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 mt-2 gap-3">
            {slot &&
              slot.map((cat, index) => (
                <div
                  key={index}
                  className="group overflow-hidden relative rounded-xl bg-white dark:bg-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer "
                  onClick={() =>
                    navigate(`subevent/${cat.eventSubCategory.id}/sync_photos`)
                  }
                >
                  <div className="overflow-hidden relative rounded-t-xl h-40">
                    <img
                      src={
                        cat?.eventSubCategory?.url ||
                        cat?.eventSubCategory?.photoUrl ||
                        demo
                      }
                      alt=""
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute rounded-t-xl overflow-hidden inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-opacity duration-300 flex items-end p-3">
                      <span className="text-white font-medium text-sm bg-black/40  px-3 py-1 rounded-full">
                        {cat?.eventSubCategory?.photoCount || 0} Photos
                      </span>
                    </div>
                    {cat?.eventSubCategory?.photoCount === 0 && (
                      <div className="absolute bottom-2 right-2">
                        <span className="text-xs bg-red-600 text-white px-2 py-1 rounded-full">
                          No Photos
                        </span>
                      </div>
                    )}
                  </div>
                  <h2 className="text-slate-800 dark:text-white py-2 font-medium text-center text-sm sm:text-base capitalize line-clamp-2 min-h-[2rem] flex items-center justify-center">
                    {cat?.eventSubCategory?.name}
                  </h2>
                  {/* <p
                    className={`absolute top-0 right-0 rounded p-1 px-2 text-white text-center text-[10px] 
    ${cat?.eventSubCategory?.photoCount === 0 ? "bg-red-600" : "bg-green-600"}`}
                  >
                    {cat?.eventSubCategory?.photoCount} Photos
                  </p> */}
                </div>
              ))}
          </div>
        </div>
      </section>
    </>
  );
}

export default Subevent;
