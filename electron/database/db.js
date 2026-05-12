const path = require("path");
const { app } = require("electron");

let _db = null;

function getDb() {
  if (_db) return _db;
  const Database = require("better-sqlite3");
  const dbPath = path.join(app.getPath("userData"), "fotoalpha.db");
  _db = new Database(dbPath);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");
  migrate(_db);
  return _db;
}

function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS uploaded_images (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      hash        TEXT    NOT NULL UNIQUE,
      name        TEXT    NOT NULL,
      event_id    TEXT,
      subevent_id TEXT,
      uploaded_at INTEGER DEFAULT (strftime('%s','now'))
    );

    CREATE TABLE IF NOT EXISTS uploaded_videos (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      hash        TEXT    NOT NULL UNIQUE,
      name        TEXT    NOT NULL,
      event_id    TEXT,
      subevent_id TEXT,
      uploaded_at INTEGER DEFAULT (strftime('%s','now'))
    );

    CREATE TABLE IF NOT EXISTS watched_folders (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      folder_path     TEXT    NOT NULL UNIQUE,
      event_id        TEXT    NOT NULL,
      subevent_id     TEXT    NOT NULL,
      event_name      TEXT    DEFAULT '',
      category_name   TEXT    DEFAULT '',
      role            TEXT    NOT NULL DEFAULT 'org',
      api_url         TEXT    DEFAULT '',
      token           TEXT    DEFAULT '',
      total_uploaded  INTEGER DEFAULT 0,
      total_failed    INTEGER DEFAULT 0,
      total_duplicate INTEGER DEFAULT 0,
      last_synced     INTEGER,
      is_active       INTEGER DEFAULT 1,
      created_at      INTEGER DEFAULT (strftime('%s','now'))
    );
  `);
}

// ── uploaded_images ──────────────────────────────────────────────

function isUploaded(hash) {
  return !!getDb().prepare("SELECT 1 FROM uploaded_images WHERE hash = ?").get(hash);
}

function markUploaded(hash, name, eventId, subeventId) {
  try {
    getDb()
      .prepare(
        "INSERT OR IGNORE INTO uploaded_images (hash, name, event_id, subevent_id) VALUES (?, ?, ?, ?)"
      )
      .run(hash, name, eventId || null, subeventId || null);
  } catch {}
}

function removeUploaded(hash) {
  getDb().prepare("DELETE FROM uploaded_images WHERE hash = ?").run(hash);
}

function getAllUploaded() {
  return getDb().prepare("SELECT hash, name FROM uploaded_images").all();
}

// ── uploaded_videos ──────────────────────────────────────────────

function isVideoUploaded(hash) {
  return !!getDb().prepare("SELECT 1 FROM uploaded_videos WHERE hash = ?").get(hash);
}

function markVideoUploaded(hash, name, eventId, subeventId) {
  try {
    getDb()
      .prepare(
        "INSERT OR IGNORE INTO uploaded_videos (hash, name, event_id, subevent_id) VALUES (?, ?, ?, ?)"
      )
      .run(hash, name, eventId || null, subeventId || null);
  } catch {}
}

function removeVideoUploaded(hash) {
  getDb().prepare("DELETE FROM uploaded_videos WHERE hash = ?").run(hash);
}

function getAllUploadedVideos() {
  return getDb().prepare("SELECT hash, name FROM uploaded_videos").all();
}

// ── watched_folders ──────────────────────────────────────────────

function upsertWatchedFolder({
  folderPath,
  eventId,
  subeventId,
  eventName,
  categoryName,
  role,
  apiUrl,
  token,
}) {
  getDb()
    .prepare(
      `INSERT INTO watched_folders
         (folder_path, event_id, subevent_id, event_name, category_name, role, api_url, token)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(folder_path) DO UPDATE SET
         event_id      = excluded.event_id,
         subevent_id   = excluded.subevent_id,
         event_name    = excluded.event_name,
         category_name = excluded.category_name,
         role          = excluded.role,
         api_url       = excluded.api_url,
         token         = excluded.token,
         is_active     = 1`
    )
    .run(
      folderPath,
      eventId,
      subeventId,
      eventName || "",
      categoryName || "",
      role || "org",
      apiUrl || "",
      token || ""
    );
}

function deactivateWatchedFolder(folderPath) {
  getDb()
    .prepare("UPDATE watched_folders SET is_active = 0 WHERE folder_path = ?")
    .run(folderPath);
}

function getActiveWatchedFolders() {
  return getDb()
    .prepare("SELECT * FROM watched_folders WHERE is_active = 1 ORDER BY created_at ASC")
    .all();
}

function updateWatchedFolderToken(folderPath, token) {
  getDb()
    .prepare("UPDATE watched_folders SET token = ? WHERE folder_path = ?")
    .run(token, folderPath);
}

function incrementFolderStats(folderPath, { uploaded = 0, failed = 0, duplicate = 0 }) {
  getDb()
    .prepare(
      `UPDATE watched_folders
       SET total_uploaded  = total_uploaded  + ?,
           total_failed    = total_failed    + ?,
           total_duplicate = total_duplicate + ?,
           last_synced     = strftime('%s','now')
       WHERE folder_path = ?`
    )
    .run(uploaded, failed, duplicate, folderPath);
}

module.exports = {
  getDb,
  isUploaded,
  markUploaded,
  removeUploaded,
  getAllUploaded,
  isVideoUploaded,
  markVideoUploaded,
  removeVideoUploaded,
  getAllUploadedVideos,
  upsertWatchedFolder,
  deactivateWatchedFolder,
  getActiveWatchedFolders,
  updateWatchedFolderToken,
  incrementFolderStats,
};
