import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import MUIDataTable from "mui-datatables";
import { CircularProgress } from "@mui/material";
import AsignMember from "./AsignMember";
import axios from "axios";
import { toast } from "react-toastify";
import DeleteIcon from "@mui/icons-material/Delete";
import Swal from "sweetalert2";
import CreateTeamMember from "../Team/CreateTeamMember"

const baseurl = process.env.REACT_APP_BASE_URL;

function ManageTeam() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [team, setTeam] = useState([]);
  const [teamassign, setTeamassign] = useState([]);
  const [open, setOpen] = useState(false);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const handleClose = () => setOpen(false);
  const handleCloseCreateModal = () => {
    setOpenCreateModal(false);
    fetchTeamassign();
  };
// console.log(id)

  useEffect(() => {
    fetchTeam();
    fetchTeamassign();
  }, []);

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${baseurl}/photographer/event/team-assigned?eventId=${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setTeam(response.data.team || []);
    } catch (error) {
      console.error("Error fetching team:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamassign = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseurl}/photographer/team`, {
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

    const Data = team.map((item) => ({
  name: item.user?.name,
   phone: item.user?.phone,
  id: item.user?._id,
}));

  const columns = [
    {
      name: "name",
      label: "Name",
      options: {
        filter: false,
        sort: true,
        customBodyRender: (value, tableMeta) => {
          const rowIndex = tableMeta.rowIndex;
          return (
            <span className="dark:text-slate-400">
              {value}
            </span>
          );
        },
      },
    },
    {
      name: "phone",
      label: "Phone",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value, tableMeta) => {
          const rowIndex = tableMeta.rowIndex;
          return (
            <span className="dark:text-slate-400">
              {value}
            </span>
          );
        },
      },
    },
    // {
    //   name: "role",
    //   label: "Role",
    //   options: {
    //     filter: true,
    //     sort: true,
    //     customBodyRender: (value, tableMeta) => {
    //       const rowIndex = tableMeta.rowIndex;
    //       return (
    //         <span className="dark:text-slate-400">
    //           {team[rowIndex]?.user?.role?.name || "—"}
    //         </span>
    //       );
    //     },
    //   },
    // },
     {
      name: "id",
      label: "Action",
      options: {
        filter: false,
        sort: false,
        download: false,
        customBodyRender: (value) => {
          // console.log(value)
          return (
            <>              
              <DeleteIcon className="text-red-500 cursor-pointer " onClick={() => handleDelete(value)}/>
            </>
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

  const handleBack = () => {
    navigate(-1);
  };

  const handleDelete = (teamid) => {
    // console.log(id);
    Swal.fire({
      title: "Are you sure?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Delete it!",
    }).then(async(result) => {
      if (result.isConfirmed) {
        try {
         await axios.delete(`${baseurl}/events/assign-team/${id}/${teamid}/revoke`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "ngrok-skip-browser-warning": "69420",
            },
          })
          // toast.success("Team member deleted successfully");
          setTimeout(() => {
            fetchTeam();            
          }, 500);
        } catch (err) {
          toast.error(err?.response?.data?.message || "Something went wrong");
          console.log(err);
        }
      }
    });
  };


  return (
    <>
      <style>
        {`
            .no-shadow {
            box-shadow: none !important;
            }
            .tss-1h9t3sl-MUIDataTableHeadCell-sortAction{
                font-weight: bold !important;
            }
            .MuiTableCell-head {
                white-space: nowrap;
                text-overflow: ellipsis;
                overflow: hidden;
            }
            .css-1fnc9ax-MuiButtonBase-root-MuiButton-root{
             padding: 5px 0px;
              justify-content: start;
            }
            .tss-1vd39vz-MUIDataTableBodyCell-stackedCommon:nth-last-of-type(2){
            display:none;
            }
        `}
      </style>
      <section className="bg-white p-4 rounded dark:bg-slate-800">
        <div className="flex justify-between">
          <div className="flex items-center">
            <ArrowBackIcon
              sx={{ fontSize: "30px" }}
              className="bg-slate-300 p-1 rounded text-white cursor-pointer"
              onClick={handleBack}
            />
            {/* <h1 className="text-3xl font-bold text-slate-700 dark:text-white ml-2">
              Manage Team
            </h1> */}
          </div>
          {teamassign.length === 0 ? (
            <button
              className="bg-blue text-white font-normal px-4 py-2 rounded hover:bg-blueHover"
              onClick={() => setOpenCreateModal(true)}
            >
              <AddIcon /> Add Team Member
            </button>
          ) : (
            <button
              className="bg-blue text-white font-normal px-4 py-2 rounded hover:bg-blueHover"
              onClick={() => setOpen(true)}
            >
              <AddIcon /> Assign Team Member
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center mt-5">
            <CircularProgress />
          </div>
        ) : (
          <MUIDataTable
            data={Data}
            columns={columns}
            options={options}
            className="no-shadow bg-white dark:bg-slate-800 dark:text-white mt-5"
          />
        )}
      </section>

      <AsignMember
        open={open}
        handleClose={handleClose}
        fetchteam={fetchTeam}
        teamassign={teamassign}
      />
      <CreateTeamMember
        open={openCreateModal}
        handleClose={handleCloseCreateModal}
        fetchTeam={fetchTeamassign}
      />
    </>
  );
}

export default ManageTeam;

