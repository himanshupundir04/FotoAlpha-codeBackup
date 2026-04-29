import { toast } from "react-toastify";

export const startUpload = async (folderPath, updateUploadState, setStatus) => {
  if (!folderPath) {
    toast.error("No folder selected");
    setStatus?.("idle");
    return;
  }

  // Force reset first
  updateUploadState({
    folderPath: null,
    isUploading: false,
  });

  // Small delay so React state updates
  setTimeout(() => {
    updateUploadState({
      folderPath,
      isUploading: true,
    });
    setStatus("loading");
  }, 50);
};
