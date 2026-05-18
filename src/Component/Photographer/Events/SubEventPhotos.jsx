import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { CircularProgress } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import RefreshIcon from "@mui/icons-material/Refresh";
import { formatFileSize } from "../../Common/utils";
import demo from "../../image/demo.jpg";

const baseURL = import.meta.env.VITE_BASE_URL;
const POLL_INTERVAL_MS = 10000;
const PAGE_SIZE = 50;

export default function SubEventPhotos() {
  const { eventId, subeventId } = useParams();
  const navigate = useNavigate();

  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  const pollRef = useRef(null);
  const lastCreatedAtRef = useRef(null);

  const fetchPhotos = useCallback(async (pageNum = 1, append = false) => {
    const isFirstPage = pageNum === 1 && !append;
    if (isFirstPage) setLoading(true);
    if (append) setLoadingMore(true);

    try {
      const res = await axios.get(`${baseURL}/photos/get/${eventId}/${subeventId}`, {
        params: { page: pageNum, limit: PAGE_SIZE, sortBy: "createdAt", sortOrder: "desc" },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "ngrok-skip-browser-warning": "69420",
        },
      });

      const data = res.data?.data || res.data;
      const newPhotos = data?.photos || [];

      if (append) {
        setPhotos((prev) => [...prev, ...newPhotos]);
      } else {
        setPhotos(newPhotos);
      }

      const pag = data?.pagination;
      setHasMore(pag ? pag.page < pag.pages : false);

      if (newPhotos.length > 0 && !append) {
        lastCreatedAtRef.current = newPhotos[0]?.createdAt || null;
      }
    } catch (err) {
      if (!append) setError(err?.response?.data?.message || "Failed to load photos");
      const cached = await window.electronAPI?.getStore(`subevent_photos_${subeventId}`);
      if (cached && !append) setPhotos(cached);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [eventId, subeventId]);

  const pollNewPhotos = useCallback(async () => {
    try {
      const res = await axios.get(`${baseURL}/photos/get/${eventId}/${subeventId}`, {
        params: { page: 1, limit: 10, sortBy: "createdAt", sortOrder: "desc" },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "ngrok-skip-browser-warning": "69420",
        },
      });

      const data = res.data?.data || res.data;
      const latest = data?.photos || [];

      if (latest.length > 0 && lastCreatedAtRef.current) {
        const existingIds = new Set(photos.map((p) => p._id));
        const newOnes = latest.filter((p) => !existingIds.has(p._id));
        if (newOnes.length > 0) {
          setPhotos((prev) => [...newOnes, ...prev]);
          lastCreatedAtRef.current = latest[0]?.createdAt || lastCreatedAtRef.current;
        }
      } else if (latest.length > 0 && !lastCreatedAtRef.current) {
        lastCreatedAtRef.current = latest[0]?.createdAt || null;
      }
    } catch {
      // silent poll failure
    }
  }, [eventId, subeventId, photos]);

  useEffect(() => {
    fetchPhotos(1, false);
  }, [fetchPhotos]);

  useEffect(() => {
    pollRef.current = setInterval(pollNewPhotos, POLL_INTERVAL_MS);
    return () => clearInterval(pollRef.current);
  }, [pollNewPhotos]);

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPhotos(nextPage, true);
  };

  const handleRefresh = () => {
    setPage(1);
    fetchPhotos(1, false);
  };

  const handleOpenLightbox = (photo) => setLightbox(photo);

  const getBestPreviewUrl = (photo) => {
    return photo.mediumPreviewSignedUrl || photo.urlThumbnailSignedUrl || photo.urlImageSignedUrl || demo;
  };

  const getFullUrl = (photo) => {
    return photo.urlImageSignedUrl || photo.mediumPreviewSignedUrl || photo.url || demo;
  };

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            <ArrowBackIcon sx={{ fontSize: 20, color: "#475569" }} />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Photos</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {photos.length} photo{photos.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            title="Refresh"
          >
            <RefreshIcon sx={{ fontSize: 18, color: "#475569" }} />
          </button>
          <button
            onClick={() => navigate(`/photographer/upload_photos/${eventId}`, { state: { subeventId } })}
            className="flex items-center gap-1 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-md text-xs font-medium transition-colors"
          >
            <CloudUploadIcon sx={{ fontSize: 14 }} /> Upload
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16">
          <CircularProgress size={32} />
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="text-center py-16">
          <p className="text-red-500 text-sm mb-3">{error}</p>
          <button onClick={handleRefresh} className="px-4 py-1.5 bg-cyan-500 text-white rounded text-xs">Retry</button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && photos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <CloudUploadIcon sx={{ fontSize: 48, color: "#94a3b8" }} />
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">No photos yet</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Upload photos to this sub-event to see them here</p>
        </div>
      )}

      {/* Photo Grid */}
      {!loading && photos.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {photos.map((photo) => (
              <div
                key={photo._id}
                className="group relative bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-all cursor-pointer"
                onClick={() => handleOpenLightbox(photo)}
              >
                <div className="aspect-square overflow-hidden bg-slate-100 dark:bg-slate-700">
                  <img
                    src={getBestPreviewUrl(photo)}
                    alt={photo.filename}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { e.target.src = demo; }}
                  />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-[11px] truncate font-medium">{photo.filename}</p>
                  {photo.metadata?.size > 0 && (
                    <p className="text-white/70 text-[10px]">{formatFileSize(photo.metadata.size)}</p>
                  )}
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <FullscreenIcon sx={{ fontSize: 16, color: "white", filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))" }} />
                </div>
              </div>
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center mt-6">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-5 py-2 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                {loadingMore ? <CircularProgress size={16} /> : "Load More"}
              </button>
            </div>
          )}
        </>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <CloseIcon sx={{ fontSize: 24 }} />
          </button>

          <div className="absolute top-4 left-4 text-white/70 text-xs">
            {lightbox.filename}
            {lightbox.metadata?.size > 0 && ` — ${formatFileSize(lightbox.metadata.size)}`}
          </div>

          <img
            src={getFullUrl(lightbox)}
            alt={lightbox.filename}
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
            onError={(e) => { e.target.src = demo; }}
          />

          <a
            href={getFullUrl(lightbox)}
            download={lightbox.filename}
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-4 right-4 flex items-center gap-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-md text-xs backdrop-blur transition-colors"
          >
            <DownloadIcon sx={{ fontSize: 14 }} /> Download
          </a>
        </div>
      )}
    </div>
  );
}
