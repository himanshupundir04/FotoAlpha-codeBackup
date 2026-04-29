import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { CircularProgress } from "@mui/material";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";

const baseURL = process.env.REACT_APP_BASE_URL;

const FILTERS = [
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
];

const normalizeStatus = (value) => {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "approved") return "approved";
  if (normalized === "rejected") return "rejected";
  return "pending";
};

const resolveUploadedAt = (item = {}) =>
  item?.uploadedAt || item?.uploaded_at || item?.createdAt || item?.created_at;

const formatDateLabel = (value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Unknown Date";
  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getDateKey = (value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "unknown";
  return parsed.toISOString().split("T")[0];
};

const normalizeUpload = (item = {}, index = 0) => {
  const uploadedAt = resolveUploadedAt(item);
  return {
    id: item?._id || item?.id || item?.photoId || `team-photo-${index}`,
    status: normalizeStatus(item?.teamApprovalStatus || item?.status),
    uploadedBy:
      item?.uploadedBy?.name ||
      item?.uploadedByName ||
      item?.user?.name ||
      item?.teamMember?.name ||
      "Team Member",
    uploadedDateKey: getDateKey(uploadedAt),
    uploadedDateLabel: formatDateLabel(uploadedAt),
  };
};

const getResponseRows = (response) => {
  if (Array.isArray(response?.data?.photos)) return response.data.photos;
  if (Array.isArray(response?.data?.teamPhotos))
    return response.data.teamPhotos;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

function PhotosRequest() {
  const params = useParams();
  const eventId = params?.eventid;

  const [uploads, setUploads] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [activeFilter, setActiveFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchUploads = async () => {
    if (!eventId) {
      setUploads([]);
      setTotalCount(0);
      setLoading(false);
      setError("Event ID not found.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const allRows = [];
      let total = 0;
      let page = 1;
      const limit = 100;

      while (true) {
        const response = await axios.get(
          `${baseURL}/photographer/event/${eventId}/team-photos`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "ngrok-skip-browser-warning": "69420",
            },
            params: {
              status: activeFilter,
              page,
              limit,
            },
          },
        );

        const rows = getResponseRows(response);
        const responseTotal = Number(response?.data?.total);

        if (page === 1) {
          total = Number.isFinite(responseTotal) ? responseTotal : rows.length;
        }

        allRows.push(...rows);

        if (rows.length === 0 || allRows.length >= total) {
          break;
        }

        page += 1;
        if (page > 50) break;
      }

      setUploads(allRows.map((item, index) => normalizeUpload(item, index)));
      setTotalCount(Number.isFinite(total) ? total : allRows.length);
    } catch (fetchError) {
      setUploads([]);
      setTotalCount(0);
      setError(
        fetchError?.response?.data?.message || "Failed to load team photos.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUploads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, activeFilter]);

  const groupedBoxes = useMemo(() => {
    const grouped = new Map();

    uploads.forEach((item) => {
      const key = `${item.uploadedBy}__${item.uploadedDateKey}`;
      const existing = grouped.get(key);

      if (existing) {
        existing.totalPhotos += 1;
      } else {
        grouped.set(key, {
          key,
          uploadedBy: item.uploadedBy,
          dateLabel: item.uploadedDateLabel || "Unknown Date",
          dateKey: item.uploadedDateKey || "unknown",
          totalPhotos: 1,
        });
      }
    });

    return Array.from(grouped.values()).sort((a, b) => {
      if (a.dateKey === "unknown") return 1;
      if (b.dateKey === "unknown") return -1;
      if (a.dateKey === b.dateKey) {
        return a.uploadedBy.localeCompare(b.uploadedBy);
      }
      return a.dateKey < b.dateKey ? 1 : -1;
    });
  }, [uploads]);

  const handleApprove = async () => {
    if (!eventId || totalCount === 0 || actionLoading) {
      return;
    }

    setActionLoading(true);
    try {
      await axios.post(
        `${baseURL}/photographer/event/${eventId}/team-photos/action`,
        {
          action: "approve",
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "ngrok-skip-browser-warning": "69420",
          },
        },
      );

      toast.success(`${activeFilter} photos approved successfully.`);
      await fetchUploads();
    } catch (actionError) {
      toast.error(
        actionError?.response?.data?.message || "Failed to approve photos.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!eventId || totalCount === 0 || setRejectLoading) {
      return;
    }

    setRejectLoading(true);
    try {
      await axios.post(
        `${baseURL}/photographer/event/${eventId}/team-photos/action`,
        {
          action: "reject",
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "ngrok-skip-browser-warning": "69420",
          },
        },
      );

      toast.success(`${activeFilter} photos rejected successfully.`);
      await fetchUploads();
    } catch (actionError) {
      toast.error(
        actionError?.response?.data?.message || "Failed to reject photos.",
      );
    } finally {
      setRejectLoading(false);
    }
  };

  return (
    <section className="rounded-md bg-white p-4 dark:bg-slate-800 text-start">
      {loading ? (
        <div className="mt-6 flex h-40 items-center justify-center rounded-md border border-slate-200 dark:border-slate-700">
          <CircularProgress />
        </div>
      ) : error ? (
        <p className="mt-4 text-sm text-rose-600 dark:text-rose-300">{error}</p>
      ) : groupedBoxes.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-8 dark:border-slate-700 dark:bg-slate-900/50">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-slate-400 dark:text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
              />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-semibold text-slate-700 dark:text-slate-200">
            No Photo Requests Found
          </h3>
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            There are no{" "}
            <span className="font-medium capitalize">{activeFilter}</span> photo
            requests at the moment.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-medium text-slate-700 dark:text-white">
                Photo Request Review
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-300 capitalize">
                Showing {activeFilter} photo requests.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded bg-slate-100 px-2 py-1 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                Total Photos: {totalCount}
              </span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setActiveFilter(filter.id)}
                disabled={loading || actionLoading}
                className={`rounded border px-3 py-1.5 text-sm font-normal ${
                  activeFilter === filter.id
                    ? "border-blue bg-blue text-white"
                    : "border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-200"
                } ${(loading || actionLoading) && "cursor-not-allowed opacity-70"}`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {groupedBoxes.map((item) => (
              <div
                key={item.key}
                className="rounded-md border border-slate-200 p-3 dark:border-slate-700"
              >
                <p className="text-sm text-slate-700 dark:text-white">
                  <span className="font-medium">Uploaded By:</span>{" "}
                  {item.uploadedBy}
                </p>
                <p className="mt-1 text-sm text-slate-700 dark:text-white">
                  <span className="font-medium">Total Photos:</span>{" "}
                  {item.totalPhotos}
                </p>
                <p className="mt-1 text-sm text-slate-700 dark:text-white">
                  <span className="font-medium">Date:</span> {item.dateLabel}
                </p>

                {activeFilter === "pending" ? (
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={handleApprove}
                      disabled={actionLoading || totalCount === 0}
                      className={`rounded px-3 py-1 text-xs text-white ${
                        actionLoading || totalCount === 0
                          ? "cursor-not-allowed bg-green-300"
                          : "bg-green-600 hover:bg-green-700"
                      }`}
                    >
                      {actionLoading ? "Processing..." : "Approve"}
                    </button>
                    <button
                      type="button"
                      onClick={handleReject}
                      disabled={rejectLoading || totalCount === 0}
                      className={`rounded px-3 py-1 text-xs text-white ${
                        rejectLoading || totalCount === 0
                          ? "cursor-not-allowed bg-red-300"
                          : "bg-red-600 hover:bg-red-700"
                      }`}
                    >
                      {rejectLoading ? "Processing..." : "Reject"}
                    </button>
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-slate-500 dark:text-slate-300 capitalize">
                    Status: {activeFilter}
                  </p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default PhotosRequest;
