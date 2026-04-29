import { createContext, useRef, useState } from "react";

export const UploadContext = createContext();

const UploadContextProvider = ({ children }) => {
  const lastUploadedRef = useRef(0);
  const lastTimeRef = useRef(Date.now());
  const [uploadState, setUploadState] = useState({
    folderPath: null,
    syncStatus: "idle",
    totalImages: 0,
    uploadedImages: 0,
    duplicateImages: 0,
    failedImages: 0,
    isUploading: false,
  });
  const [uplaoded, setUploaded] = useState(0);
  const [total, setTotal] = useState(0);
  const [duplicate, setDuplicate] = useState(0);
  const [failed, setFailed] = useState(0);
    const [error, setError] = useState("");
  const [savedSelectedOption, setSavedSelectedOption] = useState(null);
  const [cancel, setCancel] = useState(false);
  const [complete, setComplete] = useState(false);
  const [eventsid, setEventsid] = useState();
  const [subeventsid, setSubeventsid] = useState();
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

  const getUploadSpeed = (currentUploaded) => {
    const now = Date.now();
    const diffImages = currentUploaded - lastUploadedRef.current;
    const diffTime = (now - lastTimeRef.current) / 1000;

    lastUploadedRef.current = currentUploaded;
    lastTimeRef.current = now;

    if (diffTime <= 0) return 0;
    return (diffImages / diffTime).toFixed(2);
  };

  return (
    <UploadContext.Provider
     value={{
        uploadState,
        updateUploadState,
        uplaoded,
        setUploaded,
        total,
        setTotal,
        duplicate,
        setDuplicate,
        failed,
        setFailed,
        error,
        setError,       
        cancel,
        setCancel,
        complete,
        setComplete,       
        savedSelectedOption,
        setSavedSelectedOption,       
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
        getUploadSpeed,
      }}
    >
      {children}
    </UploadContext.Provider>
  );
};

export default UploadContextProvider;
