const fs = require("fs");
const crypto = require("crypto");

// Lazy-load db to avoid circular deps at module load time
function db() {
  return require("../database/db");
}

function getSentImages() {
  try {
    return db().getAllUploaded();
  } catch {
    return [];
  }
}

function saveSentImage(name, hash) {
  try {
    db().markUploaded(hash, name);
  } catch {}
}

function removeSentImageByHash(hash) {
  try {
    db().removeUploaded(hash);
  } catch {}
}

function getImageHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash   = crypto.createHash("sha256");
    const stream = fs.createReadStream(filePath);
    const timeout = setTimeout(() => {
      stream.destroy();
      reject(new Error("Hash timeout"));
    }, 30000);
    stream.on("data",  (d)   => hash.update(d));
    stream.on("end",   ()    => { clearTimeout(timeout); resolve(hash.digest("hex")); });
    stream.on("error", (err) => { clearTimeout(timeout); reject(err); });
  });
}

module.exports = {
  getSentImages,
  saveSentImage,
  removeSentImageByHash,
  getImageHash,
};
