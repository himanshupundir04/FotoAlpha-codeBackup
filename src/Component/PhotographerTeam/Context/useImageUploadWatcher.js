import { useImageUploadWatcher as useCommonWatcher } from "../../Common/useImageUploadWatcher";
import { useContext } from "react";
import { UploadContext } from "./UploadContext";

export const useImageUploadWatcher = ({ folderPath }) => {
  const ctx = useContext(UploadContext);
  return useCommonWatcher({
    folderPath,
    setTotal: ctx.setTotal,
    setUploaded: ctx.setUploaded,
    setDuplicate: ctx.setDuplicate,
    setFailed: ctx.setFailed,
    setHasStarted: ctx.setHasStarted,
    setStatus: ctx.setStatus,
    eventId: ctx.eventsid,
    subeventId: ctx.subeventsid,
    eventsid: ctx.eventsid,
    subeventsid: ctx.subeventsid,
  });
};
