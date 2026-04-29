import React, { useEffect, useState } from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import MUIDataTable from "mui-datatables";
import { CircularProgress } from "@mui/material";
import axios from "axios";
import CreateTeamMember from "./CreateTeamMember";
import { toast } from "react-toastify";
import DeleteIcon from "@mui/icons-material/Delete";
import Swal from "sweetalert2";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import BoltIcon from "@mui/icons-material/Bolt";
import EditTeamMember from "./EditTeamMember";
import BorderColorIcon from "@mui/icons-material/BorderColor";

const baseurl = process.env.REACT_APP_BASE_URL;

function Team() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [team, setTeam] = useState([]);
  const [opend, setOpen] = useState(false);
  const handleClosed = () => setOpen(false);
  const [openedit, setOpenedit] = useState(false);
  const handleClosededit = () => setOpenedit(false);
  const [editid, setEditid] = useState("");
  const [permission, setPermission] = useState(false);

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseurl}/photographer/team`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setTeam(response?.data?.users);
      // console.log(response.data.users);
      setLoading(false);
      window.electronAPI.setStore("team", response.data.users);
    } catch (error) {
      setLoading(false);
      const cachedSummary = await window.electronAPI.getStore("team");
      if (cachedSummary) {
        setTeam(cachedSummary);
        // console.log(cachedSummary);
      }
      console.error("Error fetching:", error?.response?.data?.message);
      const errorMessage = error?.response?.data?.message || "";
      const statusCode = error?.response?.status;

      if (
        statusCode === 403 ||
        errorMessage ===
          "Your trial period has ended. Please upgrade to continue." ||
        errorMessage ===
          "Your trial period of 14 days has ended. Please upgrade to continue."
      ) {
        setPermission(true);
      }
    }
  };

  const data = team;

  const columns = [
    {
      name: "name",
      label: "Name",
      options: {
        filter: false,
        sort: true,
        customBodyRender: (value) => {
          return <span className="dark:text-white">{value}</span>;
        },
      },
    },
    {
      name: "phone",
      label: "Phone",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value) => {
          return <span className="dark:text-white">{value}</span>;
        },
      },
    },
    // {
    //   name: "role",
    //   label: "Role",
    //   options: {
    //     filter: false,
    //     sort: true,
    //     customBodyRender: (role) => {
    //       return <span className="dark:text-white">{role?.name}</span>;
    //     },
    //   },
    // },
    {
      name: "_id",
      label: "Action",
      options: {
        filter: false,
        sort: false,
        download: false,
        customBodyRender: (value) => {
          // console.log(value)
          return (
            <div className="flex gap-2 items-center">
              <BorderColorIcon
                className="text-green-600 cursor-pointer"
                onClick={() => handleEdit(value)}
              />
              <DeleteIcon
                className="text-red-600 cursor-pointer "
                onClick={() => handleDelete(value)}
              />
            </div>
          );
        },
      },
    },
  ];

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
  const handleBack = () => {
    navigate(-1);
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
    }).then((result) => {
      if (result.isConfirmed) {
        try {
          axios.delete(`${baseurl}/events/team/${id}/remove`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "ngrok-skip-browser-warning": "69420",
            },
          });
          toast.success("Team member deleted successfully");
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

  const handleEdit = (id) => {
    setOpenedit(true);
    setEditid(id);
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
      {permission ? ( // <-- check permission first
        <div className="bg-slate-100 p-5 rounded text-center mt-5">
          <ErrorOutlineIcon
            sx={{ fontSize: "50px" }}
            className="text-red-600"
          />
          <h1 className="text-slate-700 font-normal text-2xl">
            You do not have access to this page
          </h1>
          <p className="text-slate-700 font-normal text-sm">
            We're sorry, your plan does not have permission or upgrade to access
            this page
          </p>
          <button
            className="bg-blue rounded px-5 py-2 mt-4 text-white font-normal hover:bg-blueHoverHover"
            onClick={() => navigate("/organization/upgrade_plan")}
          >
            <BoltIcon /> Upgrade Plan
          </button>
        </div>
      ) : loading ? (
        <div className="flex justify-center mt-5">
          <CircularProgress />
        </div>
      ) : (
        <section className="bg-white p-4 rounded dark:bg-slate-800">
          <div className="flex justify-end">
            <button
              className="bg-blue text-white font-normal px-3 py-2 text-sm rounded hover:bg-blueHover"
              onClick={() => setOpen(true)}
            >
              <AddIcon sx={{ fontSize: "18px" }} /> Add Team Member
            </button>
          </div>
          <>
            <MUIDataTable
              data={data}
              columns={columns}
              options={options}
              className="no-shadow bg-white dark:bg-slate-800 dark:text-white "
            />
          </>
        </section>
      )}
      <CreateTeamMember
        open={opend}
        handleClose={handleClosed}
        fetchTeam={fetchTeam}
      />
      <EditTeamMember
        open={openedit}
        handleClose={handleClosededit}
        id={editid}
        fetchTeam={fetchTeam}
      />
    </>
  );
}

export default Team;

