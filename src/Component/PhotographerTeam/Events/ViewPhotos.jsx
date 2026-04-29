// import React, { useState } from "react";
// import MoreVertIcon from "@mui/icons-material/MoreVert";
// import { Dialog, IconButton, Menu, MenuItem, Switch } from "@mui/material";
// import HideImageOutlinedIcon from "@mui/icons-material/HideImageOutlined";
// import DeleteIcon from "@mui/icons-material/Delete";
// import ArrowBackIcon from "@mui/icons-material/ArrowBack";
// import { useNavigate } from "react-router-dom";

// function ViewPhotos() {
//   const [anchorEl, setAnchorEl] = useState(null);
//   const open = Boolean(anchorEl);
//   const handleClick = (event) => {
//     setAnchorEl(event.currentTarget);
//   };
//   const handleClose = () => {
//     setAnchorEl(null);
//   };
//   const [photos, setPhotos] = useState([]);
//   const [zoomImg, setZoomImg] = useState(null);
//   const [selected, setSelected] = useState(false);

//   const navigate = useNavigate();
//   const handleBack = () => {
//     navigate(-1);
//   };

//   const formatFileSize = (bytes) => {
//     if (bytes >= 1024 ** 3) {
//       return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
//     } else if (bytes >= 1024 ** 2) {
//       return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
//     } else if (bytes >= 1024) {
//       return `${(bytes / 1024).toFixed(1)} KB`;
//     } else {
//       return `${bytes} B`;
//     }
//   };
//   return (
//     <>
//       <div className="flex items-center">
//         <ArrowBackIcon
//           sx={{ fontSize: "30px" }}
//           className="bg-slate-300 p-1 rounded text-white cursor-pointer"
//           onClick={handleBack}
//         />
//         <h1 className="text-start text-3xl text-slate-700 font-bold dark:text-white capitalize ml-3">
//           Engagement
//         </h1>
//       </div>
//       <div className="bg-white rounded md:mb-0 mb-3 dark:bg-slate-800 p-4 mt-5">
//         <div className="flex justify-between">
//           <p className="text-start text-blue dark:text-white text-xl font-semibold">
//             Photos
//           </p>
//           <div className="flex items-center">
//             <span className="mr-2 text-bold text-slate-800 text-lg dark:text-slate-400">
//               Watermarked
//             </span>
//             <Switch
//               defaultChecked
//               onChange={() => setSelected((prevSelected) => !prevSelected)}
//             />
//             <span className="ms-2 text-bold text-slate-800 text-lg dark:text-slate-400">
//               Original
//             </span>
//           </div>
//         </div>
//         <div className="flex flex-wrap gap-3 mt-4">
//           {photos?.length === 0 ? (
//             <div className="flex flex-col justify-center items-center w-full">
//               <HideImageOutlinedIcon
//                 sx={{ fontSize: 50 }}
//                 className="text-slate-400"
//               />
//               <p className="text-2xl text-slate-400">No photos available</p>
//             </div>
//           ) : (
//             photos &&
//             photos.map((event, index) => (
//               <div className="flex flex-col" key={index}>
//                 <div className="max-w-sm bg-white rounded-md shadow-sm border-1 border-slate-200 dark:border-slate-700 dark:bg-slate-700 relative w-56 h-52">
//                   <img
//                     src={selected ? event?.watermarked_path : event?.url}
//                     alt=""
//                     className="w-56 h-52 object-cover absolute top-0 left-0 rounded-md cursor-pointer"
//                     loading="lazy"
//                     onClick={() =>
//                       setZoomImg(
//                         selected ? event?.watermarked_path : event?.url
//                       )
//                     }
//                   />
//                   <input
//                     type="checkbox"
//                     className="absolute top-3 left-3 z-10"
//                   />
//                   <div className="absolute top-1 right-1 bg-slate-100 dark:bg-slate-700 rounded-lg">
//                     <IconButton
//                       className="p-0"
//                       aria-label="more"
//                       size="small"
//                       id="long-button"
//                       aria-controls={open ? "long-menu" : undefined}
//                       aria-expanded={open ? "true" : undefined}
//                       aria-haspopup="true"
//                       onClick={handleClick}
//                     >
//                       <MoreVertIcon
//                         sx={{ fontSize: 20 }}
//                         className="dark:text-slate-400"
//                       />
//                     </IconButton>
//                     <Menu
//                       id="long-menu"
//                       MenuListProps={{
//                         "aria-labelledby": "long-button",
//                       }}
//                       anchorEl={anchorEl}
//                       open={open}
//                       onClose={handleClose}
//                       slotProps={{
//                         paper: {
//                           style: {
//                             // maxHeight: ITEM_HEIGHT * 3,
//                             width: "14ch",
//                             boxShadow: "none",
//                           },
//                         },
//                       }}
//                       className="shadow-none"
//                     >
//                       <MenuItem
//                         selected="Pyxis"
//                         onClick={handleClose}
//                         className="dark:text-slate-700 "
//                       >
//                         <DeleteIcon /> Delete
//                       </MenuItem>
//                     </Menu>
//                   </div>
//                   <span className="absolute bottom-3 left-3 bg-green-200 text-green-500 px-2 text-sm rounded-full">
//                     Ready
//                   </span>
//                 </div>
//                 <div className="flex justify-between mt-2 mb-2">
//                   <p className="text-sm font-semibold text-slate-800 dark:text-slate-400 truncate max-w-[150px]">
//                     {event.filename}
//                   </p>
//                   <p className="text-sm text-slate-500 dark:text-slate-400">
//                     {formatFileSize(event.metadata.size)}
//                   </p>
//                 </div>
//               </div>
//             ))
//           )}
//         </div>
//       </div>
//       <Dialog open={!!zoomImg} onClose={() => setZoomImg(null)} maxWidth="md">
//         <img src={zoomImg} alt="" className="w-96 h-auto object-contain" />
//       </Dialog>
//     </>
//   );
// }

// export default ViewPhotos;
