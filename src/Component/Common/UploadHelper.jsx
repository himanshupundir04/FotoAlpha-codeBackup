import { toast } from "react-toastify";

export const startUpload = async (folderPath, updateUploadState, setStatus) => {
  if (!folderPath) {
    toast.error("No folder selected");
    setStatus?.("idle");
    return;
  }

  updateUploadState({
    folderPath: null,
    isUploading: false,
  });

  setTimeout(() => {
    updateUploadState({
      folderPath,
      isUploading: true,
    });
    setStatus?.("loading");
  }, 50);
};
