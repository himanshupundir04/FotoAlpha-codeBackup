// src/components/ImageCropper.js
import React, { useState, useCallback, useEffect } from "react";
import Cropper from "react-easy-crop";
import getCroppedImg from "./CropImage";
import { Dialog } from "@mui/material";

function ImageCropper({
  open,
  onClose,
  imageSrc,
  aspect,
  cropType,
  onCropComplete,
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const isProfileCrop = cropType === "profileImage";
  const isMobileCrop = cropType === "coverMobile";
  const maxZoom = isProfileCrop ? 4 : 3;
  const profileCropBoxStyle = isProfileCrop
    ? {
        width: "min(100%, 460px)",
        height: "min(70vh, 460px)",
        margin: "0 auto",
      }
    : undefined;
  const dialogPaperSx = isProfileCrop
    ? { width: { xs: "92vw", sm: "520px" }, maxWidth: "520px" }
    : isMobileCrop
      ? { width: { xs: "92vw", sm: "400px" }, maxWidth: "400px" } // 📱 mobile feel
      : { width: { xs: "96vw", md: "1200px" }, maxWidth: "1200px" };

  useEffect(() => {
    if (!open) return;

    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  }, [open, imageSrc, aspect]);

  const handleCropComplete = useCallback((_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      const croppedImage = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        cropType,
      );
      onCropComplete(croppedImage);
      onClose();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullWidth
      PaperProps={{
        sx: dialogPaperSx,
      }}
    >
      <div
        className={`relative bg-black ${
          isProfileCrop ? "" : "w-full aspect-[3.5/1]"
        }`}
        style={
          isProfileCrop
            ? profileCropBoxStyle
            : isMobileCrop
              ? { width: "100%", height: "80vh", maxHeight: "700px" } // ✅ MOBILE HEIGHT
              : { width: "100%", aspectRatio: "3.5 / 1" }
        }
      >
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          objectFit={isProfileCrop ? "cover" : "horizontal-cover"}
          cropShape={isProfileCrop ? "round" : "rect"}
          zoomWithScroll
          minZoom={1}
          maxZoom={maxZoom}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={handleCropComplete}
        />
      </div>
      <div className="px-4 pt-3">
        <p className="text-sm text-slate-600">
          Drag to reposition and use zoom to crop.
        </p>
        <div className="mt-2 flex items-center gap-3">
          <span className="text-xs text-slate-500">Zoom</span>
          <input
            type="range"
            min={1}
            max={maxZoom}
            step={0.1}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            className="w-full"
          />
          <span className="min-w-[32px] text-right text-xs text-slate-500">
            {zoom.toFixed(1)}x
          </span>
        </div>
      </div>
      <div className="flex justify-end gap-2 p-3 pt-2">
        <button
          onClick={onClose}
          type="button"
          className="bg-gray-300 px-4 py-2 rounded"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          type="button"
          disabled={!croppedAreaPixels}
          className="bg-blue px-4 py-2 text-white rounded"
        >
          Save
        </button>
      </div>
    </Dialog>
  );
}

export default ImageCropper;
