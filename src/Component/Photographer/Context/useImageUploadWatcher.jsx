import { useImageUploadWatcher as useCommonWatcher } from "../../Common/useImageUploadWatcher";
import { useContext } from "react";
import { PortfolioContext } from "./PortfolioContext";

export const useImageUploadWatcher = ({ folderPath }) => {
  const ctx = useContext(PortfolioContext);
  return useCommonWatcher({
    folderPath,
    setTotal: ctx.setTotal,
    setUploaded: ctx.setUploaded,
    setDuplicate: ctx.setDuplicate,
    setFailed: ctx.setFailed,
    setHasStarted: ctx.setHasStarted,
    setStatus: ctx.setStatus,
    eventId: ctx.eventId,
    subeventId: ctx.subId,
    eventsid: ctx.eventsid,
    subeventsid: ctx.subeventsid,
  });
};
