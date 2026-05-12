// Cache.js
const fs = require('fs');
const path = require('path');

const cacheFilePath = path.join(__dirname, 'cache.json');

function saveCache(key, data) {
  let cache = {};
  if (fs.existsSync(cacheFilePath)) {
    cache = JSON.parse(fs.readFileSync(cacheFilePath, 'utf-8'));
  }
  cache[key] = data;
  fs.writeFileSync(cacheFilePath, JSON.stringify(cache, null, 2));
}

function loadCache(key) {
  if (!fs.existsSync(cacheFilePath)) return null;
  const cache = JSON.parse(fs.readFileSync(cacheFilePath, 'utf-8'));
  return cache[key] || null;
}

module.exports = { saveCache, loadCache };
