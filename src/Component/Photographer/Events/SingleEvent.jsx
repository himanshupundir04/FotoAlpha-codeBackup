import React, { useContext, useEffect, useState } from "react";
import Photos from "./Photos";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Oveview from "./Overview";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Settings from "./Settings";
import Guestassignedteam from "./Guest&assignedteam";
import axios from "axios";
import { PortfolioEventContext } from "../Context/PortfolioEventContext";
import Analysis from "./Analysis";
import PaymentManagement from "./PaymentManagement";
import InvitationCard from "./InvitationCard";
import PhotosRequest from "./PhotosRequest";

const baseURL = process.env.REACT_APP_BASE_URL;

function SingleEvent() {
  const [activeTab, setActiveTab] = useState("photos");
  const navigate = useNavigate();
  const { eventid } = useParams();
  const { setPortfolioEvent } = useContext(PortfolioEventContext);
  const [event, setEvent] = useState({});
    const location = useLocation();

  useEffect(() => {
    fetchEvents();
  }, []);

  const tabs = [
    { id: "photos", label: "Photos" },
    { id: "photosRequest", label: "Photo Request" },
    { id: "overview", label: "Overview" },
    { id: "settings", label: "Settings" },
    { id: "guest&assigndteam", label: "Guest & Assigned Team" },
    { id: "payment", label: "Payment Overview" },
    { id: "analysis", label: "Analysis" },
    { id: "InvitationCard", label: "InvitationCard" },
  ];

  useEffect(() => {
    const requestedTab = location.state?.activeTab;
    const tabExists = tabs.some((tab) => tab.id === requestedTab);

    if (tabExists) {
      setActiveTab(requestedTab);
    }
  }, [location.state]);

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <Oveview />;
      case "photos":
        return <Photos />;
         case "photosRequest":
        return <PhotosRequest/>;
      case "settings":
        return <Settings />;
      case "guest&assigndteam":
        return <Guestassignedteam  initialView={location.state?.guestAssignedTeamView}/>;
      case "payment":
        return <PaymentManagement fetchEvents={fetchEvents}/>;
      case "analysis":
        return <Analysis />;
         case "InvitationCard":
        return <InvitationCard/>;
      default:
        return null;
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${baseURL}/events/${eventid}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "ngrok-skip-browser-warning": "69420",
        },
      });

      setPortfolioEvent(response.data.event);
      setEvent(response.data.event);
      // console.log(response.data.event);
       window.electronAPI.setStore("singleEvent", response.data.event);
    } catch (error) {
      const cachedSummary = await window.electronAPI.getStore("singleEvent");
      if (cachedSummary) {
        setEvent(cachedSummary);
        setPortfolioEvent(cachedSummary);
        // console.log(cachedSummary);
      }
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <>     
      <section>
        <div className="flex justify-between">
          <div className="flex items-center">
            <ArrowBackIcon
              sx={{ fontSize: "30px" }}
              className="bg-slate-300 p-1 rounded text-white cursor-pointer"
              onClick={handleBack}
            />
            <h1 className="text-start text-2xl test-slate-700 font-bold dark:text-white text-black ml-3 capitalize">
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
    </>
  );
}

export default SingleEvent;
