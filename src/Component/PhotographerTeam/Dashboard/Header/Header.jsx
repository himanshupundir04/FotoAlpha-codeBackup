import React, { useState, useEffect } from "react";
import BedtimeIcon from "@mui/icons-material/Bedtime";
import {
  Avatar,
  Dialog,
   DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import SettingsIcon from "@mui/icons-material/Settings";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import LoginModel from "./LoginModel";
import SignupModel from "./SignupModel";
import VerifyModel from "./VerifyModel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import demo from "../../../image/demo.jpg";
import Notification from "./Notification"
import axios from "axios";
import Swal from "sweetalert2";

const baseURL = process.env.REACT_APP_BASE_URL
function Header() {
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );
  const users = JSON.parse(localStorage.getItem("users")) || [];
  const currentUser = users.find((u) => u.isCurrent);

  const sortedUsers = [
    ...users.filter((u) => u._id === currentUser?._id),
    ...users.filter((u) => u._id !== currentUser?._id),
  ];
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const [accountEl, setAccountEl] = useState(null);
  const opend = Boolean(accountEl);
  const [opendialog, setOpendialog] = useState(false);
  const [openlogin, setOpenlogin] = useState(false);
  const handleOpenlogin = () => setOpenlogin(true);
  const handleClosedlogin = () => setOpenlogin(false);
  const [opensignup, setOpensignup] = useState(false);
  const handleOpensignup = () => setOpensignup(true);
  const handleClosedsignup = () => setOpensignup(false);
  const [openveify, setOpenverify] = useState(false);
  const handleOpenverify = () => setOpenverify(true);
  const handleClosedverify = () => setOpenverify(false);
  const [openNotifiaction, setOpenNotifiaction] = useState(false);
  const avatar = localStorage.getItem("avatar");
  const [profile, setProfile] = useState()
   const [fullProfileData, setFullProfileData] = useState(null);
  const [invitationStatus, setInvitationStatus] = useState(null);
  const [invitationDialogOpen, setInvitationDialogOpen] = useState(false);
  const [invitationLoading, setInvitationLoading] = useState(false);
  const [confirmRejectDialogOpen, setConfirmRejectDialogOpen] = useState(false);
  const navigate = useNavigate();

  // console.log("user:", users);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleadd = () => {
    handleClosed();
    setTimeout(() => {
      handleClickOpen();
    }, 200);
  };

  const handleClickd = (event) => {
    setAccountEl(event.currentTarget);
  };

  const handleClosed = () => {
    setAccountEl(null);
  };

  const handleClickOpen = () => {
    setOpendialog(true);
  };

  const handleClosedialog = (value) => {
    setOpendialog(false);
  };

  // const handleLogout = () => {
  //   dispatch(logout());
  //   handleClose();
  //   navigate("/");
  // };

    useEffect(() => {
      fetchEvents();
    }, []);
  
    const fetchEvents = async () => {
      
      axios
        .get(`${baseURL}/photographer-team/profile`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "ngrok-skip-browser-warning": "69420",
          },
        })
        .then((response) => {        
          setProfile(response.data);
          localStorage.setItem("avatar", response?.data?.avatarUrl)
          // console.log(response.data);
           // Store full profile data and check invitation status
          setFullProfileData(response.data);
          const status = response.data?.invitationStatus;
          setInvitationStatus(status);
          
          // Show invitation dialog if status is pending
          if (status === "pending") {
            setInvitationDialogOpen(true);
          }
        })
       .catch((error) => {
        console.log(error);

        if (
          error?.response?.status === 401 ||
          error?.response?.data?.message ===
            "The user belonging to this token no longer exists."
        ) {
          // Clear stored auth data
          localStorage.clear();

          // Redirect to login
          window.location.href = "/login";
        }
      });
    };

     // Handle accepting the invitation
  const handleAcceptInvitation = async () => {
    setInvitationLoading(true);
    try {
      const response = await axios.patch(
        `${baseURL}/photographer-team/invitation/accept`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "ngrok-skip-browser-warning": "69420",
          },
        }
      );
      
      // Close dialog and refresh profile
      setInvitationDialogOpen(false);
      setInvitationStatus("accepted");
      fetchEvents();
      
      // Show success message (using console for now, can be replaced with toast)
      console.log("Invitation accepted successfully");
    } catch (error) {
      console.error("Error accepting invitation:", error?.response?.data?.message || error.message);
    } finally {
      setInvitationLoading(false);
    }
  };

  // Handle rejecting the invitation
  const handleRejectInvitation = async () => {
    setInvitationLoading(true);
    try {
      const response = await axios.patch(
        `${baseURL}/photographer-team/invitation/reject`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "ngrok-skip-browser-warning": "69420",
          },
        }
      );
      
      // Close dialog and refresh profile
      setInvitationDialogOpen(false);
      setInvitationStatus("rejected");
      fetchEvents();
      
      // Show success message (using console for now, can be replaced with toast)
      console.log("Invitation rejected successfully");
    } catch (error) {
      console.error("Error rejecting invitation:", error?.response?.data?.message || error.message);
    } finally {
      setInvitationLoading(false);
    }
  };

  // Handle opening confirmation dialog for rejecting invitation
  const handleOpenConfirmRejectDialog = () => {
    setConfirmRejectDialogOpen(true);
  };

  // Handle closing confirmation dialog
  const handleCloseConfirmRejectDialog = () => {
    setConfirmRejectDialogOpen(false);
  };

  // Handle closing invitation dialog
  const handleCloseInvitationDialog = () => {
    setInvitationDialogOpen(false);
  };

  // const handleLogout = () => {
  //   let users = JSON.parse(localStorage.getItem("users")) || [];

  //   // Find current user by isCurrent flag
  //   const currentUser = users.find((u) => u.isCurrent);

  //   if (!currentUser) {
  //     // No current user found — maybe already logged out
  //     navigate("/");
  //     return;
  //   }

  //   // Remove current user from array
  //   users = users.filter((u) => u._id !== currentUser._id);

  //   // Update users array and remove token data
  //   localStorage.setItem("users", JSON.stringify(users));
  //   localStorage.removeItem("token");

  //   if (users.length > 0) {
  //     // Set the next user as current
  //     users[0].isCurrent = true;
  //     localStorage.setItem("users", JSON.stringify(users));
  //     localStorage.setItem("token", users[0].token);
  //     navigate("/"); // or redirect based on role of users[0]
  //   } else {
  //     // No users left, go to login
  //     navigate("/");
  //   }
  // };

  const handleLogout = () => {
    // console.log(id);
    handleClose();
    handleClosed();
    Swal.fire({
      title: "Are you sure? You want to logout!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      confirmButtonText: "Yes",
    }).then(async (result) => {
      if (result.isConfirmed) {
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

    if (users.length > 0) {
      // Set the next user as current
      users[0].isCurrent = true;
      localStorage.setItem("users", JSON.stringify(users));
      localStorage.setItem("token", users[0].token);
      navigate("/"); // or redirect based on role of users[0]
    } else {
      // No users left, go to login
      navigate("/");
    }
      }
    });
  };

  const handleExisting = () => {
    handleClosedialog();
    handleOpenlogin();
  };

  const handleNew = () => {
   navigate("/register")
  };

  const handleAccount = () => {
    navigate("profile");
    handleClose();
    handleClosed();
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const handleSwitch = (userId) => {
    let users = JSON.parse(localStorage.getItem("users")) || [];

    users = users.map((u) => ({
      ...u,
      isCurrent: u._id === userId, // Set only one user as current
    }));

    const selected = users.find((u) => u._id === userId);

    if (selected) {
      localStorage.setItem("users", JSON.stringify(users));
      localStorage.setItem("token", selected.token);
      localStorage.setItem("refreshToken", selected.refreshToken);
      // Optional: navigate based on role
    }
    const role = selected.role.name;
    // console.log(res.data.data.user.role.name);

    if (role === "photographer") {
      navigate("/photographer/dashboard");
    } else if (role === "guest") {
      navigate("/guest/my_events");
    } else if (role === "superadmin") {
      navigate("/superadmin/dashboard");
    } else if (role === "photographer-team") {
      navigate("/photographer_team/dashboard");
    } else if (role === "admin_support") {
      navigate("/admin_support/dashboard");
    } else if (role === "organization") {
      navigate("/organization/dashboard");
    }
    window.location.reload()
  };

  return (
    <>
      <style>
        {`
        #demo-positioned-menu li{
        font-weight: 600;
        color: #334155;
        }
          .dialog ul{
          padding:10px;
          min-width:300px
          }
          #account-menu .css-1toxriw-MuiList-root-MuiMenu-list{
          min-width:230px;
          padding: 0;
          }
          #account-menu .css-1toxriw-MuiList-root-MuiMenu-list li{
          padding: 10px 15px;
          }
        
        `}
      </style>
      <div className="flex justify-end items-center p-1 light:bg-white w-webkit-fill-available">
        {/* <div className="flex flex-col">
          <div
            className="flex items-center cursor-pointer ml-2"
            id="account-menu"
            aria-controls={opend ? "account-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={opend ? "true" : undefined}
            onClick={handleClickd}
          >
            <h3 className="text-slate-700 font-bold  dark:text-white">
              {currentUser?.username}
            </h3>
            <KeyboardArrowDownIcon className="ml-1 dark:text-white" />
            <p className="text-white bg-blue px-2 rounded-full ml-1 capitalize text-sm">
              {currentUser?.role?.name}
            </p>
          </div>
          <Menu
            id="account-menu"
            aria-labelledby="account-menu"
            anchorEl={accountEl}
            open={opend}
            onClose={handleClosed}
            anchorOrigin={{
              vertical: "top",
              horizontal: "left",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "left",
            }}
            className="mt-9"
          >
            {sortedUsers.map((user, index) => (
              <MenuItem
                onClick={() => handleSwitch(user._id)}
                sx={{
                  // backgroundColor:
                  //   user._id === currentUser?._id ? "#dbeafe" : "inherit",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
                key={user._id}
              >
                <div className="flex items-center gap-2 text-slate-700">
                  <Avatar src={user?.avatar || avatar || demo} sx={{ width: 28, height: 28 }} />
                  {user?.name}
                </div>
                {user._id === currentUser?._id && (
                  <CheckCircleIcon color="primary" />
                )}
              </MenuItem>
            ))}
            <Divider />
            <MenuItem onClick={handleadd}>
              <div className="flex items-center gap-2 text-blue">
                <AddCircleOutlineIcon /> &nbsp;Add Account
              </div>
            </MenuItem>
          </Menu>
        </div>
        <Dialog
          onClose={handleClosedialog}
          open={opendialog}
          className="dialog"
        >
          <DialogTitle>Add Account</DialogTitle>
          <List sx={{ pt: 0 }}>
            <ListItem
              className="border border-blue text-center rounded-full bg-blue"
              disablePadding
              onClick={handleExisting}
            >
              <ListItemButton autoFocus>
                <ListItemText
                  primary="Log in to existing account"
                  className="text-white text-center"
                />
              </ListItemButton>
            </ListItem>
            <ListItem
              className="border border-slate-400 text-center rounded-full mt-3"
              disablePadding
              onClick={handleNew}
            >
              <ListItemButton autoFocus>
                <ListItemText
                  primary="Create new account"
                  className="text-center"
                />
              </ListItemButton>
            </ListItem>
          </List>
        </Dialog> */}
        <div className="flex justify-end items-center space-x-3 me-3 dark:text-white">         
            <Notification/>  
            {/* <BedtimeIcon
            sx={{ fontSize: "22px" }}
              className="cursor-pointer"
              onClick={() => setDarkMode(!darkMode)}
            /> */}
           <div className="flex flex-col">
            <div
              className="flex items-center cursor-pointer gap-2"
              id="account-menu"
              aria-controls={opend ? "account-menu" : undefined}
              aria-haspopup="true"
              aria-expanded={opend ? "true" : undefined}
              onClick={handleClickd}
            >
              <Avatar
                src={profile || users?.avatar || avatar || "/broken-image.jpg"} 
                sx={{ width: 22, height: 22 }}
              />
              <h3 className="text-slate-700 font-normal dark:text-white capitalize max-w-20 truncate">
                {currentUser?.name}
              </h3>
              <KeyboardArrowDownIcon className=" dark:text-white text-slate-700" />
              {/* <p className="text-white bg-blue px-2 pb-[2px] text-sm rounded-full ml-1 capitalize font-normal">
                {currentUser?.role?.name ||
                  (role === "6819c1cc60fcb9a082b910b2" ? "photographer" : "")}
              </p> */}
            </div>
            <Menu
              id="account-menu"
              aria-labelledby="account-menu"
              anchorEl={accountEl}
              open={opend}
              onClose={handleClosed}
              anchorOrigin={{
                vertical: "top",
                horizontal: "left",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "left",
              }}
              className="mt-9 rounded-lg shadow-lg"
            > 
              <div className="flex items-center gap-2 px-4 py-3 cursor-pointer" onClick={handleAccount}>
                <Avatar
                  src={
                    profile || users?.avatar || avatar || "/broken-image.jpg"
                  }                  
                  sx={{ width: 32, height: 32 }}
                />
                <div className="flex flex-col">
                  <p className="text-slate-700 font-normal">
                    {currentUser?.username}
                  </p>
                  <p className="text-blue text-sm rounded-full capitalize font-normal">
                    {currentUser?.role?.name}
                  </p>
                </div>
              </div>
              <Divider />
              {sortedUsers.map((user, index) => (
                <MenuItem
                  onClick={() => {
                    handleSwitch(user._id);
                    handleClosed();
                  }}
                  sx={{                   
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                  key={user._id}
                >
                  <div className="flex items-center gap-2 text-slate-700">
                    <Avatar
                      src={user?.avatar || avatar || "/broken-image.jpg"}
                      sx={{ width: 28, height: 28 }}
                    />
                    {user?.name}
                  </div>
                  {user._id === currentUser?._id && (
                    <CheckCircleIcon color="primary" />
                  )}
                </MenuItem>
              ))}
              <MenuItem onClick={handleadd}>
                <div className="flex items-center gap-2 text-blue">
                  <p>
                    <AddCircleOutlineIcon sx={{ fontSize: "18px" }} /> &nbsp;Add
                    Account
                  </p>
                </div>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleAccount}>
                <SettingsIcon sx={{ fontSize: "18px" }} />
                &nbsp; Profile Setting
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <ExitToAppIcon sx={{ fontSize: "18px" }} /> &nbsp;Signout
              </MenuItem>
            </Menu>
          </div>
          <Dialog
            onClose={handleClosedialog}
            open={opendialog}
            className="dialog"
          >
            <h2 className="text-slate-700 font-normal px-5 py-3 text-xl">
              Add Account
            </h2>
            <List sx={{ pt: 0 }}>
              <ListItem
                className="border border-blue text-center rounded-full bg-blue"
                disablePadding
                onClick={handleExisting}
              >
                <ListItemButton autoFocus>
                  <ListItemText
                    primary="Log in to existing account"
                    className="text-white text-center"
                  />
                </ListItemButton>
              </ListItem>
              <ListItem
                className="border border-slate-400 text-center rounded-full mt-3"
                disablePadding
                onClick={handleNew}
              >
                <ListItemButton autoFocus>
                  <ListItemText
                    primary="Create new account"
                    className="text-center"
                  />
                </ListItemButton>
              </ListItem>
            </List>
          </Dialog>
          {/* <Avatar
            src={profile || users?.avatarUrl || avatar || "/broken-image.jpg"}
            id="demo-positioned-button"
            aria-controls={open ? "demo-positioned-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={open ? "true" : undefined}
            onClick={handleClick}
            sx={{ width: 30, height: 30 }}
            className="cursor-pointer"
          />
          <Menu
            id="demo-positioned-menu"
            aria-labelledby="demo-positioned-button"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            anchorOrigin={{
              vertical: "top",
              horizontal: "left",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "left",
            }}
            className="mt-9"
          >
            <MenuItem onClick={handleAccount}>
              <SettingsIcon />
              &nbsp; Profile Setting
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ExitToAppIcon /> &nbsp;Signout
            </MenuItem>
          </Menu> */}
        </div>
      </div>

      {/* Invitation Dialog - Shows when invitationStatus is "pending" */}
      <Dialog
        open={invitationDialogOpen}
        onClose={handleCloseInvitationDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          style: {
            borderRadius: "12px",
          },
        }}
      >
        <DialogTitle className="text-center pt-6 pb-2">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-3">
              <svg
                className="w-8 h-8 text-amber-600 dark:text-amber-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
              Team Invitation
            </h2>
          </div>
        </DialogTitle>
        <DialogContent className="text-center px-6 py-2">
          <p className="text-slate-600 dark:text-slate-300">
            You have been invited to join a photography team. Would you like to
            accept or reject this invitation?
          </p>
          {fullProfileData?.invitedBy?.name && (
            <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Invited by:
              </p>
              <p className="text-base font-medium text-slate-700 dark:text-white">
                {fullProfileData.invitedBy?.name}
              </p>
            </div>
          )}
        </DialogContent>
        <DialogActions className="px-6 pb-6 pt-2 justify-center gap-3">
          <Button
            onClick={handleOpenConfirmRejectDialog}
            disabled={invitationLoading}
            variant="outlined"
            className="border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 px-6"
          >
            Reject
          </Button>
          <Button
            onClick={handleAcceptInvitation}
            disabled={invitationLoading}
            variant="contained"
            className="bg-blue hover:bg-blueHover text-white px-6"
          >
            {invitationLoading ? "Processing..." : "Accept"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog for Rejecting Invitation */}
      <Dialog
        open={confirmRejectDialogOpen}
        onClose={handleCloseConfirmRejectDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          style: {
            borderRadius: "12px",
          },
        }}
      >
        <DialogTitle className="text-center pt-6 pb-2">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-3">
              <svg
                className="w-8 h-8 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
              Confirm Rejection
            </h2>
          </div>
        </DialogTitle>
        <DialogContent className="text-center px-6 py-2">
          <p className="text-slate-600 dark:text-slate-300">
            Are you sure you want to reject this team invitation? This action cannot be undone.
          </p>
        </DialogContent>
        <DialogActions className="px-6 pb-6 pt-2 justify-center gap-3">
          <Button
            onClick={handleCloseConfirmRejectDialog}
            disabled={invitationLoading}
            variant="outlined"
            className="border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 px-6"
          >
            Cancel
          </Button>
          <Button
            onClick={handleRejectInvitation}
            disabled={invitationLoading}
            variant="contained"
            className="bg-red-600 hover:bg-red-700 text-white px-6"
          >
            {invitationLoading ? "Processing..." : "Yes, Reject"}
          </Button>
        </DialogActions>
      </Dialog>
      <LoginModel
        open={openlogin}
        handleClose={handleClosedlogin}
        opensignup={handleOpensignup}
      />
      <SignupModel
        open={opensignup}
        handleClose={handleClosedsignup}
        openlogin={handleOpenlogin}
        openverify={handleOpenverify}
        closeSignup={handleClosedsignup}
      />
      <VerifyModel open={openveify} handleClose={handleClosedverify} />
    </>
  );
}

export default Header;
