// src/components/ImageCropper.js
import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import getCroppedImg from "./CropImage";
import { Dialog } from "@mui/material";

function ImageCropper({ open, onClose, imageSrc, aspect, onCropComplete }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const handleCropComplete = useCallback((_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // const handleSave = async () => {
  //   try {
  //     const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
  //     onCropComplete(croppedImage);
  //     onClose();
  //   } catch (e) {
  //     console.error(e);
  //   }
  // };
   const handleSave = async () => {
  try {
    const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, aspect === 1 ? "profileImage" : "cover");
    onCropComplete(croppedImage);
    onClose();
  } catch (e) {
    console.error(e);
  }
};

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <div className="relative aspect-[3.5/1] bg-black w-full">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          objectFit="cover"
          cropShape={aspect === 1 ? "round" : "rect"}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={handleCropComplete}
        />
      </div>
      <div className="flex justify-end gap-2 p-3">
        <button onClick={onClose} className="bg-gray-300 px-4 py-2 rounded">
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="bg-blue px-4 py-2 text-white rounded"
        >
          Crop & Save
        </button>
      </div>
    </Dialog>
  );
}

export default ImageCropper;
