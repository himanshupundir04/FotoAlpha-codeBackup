import { Box, Divider, Modal } from "@mui/material";
import React, { useContext, useState } from "react";
import { PlanContext } from "../../Context/PlanContext";
import CloseIcon from "@mui/icons-material/Close";
import PaymentDetails from "./Pricing/PaymentDetails";
import axios from "axios";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: {
    xs: "90%", // mobile screens
    sm: 400, // small screens and up
    md: 500, // medium screens and up
  },
  boxShadow: 24,
};

const baseURL = process.env.REACT_APP_BASE_URL;
function Calculateprice({ open, handleClose }) {
  const { setPlan, setYear, setPlanid, pricedetail, filldetail,setType } =
    useContext(PlanContext);
  const [opend, setOpend] = useState(false);
  const handleClosed = () => setOpend(false);

   const storage = filldetail?.storageGB
    ? filldetail.storageGB >= 1024
      ? `${(filldetail.storageGB / 1024).toFixed(
          filldetail.storageGB % 1024 === 0 ? 0 : 1
        )} TB`
      : `${filldetail.storageGB}`
    : "No storage selected";

  const handleOpen = (plan,id, type) => {
    setOpend(true);
    handleClose();
    setPlan(plan);
    setYear("MYOP");
    setPlanid(id);
     setType(type)
  };

  const savemyop = async () => {
    const formdata = {
      validityInMonths: filldetail?.validityInMonths || "",
      numberOfEvents: filldetail?.numberOfEvents || "",
      uploadPhotos: filldetail?.uploadPhotos || "",
      storageGB: storage || "",
      price: pricedetail?.total || "",
    };
    axios
      .post(`${baseURL}/mysubscriptions/myop/save`,formdata, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "ngrok-skip-browser-warning": "69420",
        },
      })
      .then((response) => {
        // console.log(response.data.planId);
        handleOpen(pricedetail?.total, response?.data?.planId, response?.data?.planType);
      })  
      .catch((error) => {
        console.log(error);
      });
  };

  // console.log(pricedetail);
  // console.log(filldetail);
  return (
    <>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <div className="bg-white p-4">
            <div className="flex justify-between items-center">
              <h2 className="text-slate-700 font-normal text-2xl">
                Calculated Price
              </h2>
              <CloseIcon
                className="text-slate-700 cursor-pointer"
                onClick={() => {
                  handleClose();
                }}
              />
            </div>
            <div className="mt-3 px-5">
              <div className="flex justify-between items-center mt-1">
                <p className="text-slate-700 font-normal ">Valid for:</p>
                <p className="text-slate-700 font-normal ">
                  {filldetail?.validityInMonths}
                </p>
              </div>
              <div className="flex justify-between items-center mt-1">
                <p className="text-slate-700 font-normal ">Event for:</p>
                <p className="text-slate-700 font-normal ">
                  {filldetail?.numberOfEvents}
                </p>
              </div>
              <div className="flex justify-between items-center mt-1">
                <p className="text-slate-700 font-normal ">
                  Uplaod Photo for:
                </p>
                <p className="text-slate-700 font-normal ">
                  {filldetail?.uploadPhotos}
                </p>
              </div>
              <div className="flex justify-between items-center mt-1 mb-2">
                <p className="text-slate-700 font-normal ">Storage for:</p>
                
                <p className="text-slate-700 font-normal">
                  {/* {filldetail?.storageGB
                    ? filldetail.storageGB >= 1024
                      ? `${(filldetail.storageGB / 1024).toFixed(
                          filldetail.storageGB % 1024 === 0 ? 0 : 1
                        )} TB`
                      : `${filldetail.storageGB} GB`
                    : "No storage selected"} */}
                     {storage} GB
                </p>
              </div>
              <Divider />
              <div className="flex justify-between items-center mt-1">
                <p className="text-slate-700 font-normal text-lg">
                  Total Price:
                </p>
                <p className="text-slate-700 font-normal text-lg">
                  {pricedetail?.total}
                </p>
              </div>
              <div className="flex justify-end items-center gap-4">
                <button
                  className="bg-red-500 text-white font-normal rounded py-2 px-4 mt-4 hover:bg-red-600"
                  onClick={() => {
                    handleClose();
                  }}
                >
                  Cancel
                </button>
                <button
                  className="bg-blue text-white font-normal rounded py-2 px-4 mt-4 hover:bg-blueHover"
                  onClick={() => {
                     savemyop();
                  }}
                >
                  Upgrade Plan
                </button>
              </div>
            </div>
          </div>
        </Box>
      </Modal>
      <PaymentDetails payopen={opend} payclose={handleClosed} />
    </>
  );
}

export default Calculateprice;
