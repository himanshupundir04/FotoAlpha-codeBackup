// src/utils/cropImage.js
const PROFILE_OUTPUT = { width: 800, height: 800 };
const COVER_OUTPUT = { width: 2100, height: 600 }; // 3.5:1
const MOBILE_COVER_OUTPUT = { width: 800, height: 1000 };

export default function getCroppedImg(imageSrc, pixelCrop, cropType = "cover") {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      let outputSize;

      if (cropType === "profileImage") {
        outputSize = PROFILE_OUTPUT;
      } else if (cropType === "coverMobile") {
        outputSize = MOBILE_COVER_OUTPUT; // ✅ FIX
      } else {
        outputSize = COVER_OUTPUT;
      }

      canvas.width = outputSize.width;
      canvas.height = outputSize.height;

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      ctx.drawImage(
        image,
        pixelCrop.x * scaleX,
        pixelCrop.y * scaleY,
        pixelCrop.width * scaleX,
        pixelCrop.height * scaleY,
        0,
        0,
        canvas.width,
        canvas.height
      );

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"));
          return;
        }
        let outputFileName = "cover.jpg";

          if (cropType === "profileImage") {
            outputFileName = "profile.jpg";
          } else if (cropType === "coverMobile") {
            outputFileName = "mobile_cover.jpg"; // ✅ optional
          }
        const file = new File([blob], outputFileName, { type: "image/jpeg" });
        resolve(file);
      }, "image/jpeg");
    };
    image.onerror = (error) => reject(error);
  });
}
