import { useEffect, useMemo, useState } from "react";
import {
  CloudUpload,
  CheckCircle,
  Cancel,
  OpenInNew,
  BadgeOutlined,
  DescriptionOutlined,
  ShieldOutlined,
} from "@mui/icons-material";
import axios from "axios";
import Aadhar from "../../image/AadharCard.png";
import Pan from "../../image/PanCard.png";
import Business from "../../image/BusinessCard.png";
import Voter from "../../image/Votercard.png";
import Driving from "../../image/Drivingcard.png";
import Passport from "../../image/passport.jpg";
import { toast } from "react-toastify";
const MAX_SIZE = 10 * 1024 * 1024;

const baseURL = process.env.REACT_APP_BASE_URL;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "pdf"];
const DOC_LABELS = {
  aadhaar_card: "Aadhaar Card",
  pan_card: "PAN Card",
  voter_id: "Voter ID",
  driving_license: "Driving License",
  passport: "Passport",
  business_proof: "Business Proof",
};
const DOC_IMAGES = {
  aadhaar_card: Aadhar,
  pan_card: Pan,
  business_proof: Business,
  voter_id: Voter,
  driving_license: Driving,
  passport: Passport,
};
const DEFAULT_DOCUMENT_TYPES = ["aadhaar_card", "pan_card", "business_proof"];
const DEFAULT_REQUIRES_BACK = {
  aadhaar_card: true,
  pan_card: false,
  business_proof: false,
};

const formatDocName = (value) =>
  DOC_LABELS[value] ||
  value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const buildDocs = (types = DEFAULT_DOCUMENT_TYPES, requiresBack = DEFAULT_REQUIRES_BACK) =>
  types.map((value) => ({
    name: formatDocName(value),
    value,
    back: Boolean(requiresBack?.[value]),
    image: DOC_IMAGES[value] || null,
  }));

const DEFAULT_DOCS = buildDocs();
const formatDateTime = (dateValue) => {
  if (!dateValue) return "-";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function PhotographerVerification() {
  const [availableDocs, setAvailableDocs] = useState(DEFAULT_DOCS);
  const [selectedDoc, setSelectedDoc] = useState(DEFAULT_DOCS[0]?.value || "");
  const [frontFile, setFrontFile] = useState(null);
  const [backFile, setBackFile] = useState(null);
  const [latestSubmission, setLatestSubmission] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const users = JSON.parse(localStorage.getItem("users")) || [];
  const currentUser = users.find((u) => u.isCurrent);

  const selectedDocConfig = useMemo(
    () => availableDocs.find((d) => d.value === selectedDoc),
    [availableDocs, selectedDoc],
  );
  const needsBack = Boolean(selectedDocConfig?.back);

  useEffect(() => {
    fetchVerificationStatus();
    fetchMyVerification();
  }, []);

  const fetchVerificationStatus = async () => {
    try {
      const response = await axios.get(`${baseURL}/id-verification/status`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = response?.data || {};
      const documentTypes =
        Array.isArray(data.documentTypes) && data.documentTypes.length > 0
          ? data.documentTypes
          : DEFAULT_DOCS.map((doc) => doc.value);
      const nextDocs = buildDocs(documentTypes, data.requiresBack);
      const latestDocType = data.latestSubmission?.document_type;

      setStatus(data.latestSubmission?.status || "idle");
      setAvailableDocs(nextDocs);
      setSelectedDoc((prevDoc) => {
        if (latestDocType && documentTypes.includes(latestDocType)) {
          return latestDocType;
        }
        if (documentTypes.includes(prevDoc)) {
          return prevDoc;
        }
        return documentTypes[0] || "";
      });
    } catch (error) {
      console.error(
        "Failed to fetch verification status:",
        error?.response?.data?.message || error,
      );
    }
  };

  const fetchMyVerification = async () => {
    try {
      const response = await axios.get(`${baseURL}/id-verification/my`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const rows = Array.isArray(response?.data?.verifications)
        ? response.data.verifications
        : [];
      if (rows.length === 0) {
        setLatestSubmission(null);
        return;
      }

      const latestRow = [...rows].sort((a, b) => {
        const attemptDiff = Number(b?.attempt_number || 0) - Number(a?.attempt_number || 0);
        if (attemptDiff !== 0) return attemptDiff;
        const bDate = new Date(b?.createdAt || 0).getTime();
        const aDate = new Date(a?.createdAt || 0).getTime();
        return bDate - aDate;
      })[0];

      setLatestSubmission(latestRow || null);
      if (latestRow?.status) {
        setStatus((prev) => {
          if (prev === "approved") return prev;
          return latestRow.status;
        });
      }
    } catch (error) {
      console.error(
        "Failed to fetch my verification:",
        error?.response?.data?.message || error,
      );
    }
  };

  const validateFile = (file) => {
    if (!file) return null;

    const extension = String(file?.name || "")
      .split(".")
      .pop()
      ?.toLowerCase();
    const hasValidType =
      ALLOWED_MIME_TYPES.includes(file.type) ||
      ALLOWED_EXTENSIONS.includes(extension);

    if (!hasValidType) {
      return "Only JPG, PNG, PDF allowed";
    }
    if (file.size > MAX_SIZE) {
      return "File size exceeds 10 MB";
    }
    return null;
  };

  const handleFile = (file, side) => {
    if (status === "approved" || status === "pending" || submitting) return;

    const err = validateFile(file);
    if (err) {
      setError(err);
      return;
    }
    setError("");
    if (side === "front") setFrontFile(file);
    else setBackFile(file);
  };

  const submitVerification = async () => {
    if (!frontFile) {
      setError("Front side is required");
      return;
    }

    if (needsBack && !backFile) {
      setError("Back side is required for this document");
      return;
    }

    if (!currentUser?._id) {
      setError("Unable to identify current user");
      return;
    }

    setError("");
    setStatus("pending");
    setSubmitting(true);

    const formData = new FormData();
    formData.append("document_type", selectedDoc);
    formData.append("front", frontFile);
    if (needsBack) formData.append("back", backFile);

    try {
      await axios.post(`${baseURL}/id-verification`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setStatus("pending");
      fetchMyVerification();
      toast.success("Documents submitted successfully. Verification is in progress.");
    } catch (error) {
      setStatus("rejected");
      toast.error(error?.response?.data?.message || "Failed to submit documents. Please try again.");
      console.error("Verification submission error:", error?.response?.data.message || error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSelectedDoc(availableDocs[0]?.value || "");
    setFrontFile(null);
    setBackFile(null);
    setError("");
  };

  const isSubmitDisabled =
    submitting ||
    status === "pending" ||
    status === "approved" ||
    !selectedDoc ||
    !frontFile ||
    (needsBack && !backFile);

  const statusBadgeClasses = {
    approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    rejected: "bg-rose-50 text-rose-700 border-rose-200",
  };

  const statusConfig = {
    idle: {
      title: "Ready for verification",
      subtitle: "Select a document and upload required files.",
      className: "bg-slate-50 border-slate-200 text-slate-700",
    },
    pending: {
      title: "Under review",
      subtitle: "Verification is in progress. This may take some time.",
      className: "bg-amber-50 border-amber-200 text-amber-700",
    },
    rejected: {
      title: "Verification rejected",
      subtitle: "Please upload clearer or valid documents and try again.",
      className: "bg-rose-50 border-rose-200 text-rose-700",
    },
    approved: {
      title: "Verification approved",
      subtitle: "Your account has been successfully verified.",
      className: "bg-emerald-50 border-emerald-200 text-emerald-700",
    },
  };
  const activeStatusConfig = statusConfig[status] || statusConfig.idle;

  return (
    <div className="mx-auto w-full max-w-5xl text-start">
      <div
        className={`mt-5 rounded-xl border p-4 ${activeStatusConfig.className}`}
      >
        <p className="font-semibold">{activeStatusConfig.title}</p>
        <p className="text-sm">{activeStatusConfig.subtitle}</p>
      </div>

      {latestSubmission && (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-800">Latest Uploaded Attempt</h3>
          <div className="mt-3 grid grid-cols-1 gap-3 text-sm text-slate-700 sm:grid-cols-2">
            <p>
              <span className="font-medium">Document:</span>{" "}
              {formatDocName(latestSubmission.document_type)}
            </p>
            <p>
              <span className="font-medium">Attempt:</span> {latestSubmission.attempt_number || "-"}
            </p>
            <p>
              <span className="font-medium">Submitted:</span>{" "}
              {formatDateTime(latestSubmission.submit_date || latestSubmission.createdAt)}
            </p>
            <div>
              <span className="font-medium">Status:</span>{" "}
              <span
                className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${
                  statusBadgeClasses[latestSubmission.status] ||
                  "bg-slate-50 text-slate-700 border-slate-200"
                }`}
              >
                {String(latestSubmission.status || "-").toUpperCase()}
              </span>
            </div>
          </div>

          {latestSubmission.reason && (
            <p className="mt-3 text-sm text-rose-700">
              <span className="font-medium">Reason:</span> {latestSubmission.reason}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {latestSubmission.frontSignedUrl && (
              <a
                href={latestSubmission.frontSignedUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <OpenInNew sx={{ fontSize: 14 }} />
                View Front
              </a>
            )}
            {latestSubmission.backSignedUrl && (
              <a
                href={latestSubmission.backSignedUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <OpenInNew sx={{ fontSize: 14 }} />
                View Back
              </a>
            )}
          </div>
        </div>
      )}

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <BadgeOutlined className="text-blue" sx={{ fontSize: 20 }} />
          <h2 className="text-lg font-semibold text-slate-800">
            Choose Document Type
          </h2>
        </div>

        {availableDocs.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {availableDocs.map((doc) => (
              <button
                key={doc.value}
                type="button"
                disabled={status === "approved" || status === "pending" || submitting}
                onClick={() => {
                  setSelectedDoc(doc.value);
                  setFrontFile(null);
                  setBackFile(null);
                  setError("");
                }}
                className={`rounded-xl border p-4 text-left transition ${
                  selectedDoc === doc.value
                    ? "border-blue bg-blue/5 shadow-sm"
                    : "border-slate-200 hover:border-blue/40"
                } ${(status === "approved" || status === "pending" || submitting) && "cursor-not-allowed opacity-60"}`}
              >
                <div className="mb-3 flex h-20 items-center justify-center rounded-lg bg-slate-50">
                  {doc.image ? (
                    <img
                      src={doc.image}
                      alt={doc.name}
                      className="h-full w-auto object-contain"
                    />
                  ) : (
                    <DescriptionOutlined className="text-slate-400" sx={{ fontSize: 34 }} />
                  )}
                </div>
                <div className="text-center">
                  <p className="font-medium text-slate-700">{doc.name}</p>
                  <p className=" text-xs text-slate-500">
                    {doc.back ? "Front + Back required" : "Front only"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
            No document types available right now. Please try again in some time.
          </p>
        )}
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <DescriptionOutlined className="text-blue" sx={{ fontSize: 20 }} />
          <h2 className="text-lg font-semibold text-slate-800">
            Upload Documents
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <UploadBox
            label="Front Side"
            file={frontFile}
            onFile={(file) => handleFile(file, "front")}
            disabled={status === "approved" || status === "pending" || submitting}
          />
          {needsBack && (
            <UploadBox
              label="Back Side"
              file={backFile}
              onFile={(file) => handleFile(file, "back")}
              disabled={status === "approved" || status === "pending" || submitting}
            />
          )}
        </div>

        {error && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            <Cancel fontSize="small" />
            {error}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={submitting || isSubmitDisabled}
            onClick={handleReset}
            className={`rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 ${
              submitting || isSubmitDisabled ? "cursor-not-allowed opacity-60" : ""
            }`}
          >
            Reset
          </button>
          <button
            type="button"
            disabled={isSubmitDisabled}
            onClick={submitVerification}
            className={`inline-flex items-center justify-center gap-1 rounded-lg px-4 py-2 text-sm font-medium text-white transition ${
              isSubmitDisabled
                ? "cursor-not-allowed bg-slate-300 text-slate-600"
                : "bg-blue hover:bg-blueHover"
            }`}
          >
            <ShieldOutlined sx={{ fontSize: 16 }} />
            {status === "approved"
              ? "Verified"
              : status === "pending"
                ? "In Review"
                : status === "rejected"
                  ? "Re-submit Verification"
                  : "Submit Verification"}
          </button>
        </div>
      </div>
    </div>
  );
}

function UploadBox({ label, onFile, file, disabled }) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleDrop = (event) => {
    if (disabled) return;
    event.preventDefault();
    const droppedFile = event.dataTransfer?.files?.[0];
    if (!droppedFile) return;
    onFile(droppedFile);
  };

  const handleViewFile = () => {
    if (!file) return;
    
    // Create a URL for the file
    const fileUrl = URL.createObjectURL(file);
    setPreviewUrl(fileUrl);
    setShowPreview(true);
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const isPdf = file?.type === "application/pdf";

  return (
    <>
      <label
        onDragOver={(event) => !disabled && event.preventDefault()}
        onDrop={handleDrop}
        className={`rounded-xl border-2 border-dashed p-5 text-center transition ${
          disabled
            ? "cursor-not-allowed border-slate-200 bg-slate-100 opacity-70"
            : "cursor-pointer border-slate-300 hover:border-blue hover:bg-blue/5"
        }`}
      >
        <CloudUpload className="text-slate-400" />
        <p className="mt-2 font-medium text-slate-700">{label}</p>

        <input
          type="file"
          hidden
          accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
          disabled={disabled}
          onChange={(event) => {
            const pickedFile = event.target.files?.[0];
            if (pickedFile) onFile(pickedFile);
            // Allow selecting the same file again (onChange otherwise may not fire).
            event.target.value = "";
          }}
        />

        <p className="mt-1 text-sm text-slate-500">
          Drag & drop or click to upload
        </p>
        <p className="mt-1 text-xs text-slate-500">JPG, PNG, PDF | Max 10 MB</p>

        {file && (
          <div className="mt-3 flex flex-col items-center gap-2">
            <p className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-sm text-emerald-700">
              <CheckCircle fontSize="small" />
              {file.name}
            </p>
            <button
              type="button"
              onClick={handleViewFile}
              className="inline-flex items-center gap-1 rounded-md border border-blue bg-blue/5 px-3 py-1 text-xs font-medium text-blue hover:bg-blue/10"
            >
              <OpenInNew sx={{ fontSize: 14 }} />
              View
            </button>
          </div>
        )}
      </label>

      {/* Preview Modal */}
      {showPreview && previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="relative max-h-[90vh] max-w-4xl rounded-xl bg-white p-4">
            <button
              type="button"
              onClick={handleClosePreview}
              className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
            >
              ×
            </button>
            {isPdf ? (
              <iframe
                src={previewUrl}
                className="h-[70vh] w-[70vw] max-w-3xl rounded-lg"
                title="PDF Preview"
              />
            ) : (
              <img
                src={previewUrl}
                alt="Preview"
                className="max-h-[70vh] max-w-[70vw] rounded-lg object-contain"
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default PhotographerVerification;
