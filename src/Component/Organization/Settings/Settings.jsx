import React, { useEffect, useState } from "react";
import Profile from "./Profile";
import Account from "./Account";
import Billing from "./Billing";
import axios from "axios";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import BoltIcon from "@mui/icons-material/Bolt";
import { useNavigate } from "react-router-dom";
import { CircularProgress } from "@mui/material";
import UsageStatistics from "./UsageStatistics";

const baseURL = process.env.REACT_APP_BASE_URL;

function Settings() {
    const tab = localStorage.getItem("tab");
  const [activeTab, setActiveTab] = useState(tab || "profile");
  const [profile, setProfile] = useState({});
  const [permission, setPermission] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paydata, setPayData] = useState([]);
  const navigate = useNavigate();
  const tabs = [
    { id: "profile", label: "Profile" },
    { id: "account", label: "Logo" },
    { id: "billing", label: "Billing" },
     { id: "usage", label: "Usage Statistics" },
  ];


  const users = JSON.parse(localStorage.getItem("users")) || [];
  const currentUser = users.find((u) => u.isCurrent);
  const id = currentUser?._id;

  useEffect(() => {
    fetchProfile();
    fetchPayment();
  }, []);

  
  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseURL}/users/profile`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "ngrok-skip-browser-warning": "69420",
        },
      });

      setLoading(false);
      setProfile(response?.data);
      localStorage.setItem("avatar",response?.data?.avatarUrl)
      // console.log(response.data);
      window.electronAPI.setStore("setting", response?.data);
    } catch (error) {
      setLoading(false);
      const cachedSummary = await window.electronAPI.getStore("settings");
      if (cachedSummary) {
        setProfile(cachedSummary);
        // console.log(cachedSummary);
      }
      console.error("Error fetching:", error?.response?.data?.message);
 const errorMessage = error?.response?.data?.message || "";
      const statusCode = error?.response?.status;

      if (
        statusCode === 403 ||
        errorMessage ===
          "Your trial period has ended. Please upgrade to continue." ||
        errorMessage ===
          "Your trial period of 14 days has ended. Please upgrade to continue."
      ) {
        setPermission(true);
      }
    }
  };

  const fetchPayment = async () => {
    setLoading(true);
    try {
      const respons = await axios.get(`${baseURL}/transactions/user/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setPayData(respons.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return <Profile profile={profile} fetchProfile={fetchProfile} />;
      case "account":
        return <Account />;
      case "billing":
        return <Billing paydata={paydata} />;
         case "usage":
        return <UsageStatistics />;
      default:
        return null;
    }
  };
  return (
    <>
      {permission ? ( // <-- check permission first
        <div className="bg-slate-100 p-5 rounded text-center mt-5">
          <ErrorOutlineIcon
            sx={{ fontSize: "50px" }}
            className="text-red-600"
          />
          <h1 className="text-slate-700 font-normal text-2xl">
            You do not have access to this page
          </h1>
          <p className="text-slate-700 font-normal text-sm">
            We're sorry, your plan does not have permission or upgrade to access
            this page
          </p>
          <button
            className="bg-blue rounded px-5 py-2 mt-4 text-white font-normal hover:bg-blueHoverHover"
            onClick={() => navigate("/organization/upgrade_plan")}
          >
            <BoltIcon /> Upgrade Plan
          </button>
        </div>
      ) : loading ? (
        <div className="flex justify-center mt-5">
          <CircularProgress />
        </div>
      ) : (
        <>
          <div className="mb-1">
            <ul className="flex flex-wrap text-sm font-normal text-center">
              {tabs.map((tab) => (
                <li key={tab.id} className="me-2">
                  <button
                    className={`inline-block p-4 pb-2 border-b-2 rounded-t-lg text-black dark:text-slate-200 font-normal text-sm ${
                      activeTab === tab.id
                        ? "text-blue border-blue"
                        : "hover:text-slate-700 hover:border-slate-300 dark:hover:text-slate-300 border-transparent"
                    }`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="md:p-4 mt-5 md:mt-0">{renderContent()}</div>
        </>
      )}
    </>
  );
}

export default Settings;

