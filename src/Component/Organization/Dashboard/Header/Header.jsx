import React, { useState, useEffect, useContext } from "react";
import BedtimeIcon from "@mui/icons-material/Bedtime";
import {
  Avatar,
  Dialog,
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
import Notification from "./Notification";
import axios from "axios";
import { OrganizationEventContext } from "../../Context/OrganizationEventContext";
import {
  fetchCurrentSubscription,
  getSubscriptionStatus,
} from "../../../../services/subscriptionService";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import { format } from "date-fns";

const baseURL = process.env.REACT_APP_BASE_URL;
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
  const [showUpgrade, setUpgrade] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [subscription, setSubscription] = useState(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [coinBalance, setCoinBalance] = useState(0);
  const navigate = useNavigate();
  // console.log("user:", users);
  const avatar = localStorage.getItem("avatar");
  const [profile, setProfileurl] = useState();
  const { setProfile } = useContext(OrganizationEventContext);

  // Fetch subscription from UserSubscription collection
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setLoadingSubscription(true);
      fetchCurrentSubscription(token).then((sub) => {
        if (sub) {
          setSubscription(sub);
          const { statusMessage, showUpgradeButton } =
            getSubscriptionStatus(sub);
         setStatusMessage(sub?.data?.data?.trial_end || statusMessage);
          setUpgrade(sub?.data?.data?.in_trial);
        } else {
          // No subscription found, show upgrade button
          setUpgrade(true);
          setStatusMessage("");
        }
        setLoadingSubscription(false);
      });
    }
  }, []);

  // Fetch coin balance
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios
        .get(`${baseURL}/coins/balance`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          if (res.data.success) {
            setCoinBalance(res.data.data.availableCoins || 0);
          }
        })
        .catch((err) => {
          console.error("Error fetching coin balance:", err);
        });
    }
  }, []);

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

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    axios
      .get(`${baseURL}/users/profile`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "ngrok-skip-browser-warning": "69420",
        },
      })
      .then((response) => {
        setProfileurl(response.data.avatarUrl);
        localStorage.setItem("avatar", response?.data?.avatarUrl);
        setProfile(response.data);
        // console.log(response.data);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const handleLogout = () => {
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
    localStorage.removeItem("avatar");

    if (users.length > 0) {
      // Set the next user as current
      users[0].isCurrent = true;
      localStorage.setItem("users", JSON.stringify(users));
      localStorage.setItem("token", users[0].token);
      localStorage.setItem("avatar", users[0].avatar);
      navigate("/"); // or redirect based on role of users[0]
    } else {
      // No users left, go to login
      navigate("/");
    }
  };

  const handleExisting = () => {
    handleClose();
    handleClosedialog();
    handleOpenlogin();
  };

  const handleNew = () => {
    navigate("/register");
  };

  const handleAccount = () => {
    navigate("profile");
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
      localStorage.setItem("avatar", selected.avatar);
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
        <div className="flex justify-between items-center space-x-3 me-3 dark:text-white">
          {/* Coins Display */}
          <div
            className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1 rounded-lg cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition"
            onClick={() => navigate("coins")}
            title="View coins details"
          >
            <LocalFireDepartmentIcon sx={{ fontSize: 18, color: "#f59e0b" }} />
            <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">
              {coinBalance}
            </span>
          </div>
          {showUpgrade === true && (
            <div className="upgrade flex items-center gap-2">
              {statusMessage && (
                <span className="text-xs text-slate-600 dark:text-slate-300 font-medium ">
                  Trial end on {format(new Date(statusMessage), "MMM dd, yyyy")}
                </span>
              )}
              <button
                className="flex items-center bg-blue text-white text-xs py-1 px-2 font-normal rounded hover:bg-blueHover"
                onClick={() => navigate("upgrade_plan")}
              >
                Upgrade Plan
              </button>
            </div>
          )}

          <Notification />
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
                  (currentUser?.role?._id === "6819c1cc60fcb9a082b910b2" ? "photographer" : "")}
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
              <div
                className="flex items-center gap-2 px-4 py-3 cursor-pointer"
                onClick={handleAccount}
              >
                <Avatar
                  src={
                    profile || users?.avatar || avatar || "/broken-image.jpg"
                  }
                  sx={{ width: 32, height: 32 }}
                />
                <div className="flex flex-col">
                  <p className="text-slate-700 font-normal">
                    {currentUser?.name}
                  </p>
                  <p className="text-blue text-sm rounded-full capitalize font-normal">
                    {currentUser?.role?.name ||
                      (currentUser?.role?._id === "6819c1cc60fcb9a082b910b2"
                        ? "photographer"
                        : "")}
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
            src={profile || users?.avatar || avatar || "/broken-image.jpg"}
            id="demo-positioned-button"
            aria-controls={open ? "demo-positioned-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={open ? "true" : undefined}
            onClick={handleClick}
            sx={{ width: 22, height: 22 }}
            className="cursor-pointer"
          /> */}
          {/* <Menu
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
              <SettingsIcon sx={{ fontSize: "18px" }} />
              &nbsp; Profile Setting
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ExitToAppIcon sx={{ fontSize: "18px" }} /> &nbsp;Signout
            </MenuItem>
          </Menu> */}
        </div>
      </div>
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

