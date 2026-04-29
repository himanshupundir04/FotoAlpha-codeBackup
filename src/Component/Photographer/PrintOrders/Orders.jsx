import { CircularProgress } from "@mui/material";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

const baseURL = process.env.REACT_APP_BASE_URL;
function Order() {
  const [orderloading, setOrderLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [currentOrderPhotos, setCurrentOrderPhotos] = useState([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setOrderLoading(true);
    try {
      const res = await axios.get(`${baseURL}/photographer/print-requests`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      // setOrders(res.data.data || []);
      setOrders(
        (res.data.data || []).filter(
          (item) => item.photos && item.photos.length >= 1,
        ),
      );
    } finally {
      setOrderLoading(false);
    }
  };

  const handleCancel = async (orderId) => {
    try {
      const res = await axios.patch(
        `${baseURL}/photographer/print-requests/${orderId}/reject`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      toast.success("Order rejected successfully");
      fetchOrders(); // Refresh orders after accepting
    } catch (error) {
      toast.error(error?.response?.data?.message);
      console.error("Error rejecting order:", error);
    }
  };

  const handleAccept = async (orderId) => {
    try {
      const res = await axios.patch(
        `${baseURL}/photographer/print-requests/${orderId}/accept`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      toast.success("Order accepted successfully");
      fetchOrders(); // Refresh orders after accepting
    } catch (error) {
      console.error("Error accepting order:", error);
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 text-start dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-2xl font-bold ">
            Print Orders
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Manage your photography print requests
          </p>
        </div>

        {orderloading ? (
          <div className="flex justify-center items-center h-96">
            <div className="relative">
              <CircularProgress size={60} className="text-blue" />
              <div className="absolute inset-0 bg-gradient-to-r from-blue to-purple-400 rounded-full opacity-20 animate-pulse"></div>
            </div>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-12 text-center border border-gray-100 dark:border-gray-700">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full flex items-center justify-center">
              <svg
                className="w-12 h-12 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">
              No Orders Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Your print requests will appear here once clients submit them.
            </p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3  text-start">
            {orders &&
              orders.map((order) => (
                <div
                  key={order?._id}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 dark:border-gray-700 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-gray-800 dark:text-white truncate">
                        {order?.event?.name}
                      </h2>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
                          order.status === "pending"
                            ? "bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-lg"
                            : order.status === "accepted"
                              ? "bg-gradient-to-r from-green-400 to-emerald-400 text-white shadow-lg"
                              : "bg-gradient-to-r from-red-400 to-pink-400 text-white shadow-lg"
                        }`}
                      >
                        {order?.status}
                      </span>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                        <svg
                          className="w-4 h-4 mr-2 text-blue-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        Requested Photos ({order?.photos?.length})
                      </p>
                      <div className="flex space-x-2 overflow-x-auto pb-2">
                        {order.photos.slice(0, 5).map((photo, index) => (
                          <div key={photo?._id} className="flex-shrink-0">
                            <img
                              src={
                                photo?.thumbnailSignedUrl ||
                                photo?.imageSignedUrl
                              }
                              alt={photo?.filename}
                              onClick={() => {
                                setCurrentOrderPhotos(order.photos);
                                setCurrentPhotoIndex(index);
                                setSelectedPhoto(photo);
                              }}
                              className="w-16 h-16 object-cover rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:border-blue-400 transition-colors duration-200 cursor-pointer"
                            />
                          </div>
                        ))}
                        {order.photos.length > 5 && (
                          <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                            +{order?.photos?.length - 5}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mb-6 space-y-2">
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                        <svg
                          className="w-4 h-4 mr-2 text-green-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        <span className="font-medium">Requested by:</span>
                        <span className="ml-1 text-gray-800 dark:text-white">
                          {order?.requestedBy?.name}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                        <svg
                          className="w-4 h-4 mr-2 text-purple-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <span className="font-medium">Photographer:</span>
                        <span className="ml-1 text-gray-800 dark:text-white">
                          {order?.photographer?.name}
                        </span>
                      </div>
                    </div>

                    {order?.status === "pending" && (
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleCancel(order?._id)}
                          className="flex-1 bg-blue hover-bg-blueHover text-sm text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center"
                        >
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                          Reject
                        </button>
                        <button
                          onClick={() => handleAccept(order?._id)}
                          className="flex-1 bg-red-600 hover-bg-red-700 text-sm text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center"
                        >
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Accept
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
          onClick={() => setSelectedPhoto(null)}
        >
          {/* Close button */}
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 z-50"
            onClick={() => setSelectedPhoto(null)}
          >
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Previous button */}
          {currentOrderPhotos.length > 1 && (
            <button
              className="absolute left-4 text-white hover:text-gray-300 p-2 z-50 bg-black bg-opacity-50 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                const newIndex = currentPhotoIndex === 0 ? currentOrderPhotos.length - 1 : currentPhotoIndex - 1;
                setCurrentPhotoIndex(newIndex);
                setSelectedPhoto(currentOrderPhotos[newIndex]);
              }}
            >
              <svg
                className="w-10 h-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}

          {/* Next button */}
          {currentOrderPhotos.length > 1 && (
            <button
              className="absolute right-4 text-white hover:text-gray-300 p-2 z-50 bg-black bg-opacity-50 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                const newIndex = currentPhotoIndex === currentOrderPhotos.length - 1 ? 0 : currentPhotoIndex + 1;
                setCurrentPhotoIndex(newIndex);
                setSelectedPhoto(currentOrderPhotos[newIndex]);
              }}
            >
              <svg
                className="w-10 h-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          )}

          <img
            src={selectedPhoto?.imageSignedUrl || selectedPhoto?.thumbnailSignedUrl}
            alt={selectedPhoto?.filename}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          
          {/* Photo counter */}
          <div className="absolute bottom-4 text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded-full">
            {currentPhotoIndex + 1} / {currentOrderPhotos.length}
          </div>
        </div>
      )}
    </div>
  );
}

export default Order;
