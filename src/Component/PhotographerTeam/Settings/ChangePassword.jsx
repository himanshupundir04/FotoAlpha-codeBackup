import { Box, Modal } from "@mui/material";
import React from "react";
import CloseIcon from "@mui/icons-material/Close";
import { useFormik } from "formik";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const baseurl = process.env.REACT_APP_BASE_URL;
const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 500,
  bgcolor: "background.paper",
  boxShadow: 24,
  border: "1px solid #fff",
  py: 2,
  px: 4,
};
function ChangePassword({ open, handleClose }) {
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      currentPassword: "",
      newPassword: "",
      newPasswordConfirm: "",
    },
    onSubmit: (values) => {
      try {
        const response = axios.post(`${baseurl}/auth/update-password`, values, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "ngrok-skip-browser-warning": "69420",
          },
        });
        // console.log(response)
        toast.success("Password updated successfully, Please login again.", {autoClose: 1000});
        formik.resetForm();
        handleClose();
        setTimeout(() => {
          handleLogout();
        }, 2000);
      } catch (error) {
        console.log(error);
      }
    },
  });

  const handleLogout = () => {
    let users = JSON.parse(localStorage.getItem("users")) || [];
    // Find current user by isCurrent flag
    const currentUser = users.find((u) => u.isCurrent);
    if (!currentUser) {
      // No current user found — maybe already logged out
      navigate("/");
      return;
    }
    // Remove current user from array
    users = users.filter((u) => u._id !== currentUser._id);
    // Update users array and remove token data
    localStorage.setItem("users", JSON.stringify(users));
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    navigate("/")    
  };

  return (
    <>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <form onSubmit={formik.handleSubmit} >
            <div className="flex justify-between items-center">
              <h2 className="text-slate-700 font-normal text-xl dark:text-white">
                Change Password
              </h2>
              <CloseIcon
                className="text-slate-700 cursor-pointer dark:text-white"
                onClick={() => {
                  handleClose();
                }}
              />
            </div>
            <div className="flex flex-col mt-3">
              <label className="font-normal text-slate-700 dark:text-white">
                Current Password
              </label>
              <input
                type="text"
                placeholder="Enter your current password"
                name="currentPassword"
                value={formik.values.currentPassword}
                onChange={formik.handleChange}
                className="border border-slate-300 p-2 rounded bg-transparent outline-none "
              />
            </div>
            <div className="flex flex-col mt-3">
              <label className="font-normal text-slate-700 dark:text-white">
                New Password
              </label>
              <input
                type="text"
                placeholder="Enter your new password"
                name="newPassword"
                value={formik.values.newPassword}
                onChange={formik.handleChange}
                className="border border-slate-300 p-2 rounded bg-transparent outline-none "
              />
            </div>
            <div className="flex flex-col mt-3">
              <label className="font-normal text-slate-700 dark:text-white">
                Confirm New Password
              </label>
              <input
                type="text"
                placeholder="Enter your confirm new password"
                name="newPasswordConfirm"
                value={formik.values.newPasswordConfirm}
                onChange={formik.handleChange}
                className="border border-slate-300 p-2 rounded bg-transparent outline-none "
              />
            </div>
            <div className="flex justify-end items-center gap-4 mt-5">
              <button
                className="bg-red-600 font-normal rounded py-2 px-4 text-white hover:bg-red-700"
                onClick={() => {
                  handleClose();
                }}
              >
                Close
              </button>
              <button
                className="bg-blue font-normal rounded py-2 px-4 text-white hover:bg-blueHover"
                type="submit"
              >
                Submit
              </button>
            </div>
          </form>
        </Box>
      </Modal>
    </>
  );
}

export default ChangePassword;
