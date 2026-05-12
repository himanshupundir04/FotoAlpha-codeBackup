import React, { createContext, useState } from "react";

export const OrganizationPortfolioContext = createContext();

export const OrganizationPortfolioProvider = ({ children }) => {
  const [uploadState, setUploadState] = useState({
    folderPath: null,
    syncStatus: "idle", // idle | running | completed
    totalImages: 0,
    uploadedImages: 0,
    duplicateImages: 0,
    isUploading: false,
  });
  const [uplaoded, setUploaded] = useState(0);
  const [total, setTotal] = useState(0);
  const [duplicate, setDuplicate] = useState(0);
  const [savedStep, setSavedStep] = useState(0);
  const [savedSelectedOption, setSavedSelectedOption] = useState(null);
  const [start, setStart] = useState(true);
  const [back, setBack] = useState(true);
  const [cancel, setCancel] = useState(false);
  const [complete, setComplete] = useState(false);
  const [subId, setSubId] = useState("");
  const [eventId, setEventId] = useState("");
  const [eventname, setEventname] = useState();
  const [categoryname, setCategoryname] = useState();
  const [eventsid, setEventsid] = useState();
  const [subeventsid, setSubeventsid] = useState();
  // const [syncStatus, setSyncStatus] = useState("idle");
  const [status, setStatus] = useState("idle");
  const [selectedfolder, setSelectfolder] = useState(null);
  const [uploadfolder, setUploadfolder] = useState(null);
  const [hasStarted, setHasStarted] = useState(false);

  const updateUploadState = (updates) => {
    setUploadState((prev) => {
      return typeof updates === "function"
        ? updates(prev)
        : { ...prev, ...updates };
    });
  };

  return (
    <OrganizationPortfolioContext.Provider
      value={{
        uploadState,
        updateUploadState,
        uplaoded,
        setUploaded,
        total,
        setTotal,
        duplicate,
        setDuplicate,
        start,
        setStart,
        back,
        setBack,
        cancel,
        setCancel,
        complete,
        setComplete,
        savedStep,
        setSavedStep,
        savedSelectedOption,
        setSavedSelectedOption,
        subId,
        setSubId,
        eventId,
        setEventId,
        eventname,
        setEventname,
        categoryname,
        setCategoryname,
        eventsid,
        setEventsid,
        subeventsid,
        setSubeventsid,
        status,
        setStatus,
        selectedfolder,
        setSelectfolder,
        uploadfolder,
        setUploadfolder,
        hasStarted,
        setHasStarted,
      }}
    >
      {children}
    </OrganizationPortfolioContext.Provider>
  );
};
