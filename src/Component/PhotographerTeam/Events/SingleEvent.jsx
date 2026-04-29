import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Oveview from "./Overview";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import axios from "axios";
import { PhotographerTeamEventContext } from "../Context/PhotographerTeamEventContext";
import Subevent from "./Subevent";

const baseURL = process.env.REACT_APP_BASE_URL;

function SingleEvent() {
  const [activeTab, setActiveTab] = useState("photos");
  const navigate = useNavigate();
  const { id } = useParams();
  const { setPhotographerTeamEvent } = useContext(PhotographerTeamEventContext);
  const [event, setEvent] = useState({});


  useEffect(() => {
    fetchEvents();
  }, []);

  const tabs = [
    { id: "photos", label: "Photos" },   
    { id: "overview", label: "Overview" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <Oveview />;
      case "photos":
        return <Subevent/>;     
      default:
        return null;
    }
  };

  const fetchEvents = async () => {
    axios
      .get(`${baseURL}/photographer-team/events/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "ngrok-skip-browser-warning": "69420",
        },
      })
      .then((response) => {
        setPhotographerTeamEvent(response.data.event);
        setEvent(response.data.event);
        // console.log(response.data.event);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <section>
      <div className="flex justify-between">
        <div className="flex items-center">
          <ArrowBackIcon
            sx={{ fontSize: "30px" }}
            className="bg-slate-300 p-1 rounded text-white cursor-pointer"
            onClick={handleBack}
          />
          <h1 className="text-start text-3xl font-bold dark:text-white text-black ml-3 capitalize">
            {event?.name}
          </h1>
          
        </div>
      </div>
      <div className="mt-4 mb-1">
        <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
          {tabs.map((tab) => (
            <li key={tab.id} className="me-2">
              <button
                className={`inline-block p-4 pb-2 border-b-2 rounded-t-lg text-black dark:text-slate-200 font-bold text-sm ${
                  activeTab === tab.id
                    ? "text-blue border-blue"
                    : "hover:text-slate-600 hover:border-slate-300 dark:hover:text-slate-300 border-transparent"
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="p-4">{renderContent()}</div>
    </section>
  );
}

export default SingleEvent;
