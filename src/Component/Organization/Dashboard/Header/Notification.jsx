import React, { useState, useEffect, useRef, useContext } from "react";
import NotificationsIcon from "@mui/icons-material/Notifications";
import CloseIcon from "@mui/icons-material/Close";
import { Badge } from "@mui/material";
import { format } from "date-fns";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { OrganizationEventContext } from "../../Context/OrganizationEventContext";

const baseurl = process.env.REACT_APP_BASE_URL;

function Notification() {
  const token = localStorage.getItem("token");
  const [openNotification, setOpenNotification] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const {setNotification} = useContext(OrganizationEventContext)
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
      console.log("WebSocket connected");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // console.log("Received:", data);

        if (data.type === "notification") {
          setNotifications((prev) => [...prev, data]);
          setNotification((prev) => [...prev, data]);
          // setUnreadCount((prev) => prev + 1);
        }
      } catch (err) {
        console.error("Error parsing message:", err);
      }
    };

    ws.onerror = (error) => {
      // console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("WebSocket closed");
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
      setNotifications(response?.data?.notifications);
      setNotification(response?.data?.notifications);
      setUnreadCount(response?.data?.notifications.filter((n) => !n.read).length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const fetchNotificationRead = async () => {
    try {
      await axios.get(`${baseurl}/notification/read-all`, {
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

  return (
    <div className="relative inline-block">
      <Badge badgeContent={unreadCount} color="error">
        <NotificationsIcon
          sx={{ fontSize: "22px" }}
          className="cursor-pointer text-white bg-blue rounded-full p-1"
          id="notification-menu"
          onClick={handleToggle}
        />
      </Badge>

      {openNotification && (
        <div className="absolute z-50 mt-3 left-1/2 transform -translate-x-3/4 bg-white rounded-md shadow-lg w-80 max-h-96 overflow-auto">
          <div className="flex items-center py-2 px-6 mb-1 justify-between font-semibold">
            <p className="text-slate-700 font-semibold text-xl">
              Notifications
            </p>
            <CloseIcon
              className="text-slate-700 cursor-pointer"
              onClick={() => setOpenNotification(false)}
            />
          </div>

          {notifications.length > 0 ? (
            notifications.map((n, i) =>
              n.entityType === "Event" ? (
                <div
                  key={i}
                  className="flex flex-col text-start justify-start py-2 px-6 border-t border-slate-200 hover:bg-slate-100 cursor-pointer"
                  onClick={() => {
                    navigate(`event/${n.entityId}`);
                    setOpenNotification(false);
                  }}
                >
                  <p className="text-slate-700 text-start text-sm leading-none font-semibold">
                    {n.message}
                  </p>
                  <span className="text-slate-500 text-start text-xs mt-1">
                    {format(
                      new Date(n.time || n.createdAt),
                      "MMM dd, yyyy hh:mm:ss a"
                    )}
                  </span>
                </div>
              ) : (
                <div
                  key={i}
                  className="flex flex-col py-2 text-start px-6 border-t border-slate-200 hover:bg-slate-100"
                >
                  <p className="text-slate-700 font-semibold text-sm leading-none">
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
