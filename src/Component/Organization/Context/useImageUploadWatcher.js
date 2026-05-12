import { useImageUploadWatcher as useCommonWatcher } from "../../Common/useImageUploadWatcher";
import { useContext } from "react";
import { OrganizationPortfolioContext } from "./PortfolioContext";

export const useImageUploadWatcher = ({ folderPath, updateUploadState }) => {
  const ctx = useContext(OrganizationPortfolioContext);
  return useCommonWatcher({
    folderPath,
    updateUploadState,
    setTotal: ctx.setTotal,
    setUploaded: ctx.setUploaded,
    setDuplicate: ctx.setDuplicate,
    setFailed: undefined,
    setHasStarted: ctx.setHasStarted,
    setStatus: ctx.setStatus,
    eventId: ctx.eventId,
    subeventId: ctx.subId,
    eventsid: ctx.eventsid,
    subeventsid: ctx.subeventsid,
  });
};
