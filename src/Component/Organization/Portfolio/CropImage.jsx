// src/utils/cropImage.js
export default function getCroppedImg(imageSrc, pixelCrop, cropType = "cover") {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // Force canvas size depending on type
      if (cropType === "profileImage") {
        canvas.width = 400;
        canvas.height = 400;
      } else {
        canvas.width = 1600; // Cover
        canvas.height = 900;
      }

      // Scale based on image natural size
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
        const file = new File([blob], "cropped.jpg", { type: "image/jpeg" });
        resolve(file);
      }, "image/jpeg");
    };
    image.onerror = (error) => reject(error);
  });
}
