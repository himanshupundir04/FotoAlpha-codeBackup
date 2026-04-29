import React, { useState } from "react";
import { Box, Modal } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useFormik } from "formik";
import axios from "axios";
import PaymentDetails from "./PaymentDetails";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: {
    xs: "90%",
    md: 500,
  },
  height: {
    xs: "90%",
    md: "auto",
  },
  overflow: "auto",
  bgcolor: "background.paper",
  boxShadow: 24,
  border: "1px solid #fff",
  py: 2,
  px: {
    xs: 2,
    md: 4,
  },
};
const baseurl = process.env.REACT_APP_BASE_URL;

function Connected({ open, handleClose }) {
  const [loading, setLoading] = useState(false);
  const [payopen, setpayopen] = useState(false);
  const handlepayClose = () => setpayopen(false);

  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      phone: "",
    },
    onSubmit: async (values) => {
      console.log(values);
      try {
        const response = await axios.post(`${baseurl}/events`, values, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "69420",
          },
        });
        setLoading(false);
        formik.resetForm();
      } catch (error) {
        handlepayment();
        setLoading(false);
        console.error(error);
      }
    },
  });

  const handlepayment = () => {
    handleClose();
    setpayopen(true);
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
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <h3 className="text-slate-700 font-normal text-xl">
                Get Connected
              </h3>
              <span className="text-sm text-slate-700">
                Be a part of our photo sharing community
              </span>
            </div>
            <CloseIcon
              className="text-slate-700 cursor-pointer"
              onClick={handleClose}
            />
          </div>
          <form className="mt-5" onSubmit={formik.handleSubmit}>
            <div className="flex flex-col ">
              <label className="text-slate-700 font-normal text-lg">
                Name
              </label>
              <input
                type="text"
                name="name"
                placeholder="Enter your name"
                value={formik.values.name}
                onChange={formik.handleChange}
                className="border border-slate-300 p-2 rounded"
              />
            </div>
            <div className="flex flex-col mt-2">
              <label className="text-slate-700 font-normal text-lg">
                Email
              </label>
              <input
                type="text"
                name="email"
                placeholder="Enter your email"
                value={formik.values.email}
                onChange={formik.handleChange}
                className="border border-slate-300 p-2 rounded"
              />
            </div>
            <div className="flex flex-col mt-2">
              <label className="text-slate-700 font-normal text-lg">
                Phone No.
              </label>
              <input
                type="text"
                name="phone"
                placeholder="Enter your Phone No."
                value={formik.values.phone}
                onChange={formik.handleChange}
                className="border border-slate-300 p-2 rounded"
              />
            </div>            
            <div className="flex justify-end mt-4">
              <button
                className="btn bg-blue font-normal text-white rounded p-2 px-5 hover:bg-blueHover"
                disabled={loading}
                type="submit"
              >
                {loading ? "Continue..." : "Continue"}
              </button>
            </div>
          </form>
        </Box>
      </Modal>
      <PaymentDetails payopen={payopen} payclose={handlepayClose} />
    </>
  );
}

export default Connected;
