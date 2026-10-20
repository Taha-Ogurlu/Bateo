const { contextBridge } = require("electron");

// Renderer'a güvenli, minimum yüzey alanı sun
contextBridge.exposeInMainWorld("bateo", {
  isElectron: true,
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
  },
});
