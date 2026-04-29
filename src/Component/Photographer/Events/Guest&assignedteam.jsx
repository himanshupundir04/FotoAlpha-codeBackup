import { Box, CircularProgress, Modal, IconButton, Tooltip } from "@mui/material";
import MUIDataTable from "mui-datatables";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import AsignMember from "./AsignMember";
import CreateTeamMember from "../Team/CreateTeamMember";
import Swal from "sweetalert2";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";
import { useFormik } from "formik";
import { toast } from "react-toastify";

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
function Guestassignedteam({ initialView = "assigned" }) {
  const getViewFromInput = (value) => {
    const normalizedView = String(value || "").toLowerCase();

    if (["assigned", "guest", "host"].includes(normalizedView)) {
      return normalizedView;
    }

    return "assigned";
  };

  const [loading, setLoading] = useState(false);
  const [view, setView] = useState(() => getViewFromInput(initialView));
  const [team, setTeam] = useState([]);
  const [teamassign, setTeamassign] = useState([]);
  const [guest, setGuest] = useState([]);
  const { slotid } = useParams();
  const [open, setOpen] = useState(false);
  const handleClose = () => setOpen(false);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const handleCloseCreateModal = () => {
    setOpenCreateModal(false);
    fetchTeamassign();
  };
  const [openhost, setOpenhost] = useState(false);
  const handleClosehost = () => setOpenhost(false);
  const [host, setHost] = useState([]);
  const [hostid, setHostid] = useState();
  const [hostload, setHostload] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchGuest();
    fetchTeam();
    fetchHost();
    fetchTeamassign();
  }, []);

  useEffect(() => {
    setView(getViewFromInput(initialView));
  }, [initialView]);

  const fetchTeam = () => {
    axios
      .get(`${baseUrl}/photographer/event/team-assigned?eventId=${slotid}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      .then((response) => {
        setTeam(response.data.team);
      })
      .catch((error) => {
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
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGuest = () => {
    setLoading(true);
    axios
      .get(`${baseUrl}/photographer/event/guests?eventId=${slotid}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      .then((response) => {
        setLoading(false);
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
        setHost(response.data.requests || []);
      })
      .catch((error) => {
        console.error("Error fetching host requests:", error);
      });
  };

  const assignedGuestColumns = [
    {
      name: "name",
      label: "Member",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value) => (
          <span className="dark:text-white">{value}</span>
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
          <span className="dark:text-white">{value}</span>
        ),
      },
    },
    {
      name: "id",
      label: "Action",
      options: {
        filter: false,
        sort: false,
        download: false,
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
        filter: false,
        sort: true,
        customBodyRender: (value) => (
          <span className="dark:text-white">{value}</span>
        ),
      },
    },
    {
      name: "phone",
      label: "Phone Number",
      options: {
        filter: false,
        sort: true,
        customBodyRender: (value) => (
          <span className="dark:text-white">{value}</span>
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
          <span className="dark:text-white">{value}</span>
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
          const status = String(value || "").toLowerCase();
          const isApproved = status === "approved";
          const isPending = status === "pending";
          const isRejected = status === "rejected";

          if (isApproved) {
            return (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#ccf2ff] text-[#008299] font-bold text-[9px] uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-[#008299]"></span>
                APPROVED
              </div>
            );
          }
          if (isPending) {
            return (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#ffe5e5] text-[#b30000] font-bold text-[9px] uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-[#b30000]"></span>
                PENDING
              </div>
            );
          }
          if (isRejected) {
            return (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-500 font-bold text-[9px] uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                REJECTED
              </div>
            );
          }

          return (
            <span className="capitalize font-normal dark:text-white">{value}</span>
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

  const assignedTeamData = team.map((item) => ({
    name: item.user?.name || "Unknown",
    phone: item.user?.phone || "No phone",
    id: item.user?._id,
  }));

  const guestData = guest.map((item) => ({
    name: item.user?.name || "Unknown",
    phone: item.user?.phone || "No phone",
    id: item.user?._id,
  }));

  const hostData = host.map((item) => ({
    name: item.userId?.name || "Unknown",
    phone: item?.userId?.phone || item?.eventId?.hostMobile || "No phone",
    email: item?.userId?.email || "No email",
    eventId: item.eventId?.name || "No id",
    status: item.status || "No",
    id: item?._id,
  }));

  const options = {
    responsive: "standard",
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
    Swal.fire({
      title: "Are you sure?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Remove it!",
    }).then((result) => {
      if (result.isConfirmed) {
        axios
          .delete(`${baseUrl}/events/assign-team/${slotid}/${id}/revoke`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "ngrok-skip-browser-warning": "69420",
            },
          })
          .then((res) => {
            toast.success("Team member remove successfully", {
              autoClose: 1000,
            });
            fetchTeam();
          })
          .catch((err) => {
            toast.error(
              err?.response?.data?.message || "Something went wrong",
              { autoClose: 1000 },
            );
            console.log(err);
          });
      }
    });
  };

  const handleOpenhost = (id) => {
    const request = host.find((h) => h._id === id);
    setSelectedRequest(request);
    setOpenhost(true);
    setHostid(id);
  };

  const handleAction = async (actionStatus) => {
    setHostload(true);
    try {
      const response = await axios.post(
        `${baseUrl}/host-access/host-request/${hostid}/status`,
        { status: actionStatus },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "ngrok-skip-browser-warning": "69420",
            "Content-Type": "application/json",
          },
        },
      );
      toast.success(response?.data?.message, { autoClose: 1000 });
      setHostload(false);
      fetchHost();
      handleClosehost();
    } catch (err) {
      setHostload(false);
      toast.error(err?.response?.data?.message || "Something went wrong", {
        autoClose: 1000,
      });
      console.log(err);
    }
  };

  const formik = useFormik({
    initialValues: {
      status: "",
    },
    onSubmit: async (values) => {
      handleAction(values.status);
    },
  });

  return (
    <>
      <style>
        {`
          .no-shadow {
            box-shadow: none !important;
          }
          .MuiTableCell-root.MuiTableCell-head{
                font-weight: bold !important;
                color: #212935ff;
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
            className={`btn px-3 py-2 text-sm font-normal rounded shadow-md  ${view === "assigned"
              ? "bg-blue text-white"
              : "bg-white text-slate-700"
              }`}
            onClick={() => setView("assigned")}
          >
            Assigned Team
          </button>
          <button
            className={`btn px-3 py-2 text-sm font-normal rounded shadow-md ${view === "guest"
              ? "bg-blue text-white"
              : "bg-white text-slate-700"
              }`}
            onClick={() => setView("guest")}
          >
            Guest
          </button>
          <button
            className={`btn px-3 py-2 text-sm font-normal rounded shadow-md ${view === "host" ? "bg-blue text-white" : "bg-white text-slate-700"
              }`}
            onClick={() => setView("host")}
          >
            Host Request
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-96">
            <CircularProgress className="text-blue-600" />
            <p className="mt-4 text-slate-600 dark:text-slate-300">
              Loading...
            </p>
          </div>
        ) : (
          <>
            {view === "assigned" &&
              (teamassign.length === 0 ? (
                <div className="flex justify-end mt-5 md:mt-0">
                  <button
                    className="bg-blue py-2 px-3 text-sm rounded font-normal text-white"
                    onClick={() => setOpenCreateModal(true)}
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
      <CreateTeamMember
        open={openCreateModal}
        handleClose={handleCloseCreateModal}
        fetchTeam={fetchTeamassign}
      />
      <Modal
        open={openhost}
        onClose={handleClosehost}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={{
          ...style,
          width: { xs: '95%', sm: 550 },
          p: 0,
          borderRadius: '24px',
          overflow: 'hidden',
          border: 'none',
          bgcolor: 'white'
        }}>
          {/* Header Bar */}
          <div className="bg-[#0b8599] h-20 relative flex items-center justify-end px-4">
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <IconButton
                onClick={handleClosehost}
                sx={{
                  color: 'white',
                  bgcolor: 'rgba(255,255,255,0.2)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                  width: 32,
                  height: 32
                }}
              >
                <CloseIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 relative">
            {/* Profile & Info Row - Side by Side */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 -mt-12 mb-6">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white p-1 shadow-xl overflow-hidden border border-slate-100 flex-shrink-0">
                {selectedRequest?.userId?.avatarSignedUrl ? (
                  <img
                    src={selectedRequest.userId.avatarSignedUrl}
                    alt={selectedRequest.userId.name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center rounded-xl">
                    <span className="text-slate-400 font-bold text-3xl">
                      {selectedRequest?.userId?.name ? selectedRequest.userId.name[0].toUpperCase() : '?'}
                    </span>
                  </div>
                )}
              </div>

              <div className="text-center sm:text-left pt-2 sm:pt-14 flex-1">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white leading-tight">
                  {selectedRequest?.userId?.name || 'Guest User'}
                </h3>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1">
                  <span className="text-[10px] font-bold tracking-widest text-[#0b8599] uppercase">
                    GUEST • REQUESTER
                  </span>
                  <div className="hidden sm:block w-1 h-1 bg-slate-300 rounded-full"></div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    ACCESS TO: <span className="text-slate-600 dark:text-slate-300">{selectedRequest?.eventId?.name || 'Event'}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Message Area - More Compact */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 mb-6 border border-slate-100 dark:border-slate-700">
              <p className="text-[9px] font-bold text-[#0b8599] uppercase tracking-widest mb-1">
                HOST MESSAGE
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 italic leading-relaxed">
                "I'd love to see the photos from {selectedRequest?.eventId?.name || 'this event'}! {selectedRequest?.eventId?.hostName || 'The host'} mentioned the shots were incredible and I can't wait to see the collection."
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => handleAction('approved')}
                disabled={hostload}
                className="flex-[1.5] bg-[#0b8599] hover:bg-[#086a7a] text-white py-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                {hostload ? 'PROCESSING...' : (
                  <>
                    <span className="w-4 h-4 rounded-full border border-white flex items-center justify-center text-[10px]">✓</span>
                    APPROVE REQUEST
                  </>
                )}
              </button>
              <button
                onClick={() => handleAction('rejected')}
                disabled={hostload}
                className="flex-1 bg-white hover:bg-slate-50 text-slate-500 py-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all border border-slate-200 shadow-sm active:scale-95 disabled:opacity-50"
              >
                {hostload ? '...' : (
                  <>
                    <span className="w-4 h-4 rounded-full border border-slate-400 flex items-center justify-center text-[10px]">✕</span>
                    REJECT
                  </>
                )}
              </button>
            </div>

            <div className="mt-6 text-center">
              <button className="text-[10px] font-bold text-slate-400 hover:text-[#0b8599] transition-colors uppercase tracking-widest">
                NEED MORE INFO? CONTACT REQUESTER
              </button>
            </div>
          </div>
        </Box>
      </Modal>
    </>
  );
}

export default Guestassignedteam;
