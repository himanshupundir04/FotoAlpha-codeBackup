export function formatFileSize(bytes) {
  if (!bytes || isNaN(bytes)) return "0 Bytes";
  const units = ["Bytes", "KB", "MB", "GB", "TB"];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(2)} ${units[i]}`;
}
