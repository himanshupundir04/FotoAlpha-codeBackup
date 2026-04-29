import React, { useState } from "react";
import Profile from "./Profile";
import Account from "./Account";

function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const tabs = [
    { id: "profile", label: "Profile" },
    // { id: "account", label: "Account" },    
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return <Profile />;
      case "account":
        return <Account />;      
      default:
        return null;
    }
  };
  return (
    <>
      <div className=" mb-1">
        <ul className="flex flex-wrap text-sm font-medium text-center">
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
    </>
  );
}

export default Settings;
