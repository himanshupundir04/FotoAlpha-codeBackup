

// import { useContext, useEffect, useRef, useState } from "react";
// import axios from "axios";
// import { PortfolioContext } from "./PortfolioContext";

// const baseURL = process.env.REACT_APP_BASE_URL;

// export const useImageUploadWatcher = ({
//   folderPath,
//   updateUploadState,
//   setSyncStatus,
// }) => {
//   const {
//     setTotal,
//     setUploaded,
//     setDuplicate,
//     setStart,
//     setBack,
//     eventId,
//     subId,
//     eventsid,
//     subeventsid,
//     setSavedStep,
//     hasStarted,
//     setHasStarted
//   } = useContext(PortfolioContext);

//   const subeventId = subId?.value;

//   // console.log(eventsid, "events id");
//   // console.log(subeventsid, "subevents id");


// //   useEffect(() => {
// //  if (!folderPath || hasStarted.current) return;
// //   hasStarted.current = true;
// //     setUploaded(0);
// //     setTotal(0);
// //     setDuplicate(0);

// //     window.electronAPI.onTotalImageCount((count) => {
// //       setTotal(count);
// //     });

// //     const handleCompressedChunk = async (chunk) => {
// //       // directly upload files, no queue
// //       await Promise.all(
// //         chunk.map(async (file) => {
// //           const filesize = file.size;
// //           try {
// //             await fetchFiles(
// //               file.name,
// //               file.type,
// //               file.path,
// //               file.hash,
// //               filesize
// //             );
// //           } catch (err) {
// //             console.error("Upload failed:", file.name, err);
// //           }
// //         })
// //       );
// //     };

// //     window.electronAPI.onCompressedFileReady(handleCompressedChunk);
// //     const handleNewImage = async (file) => {
// //       const filesize = file.size;
// //       await fetchFiles(file.name, file.type, file.path, file.hash, filesize);
// //     };

// //     window.electronAPI.onNewImageDetected(handleNewImage);
// //     // const startCompressionAndWatch = async () => {
// //     //   try {
// //     //     await window.electronAPI.watchFolder(folderPath);
// //     //     await window.electronAPI.compressAndReadFolder(folderPath);
// //     //   } catch (error) {
// //     //     console.error("Error during compression or watching:", error);
// //     //   }
// //     // };
// //     // startCompressionAndWatch();
// //     return () => {
// //       // window.electronAPI.stopWatchingFolder?.();
// //       // window.electronAPI.removeListeners?.();
// //     };
// //   }, [folderPath]);


// useEffect(() => {
//  if (!folderPath || hasStarted) return;  // now uses context
//     setHasStarted(true);

//   setUploaded(0);
//   setTotal(0);
//   setDuplicate(0);

//   window.electronAPI.onTotalImageCount((count) => setTotal(count));

//   const handleCompressedChunk = async (chunk) => {
//     await Promise.all(
//       chunk.map(async (file) => {
//         try {
//           await fetchFiles(file.name, file.type, file.path, file.hash, file.size);
//         } catch (err) {
//           console.error("Upload failed:", file.name, err);
//         }
//       })
//     );
//   };

//   window.electronAPI.onCompressedFileReady(handleCompressedChunk);
//   window.electronAPI.onNewImageDetected((file) =>
//     fetchFiles(file.name, file.type, file.path, file.hash, file.size)
//   );

//   window.electronAPI.watchFolder(folderPath);
//   window.electronAPI.compressAndReadFolder(folderPath);

//   return () => {
//     // ⛔ Don’t stop watchers here
//     // otherwise upload will restart when you come back
//   };
// }, [folderPath, hasStarted]);

//   const uploadLimitReached = useRef(false);

//   const fetchFiles = async (
//     filename,
//     filetype,
//     filepath,
//     filehash,
//     filesize
//   ) => {
//     if (uploadLimitReached.current) return;

//     try {
//       const response = await axios.get(
//         `${baseURL}/photos/getSignedUrl?fileName=${
//           eventId?.value || eventsid
//         }/${
//           subeventId || subeventsid
//         }/${filename}&fileType=${filetype}&hash=${filehash}&event=${
//           eventId?.value || eventsid
//         }`,
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token")}`,
//             "ngrok-skip-browser-warning": "69420",
//           },
//           validateStatus: () => true,
//         }
//       );

//       if (response?.data?.signedUrl) {
//         await sendFile(
//           filename,
//           filepath,
//           response.data.signedUrl,
//           filehash,
//           filesize
//         );
//       }

//       if (
//         response?.data?.message === "Photo upload limit reached for your plan."
//       ) {
//         uploadLimitReached.current = true;
//         await handleUploadLimitReached();
//         return;
//       }

//       if (response.status === 409 || !response.data?.signedUrl) {
//         await handleDuplicate(filepath, filehash);
//         return;
//       }
//     } catch (error) {
//       console.error("fetchFiles error:", error);
//       throw error; // so handleOnline knows it failed
//     }
//   };

//   const handleUploadLimitReached = async () => {
//     window.electronAPI.cancelUploadProcessing();
//     window.electronAPI.deleteCompressed();
//     await window.electronAPI.setStore("compressedQueue", []);
//   };

//   const handleDuplicate = async (filepath, filehash) => {
//     setDuplicate((prev) => prev + 1);
//     await window.electronAPI.deleteFile(filepath);
//   };

//   const sendFile = async (
//     filename,
//     filepath,
//     signedUrl,
//     filehash,
//     filesize
//   ) => {
//     try {
//       const fileBuffer = await window.electronAPI.readFileAsBuffer(filepath);
//       await axios.put(signedUrl, fileBuffer, {
//         headers: { "Content-Type": "image/webp" },
//       });

//       await sendDataBackend(filename, filehash, filepath, filesize);
//     } catch (error) {
//       console.error("sendFile error:", error);
//     }
//   };

//   const sendDataBackend = async (filename, filehash, filepath, filesize) => {
//     // console.log("filepath", size);
//     try {
//       const payload = {
//         eventId: eventId?.value || eventsid,
//         subeventId: subeventId || subeventsid,
//         hash: filehash,
//         size: filesize,
//         file: filename,
//         url: `/${eventId?.value || eventsid}/${
//           subeventId || subeventsid
//         }/${filename}`,
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
//         setUploaded((prev) => {
//           const updated = prev + 1;
//           return updated;
//         });
//       } else {
//         console.error("Backend rejected image");
//       }
//     } catch (error) {}
//   };
// };
