import { toast } from "react-toastify";

export const startVideoUpload = async (
  folderPath,
  updateUploadVideoState,
  setVideoStatus,
) => {
  if (!folderPath) {
    toast.error("No folder selected");
    setVideoStatus?.("idle");
    return;
  }

  console.log("video helper folderpath", folderPath)

  // Force reset first
  updateUploadVideoState({
    folderPath: null,
    isUploading: false,
  });

  // Small delay so React state updates
  setTimeout(() => {
    updateUploadVideoState({
      folderPath,
      isUploading: true,
    });
    setVideoStatus("loading");
  }, 50);
};
