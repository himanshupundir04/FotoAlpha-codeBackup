// import React, { useState } from "react";
// import InsertPhotoIcon from "@mui/icons-material/InsertPhoto";
// import UploadIcon from "@mui/icons-material/Upload";
// import { useFormik } from "formik";
// import axios from "axios";
// import { useParams } from "react-router-dom";
// import { toast } from "react-toastify";
// import { Box, Modal } from "@mui/material";
// import CloseIcon from "@mui/icons-material/Close";

// const baseurl = process.env.REACT_APP_BASE_URL;
// const style = {
//   position: "absolute",
//   top: "50%",
//   left: "50%",
//   transform: "translate(-50%, -50%)",
//   width: 500,
//   bgcolor: "background.paper",
//   boxShadow: 24,
//   border: "1px solid #fff",
//   py: 2,
//   px: 4,
// };

// function Upload({ open, handleClose }) {
//   const { id } = useParams();
//   const [loading, setLoading] = useState(false);
//   const [photoPreviews, setPhotoPreviews] = useState([]);
//   const [isDragging, setIsDragging] = useState(false);

//   // upload photo
//   const formik = useFormik({
//     initialValues: {
//       photos: "",
//       description: "aa",
//       tags: 1,
//       isPublic: false,
//       event: id,
//     },
//     onSubmit: (values) => {
//       setLoading(true);
//       // console.log(values);
//       const formData = new FormData();
//       for (let i = 0; i < values.photos.length; i++) {
//         formData.append("photos", values.photos[i]);
//       }

//       formData.append("description", values.description);
//       formData.append("tags", values.tags);
//       formData.append("isPublic", values.isPublic);
//       formData.append("event", values.event);

//       axios
//         .post(`${baseurl}/photos`, formData, {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token")}`,
//             "ngrok-skip-browser-warning": "69420",
//             "Content-Type": "multipart/form-data",
//           },
//         })
//         .then((response) => {
//           //   console.log("Form response:", response.data);
//           setLoading(false);
//           setPhotoPreviews([]);
//           formik.resetForm();
//           toast.success("Photos uploaded successfully");
//           handleClose();
//         })
//         .catch((error) => {
//           setLoading(false);
//           toast.error("Error uploading photos", error.status.message);
//           console.log(error.status.message);
//         });
//     },
//   });

//   const handlePhotoChange = (event) => {
//     const files = event.target.files;
//     formik.setFieldValue("photos", files);

//     const previews = Array.from(files).map((file) => URL.createObjectURL(file));
//     setPhotoPreviews(previews);
//   };

//   return (
//     <>
//       <Modal
//         open={open}
//         onClose={handleClose}
//         aria-labelledby="modal-modal-title"
//         aria-describedby="modal-modal-description"
//       >
//         <Box sx={style}>
//           {/* <ToastContainer /> */}
//           <div className="bg-white rounded dark:bg-slate-800">
//             <div className="flex justify-end">
//               <CloseIcon
//                 className="text-slate-700 cursor-pointer"
//                 onClick={handleClose}
//               />
//             </div>
//             <h3 className="text-start text-2xl font-bold dark:text-white text-slate-700">
//               Upload Photos
//             </h3>
//             <p className="text-start dark:text-white text-slate-500 font-semibold">
//               Upload photos for this event. Supported Formates: JPG, PNG, GIF.
//             </p>
//             <h3 className="text-start text-lg mt-3 font-bold dark:text-white text-slate-700 ">
//               Select Folder
//             </h3>
//             <div className="text-start ">
//               <select className="border border-slate-300 mt-1 rounded-md w-44 p-1 px-2 dark:bg-slate-800 dark:text-slate-400">
//                 <option>All Photos</option>
//                 <option>Engagment</option>
//                 <option>Mehndi</option>
//                 <option>Haldi</option>
//               </select>
//               <div
//                 className={`border border-dashed border-5 px-5 py-8 text-center mt-5 ${
//                   isDragging
//                     ? "border-blue bg-blue"
//                     : "border-slate-400 dark:border-slate-100"
//                 }`}
//                 onDragOver={(e) => e.preventDefault()}
//                 onDragEnter={() => setIsDragging(true)}
//                 onDragLeave={() => setIsDragging(false)}
//                 onDrop={(e) => {
//                   e.preventDefault();
//                   setIsDragging(false);
//                   const files = e.dataTransfer.files;
//                   formik.setFieldValue("photos", files);
//                   const previews = Array.from(files).map((file) =>
//                     URL.createObjectURL(file)
//                   );
//                   setPhotoPreviews(previews);
//                 }}
//               >
//                 <div className="flex flex-wrap gap-3 justify-center">
//                   {photoPreviews.length > 0 ? (
//                     photoPreviews.map((preview, index) => (
//                       <img
//                         src={preview}
//                         alt={`Preview ${index}`}
//                         key={index}
//                         style={{ width: "100px", height: "100px" }}
//                       />
//                     ))
//                   ) : (
//                     <InsertPhotoIcon
//                       className="text-slate-600 dark:text-slate-200"
//                       sx={{ fontSize: 50 }}
//                     />
//                   )}
//                 </div>

//                 <p className="text-center dark:text-white text-slate-700 font-bold">
//                   Drop your images here or click to browser
//                 </p>
//                 <p className="text-center mb-5 dark:text-white text-slate-500 font-semibold">
//                   you can upload multiple photos ad once
//                 </p>
//                 <form onSubmit={formik.handleSubmit}>
//                   <label
//                     htmlFor="uploadphoto"
//                     className="border border-slate-300 rounded-md font-semibold text-slate-600 px-4 mt-3 py-2 rounded cursor-pointer dark:bg-slate-800 dark:text-slate-400"
//                   >
//                     <UploadIcon /> Select File
//                   </label>
//                   <input
//                     type="file"
//                     name="uploadphoto"
//                     id="uploadphoto"
//                     hidden
//                     multiple
//                     accept="image/*"
//                     onChange={handlePhotoChange}
//                   />
//                   <button
//                     className="bg-blue text-white px-4 py-2 rounded ms-3"
//                     type="submit"
//                     disabled={loading}
//                   >
//                     {loading ? "Uploading..." : "Upload"}
//                   </button>
//                 </form>
//               </div>
//             </div>
//           </div>
//         </Box>
//       </Modal>
//     </>
//   );
// }

// export default Upload;

