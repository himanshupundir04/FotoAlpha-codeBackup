import { Box, CircularProgress, Modal } from "@mui/material";
import MUIDataTable from "mui-datatables";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import AsignMember from "./AsignMember";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";
import { useFormik } from "formik";

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
const baseUrl = process.env.REACT_APP_BASE_URL;
function Guestassignedteam() {
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("assigned");
  const [team, setTeam] = useState([]);
  const [guest, setGuest] = useState([]);
  const { eventid } = useParams();
  const [open, setOpen] = useState(false);
  const handleClose = () => setOpen(false);
  const [openhost, setOpenhost] = useState(false);
  const handleClosehost = () => setOpenhost(false);
  const [host, setHost] = useState([]);
  const [hostid, setHostid] = useState();
  const [hostload, setHostload] = useState(false);
  const [teamassign, setTeamassign] = useState([]);
  const navigate = useNavigate();

  // console.log(eventid)

  useEffect(() => {
    fetchGuest();
    fetchTeam();
    fetchHost();
    fetchTeamassign();
  }, []);

  const fetchTeam = () => {
    setLoading(true);
    axios
      .get(`${baseUrl}/photographer/event/team-assigned?eventId=${eventid}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      .then((response) => {
        // console.log(response.data.team)
        setTeam(response.data.team);
        setLoading(false);
      })
      .catch((error) => {
        setLoading(false);
        console.error("Error fetching team:", error);
      });
  };

  const fetchTeamassign = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseUrl}/photographer/team`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setTeamassign(response.data.users);
      // console.log(response.data.users);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGuest = () => {
    setLoading(true);
    axios
      .get(`${baseUrl}/photographer/event/guests?eventId=${eventid}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      .then((response) => {
        setLoading(false);
        // console.log(response.data.guests);
        setGuest(response.data.guests);
      })
      .catch((error) => {
        setLoading(false);
        console.error("Error fetching team:", error);
      });
  };

  const fetchHost = () => {
    axios
      .get(`${baseUrl}/host-access/host-requests`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      .then((response) => {
        // console.log(response.data.requests);
        setHost(response.data.requests || []);
      })
      .catch((error) => {
        console.error("Error fetching host requests:", error);
      });
  };

  const assignedTeamData = team.map((item) => ({
    name: item.user?.name || "Unknown",
    phone: item.user?.phone || "No phone",
    id: item.user?._id, // Use user ID for actions like delete
  }));

  const guestData = guest.map((item) => ({
    name: item.user?.name || "Unknown",
    phone: item.user?.phone || "No phone",
    id: item.user?._id, // Use user ID for actions like delete
  }));

  const hostData = host.map((item) => ({
    name: item.userId?.name || "Unknown",
    phone: item.phone || "No phone",
    eventId: item.eventId?.name || "No id",
    status: item.status || "No",
    id: item?._id, // Use user ID for actions like delete
  }));

  //  const guestData = guest;

  // const hostData = host;

  const assignedGuestColumns = [
    {
      name: "name",
      label: "Member",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value) => (
          <span className="dark:text-slate-700">{value}</span>
        ),
      },
    },
    {
      name: "phone",
      label: "Phone",
      options: {
        filter: false,
        sort: true,
        customBodyRender: (value) => (
          <span className="dark:text-slate-700">{value}</span>
        ),
      },
    },
    // {
    //   name: "eventRole",
    //   label: "Event Roles",
    //   options: {
    //     filter: true,
    //     sort: true,
    //     customBodyRender: (value) => (
    //       <span className="dark:text-slate-700">{value}</span>
    //     ),
    //   },
    // },
    {
      name: "id",
      label: "Action",
      options: {
        filter: false,
        customBodyRender: (value) => (
          <DeleteIcon
            className="text-red-600 cursor-pointer"
            onClick={() => handleDelete(value)}
          />
        ),
      },
    },
  ];

  const hostColumns = [
    {
      name: "name",
      label: "Guest Name",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value) => (
          <span className="dark:text-slate-700">{value}</span>
        ),
      },
    },
    {
      name: "phone",
      label: "Phone",
      options: {
        filter: false,
        sort: true,
        customBodyRender: (value) => (
          <span className="dark:text-slate-700">{value}</span>
        ),
      },
    },
    {
      name: "eventId",
      label: "Event Name",
      options: {
        filter: false,
        sort: true,
        customBodyRender: (value) => (
          <span className="dark:text-slate-700">{value}</span>
        ),
      },
    },
    {
      name: "status",
      label: "Status",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value) => {
          const color =
            value === "approved" ? "text-green-600" : "text-red-500";
          return (
            <span
              className={`${color} dark:text-slate-700 capitalize font-normal`}
            >
              {value}
            </span>
          );
        },
      },
    },
    {
      name: "id",
      label: "Action",
      options: {
        filter: false,
        sort: false,
        download: false,
        customBodyRender: (value) => {
          return (
            <button
              className={`text-blue rounded font-normal py-1 px-3 `}
              onClick={() => handleOpenhost(value)}
            >
              <EditIcon />
            </button>
          );
        },
      },
    },
  ];

  const options = {
    filterType: "checkbox",
    selectableRows: "none",
    print: false,
    download: true,
    viewColumns: false,
    filter: true,
    search: true,
    pagination: true,
  };

  const handleDelete = (id) => {
    // console.log(id);
    Swal.fire({
      title: "Are you sure?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        await axios
          .delete(`${baseUrl}/events/assign-team/${eventid}/${id}/revoke`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "ngrok-skip-browser-warning": "69420",
            },
          })
          .then((res) => {
            toast.success("Event deleted successfully", { autoClose: 1000 });
            setTimeout(() => {
              fetchTeam();
            }, 500);
          })
          .catch((err) => {
            toast.error(
              err?.response?.data?.message || "Something went wrong",
              { autoClose: 1000 }
            );
            console.log(err);
          });
      }
    });
  };

  const handleOpenhost = (id) => {
    setOpenhost(true);
    setHostid(id);
  };

  const formik = useFormik({
    initialValues: {
      status: "",
    },
    onSubmit: async (values) => {
      setHostload(true);
      if (values.status === "") {
        setHostload(false);
        return;
      }
      try {
        const response = await axios.post(
          `${baseUrl}/host-access/host-request/${hostid}/status`,
          values,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "ngrok-skip-browser-warning": "69420",
              "Content-Type": "application/json",
            },
          }
        );
        // console.log(response);
        toast.success(response?.data?.message, { autoClose: 1000 });
        setHostload(false);
        formik.resetForm();
        fetchHost();
        handleClosehost();
      } catch (err) {
        setHostload(false);
        toast.error(err?.response?.data?.message || "Something went wrong", {
          autoClose: 1000,
        });
        console.log(err);
      }
    },
  });

  return (
    <>
      <style>
        {`
          .no-shadow {
            box-shadow: none !important;
          }
          .tss-1h9t3sl-MUIDataTableHeadCell-sortAction {
            font-weight: bold !important;
          }
          .MuiTableCell-head {
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: hidden;
          }
          .css-1fnc9ax-MuiButtonBase-root-MuiButton-root {
            padding: 5px 0px;
            justify-content: start;
          }
        `}
      </style>
      <section>
        <div className="flex gap-5 mt-5 md:mt-0">
          <button
            className={`btn px-3 py-2 text-sm font-semibold rounded shadow-md  ${
              view === "assigned"
                ? "bg-blue  text-white"
                : "bg-white  text-slate-700"
            }`}
            onClick={() => setView("assigned")}
          >
            Assigned Team
          </button>
          <button
            className={`btn px-3 py-2 text-sm font-semibold rounded shadow-md ${
              view === "guest"
                ? "bg-blue text-white"
                : "bg-white text-slate-700"
            }`}
            onClick={() => setView("guest")}
          >
            Guest
          </button>
          <button
            className={`btn px-3 py-2 text-sm font-semibold rounded shadow-md ${
              view === "host" ? "bg-blue text-white" : "bg-white text-slate-700"
            }`}
            onClick={() => setView("host")}
          >
            Host Request
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center mt-5">
            <CircularProgress />
          </div>
        ) : (
          <>
            {view === "assigned" &&
              (teamassign.length === 0 ? (
                <div className="flex justify-end mt-5 md:mt-0">
                <button
                  className="bg-blue text-white font-normal px-4 py-2 rounded hover:bg-blueHover"
                  onClick={() => navigate("/organization/team")}
                >
                  <AddIcon /> Add Team Member
                </button>
                </div>
              ) : (
                <div className="flex justify-end mt-5 md:mt-0">
                  <button
                    className="bg-blue py-2 px-3 text-sm rounded font-normal text-white"
                    onClick={() => setOpen(true)}
                  >
                    <AddIcon sx={{ fontSize: "18px" }} /> Assigned Team Member
                  </button>
                </div>
              ))}

            <MUIDataTable
              data={
                view === "assigned"
                  ? assignedTeamData
                  : view === "guest"
                  ? guestData
                  : hostData
              }
              columns={view === "host" ? hostColumns : assignedGuestColumns}
              options={options}
              className="no-shadow bg-white dark:bg-slate-800 dark:text-white mt-5"
            />
          </>
        )}
      </section>
      <AsignMember
        open={open}
        handleClose={handleClose}
        fetchteam={fetchTeam}
      />
      <Modal
        open={openhost}
        onClose={handleClosehost}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <div className="flex justify-between items-center">
            <h2 className="text-slate-700 font-normal text-lg">Host Request</h2>
            <CloseIcon
              className="text-slate-700 cursor-pointer"
              onClick={() => {
                handleClosehost();
              }}
            />
          </div>
          <form onSubmit={formik.handleSubmit}>
            <div className="border border-slate-700 rounded p-2 mt-5 mb-5">
              <select
                className="text-slate-700 w-full dark:text-white outline-none font-normal"
                value={formik.values.status}
                name="status"
                onChange={formik.handleChange}
              >
                <option value="" disabled>
                  Select Status
                </option>
                <option value="approved">Approved</option>
                <option value="rejected">Reject</option>
              </select>
            </div>
            <div className="flex justify-end items-center gap-3">
              <button className="bg-bgred text-white font-normal rounded py-2 px-4 hover:bg-bgredHover">
                Cancel
              </button>
              <button
                className="bg-blue text-white font-normal rounded py-2 px-4 hover:bg-blueHover"
                type="submit"
                disabled={hostload}
              >
                {hostload ? "Submit..." : "Submit"}
              </button>
            </div>
          </form>
        </Box>
      </Modal>
    </>
  );
}

export default Guestassignedteam;

