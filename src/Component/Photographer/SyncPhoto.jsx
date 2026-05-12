import React, { useContext } from "react";
import { PortfolioContext } from "./Context/PortfolioContext";
import SyncPhotoCore from "../Common/SyncPhotoCore";

function SyncPhoto() {
  const ctx = useContext(PortfolioContext);

  return (
    <SyncPhotoCore
      eventId={ctx.eventId}
      subeventId={ctx.subId}
      folderPath={ctx.uploadState?.folderPath}
      setTotalImages={ctx.setTotal}
      setUploadedImages={ctx.setUploaded}
      setDuplicateImages={ctx.setDuplicate}
      setSyncStatus={ctx.setStatus}
    />
  );
}

export default SyncPhoto;
