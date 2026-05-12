import { createContext, useState } from "react";

export const UploadVideoContext = createContext(null);

export const UploadVideoProvider = ({ children }) => {
  const [uploadVideoState, setUploadVideoState] = useState({
    folderPath: null,
    isUploading: false,
  });

  
  const [videos, setVideos] = useState([]);
  const [eventid, setEventid] = useState();
  const [subeventid, setSubeventid] = useState();
  const [stepeventid, setStepEventid] = useState();
  const [stepsubeventid, setStepSubeventid] = useState();
  const [videoStatus, setVideoStatus] = useState("idle");
  const [videoTotal, setVideoTotal] = useState(0);
  const [videoDuplicate, setVideoDuplicate] = useState(0);
  const [videoFailed, setVideoFailed] = useState(0);
  const [videoUploaded, setVideoUploaded] = useState(0);

  const updateUploadVideoState = (payload) => {
    setUploadVideoState((prev) => ({ ...prev, ...payload }));
  };

  return (
    <UploadVideoContext.Provider
      value={{
        uploadVideoState,
        updateUploadVideoState, 
        setUploadVideoState,
        eventid,
        setEventid,
        subeventid,
        setSubeventid,     
        stepeventid,
        setStepEventid,
        stepsubeventid,
        setStepSubeventid,     
        videos,
        setVideos,
        videoStatus,
        setVideoStatus,
        videoTotal,
        setVideoTotal,
        videoDuplicate,
        setVideoDuplicate,
        videoFailed,
        setVideoFailed,
        videoUploaded,
        setVideoUploaded,
      }}
    >
      {children}
    </UploadVideoContext.Provider>
  );
};
