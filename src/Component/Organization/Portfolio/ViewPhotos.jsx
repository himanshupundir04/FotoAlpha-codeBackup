import React from "react";
import img from "../../image/1.jpg";
import { Box, Modal } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: {
    xs: "90%",
    md:"95%",
  },  
  bgcolor: "background.paper",
  boxShadow: 24,
  border: "1px solid #fff",
  py: 2,
  px: {
    xs: 2,
    md: 3,
  },
};

function ViewPhotos({ open, handleClose }) {
 

  const images = [img, img, img, img, img, img, img, img, img];


  return (
    <>
    
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <div className="bg-white rounded dark:bg-slate-800">
            <div className="flex justify-end">
              <CloseIcon
                className="text-slate-700 cursor-pointer"
                onClick={handleClose}
              />
            </div>
              <div className="flex flex-wrap gap-7 ">                
                  {images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`slide-${index}`}
                      className="rounded-md w-48 h-48 object-cover px-4"
                    />
                  ))}               
              </div>
          </div>
        </Box>
      </Modal>
    </>
  );
}

export default ViewPhotos;
