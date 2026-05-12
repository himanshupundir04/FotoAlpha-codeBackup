/**
 * bgWatcherService — renderer-side API for the persistent background watcher.
 *
 * Watchers are registered once and survive window close.  They are only stopped
 * when the user explicitly removes a folder from the Sync Watchers page or exits
 * from the tray.
 */

function api() {
  return window.electronAPI;
}

export const bgWatcherService = {
  /**
   * Register a folder for continuous background watching.
   * Safe to call even if the folder is already registered — the DB does an
   * upsert so it just refreshes the token / event IDs.
   */
  async add({ folderPath, eventId, subeventId, eventName, categoryName, role }) {
    if (!api()) return false;
    const token  = localStorage.getItem("token") || "";
    const apiUrl = process.env.REACT_APP_BASE_URL || "";
    return api().bgWatcherAdd({
      folderPath,
      eventId:      typeof eventId === "object" ? eventId?.value : eventId,
      subeventId:   typeof subeventId === "object" ? subeventId?.value : subeventId,
      eventName:    eventName  || "",
      categoryName: categoryName || "",
      role:         role || "org",
      apiUrl,
      token,
    });
  },

  /** Remove a folder watcher (stops chokidar + marks inactive in DB). */
  async remove(folderPath) {
    if (!api()) return false;
    return api().bgWatcherRemove(folderPath);
  },

  /** List all active watched folders with their stats. */
  async list() {
    if (!api()) return [];
    return api().bgWatcherList();
  },

  /**
   * Push the latest auth token to the main process so background uploads
   * keep working after a re-login without requiring a new folder registration.
   */
  async refreshToken(folderPath) {
    if (!api()) return false;
    const token = localStorage.getItem("token") || "";
    return api().bgWatcherUpdateToken({ folderPath, token });
  },

  /** Refresh tokens for ALL active watched folders at once. */
  async refreshAllTokens() {
    if (!api()) return;
    const folders = await this.list();
    const token   = localStorage.getItem("token") || "";
    await Promise.all(
      folders.map((f) =>
        api().bgWatcherUpdateToken({ folderPath: f.folderPath, token })
      )
    );
  },

  onFileUploaded(cb) { return api()?.onBgWatcherFileUploaded?.(cb) ?? (() => {}); },
  onNewFile(cb)      { return api()?.onBgWatcherNewFile?.(cb)      ?? (() => {}); },
  onDuplicate(cb)    { return api()?.onBgWatcherDuplicate?.(cb)    ?? (() => {}); },
  onError(cb)        { return api()?.onBgWatcherError?.(cb)        ?? (() => {}); },
  onStarted(cb)      { return api()?.onBgWatcherStarted?.(cb)      ?? (() => {}); },
};

export default bgWatcherService;
