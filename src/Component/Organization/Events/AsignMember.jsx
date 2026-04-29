import React, { useEffect, useState } from "react";
import { Box, ListItemText, MenuItem, Modal } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Select from "@mui/material/Select";
import Checkbox from "@mui/material/Checkbox";
import { useFormik } from "formik";
import { toast } from "react-toastify";
import axios from "axios";
import { useParams } from "react-router-dom";

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

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

const baseURL = process.env.REACT_APP_BASE_URL;

function AsignMember({ open, handleClose, fetchteam }) {
  const [personName, setPersonName] = useState([]);
  const [loading, setLoading] = useState(false);
  const [team, setTeam] = useState([]);
  const { id, eventid } = useParams();

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseURL}/photographer/team`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setTeam(response.data.users);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formik = useFormik({
    initialValues: {
      teamMemberId: [],
    },
    onSubmit: async (values) => {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        await axios.post(`${baseURL}/events/assign-team/${id || eventid}`, values, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        toast.success("Team members assigned successfully");
        formik.resetForm();
        setPersonName([]);
        fetchteam();
        handleClose();
      } catch (error) {
        // console.error(error);
        // toast.error("Failed to assign team");
      } finally {
        setLoading(false);
      }
    },
  });

  const handleChange = (event) => {
    const {
      target: { value },
    } = event;
    const selected = typeof value === "string" ? value.split(",") : value;
    setPersonName(selected);
    formik.setFieldValue("teamMemberId", selected);
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box sx={style}>
        <form onSubmit={formik.handleSubmit}>
          <div className="flex justify-between items-center">
            <h1 className="text-start text-2xl font-bold dark:text-white text-slate-700">
              Assign Member
            </h1>
            <div className="flex justify-end">
              <CloseIcon
                className="text-slate-700 cursor-pointer"
                onClick={handleClose}
              />
            </div>
          </div>
          <div className="flex flex-col">
            <label className="text-slate-700 font-semibold mt-5">
              Select Member
            </label>
            <Select
              multiple
              value={personName}
              onChange={handleChange}
              renderValue={(selected) =>
                selected
                  .map((id) => team.find((member) => member._id === id)?.name)
                  .join(", ")
              }
              MenuProps={MenuProps}
            >
              {team.map((member) => (
                <MenuItem key={member._id} value={member._id}>
                  <Checkbox checked={personName.includes(member._id)} />
                  <ListItemText primary={member.name} />
                </MenuItem>
              ))}
            </Select>
          </div>
          <div className="flex justify-end mt-5 gap-4">
          <button className="bg-bgred text-white px-4 py-2 rounded font-semibold hover:bg-bgred" onClick={handleClose}>Cancel</button>
            <button
              className="bg-blue text-white px-4 py-2 rounded font-semibold hover:bg-blueHover"
              type="submit"
              disabled={loading}
            >
              {loading ? "Assign..." : "Assign"}
            </button>
          </div>
        </form>
      </Box>
    </Modal>
  );
}

export default AsignMember;
