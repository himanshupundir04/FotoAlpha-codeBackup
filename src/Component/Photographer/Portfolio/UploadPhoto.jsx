import React, { useEffect, useState } from "react";
import { Box, Modal, Skeleton } from "@mui/material";
import { useFormik } from "formik";
import axios from "axios";
import { toast } from "react-toastify";
import CloseIcon from "@mui/icons-material/Close";
import UploadIcon from "@mui/icons-material/Upload";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import AddIcon from "@mui/icons-material/Add";
import loadImage from "blueimp-load-image";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: {
    xs: "90%",
    md: 600,
  },
  height: "max",
  overflow: "auto",
};

const baseURL = process.env.REACT_APP_BASE_URL;
const MAX_UPLOAD_IMAGES = 10;
function UploadPhoto({ open, handleClose, fetchPhotos }) {
  const token = localStorage.getItem("token");
  const [uploadloading, setUploadLoading] = useState(false);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [folderOpen, setFolderOpen] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [folders, setFolders] = useState([]);
  const [folderID, setFolderID] = useState("");
  const [imageLoaded, setImageLoaded] = useState({});

  const users = JSON.parse(localStorage.getItem("users")) || [];
  const currentUser = users.find((u) => u.isCurrent);

  useEffect(() => {
    fetchFolder();
  }, []);

  const fetchFolder = () => {
    axios
      .get(`${baseURL}/folders/user/${currentUser._id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "ngrok-skip-browser-warning": "69420",
        },
      })
      .then((response) => {
        // console.log(response.data);
        setFolders(response.data);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const processFileForUpload = (file) =>
    new Promise((resolve) => {
      loadImage(
        file,
        (canvas) => {
          if (canvas && typeof canvas.toBlob === "function") {
            canvas.toBlob((blob) => {
              if (!blob) {
                resolve({ file, previewUrl: URL.createObjectURL(file) });
                return;
              }
              const fixedFile = new File([blob], file.name, { type: file.type });
              resolve({ file: fixedFile, previewUrl: URL.createObjectURL(blob) });
            }, file.type);
            return;
          }
          resolve({ file, previewUrl: URL.createObjectURL(file) });
        },
        { orientation: true, canvas: true }
      );
    });

  const handleFiles = async (files) => {
    const pickedFiles = Array.from(files || []);
    if (pickedFiles.length === 0) return;

    const existingFiles = Array.isArray(formikphoto.values.portfolioPhotos)
      ? formikphoto.values.portfolioPhotos
      : [];
    const existingPreviews = Array.isArray(uploadPreview) ? uploadPreview : [];
    const remainingSlots = MAX_UPLOAD_IMAGES - existingFiles.length;

    if (remainingSlots <= 0) {
      toast.error(`You can upload up to ${MAX_UPLOAD_IMAGES} images at a time.`, {
        autoClose: 1200,
      });
      return;
    }

    const filesToProcess = pickedFiles.slice(0, remainingSlots);
    if (pickedFiles.length > remainingSlots) {
      toast.error(
        `Only ${remainingSlots} more image${
          remainingSlots === 1 ? "" : "s"
        } can be added (max ${MAX_UPLOAD_IMAGES}).`,
        { autoClose: 1500 }
      );
    }

    const processedFiles = await Promise.all(
      filesToProcess.map((file) => processFileForUpload(file))
    );

    formikphoto.setFieldValue("portfolioPhotos", [
      ...existingFiles,
      ...processedFiles.map((item) => item.file),
    ]);
    setUploadPreview([
      ...existingPreviews,
      ...processedFiles.map((item) => item.previewUrl),
    ]);
  };

  const formikphoto = useFormik({
    initialValues: {
      portfolioPhotos: null,
      folderId: folderID || null,
    },
    enableReinitialize: true,
   onSubmit: async (values) => {
  setUploadLoading(true);

  if (!token) return;

  if (!values.portfolioPhotos || values.portfolioPhotos.length === 0) {
    setUploadLoading(false);
    toast.error("Please select at least one photo before uploading.", { autoClose: 1000 });
    return;
  }

  if (values.portfolioPhotos.length > MAX_UPLOAD_IMAGES) {
    setUploadLoading(false);
    toast.error(`You can upload up to ${MAX_UPLOAD_IMAGES} images at a time.`, {
      autoClose: 1200,
    });
    return;
  }

  try {
    const formData = new FormData();
    for (let i = 0; i < values.portfolioPhotos.length; i++) {
      formData.append("portfolioPhotos", values.portfolioPhotos[i]);
    }
    formData.append("folderId", values.folderId);

    const response = await axios.post(`${baseURL}/portfolio/photos`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
        "ngrok-skip-browser-warning": "69420",
      },
    });

      toast.success("Portfolio Photos Uploaded successfully!", { autoClose: 1000 });
      if (Array.isArray(uploadPreview)) {
        uploadPreview.forEach((previewUrl) => URL.revokeObjectURL(previewUrl));
      }
      formikphoto.resetForm();
      setUploadPreview(null);
      setImageLoaded({});
      handleClose();
      fetchPhotos();  
      fetchFolder();  
  } catch (error) {
    console.error(error);
    toast.error(error?.response?.data?.message || "Failed to save portfolio.", { autoClose: 1000 });
  } finally {
    setUploadLoading(false);
  }
}
  });

  const handleCreate = () => {
    if (folderName.trim() !== "") {
      // console.log(folderName);
      const folder = {
        name: folderName,
        userId: currentUser._id,
      };
      setFolders([...folders, folderName]);
      axios
        .post(`${baseURL}/folders`, folder, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "ngrok-skip-browser-warning": "69420",
          },
        })
        .then((response) => {
          // console.log(response.data);
          toast.success("Folder created successfully!", { autoClose: 1000 });
          fetchFolder();
        })
        .catch((error) => {
          console.error(error);
        });
      // console.log("Created folder:", folderName);
    }
    setFolderName("");
    setShowInput(false);
  };

  const handleImageLoad = (index) => {
    setImageLoaded((prev) => ({ ...prev, [index]: true }));
  };

  const handleRemoveImage = (indexToRemove) => {
    const selectedPhotos = Array.isArray(formikphoto.values.portfolioPhotos)
      ? formikphoto.values.portfolioPhotos
      : [];
    const previews = Array.isArray(uploadPreview) ? uploadPreview : [];

    if (previews[indexToRemove]) {
      URL.revokeObjectURL(previews[indexToRemove]);
    }

    formikphoto.setFieldValue(
      "portfolioPhotos",
      selectedPhotos.filter((_, index) => index !== indexToRemove)
    );
    setUploadPreview(previews.filter((_, index) => index !== indexToRemove));
    setImageLoaded((prev) => {
      const nextLoaded = {};
      Object.keys(prev).forEach((key) => {
        const index = Number(key);
        if (index < indexToRemove) nextLoaded[index] = prev[key];
        if (index > indexToRemove) nextLoaded[index - 1] = prev[key];
      });
      return nextLoaded;
    });
  };

  const hasSelectedPhotos =
    Array.isArray(formikphoto.values.portfolioPhotos) &&
    formikphoto.values.portfolioPhotos.length > 0;
  const hasPreview = Array.isArray(uploadPreview) && uploadPreview.length > 0;
  const disableUploadButton = uploadloading || !hasSelectedPhotos || !hasPreview;

  return (
    <>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <div className="bg-white text-start rounded dark:bg-slate-800 p-4">
            <div className="flex justify-end">
              <CloseIcon
                className="text-slate-700 cursor-pointer dark:text-white"
                onClick={handleClose}
              />
            </div>
            <h2 className="text-start text-2xl font-normal dark:text-white text-slate-700">
              Upload Photos
            </h2>
            <p className="text-start dark:text-white text-slate-500 font-normal">
              Upload photos for this event. Supported Formates: JPG, PNG.
            </p>
            <div className="">
              <h2 className="text-start text-lg mt-3 font-normal dark:text-white text-slate-700 ">
                Select Folder
              </h2>
              <div className="relative mt-1">
                <div
                  className="flex justify-between items-center w-52 bg-slate-200 py-1 px-2 rounded-md cursor-pointer dark:bg-slate-700"
                  onClick={() => setFolderOpen(!folderOpen)}
                >
                  <p className="text-slate-700 dark:text-white">
                    {folderName || "Select Folder"}
                  </p>
                  <KeyboardArrowDownIcon className="text-slate-700 dark:text-white" />
                </div>

                {folderOpen && (
                  <div className="absolute bg-slate-100 shadow-lg rounded mt-1 w-60 z-10 dark:bg-slate-700">
                    <button
                      onClick={() => setShowInput(!showInput)}
                      className="flex items-center text-blue text-start p-2 px-3 w-full font-normal hover:bg-slate-200"
                    >
                      <AddIcon fontSize="small" className="mr-1" />
                      Add Folder
                    </button>
                    {showInput && (
                      <div className="flex py-2 px-2 border-t border-slate-300">
                        <input
                          type="text"
                          placeholder="folder name"
                          value={folderName}
                          onChange={(e) => setFolderName(e.target.value)}
                          className="border rounded-s-md outline-none text-slate-700 p-2 w-full"
                        />
                        <button
                          onClick={handleCreate}
                          className="bg-blue py-2 px-3 text-white font-normal rounded-e-md hover:bg-blueHover"
                        >
                          Create
                        </button>
                      </div>
                    )}
                    <p
                      className={`text-slate-700 py-2 px-3 dark:text-white border-t border-slate-300 font-normal cursor-pointer capitalize
                        ${
                          folderID === null
                            ? "bg-slate-300 dark:bg-slate-600"
                            : "hover:bg-slate-200 dark:hover:bg-slate-700"
                        }
                      `}
                      onClick={() => {
                        setFolderID(null);
                        setFolderOpen(false);
                      }}
                    >
                      All Photos
                    </p>
                    {folders &&
                      folders.map((folder, index) => (
                        <p
                          className={`text-slate-700 py-2 px-3 dark:text-white border-t border-slate-300 font-normal cursor-pointer capitalize
                        ${
                          folderID === folder._id
                            ? "bg-slate-300 dark:bg-slate-600"
                            : "hover:bg-slate-200 dark:hover:bg-slate-700"
                        }
                      `}
                          key={index}
                          onClick={() => {
                            setFolderID(folder._id);
                            setFolderOpen(false);
                            setFolderName(folder?.name);
                          }}
                        >
                          {folder?.name}
                        </p>
                      ))}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-10 text-start ">
              <div
                className={`border border-dashed border-5 px-5 py-8 text-center mt-5 ${
                  isDragging
                    ? "border-blue bg-blue50"
                    : "border-slate-400 dark:border-slate-100"
                }`}
                onDragOver={(e) => e.preventDefault()}
                onDragEnter={() => setIsDragging(true)}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const files = e.dataTransfer.files;
                  // formikphoto.setFieldValue("portfolioPhotos", files);
                  handleFiles(files);
                }}
              >
                <div className="flex flex-wrap gap-3 justify-center">
                  {uploadPreview &&
                    uploadPreview.map((preview, index) => (
                      <div key={index} className="relative h-20 w-20">
                        <button
                          type="button"
                          className="absolute -top-2 -right-2 z-20 h-5 w-5 rounded-full bg-black/70 text-white text-xs leading-5"
                          onClick={() => handleRemoveImage(index)}
                          aria-label="Remove image"
                        >
                          x
                        </button>
                        {!imageLoaded[index] && (
                          <Skeleton
                            variant="rounded"
                            animation="wave"
                            width="100%"
                            height="100%"
                            className="absolute top-0 left-0 z-10"
                          />
                        )}
                        <img
                          src={preview}
                          alt="Preview"
                          className="h-20 w-20 object-contain"
                          onLoad={() => handleImageLoad(index)}
                        />
                      </div>
                    ))}
                </div>
                <p className="text-center dark:text-white text-slate-700 font-normal">
                  Drop your images here or click to browser
                </p>
                <p className="text-center mb-5 dark:text-white text-slate-500 font-normal">
                  you can upload multiple photos
                </p>
                <p className="text-center mb-5 dark:text-white text-slate-500 font-normal">
                  Maximum 10 images per upload
                </p>
                <form onSubmit={formikphoto.handleSubmit}>
                  <label
                    htmlFor="photo"
                    className="border border-slate-300 rounded-md text-sm font-normal text-slate-700 px-4 mt-3 py-2 rounded cursor-pointer dark:bg-slate-800 dark:text-white"
                  >
                    <UploadIcon /> Select File
                  </label>
                  <input
                    name="portfolioPhotos"
                    type="file"
                    accept="image/*"
                    multiple
                    id="photo"
                    className="hidden"
                    onChange={(e) => {
                      const files = e.currentTarget.files;
                      handleFiles(files);
                    }}
                  />
                  <button
                    className={`bg-blue text-white text-sm px-4 py-2 rounded ms-3 font-normal ${
                      disableUploadButton
                        ? "opacity-60 cursor-not-allowed"
                        : "hover:bg-blueHover"
                    }`}
                    type="submit"
                    disabled={disableUploadButton}
                  >
                    {uploadloading ? "Uploading..." : "Upload"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </Box>
      </Modal>
    </>
  );
}

export default UploadPhoto;
