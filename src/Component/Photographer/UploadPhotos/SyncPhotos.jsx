// import React, { useState, useEffect, useContext } from "react";
// import { toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import axios from "axios";
// import DriveFolderUploadIcon from "@mui/icons-material/DriveFolderUpload";
// import { PortfolioEventContext } from "../Context/PortfolioEventContext";
// import Swal from "sweetalert2";

// const baseURL = process.env.REACT_APP_BASE_URL;

// function SyncPhotos({ selectedOption }) {
//   const [folderPath, setFolderPath] = useState(null);
//   const [syncStatus, setSyncStatus] = useState("idle");
//   const { subId } = useContext(PortfolioEventContext);
//   const [totalImages, setTotalImages] = useState(0);
//   const [uploadedImages, setUploadedImages] = useState(0);
//   const [duplicateImages, setDuplicateImages] = useState(0);
//   const {
//     setBack,
//     setCancel,
//     setComplete,
//     setUploaded,
//     setTotal,
//     setDuplicate,
//   } = useContext(PortfolioEventContext);
//   const [start, setStart] = useState(true);

//   const eventId = selectedOption.value;
//   const subEventId = subId;
//   // console.log(eventId,"ebet")

// // console.log("sync phototoooooooo")
//   const handleSelectFolder = async () => {
//     try {
//       const selected = await window.electronAPI.selectFolder();
//       if (selected) {
//         setFolderPath(selected);
//         setSyncStatus("loading...");
//         setBack(false);
//         setStart(false);
//       }
//     } catch (error) {
//       console.log(error);
//       toast.error("Failed to select folder");
//     }
//   };

//   useEffect(() => {
//     if (!folderPath) return;

//     setUploadedImages(0);
//     setTotalImages(0);

//     window.electronAPI.onTotalImageCount((count) => {
//       setTotalImages(count);
//     });

//     const handleCompressedChunk = async (chunk) => {
//       let sentImages = await window.electronAPI.getSentImages();
//       if (!Array.isArray(sentImages)) sentImages = [];

//       const uploadPromises = chunk.map(async (file) => {
//         const isAlreadySent = sentImages.some(
//           (img) => img.name === file.name && img.hash === file.hash
//         );
//         if (isAlreadySent) {
//           await window.electronAPI.deleteFile(file.path);
//           await window.electronAPI.removeSentImageByHash(file.hash);
//           return;
//         }
//         const filesize = file.size;
//         console.log("chunk", file.size)

//         await fetchFiles(file.name, file.type, file.path, file.hash, filesize);
//         // setUploadedImages((prev) => prev + 1);
//       });

//       await Promise.all(uploadPromises);
//     };

//     window.electronAPI.onCompressedFileReady(handleCompressedChunk);

//     const handleNewImage = async (file) => {
//       const filesize = file.size;

//       await fetchFiles(file.name, file.type, file.path, file.hash, filesize);
//       setTotalImages((prev) => prev + 1);
//     };

//     window.electronAPI.onNewImageDetected(handleNewImage);
//     const startCompressionAndWatch = async () => {
//       try {
//         await window.electronAPI.watchFolder(folderPath);
//         await window.electronAPI.compressAndReadFolder(folderPath);
//       } catch (error) {
//         console.error("Error during compression or watching:", error);
//         toast.error("Error during compression.");
//       }
//     };

//     startCompressionAndWatch();
//     return () => {};
//   }, [folderPath]);

//   const fetchFiles = async (filename, filetype, filepath, filehash, size) => {
//     console.log("fetchfile", size)
//     try {
//       const response = await axios.get(
//         `${baseURL}/photos/getSignedUrl?fileName=${eventId}/${subEventId}/${filename}&fileType=${filetype}&hash=${filehash}&event=${eventId}`,
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token")}`,
//             "ngrok-skip-browser-warning": "69420",
//           },
//           validateStatus: () => true,
//         }
//       );

//       if (response.status === 409) {
//         await window.electronAPI.deleteFile(filepath);
//         setDuplicateImages((prev) => prev + 1);
//         return;
//       }

//       const { signedUrl } = response?.data;
//       if (signedUrl) {
//         await sendFile(filename, filepath, signedUrl, filehash, size);
//         syncStatus("loading");
//       } else {
//         setDuplicateImages((prev) => prev + 1);
//       }
//     } catch (error) {
//       // setSyncStatus("failed");
//       console.error(error);
//     }
//   };

//   const sendFile = async (filename, filepath, signedUrl, filehash, size) => {
//     console.log("sendfile", size)
//     try {
//       const fileBuffer = await window.electronAPI.readFileAsBuffer(filepath);
//       await axios.put(signedUrl, fileBuffer, {
//         headers: {
//           "Content-Type": "image/webp",
//         },
//       });
//       await sendDataBackend(filename, filehash, filepath, size);
//     } catch (error) {
//       console.error(error);
//       setSyncStatus("failed");
//     }
//   };

//   const sendDataBackend = async (filename, filehash, filepath, size) => {
//     console.log("backend", size)
//     try {
//       const payload = {
//         eventId,
//         subEventId,
//         hash: filehash,
//         size: size,
//         file: filename,
//         url: `/${eventId}/${subEventId}/${filename}`,
//       };

//       const res = await axios.post(
//         `${baseURL}/photos/update-photopath`,
//         payload,
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token")}`,
//             "Content-Type": "application/json",
//             "ngrok-skip-browser-warning": "69420",
//           },
//         }
//       );
//       if (res.data?.message === "Photo path updated successfully.") {
//         // console.log(res.data);
//         await window.electronAPI.deleteFile(filepath);
//         await window.electronAPI.removeSentImageByHash(filehash);
//         setUploadedImages((prev) => {
//           const updated = prev + 1;
//           return updated;
//         });
//       } else {
//         toast.error("Backend rejected image");
//       }

//       await window.electronAPI.deleteFile(filepath);
//       await window.electronAPI.removeSentImageByHash(filehash);
//     } catch (error) {
//       console.error(error);
//       setSyncStatus("failed");
//     }
//   };

//   useEffect(() => {
//     if (totalImages > 0 && uploadedImages + duplicateImages === totalImages) {
//       setSyncStatus("completed");
//       setUploaded(uploadedImages);
//       setTotal(totalImages);
//       setDuplicate(duplicateImages);
//       setStart(true);
//       setComplete(true);
//       window.electronAPI.deleteCompressed();
//     }
//   }, [uploadedImages, totalImages, duplicateImages]);

//   const progressPercentage =
//     totalImages === 0
//       ? 0
//       : ((uploadedImages + duplicateImages) / totalImages) * 100;

//   const handleCancelUpload = () => {
//     Swal.fire({
//       title: "Are you sure?",
//       text: "You won't be able to revert this!",
//       icon: "warning",
//       showCancelButton: true,
//       confirmButtonColor: "#3085d6",
//       cancelButtonColor: "#d33",
//       confirmButtonText: "Yes, cancel it!",
//     }).then((result) => {
//       if (result.isConfirmed) {
//         window.electronAPI.cancelUploadProcessing();
//         setSyncStatus("cancelled");
//         setCancel(true);
//         setUploaded(uploadedImages);
//         setTotal(totalImages);
//         setDuplicate(duplicateImages);
//       }
//     });
//   };

//   return (
//     <>
//       <ToastContainer />
//       <div className="flex flex-col items-center my-5">
//         <button
//           className="text-lg flex items-center gap-2 border-2 border-blue text-blue py-5 px-5 rounded font-semibold hover:text-white hover:bg-bluehover disabled:opacity-50"
//           onClick={handleSelectFolder}
//           disabled={syncStatus === "loading"}
//         >
//           <DriveFolderUploadIcon /> Select Folder
//         </button>

//         {/* {syncStatus === "loading" && (
//           <p className="mt-4 text-blue font-semibold">
//             Syncing photos... Please wait.
//           </p>
//         )} */}
//         {/* {syncStatus === "failed" && (
//           <p className="mt-4 text-red font-semibold">Failed to sync photos.</p>
//         )} */}
//         {/* {totalImages > 0 && (
//           <>
//             <div className="flex flex-col justify-end items-center mt-2 text-lg font-semibold text-slate-700">
//               <p>
//                 Upload Images: {uploadedImages} / {totalImages}
//               </p>
//               <p>Duplicate Images: {duplicateImages}</p>
//             </div>
//             <div className="w-full bg-gray-200 bo border border-slate-400 rounded-full h-4 overflow-hidden mt-2">
//               <div
//                 className="bg-green-500 h-4 transition-all duration-500"
//                 style={{ width: `${progressPercentage}%` }}
//               ></div>
//             </div>
//             {start === false && (
//               <button
//                 onClick={handleCancelUpload}
//                 className="mt-4 bg-bgred text-white py-2 px-4 rounded font-semibold"
//               >
//                 Cancel Upload
//               </button>
//             )}
//           </>
//         )} */}

//         {/* {syncStatus === "completed" && (
//           <p className="mt-4 text-green-600 font-semibold">
//             Upload completed successfully!
//           </p>
//         )} */}
//       </div>
//     </>
//   );
// }

// export default SyncPhotos;

