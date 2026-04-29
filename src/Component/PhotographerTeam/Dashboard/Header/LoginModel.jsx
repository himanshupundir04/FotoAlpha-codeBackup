import React, { useState } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import axios from "axios";
import { Box, Modal } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import LoginForm from "../../../login/LoginForm";

const baseURL = process.env.REACT_APP_BASE_URL;
const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: {
    xs: "90%",
    md: 500,
  },
  bgcolor: "background.paper",
  boxShadow: 24,
  border: "1px solid #fff",
  py: 2,
  px: {
    xs: 2,
    md: 4,
  },
};
function LoginModel({ open, handleClose, opensignup }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const res = await axios.post(`${baseURL}/auth/login`, values);
        setLoading(false);

        Swal.fire({
          position: "top-end",
          title: "Login Successful",
          showConfirmButton: false,
          timer: 1000,
        });

        formik.resetForm();
        localStorage.setItem("token", res.data.data.token);
        localStorage.setItem("refreshToken", res.data.data.refreshToken);
        localStorage.setItem("user", JSON.stringify(res.data.data.user));
        // localStorage.setItem("user", JSON.stringify({ id: res.data.data.user._id , role: res.data.data.user.role }));

        const role = res.data.data.user.role.name;
        // console.log(res.data.data.user.role.name);

       if (role === "photographer") {
      navigate("/photographer/dashboard");
    } else if (role === "guest") {
      navigate("/guest/my_events");
    } else if (role === "superadmin") {
      navigate("/superadmin/dashboard");
    }else if (role === "photographer-team") {
      navigate("/photographer_team/dashboard");
    } else if (role === "admin_support") {
      navigate("/admin_support/dashboard");
    } else if (role === "organization") {
      navigate("/organization/dashboard");
    }
      } catch (error) {
        // console.log(error?.response?.data?.message);
        setLoading(false);
        Swal.fire({
          position: "top-end",
          title: "Login Failed",
          text: error?.response?.data?.message || "Something went wrong!",
          icon: "error",
          showConfirmButton: false,
          timer: 1500,
        });
      }
    },
  });

  const handlesignup = () => {
    handleClose();
    opensignup();
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
          <div className="flex justify-end">
            <CloseIcon onClick={handleClose} className="cursor-pointer " />
          </div>
          <LoginForm />
          <p
            className="mt-3 text-gray-500 font-semibold text-center cursor-pointer"
            onClick={handlesignup}
          >
            Craete New Account
          </p>
        </Box>
      </Modal>
    </>
  );
}

export default LoginModel;
