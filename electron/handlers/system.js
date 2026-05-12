const { ipcMain } = require("electron");
const os = require("os");
const si = require("systeminformation");

function registerSystemHandlers() {
  ipcMain.handle("getSystemStats", async () => {
    const cpus = os.cpus();
    return {
      cpu: {
        model: cpus.length > 0 ? cpus[0].model : "Unknown",
        cores: cpus.length,
      },
      memory: {
        total: Math.round(os.totalmem() / 1024 / 1024),
        free: Math.round(os.freemem() / 1024 / 1024),
      },
    };
  });

  const speedStateMap = new Map();

  ipcMain.handle("getNetworkSpeed", async (event) => {
    const senderId = event.sender.id;
    if (!speedStateMap.has(senderId)) {
      speedStateMap.set(senderId, { lastTx: null, lastTime: null, smoothedSpeed: 0 });
    }
    const state = speedStateMap.get(senderId);

    const stats = await si.networkStats();
    const iface = stats.find((i) => i.operstate === "up") || stats[0];
    if (!iface) return 0;

    const now = Date.now();

    if (state.lastTx === null) {
      state.lastTx = iface.tx_bytes;
      state.lastTime = now;
      return 0;
    }

    const byteDiff = iface.tx_bytes - state.lastTx;
    const timeDiff = (now - state.lastTime) / 1000;

    state.lastTx = iface.tx_bytes;
    state.lastTime = now;

    if (byteDiff < 0 || timeDiff <= 0) {
      return state.smoothedSpeed.toFixed(2);
    }

    let speedMB = byteDiff / 1024 / 1024 / timeDiff;

    state.smoothedSpeed = state.smoothedSpeed * 0.7 + speedMB * 0.3;

    return state.smoothedSpeed.toFixed(2);
  });
}

module.exports = { registerSystemHandlers };
