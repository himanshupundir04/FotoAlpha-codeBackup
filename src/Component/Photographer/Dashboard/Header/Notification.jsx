import React, { useState, useEffect, useRef, useContext } from "react";
import NotificationsIcon from "@mui/icons-material/Notifications";
import CloseIcon from "@mui/icons-material/Close";
import { Badge } from "@mui/material";
import { format } from "date-fns";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { PhotographerEventContext } from "../../Context/PhotographerEventContext";

const baseurl = process.env.REACT_APP_BASE_URL;

function Notification() {
  const token = localStorage.getItem("token");
  const [openNotification, setOpenNotification] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const {setNotification} = useContext(PhotographerEventContext)
  const navigate = useNavigate();
  // console.log("token", token);

  useEffect(() => {
    fetchNotification();
  }, []);

  useEffect(() => {
    setUnreadCount(notifications.filter((n) => !n.isRead).length);
  }, [notifications]);

  const socketRef = useRef(null);

  useEffect(() => {
    if (!token) return;

    const ws = new WebSocket(`wss://fotoalpha.com/websocket?token=${token}`);
    socketRef.current = ws;

    ws.onopen = () => {
      // console.log("WebSocket connected");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // console.log("Received:", data);

        if (data.type === "notification") {
          setNotifications((prev) => [...prev, data]);
          // setUnreadCount((prev) => prev + 1);
          setNotification((prev) => [...prev, data]);
        }
      } catch (err) {
        console.error("Error parsing message:", err);
      }
    };

    ws.onerror = (error) => {
      // console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      // console.log("WebSocket closed");
    };

    return () => {
      ws.close();
    };
  }, [token]);

  const fetchNotification = async () => {
    try {
      const response = await axios.get(`${baseurl}/notification`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      // console.log("Fetched notifications:", response.data.notifications);
      setNotifications(response.data.notifications);
      setNotification(response.data.notifications);
      setUnreadCount(response.data.notifications.filter((n) => !n.read).length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const fetchNotificationRead = async () => {
    try {
      const response = await axios.get(`${baseurl}/notification/read-all`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      // console.log("Fetched notifications:", response.data.notifications);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const handleToggle = () => {
    setOpenNotification(!openNotification);
    if (!openNotification) setUnreadCount(0);
    fetchNotificationRead();
  };

  const isEventNotification = (entityType) =>
    String(entityType || "").toLowerCase() === "event";

  const isHostRequestApprovalNotification = (notification) => {
    const message = String(notification?.message || "")
      .trim()
      .toLowerCase();

    return (
      message === "you have a new host request for approval." ||
      message === "you have a new host request for approval"
    );
  };

   const isPrintRequestNotification = (notification) => {
    const entityType = String(notification?.entityType || "").toLowerCase();
    const message = String(notification?.message || "").toLowerCase();

    return (
      entityType === "print_request" ||
      entityType === "print_order" ||
      entityType === "printrequest" ||
      entityType === "requested prints" ||
      message.includes("print request") ||
      message.includes("print order") ||
      message.includes("requested prints") ||
      message.includes("photo request")
    );
  };

  const handleNotificationClick = (notification) => {
    if (!isEventNotification(notification?.entityType)) return;
      if (isPrintRequestNotification(notification)) {
      navigate("print_orders");
      setOpenNotification(false);
      return;
    }

    if (isHostRequestApprovalNotification(notification)) {
      navigate(`event/${notification.entityId}`, {
        state: {
          activeTab: "guest&assigndteam",
          guestAssignedTeamView: "host",
        },
      });
    } else {
      navigate(`event/${notification.entityId}`);
    }

    setOpenNotification(false);
  };

  

  return (
    <div className="relative inline-block text-start">
      <Badge badgeContent={unreadCount} color="error">
        <NotificationsIcon
          sx={{ fontSize: "22px" }}
          className="cursor-pointer text-white bg-blue rounded-full p-1"
          id="notification-menu"
          onClick={handleToggle}
        />
      </Badge>

      {openNotification && (
        <div className="absolute z-50 mt-3 left-3/4 transform -translate-x-3/4 bg-white rounded-md shadow-lg w-80 max-h-96 overflow-auto">
          <div className="flex items-center py-2 px-6 mb-1 justify-between font-normal">
            <h2 className="text-slate-700 font-normal text-xl">
              Notifications
            </h2>
            <CloseIcon
              className="text-slate-700 cursor-pointer"
              onClick={() => setOpenNotification(false)}
            />
          </div>

          {notifications.length > 0 ? (
            notifications.map((n, i) =>
              isEventNotification(n.entityType) ? (
                <div
                  key={i}
                  className="flex flex-col py-2 px-6 border-t border-slate-200 hover:bg-slate-100 cursor-pointer"
                  onClick={() => handleNotificationClick(n)}
                >
                  <p className="text-slate-700 text-sm leading-none font-normal">
                    {n.message}
                  </p>
                  <span className="text-slate-500 text-xs mt-1">
                    {format(
                      new Date(n.time || n.createdAt),
                      "MMM dd, yyyy hh:mm:ss a"
                    )}
                  </span>
                </div>
              ) : (
                <div
                  key={i}
                  className="flex flex-col py-2 px-6 border-t border-slate-200 hover:bg-slate-100"
                >
                  <p className="text-slate-700 font-normal text-sm leading-none">
                    {n.message}
                  </p>
                  <span className="text-slate-500 text-xs mt-1">
                    {format(
                      new Date(n.time || n.createdAt),
                      "MMM dd, yyyy hh:mm:ss a"
                    )}
                  </span>
                </div>
              )
            )
          ) : (
            <p className="text-center p-4 text-gray-500">
              No notifications yet
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default Notification;
